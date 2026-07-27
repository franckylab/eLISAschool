/**
 * ==================================
 * eLISAschool - Service Notes v2.1 (Refactorisé)
 * ==================================
 * - Résolution enseignant via MembrePersonnel.utilisateurId
 * - Guards période clôturée + affectations actives (create ET createBulk)
 * - Niveaux de validation configurables (notes.validation_levels)
 * - Pagination standardisée PaginatedResult + recherche serveur
 * - Statistiques de notes (GET /api/notes/statistiques)
 */

import { Repository, FindOptionsWhere, In } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Note, TypeEvaluation, StatutNote, NoteVersion } from '../entities';
import { AffectationEleve } from '@modules/classes/entities';
import { CreateNoteDto, UpdateNoteDto, CreateBulkNotesDto, QueryNotesDto, QueryNotesStatistiquesDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { parentsService } from '@modules/responsables-eleves/services';
import { getParamNumber, getParamBoolean } from '@modules/configuration/utils/config.helper';
import { auditService, AuditAction } from '@modules/auth';
import { periodesService } from '@modules/periodes/services';
import { StatutPeriode } from '@modules/periodes/entities';
import { notificationTemplates } from '@modules/notifications/services';
import { MembrePersonnel } from '@modules/personnel/entities';
import { Eleve } from '@modules/eleves/entities';
import { Matiere } from '@modules/matieres/entities';
import { validationWorkflowService } from '@modules/validation-workflow/services';
import { StatutWorkflow, DecisionValidation } from '@modules/validation-workflow/entities';
import { gamificationService } from '@modules/gamification/services';
import { PaginatedResult, createPaginatedResult } from '@common/utils/pagination.util';

/**
 * Tranches de distribution des notes (sur 20)
 */
const TRANCHES_DISTRIBUTION: Array<{ tranche: string; min: number; max: number }> = [
    { tranche: '0-5', min: 0, max: 5 },
    { tranche: '5-8', min: 5, max: 8 },
    { tranche: '8-10', min: 8, max: 10 },
    { tranche: '10-12', min: 10, max: 12 },
    { tranche: '12-14', min: 12, max: 14 },
    { tranche: '14-16', min: 14, max: 16 },
    { tranche: '16-20', min: 16, max: 20.0001 }, // borne haute inclusive
];

/**
 * Résultat des statistiques de notes
 */
export interface NotesStatistiquesResult {
    nombreNotes: number;
    moyenne: number;
    mediane: number;
    min: number;
    max: number;
    ecartType: number;
    distribution: Array<{ tranche: string; count: number }>;
    parType: Array<{ typeEvaluation: TypeEvaluation; count: number; moyenne: number }>;
    parStatut: Array<{ statut: StatutNote; count: number }>;
}

export class NotesService {
    private noteRepository: Repository<Note>;
    private versionRepository: Repository<NoteVersion>;

    constructor() {
        this.noteRepository = AppDataSource.getRepository(Note);
        this.versionRepository = AppDataSource.getRepository(NoteVersion);
    }

    private async getNotesParams() {
        return {
            baremeDefaut: await getParamNumber('notes.bareme_defaut', { defaultValue: 20 }),
            showRanking: await getParamBoolean('notes.show_ranking', { defaultValue: true }),
            requireValidation: await getParamBoolean('notes.require_validation', { defaultValue: true }),
            allowBulkEntry: await getParamBoolean('notes.allow_bulk_entry', { defaultValue: true }),
            validationLevels: await getParamNumber('notes.validation_levels', { defaultValue: 2 }),
        };
    }

    /**
     * Résout le MembrePersonnel correspondant à un utilisateur.
     * Note.enseignantId référence MembrePersonnel.id (PAS Utilisateur.id).
     * Retourne undefined si l'utilisateur n'est pas rattaché au personnel
     * (ex: administrateur) — la note est alors créée sans enseignant.
     */
    private async resolveEnseignantId(utilisateurId: string): Promise<string | undefined> {
        try {
            const membreRepo = AppDataSource.getRepository(MembrePersonnel);
            const membre = await membreRepo.findOne({ where: { utilisateurId } });
            if (membre) return membre.id;
            logger.warn(`[Notes] Utilisateur ${utilisateurId} non rattaché au personnel — note sans enseignant`);
            return undefined;
        } catch (e) {
            logger.warn('[Notes] Impossible de résoudre le membre du personnel (non bloquant)', e);
            return undefined;
        }
    }

    async create(createDto: CreateNoteDto, utilisateurId: string, etablissementId?: string): Promise<Note> {
        const params = await this.getNotesParams();

        // 1. Récupérer l'année scolaire via la période
        const periode = await periodesService.findOne(createDto.periodeId);
        const anneeId = periode.anneeScolaireId;

        // 2. Guard de clôture - empêcher les notes dans période clôturée
        if (periode.statut === StatutPeriode.CLOTUREE) {
            throw new AppError(
                'Impossible d\'ajouter une note dans une période clôturée',
                400,
                'PERIODE_CLOTUREE'
            );
        }

        // 3. Déduire et vérifier l'affectation active de l'élève
        const affectationRepo = AppDataSource.getRepository(AffectationEleve);
        const affectation = await affectationRepo.findOne({
            where: {
                eleveId: createDto.eleveId,
                anneeScolaireId: anneeId,
                actif: true
            },
            relations: ['classe']
        });

        if (!affectation) {
            throw new AppError(
                `L'élève n'est affecté à aucune classe active pour cette année scolaire`,
                400,
                'ELEVE_SANS_CLASSE'
            );
        }

        // 4. Résoudre l'enseignant (MembrePersonnel) depuis l'utilisateur connecté
        const enseignantId = await this.resolveEnseignantId(utilisateurId);

        // 5. Résoudre coefficient/bareme depuis la hiérarchie matières si non fournis
        let coefficient = createDto.coefficient;
        let bareme = createDto.bareme;

        if (coefficient === undefined || bareme === undefined) {
            try {
                const matiereNiveauRepo = AppDataSource.getRepository('MatiereNiveau') as any;
                const affectationMatiereRepo = AppDataSource.getRepository('AffectationMatiere') as any;
                const classeAnneeRepo = AppDataSource.getRepository('AffectationEleve') as any;

                // Trouver le niveau de la classe et le programme associé
                const affectationDetail = await classeAnneeRepo.findOne({
                    where: { eleveId: createDto.eleveId, anneeScolaireId: anneeId, actif: true },
                    relations: ['classe', 'classeAnnee'],
                });

                if (affectationDetail?.classe?.niveauId) {
                    const niveauId = affectationDetail.classe.niveauId;

                    // Chercher l'affectation matière (source prioritaire pour le coefficient)
                    // NB: AffectationMatiere ne porte PAS de barème (champ inexistant)
                    const affectMatiere = await affectationMatiereRepo.findOne({
                        where: { matiereId: createDto.matiereId, classeAnneeId: createDto.classeAnneeId },
                    });

                    if (coefficient === undefined) {
                        coefficient = affectMatiere?.coefficient;
                    }

                    // ProgrammeMatiere override (via programme de la ClasseAnnee)
                    if (coefficient === undefined || bareme === undefined) {
                        const programmeId = affectationDetail.classeAnnee?.programmeId;
                        if (programmeId) {
                            const mn = await matiereNiveauRepo.findOne({
                                where: { matiereId: createDto.matiereId, niveauId },
                                select: ['id'],
                            });
                            if (mn?.id) {
                                const pm = await AppDataSource.getRepository('ProgrammeMatiere').findOne({
                                    where: { programmeId, matiereNiveauId: mn.id },
                                });
                                if (coefficient === undefined) coefficient = pm?.coefficient;
                                if (bareme === undefined) bareme = pm?.bareme;
                            }
                        }
                    }

                    // Fallback sur MatiereNiveau (grille matière-niveau)
                    if (coefficient === undefined || bareme === undefined) {
                        const mn = await matiereNiveauRepo.findOne({
                            where: { matiereId: createDto.matiereId, niveauId },
                        });

                        if (coefficient === undefined) {
                            coefficient = mn?.coefficient;
                        }
                        if (bareme === undefined) {
                            bareme = mn?.bareme;
                        }
                    }
                }
            } catch (e) {
                logger.warn('[Notes] Impossible de résoudre config matiere (non bloquant)', e);
            }
        }

        // 6. Créer la note (classeId déduit via AffectationEleve, plus stocké dans Note)
        const note = this.noteRepository.create({
            ...createDto,
            coefficient: coefficient ?? 1,
            bareme: bareme ?? params.baremeDefaut,
            enseignantId,
            anneeScolaireId: anneeId,
            dateEvaluation: createDto.dateEvaluation ? new Date(createDto.dateEvaluation) : undefined,
            statut: params.requireValidation ? StatutNote.BROUILLON : StatutNote.VALIDEE,
            etablissementId,
        });

        await this.noteRepository.save(note);

        // Créer un workflow de validation si requis
        if (params.requireValidation) {
            await validationWorkflowService.createWorkflow({
                module: 'notes',
                entiteId: note.id,
                entiteType: 'Note',
                niveauxRequis: params.validationLevels,
                etablissementId,
            }, utilisateurId);
        }

        await auditService.log({
            utilisateurId,
            action: AuditAction.NOTE_CREATE,
            cible: 'Note',
            cibleId: note.id,
            description: `Note créée pour élève ${createDto.eleveId}`,
            module: 'notes',
        });

        // NOTIFICATION : Envoyer une notification aux parents
        try {
            const eleveRepo = AppDataSource.getRepository(Eleve);
            const matiereRepo = AppDataSource.getRepository(Matiere);
            const personnelRepo = AppDataSource.getRepository(MembrePersonnel);

            const eleve = await eleveRepo.findOne({ 
                where: { id: createDto.eleveId },
                relations: ['utilisateur']
            });
            
            if (eleve) {
                const matiere = await matiereRepo.findOne({ where: { id: createDto.matiereId } });
                // enseignantId est un MembrePersonnel.id, on récupère son utilisateur
                const enseignant = enseignantId
                    ? await personnelRepo.findOne({
                        where: { id: enseignantId },
                        relations: ['utilisateur']
                    })
                    : null;

                // Trouver les responsables de cet élève
                const responsables = await parentsService.getResponsablesForNotification(eleve.utilisateurId);

                // Notifier chaque responsable
                if (responsables && responsables.length > 0) {
                    for (const resp of responsables) {
                        await notificationTemplates.nouvelleNote({
                            destinataireId: resp.utilisateurId,
                            etablissementId,
                            metadata: {
                                noteId: note.id,
                                eleveId: eleve.id,
                            },
                        }, {
                            eleveNom: `Élève ${eleve.id.substring(0, 8)}`,
                            matiere: matiere?.nom || 'Matière',
                            note: createDto.valeur,
                            bareme: note.bareme,
                            periode: periode?.nom || 'Période',
                            enseignant: enseignant?.utilisateur
                                ? `${enseignant.utilisateur.pseudonyme || enseignant.utilisateur.email?.split('@')[0] || 'Enseignant'}`
                                : 'Enseignant',
                        });
                    }
                }
            }
        } catch (error) {
            // Ne pas bloquer la création de note si la notification échoue
            logger.warn('[Notes] Échec envoi notification nouvelle note (non bloquant)', error);
        }

        // GAMIFICATION : Attribution automatique de points pour bonne note
        try {
            const eleveRepo = AppDataSource.getRepository(Eleve);
            const eleve = await eleveRepo.findOne({ 
                where: { id: createDto.eleveId },
                select: ['utilisateurId']
            });
            
            if (eleve) {
                // Attribution points si note ≥ 80% du barème (ou seuil configuré)
                await gamificationService.attribuerPointsBonneNote(
                    eleve.utilisateurId,
                    createDto.valeur,
                    note.bareme
                );
                
                logger.info(`[Notes] Points gamification attribués pour note ${createDto.valeur}/${note.bareme}`);
            }
        } catch (error) {
            // Ne pas bloquer la création de note si la gamification échoue
            logger.warn('[Notes] Échec attribution points gamification (non bloquant)', error);
        }

        return note;
    }

    async createBulk(createDto: CreateBulkNotesDto, utilisateurId: string, etablissementId?: string): Promise<number> {
        const params = await this.getNotesParams();

        // 1. Vérifier que la saisie en masse est autorisée par la configuration
        if (!params.allowBulkEntry) {
            throw new AppError(
                'La saisie de notes en masse est désactivée par la configuration',
                403,
                'BULK_ENTRY_DISABLED'
            );
        }

        const periode = await periodesService.findOne(createDto.periodeId);
        const anneeId = periode.anneeScolaireId;

        // 2. Guard de clôture — cohérent avec create()
        if (periode.statut === StatutPeriode.CLOTUREE) {
            throw new AppError(
                'Impossible d\'ajouter des notes dans une période clôturée',
                400,
                'PERIODE_CLOTUREE'
            );
        }

        // 3. Vérifier que chaque élève a une affectation active (une seule requête batch)
        const eleveIds = [...new Set(createDto.notes.map((n) => n.eleveId))];
        const affectationRepo = AppDataSource.getRepository(AffectationEleve);
        const affectations = await affectationRepo.find({
            where: {
                eleveId: In(eleveIds),
                anneeScolaireId: anneeId,
                actif: true,
            },
            select: ['id', 'eleveId'],
        });
        const elevesAffectes = new Set(affectations.map((a) => a.eleveId));
        const sansInscription = eleveIds.filter((id) => !elevesAffectes.has(id));
        if (sansInscription.length > 0) {
            throw new AppError(
                `Élèves sans inscription active pour cette année scolaire: ${sansInscription.join(', ')}`,
                400,
                'ELEVES_SANS_INSCRIPTION'
            );
        }

        // 4. Résoudre l'enseignant (MembrePersonnel) depuis l'utilisateur connecté
        const enseignantId = await this.resolveEnseignantId(utilisateurId);

        // 5. Résoudre coefficient/bareme depuis la hiérarchie si non fournis
        let coefficient = createDto.coefficient;
        let bareme = createDto.bareme;

        if (coefficient === undefined || bareme === undefined) {
            try {
                const matiereNiveauRepo = AppDataSource.getRepository('MatiereNiveau') as any;
                const affectationMatiereRepo = AppDataSource.getRepository('AffectationMatiere') as any;

                // NB: AffectationMatiere ne porte PAS de barème (champ inexistant)
                const affectMatiere = await affectationMatiereRepo.findOne({
                    where: { matiereId: createDto.matiereId, classeAnneeId: createDto.classeAnneeId },
                });

                if (coefficient === undefined) {
                    coefficient = affectMatiere?.coefficient;
                }

                // ProgrammeMatiere override (via programme de la ClasseAnnee)
                if (coefficient === undefined || bareme === undefined) {
                    const classeAnnee = await AppDataSource.getRepository('ClasseAnnee').findOne({
                        where: { id: createDto.classeAnneeId },
                        relations: ['classe'],
                    });

                    if (classeAnnee?.classe?.niveauId) {
                        const niveauId = classeAnnee.classe.niveauId;

                        // ProgrammeMatiere lookup
                        const programmeId = classeAnnee.programmeId;
                        if (programmeId) {
                            const mn = await matiereNiveauRepo.findOne({
                                where: { matiereId: createDto.matiereId, niveauId },
                                select: ['id'],
                            });
                            if (mn?.id) {
                                const pm = await AppDataSource.getRepository('ProgrammeMatiere').findOne({
                                    where: { programmeId, matiereNiveauId: mn.id },
                                });
                                if (coefficient === undefined) coefficient = pm?.coefficient;
                                if (bareme === undefined) bareme = pm?.bareme;
                            }
                        }

                        // Fallback MatiereNiveau
                        if (coefficient === undefined || bareme === undefined) {
                            const mnResult = await matiereNiveauRepo.findOne({
                                where: { matiereId: createDto.matiereId, niveauId },
                            });
                            if (coefficient === undefined) coefficient = mnResult?.coefficient;
                            if (bareme === undefined) bareme = mnResult?.bareme;
                        }
                    }
                }
            } catch (e) {
                logger.warn('[Notes] Impossible de résoudre config matiere pour bulk (non bloquant)', e);
            }
        }

        const notes = createDto.notes.map((n) =>
            this.noteRepository.create({
                eleveId: n.eleveId,
                matiereId: createDto.matiereId,
                classeAnneeId: createDto.classeAnneeId,
                anneeScolaireId: anneeId,
                periodeId: createDto.periodeId,
                typeEvaluation: createDto.typeEvaluation as TypeEvaluation,
                description: createDto.description,
                valeur: n.valeur,
                bareme: bareme ?? params.baremeDefaut,
                coefficient: coefficient ?? 1,
                commentaire: n.commentaire,
                dateEvaluation: createDto.dateEvaluation ? new Date(createDto.dateEvaluation) : undefined,
                enseignantId,
                statut: params.requireValidation ? StatutNote.BROUILLON : StatutNote.VALIDEE,
                etablissementId,
            })
        );

        await this.noteRepository.save(notes);

        // Créer des workflows de validation si requis (un par note)
        if (params.requireValidation) {
            for (const note of notes) {
                await validationWorkflowService.createWorkflow({
                    module: 'notes',
                    entiteId: note.id,
                    entiteType: 'Note',
                    niveauxRequis: params.validationLevels,
                    etablissementId,
                }, utilisateurId);
            }
        }

        await auditService.log({
            utilisateurId,
            action: AuditAction.NOTE_CREATE,
            description: `Bulk: ${notes.length} notes créées`,
            module: 'notes',
        });

        return notes.length;
    }

    async findAll(query: QueryNotesDto, etablissementId?: string): Promise<PaginatedResult<Note>> {
        const { page, limit, eleveId, matiereId, classeAnneeId, periodeId, typeEvaluation, statut, recherche } = query;

        const qb = this.noteRepository.createQueryBuilder('note')
            .leftJoinAndSelect('note.eleve', 'eleve')
            .leftJoinAndSelect('note.enseignant', 'enseignant')
            .leftJoinAndSelect('note.matiere', 'matiere')
            .leftJoinAndSelect('note.classeAnnee', 'classeAnnee')
            .leftJoinAndSelect('classeAnnee.classe', 'classe')
            .leftJoinAndSelect('classeAnnee.anneeScolaire', 'anneeScolaire')
            .leftJoinAndSelect('note.periode', 'periode');

        if (eleveId) qb.andWhere('note.eleveId = :eleveId', { eleveId });
        if (matiereId) qb.andWhere('note.matiereId = :matiereId', { matiereId });
        if (classeAnneeId) qb.andWhere('note.classeAnneeId = :classeAnneeId', { classeAnneeId });
        if (periodeId) qb.andWhere('note.periodeId = :periodeId', { periodeId });
        if (typeEvaluation) qb.andWhere('note.typeEvaluation = :typeEvaluation', { typeEvaluation });
        if (statut) qb.andWhere('note.statut = :statut', { statut });
        if (etablissementId) qb.andWhere('note.etablissementId = :etablissementId', { etablissementId });

        // Recherche serveur : nom/prénom élève + description de la note
        if (recherche) {
            qb.andWhere(
                '(eleve.nom ILIKE :recherche OR eleve.prenom ILIKE :recherche OR note.description ILIKE :recherche)',
                { recherche: `%${recherche}%` }
            );
        }

        qb.orderBy('note.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        const [items, total] = await qb.getManyAndCount();

        return createPaginatedResult(items, total, page, limit);
    }

    async findOne(id: string, etablissementId?: string): Promise<Note> {
        const where: FindOptionsWhere<Note> = { id };
        if (etablissementId) where.etablissementId = etablissementId;

        const note = await this.noteRepository.findOne({
            where,
            relations: ['eleve', 'enseignant', 'matiere', 'classeAnnee', 'periode'],
        });
        if (!note) throw new AppError('Note non trouvée', 404, 'NOTE_NOT_FOUND');
        return note;
    }

    async update(id: string, updateDto: UpdateNoteDto, utilisateurId: string, etablissementId?: string): Promise<Note> {
        const note = await this.findOne(id, etablissementId);

        // Vérifier le verrouillage de la période associée
        if (note.periodeId) {
            const periode = await periodesService.findOne(note.periodeId);
            if (periode.statut === StatutPeriode.CLOTUREE) {
                const lockOnCloture = await getParamBoolean('periodes.lock_on_cloture', { defaultValue: true });
                if (lockOnCloture) {
                    throw new AppError(
                        'Impossible de modifier une note dans une période clôturée',
                        400,
                        'PERIODE_CLOTUREE_IMMUTABLE',
                    );
                }
            }
        }

        // Snapshot de l'état AVANT modification pour l'historique
        const snapshotAvant: Record<string, unknown> = {
            valeur: note.valeur,
            bareme: note.bareme,
            coefficient: note.coefficient,
            typeEvaluation: note.typeEvaluation,
            description: note.description,
            commentaire: note.commentaire,
            dateEvaluation: note.dateEvaluation,
            statut: note.statut,
            enseignantId: note.enseignantId,
            validateurId: note.validateurId,
        };

        // Si on change le statut, utiliser le workflow de validation
        if (updateDto.statut) {
            const workflow = await validationWorkflowService.findByModuleAndEntite('notes', id);
            
            if (workflow && workflow.statut === StatutWorkflow.EN_COURS) {
                const decision = updateDto.statut === StatutNote.VALIDEE || updateDto.statut === StatutNote.PUBLIEE
                    ? DecisionValidation.APPROUVE
                    : DecisionValidation.REJETE;

                const updatedWorkflow = await validationWorkflowService.traiterValidation(
                    workflow.id,
                    { decision, commentaire: updateDto.commentaire },
                    utilisateurId
                );

                if (updatedWorkflow.statut === StatutWorkflow.COMPLETEE) {
                    note.statut = StatutNote.PUBLIEE;
                } else if (updatedWorkflow.statut === StatutWorkflow.REJETEE) {
                    note.statut = StatutNote.BROUILLON;
                } else {
                    note.statut = StatutNote.VALIDEE;
                }

                note.validateurId = utilisateurId;
                note.valideeAt = new Date();
            } else {
                Object.assign(note, updateDto);
                if (updateDto.statut === StatutNote.VALIDEE || updateDto.statut === StatutNote.PUBLIEE) {
                    note.validateurId = utilisateurId;
                    note.valideeAt = new Date();
                }
            }
        } else {
            Object.assign(note, updateDto);
        }

        // Créer la version avant de sauvegarder
        await this.creerVersion(note.id, snapshotAvant, utilisateurId, note.etablissementId, updateDto.commentaire);

        await this.noteRepository.save(note);
        return note;
    }

    async remove(id: string, utilisateurId: string, etablissementId?: string): Promise<void> {
        const note = await this.findOne(id, etablissementId);

        // Guard de clôture — cohérent avec update()
        if (note.periodeId) {
            const periode = await periodesService.findOne(note.periodeId);
            if (periode.statut === StatutPeriode.CLOTUREE) {
                const lockOnCloture = await getParamBoolean('periodes.lock_on_cloture', { defaultValue: true });
                if (lockOnCloture) {
                    throw new AppError(
                        'Impossible de supprimer une note dans une période clôturée',
                        400,
                        'PERIODE_CLOTUREE_IMMUTABLE',
                    );
                }
            }
        }

        // Nettoyer le workflow de validation associé
        try {
            const workflow = await validationWorkflowService.findByModuleAndEntite('notes', id);
            if (workflow) {
                await validationWorkflowService.remove(workflow.id);
            }
        } catch (e) {
            logger.warn('[Notes] Impossible de nettoyer le workflow de validation (non bloquant)', e);
        }

        await this.noteRepository.remove(note);

        await auditService.log({
            utilisateurId,
            action: AuditAction.NOTE_DELETE,
            cible: 'Note',
            cibleId: id,
            description: `Note supprimée (élève: ${note.eleveId}, matière: ${note.matiereId})`,
            module: 'notes',
        });

        logger.info(`[Notes] Note ${id} supprimée par ${utilisateurId}`);
    }

    // Calcul de moyenne refactorisé — les notes VALIDEE et PUBLIEE comptent
    async calculerMoyenne(eleveId: string, matiereId: string, periodeId?: string, etablissementId?: string): Promise<number> {
        const where: FindOptionsWhere<Note> = {
            eleveId,
            matiereId,
            statut: In([StatutNote.VALIDEE, StatutNote.PUBLIEE]),
        };
        if (periodeId) where.periodeId = periodeId;
        if (etablissementId) where.etablissementId = etablissementId;

        const notes = await this.noteRepository.find({ where });
        if (notes.length === 0) return 0;

        let totalPondere = 0;
        let totalCoeff = 0;

        for (const note of notes) {
            const note20 = note.noteSur20;
            totalPondere += note20 * note.coefficient;
            totalCoeff += note.coefficient;
        }

        return totalCoeff > 0 ? Math.round((totalPondere / totalCoeff) * 100) / 100 : 0;
    }

    /**
     * Statistiques de notes (GET /api/notes/statistiques)
     * - Calculs (moyenne, médiane, min, max, écart-type, distribution, parType)
     *   sur les notes VALIDEE + PUBLIEE, ramenées sur 20
     * - parStatut compte TOUTES les notes correspondant aux filtres
     */
    async getStatistiques(query: QueryNotesStatistiquesDto, etablissementId?: string): Promise<NotesStatistiquesResult> {
        const where: FindOptionsWhere<Note> = {};
        if (query.periodeId) where.periodeId = query.periodeId;
        if (query.classeAnneeId) where.classeAnneeId = query.classeAnneeId;
        if (query.matiereId) where.matiereId = query.matiereId;
        if (query.eleveId) where.eleveId = query.eleveId;
        if (etablissementId) where.etablissementId = etablissementId;

        const notes = await this.noteRepository.find({
            where,
            select: ['id', 'valeur', 'bareme', 'coefficient', 'typeEvaluation', 'statut'],
        });

        // Répartition par statut (toutes notes)
        const statutCounts = new Map<StatutNote, number>();
        for (const note of notes) {
            statutCounts.set(note.statut, (statutCounts.get(note.statut) || 0) + 1);
        }
        const parStatut = Object.values(StatutNote)
            .filter((s) => statutCounts.has(s))
            .map((s) => ({ statut: s, count: statutCounts.get(s)! }));

        // Notes comptabilisées : VALIDEE + PUBLIEE
        const notesComptees = notes.filter(
            (n) => n.statut === StatutNote.VALIDEE || n.statut === StatutNote.PUBLIEE
        );

        const arrondi = (v: number) => Math.round(v * 100) / 100;

        if (notesComptees.length === 0) {
            return {
                nombreNotes: 0,
                moyenne: 0,
                mediane: 0,
                min: 0,
                max: 0,
                ecartType: 0,
                distribution: TRANCHES_DISTRIBUTION.map((t) => ({ tranche: t.tranche, count: 0 })),
                parType: [],
                parStatut,
            };
        }

        const valeurs20 = notesComptees.map((n) => n.noteSur20).sort((a, b) => a - b);
        const nombreNotes = valeurs20.length;
        const somme = valeurs20.reduce((acc, v) => acc + v, 0);
        const moyenne = somme / nombreNotes;

        // Médiane
        const milieu = Math.floor(nombreNotes / 2);
        const mediane = nombreNotes % 2 === 0
            ? (valeurs20[milieu - 1] + valeurs20[milieu]) / 2
            : valeurs20[milieu];

        // Écart-type (population)
        const variance = valeurs20.reduce((acc, v) => acc + Math.pow(v - moyenne, 2), 0) / nombreNotes;
        const ecartType = Math.sqrt(variance);

        // Distribution par tranches
        const distribution = TRANCHES_DISTRIBUTION.map((t) => ({
            tranche: t.tranche,
            count: valeurs20.filter((v) => v >= t.min && v < t.max).length,
        }));

        // Répartition par type d'évaluation
        const typeAgg = new Map<TypeEvaluation, { count: number; somme: number }>();
        for (const note of notesComptees) {
            const agg = typeAgg.get(note.typeEvaluation) || { count: 0, somme: 0 };
            agg.count++;
            agg.somme += note.noteSur20;
            typeAgg.set(note.typeEvaluation, agg);
        }
        const parType = [...typeAgg.entries()].map(([typeEvaluation, agg]) => ({
            typeEvaluation,
            count: agg.count,
            moyenne: arrondi(agg.somme / agg.count),
        }));

        return {
            nombreNotes,
            moyenne: arrondi(moyenne),
            mediane: arrondi(mediane),
            min: arrondi(valeurs20[0]),
            max: arrondi(valeurs20[nombreNotes - 1]),
            ecartType: arrondi(ecartType),
            distribution,
            parType,
            parStatut,
        };
    }

    async creerVersion(
        noteId: string,
        snapshot: Record<string, unknown>,
        modifiePar: string,
        etablissementId: string,
        raison?: string,
    ): Promise<NoteVersion> {
        const dernierNumero = await this.versionRepository
            .createQueryBuilder('v')
            .select('MAX(v.version)', 'maxVersion')
            .where('v.noteId = :noteId', { noteId })
            .getRawOne<{ maxVersion: number | null }>();

        const version = (dernierNumero?.maxVersion ?? 0) + 1;

        const noteVersion = this.versionRepository.create({
            noteId,
            version,
            snapshot,
            modifiePar,
            etablissementId,
            ...(raison ? { raison: raison.substring(0, 50) } : {}),
        });

        await this.versionRepository.save(noteVersion);
        logger.info(`NoteVersion créée: note ${noteId}, version ${version}`);
        return noteVersion;
    }

    async getHistorique(noteId: string, etablissementId?: string): Promise<NoteVersion[]> {
        return this.versionRepository.find({
            where: {
                noteId,
                ...(etablissementId ? { etablissementId } : {}),
            },
            order: { version: 'DESC' },
        });
    }
}

export const notesService = new NotesService();
export default NotesService;
