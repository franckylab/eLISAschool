/**
 * ==================================
 * eLISAschool - Service Notes v2.0 (Refactorisé)
 * ==================================
 */

import { Repository, FindOptionsWhere } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Note, TypeEvaluation, StatutNote } from '../entities';
import { AffectationEleve } from '@modules/classes/entities';
import { CreateNoteDto, UpdateNoteDto, CreateBulkNotesDto, QueryNotesDto } from '../dto';
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


export class NotesService {
    private noteRepository: Repository<Note>;

    constructor() {
        this.noteRepository = AppDataSource.getRepository(Note);
    }

    private async getNotesParams() {
        return {
            baremeDefaut: await getParamNumber('notes.bareme_defaut', { defaultValue: 20 }),
            showRanking: await getParamBoolean('notes.show_ranking', { defaultValue: true }),
            requireValidation: await getParamBoolean('notes.require_validation', { defaultValue: true }),
        };
    }

    async create(createDto: CreateNoteDto, enseignantId: string, etablissementId?: string): Promise<Note> {
        const params = await this.getNotesParams();

        // 1. Récupérer l'année scolaire via la période
        const periode = await periodesService.findOne(createDto.periodeId);
        const anneeId = periode.anneeScolaireId;

        // 2. NOUVEAU: Guard de clôture - empêcher les notes dans période clôturée
        if (periode.statut === StatutPeriode.CLOTUREE) {
            throw new AppError(
                'Impossible d\'ajouter une note dans une période clôturée',
                400,
                'PERIODE_CLOTUREE'
            );
        }

        // 3. NOUVEAU: Déduire et vérifier l'affectation active de l'élève
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

        // 4. Résoudre coefficient/bareme depuis la hiérarchie matières si non fournis
        let coefficient = createDto.coefficient;
        let bareme = createDto.bareme;

        if (coefficient === undefined || bareme === undefined) {
            try {
                const matiereNiveauRepo = AppDataSource.getRepository('MatiereNiveau') as any;
                const affectationRepo = AppDataSource.getRepository('AffectationMatiere') as any;
                const classeAnneeRepo = AppDataSource.getRepository('AffectationEleve') as any;

                // Trouver le niveau de la classe et le programme associé
                const affectation = await classeAnneeRepo.findOne({
                    where: { eleveId: createDto.eleveId, anneeScolaireId: anneeId, actif: true },
                    relations: ['classe', 'classeAnnee'],
                });

                if (affectation?.classe?.niveauId) {
                    const niveauId = affectation.classe.niveauId;

                    // Chercher l'affectation matière (source prioritaire)
                    const affectMatiere = await affectationRepo.findOne({
                        where: { matiereId: createDto.matiereId, classeAnneeId: createDto.classeAnneeId },
                    });

                    if (coefficient === undefined) {
                        coefficient = affectMatiere?.coefficient;
                    }
                    if (bareme === undefined) {
                        bareme = affectMatiere?.bareme;
                    }

                    // ProgrammeMatiere override (via programme de la ClasseAnnee)
                    if (coefficient === undefined || bareme === undefined) {
                        const programmeId = affectation.classeAnnee?.programmeId;
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

        // 5. Créer la note (classeId déduit via AffectationEleve, plus stocké dans Note)
        const note = this.noteRepository.create({
            ...createDto,
            coefficient: coefficient ?? 1,
            bareme: bareme ?? params.baremeDefaut,
            enseignantId,
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
                niveauxRequis: 2,
                etablissementId,
            }, enseignantId);
        }

        await auditService.log({
            utilisateurId: enseignantId,
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
                // L'enseignantId est maintenant un MembrePersonnel, on récupère son utilisateur
                const enseignant = await personnelRepo.findOne({ 
                    where: { id: enseignantId },
                    relations: ['utilisateur']
                });
                const periode = await periodesService.findOne(createDto.periodeId);

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
                            bareme: createDto.bareme || 20,
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
                const bareme = createDto.bareme || (await this.getNotesParams()).baremeDefaut;
                
                // Attribution points si note ≥ 80% du barème (ou seuil configuré)
                await gamificationService.attribuerPointsBonneNote(
                    eleve.utilisateurId,
                    createDto.valeur,
                    bareme
                );
                
                logger.info(`[Notes] Points gamification attribués pour note ${createDto.valeur}/${bareme}`);
            }
        } catch (error) {
            // Ne pas bloquer la création de note si la gamification échoue
            logger.warn('[Notes] Échec attribution points gamification (non bloquant)', error);
        }

        return note;
    }

    async createBulk(createDto: CreateBulkNotesDto, enseignantId: string, etablissementId?: string): Promise<number> {
        const params = await this.getNotesParams();

        const periode = await periodesService.findOne(createDto.periodeId);
        const anneeId = periode.anneeScolaireId;

        // Résoudre coefficient/bareme depuis la hiérarchie si non fournis
        let coefficient = createDto.coefficient;
        let bareme = createDto.bareme;

        if (coefficient === undefined || bareme === undefined) {
            try {
                const matiereNiveauRepo = AppDataSource.getRepository('MatiereNiveau') as any;
                const affectationRepo = AppDataSource.getRepository('AffectationMatiere') as any;

                const affectMatiere = await affectationRepo.findOne({
                    where: { matiereId: createDto.matiereId, classeAnneeId: createDto.classeAnneeId },
                });

                if (coefficient === undefined) {
                    coefficient = affectMatiere?.coefficient;
                }
                if (bareme === undefined) {
                    bareme = affectMatiere?.bareme;
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
                    niveauxRequis: 2,
                    etablissementId,
                }, enseignantId);
            }
        }

        await auditService.log({
            utilisateurId: enseignantId,
            action: AuditAction.NOTE_CREATE,
            description: `Bulk: ${notes.length} notes créées`,
            module: 'notes',
        });

        return notes.length;
    }

    async findAll(query: QueryNotesDto, etablissementId?: string): Promise<{ items: Note[]; total: number }> {
        const { page, limit, eleveId, matiereId, classeAnneeId, periodeId, typeEvaluation, statut } = query;

        const where: FindOptionsWhere<Note> = {};
        if (eleveId) where.eleveId = eleveId;
        if (matiereId) where.matiereId = matiereId;
        if (classeAnneeId) where.classeAnneeId = classeAnneeId;
        if (periodeId) where.periodeId = periodeId;
        if (typeEvaluation) where.typeEvaluation = typeEvaluation;
        if (statut) where.statut = statut;
        if (etablissementId) where.etablissementId = etablissementId;

        const [items, total] = await this.noteRepository.findAndCount({
            where,
            relations: ['eleve', 'enseignant', 'matiere', 'classeAnnee', 'classeAnnee.classe', 'classeAnnee.anneeScolaire', 'periode'],
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return { items, total };
    }

    async findOne(id: string): Promise<Note> {
        const note = await this.noteRepository.findOne({
            where: { id },
            relations: ['eleve', 'enseignant', 'matiere', 'classeAnnee', 'periode'],
        });
        if (!note) throw new AppError('Note non trouvée', 404, 'NOTE_NOT_FOUND');
        return note;
    }

    async update(id: string, updateDto: UpdateNoteDto, utilisateurId: string): Promise<Note> {
        const note = await this.findOne(id);

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

        // Si on change le statut, utiliser le workflow de validation
        if (updateDto.statut) {
            const workflow = await validationWorkflowService.findByModuleAndEntite('notes', id);
            
            if (workflow && workflow.statut === StatutWorkflow.EN_COURS) {
                // Déterminer la décision basée sur le statut demandé
                const decision = updateDto.statut === StatutNote.VALIDEE || updateDto.statut === StatutNote.PUBLIEE
                    ? DecisionValidation.APPROUVE
                    : DecisionValidation.REJETE;

                // Traiter la validation via le workflow
                const updatedWorkflow = await validationWorkflowService.traiterValidation(
                    workflow.id,
                    { decision, commentaire: updateDto.commentaire },
                    utilisateurId
                );

                // Mettre à jour le statut de la note selon le workflow
                if (updatedWorkflow.statut === StatutWorkflow.COMPLETEE) {
                    note.statut = StatutNote.PUBLIEE; // Workflow complet = publiée
                } else if (updatedWorkflow.statut === StatutWorkflow.REJETEE) {
                    note.statut = StatutNote.BROUILLON; // Rejet = retour brouillon
                } else {
                    note.statut = StatutNote.VALIDEE; // En cours = validée partiellement
                }

                note.validateurId = utilisateurId;
                note.valideeAt = new Date();
            } else {
                // Pas de workflow ou déjà complet, mise à jour directe
                Object.assign(note, updateDto);
                if (updateDto.statut === StatutNote.VALIDEE || updateDto.statut === StatutNote.PUBLIEE) {
                    note.validateurId = utilisateurId;
                    note.valideeAt = new Date();
                }
            }
        } else {
            // Mise à jour normale sans changement de statut
            Object.assign(note, updateDto);
        }

        await this.noteRepository.save(note);
        return note;
    }

    async remove(id: string, utilisateurId: string): Promise<void> {
        const note = await this.findOne(id);

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

    // Calcul de moyenne refactorisé
    async calculerMoyenne(eleveId: string, matiereId: string, periodeId?: string, etablissementId?: string): Promise<number> {
        const where: FindOptionsWhere<Note> = { eleveId, matiereId, statut: StatutNote.PUBLIEE };
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
}

export const notesService = new NotesService();
export default NotesService;
