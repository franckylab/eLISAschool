/**
 * ==================================
 * eLISAschool - Service Notes v2.0 (Refactorisé)
 * ==================================
 */

import { Repository, FindOptionsWhere } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Note, TypeEvaluation, StatutNote } from '../entities';
import { CreateNoteDto, UpdateNoteDto, CreateBulkNotesDto, QueryNotesDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { parentsService } from '@modules/responsables-eleves/services';
import { getParamNumber, getParamBoolean } from '@modules/configuration/utils/config.helper';
import { auditService, AuditAction } from '@modules/auth';
import { periodesService } from '@modules/periodes/services';
import { AffectationEleve } from '@modules/classes/entities';
import { notificationTemplates } from '@modules/notifications/services';
import { Eleve } from '@modules/eleves/entities';
import { Matiere } from '@modules/matieres/entities';
import { Utilisateur } from '@modules/utilisateurs/entities';
import { validationWorkflowService } from '@modules/validation-workflow/services';
import { StatutWorkflow, DecisionValidation } from '@modules/validation-workflow/entities';

export class NotesService {
    private noteRepository: Repository<Note>;

    constructor() {
        this.noteRepository = AppDataSource.getRepository(Note);
    }

    private async getNotesParams() {
        return {
            baremeDefaut: await getParamNumber('notes.bareme_defaut', 20),
            showRanking: await getParamBoolean('notes.show_ranking', true),
            requireValidation: await getParamBoolean('notes.require_validation', true),
        };
    }

    async create(createDto: CreateNoteDto, enseignantId: string, etablissementId?: string): Promise<Note> {
        const params = await this.getNotesParams();

        let anneeId = createDto.anneeScolaireId;
        if (!anneeId) {
            const periode = await periodesService.findOne(createDto.periodeId);
            anneeId = periode.anneeScolaireId;
        }

        // Validation : vérifier que l'élève est bien dans la classe
        if (createDto.eleveId && createDto.classeId && anneeId) {
            const affectationRepo = AppDataSource.getRepository(AffectationEleve);
            const affectation = await affectationRepo.findOne({
                where: {
                    eleveId: createDto.eleveId,
                    classeId: createDto.classeId,
                    anneeScolaireId: anneeId,
                    actif: true
                }
            });
            if (!affectation) {
                throw new AppError(
                    `L'élève ${createDto.eleveId} n'est pas affecté à la classe ${createDto.classeId} pour cette année`,
                    400,
                    'ELEVE_NOT_IN_CLASS'
                );
            }
        }

        const note = this.noteRepository.create({
            ...createDto,
            anneeScolaireId: anneeId,
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
            const userRepo = AppDataSource.getRepository(Utilisateur);

            const eleve = await eleveRepo.findOne({ 
                where: { id: createDto.eleveId },
                relations: ['utilisateur']
            });
            
            if (eleve) {
                const matiere = await matiereRepo.findOne({ where: { id: createDto.matiereId } });
                const enseignant = await userRepo.findOne({ where: { id: enseignantId } });
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
                            enseignant: 'Enseignant',
                        });
                    }
                }
            }
        } catch (error) {
            // Ne pas bloquer la création de note si la notification échoue
            logger.warn('[Notes] Échec envoi notification nouvelle note (non bloquant)', error);
        }

        return note;
    }

    async createBulk(createDto: CreateBulkNotesDto, enseignantId: string, etablissementId?: string): Promise<number> {
        const params = await this.getNotesParams();

        let anneeId = createDto.anneeScolaireId;
        if (!anneeId) {
            const periode = await periodesService.findOne(createDto.periodeId);
            anneeId = periode.anneeScolaireId;
        }

        const notes = createDto.notes.map((n) =>
            this.noteRepository.create({
                eleveId: n.eleveId,
                matiereId: createDto.matiereId,
                classeId: createDto.classeId,
                periodeId: createDto.periodeId,
                anneeScolaireId: anneeId,
                typeEvaluation: createDto.typeEvaluation as TypeEvaluation,
                description: createDto.description,
                valeur: n.valeur,
                bareme: createDto.bareme ?? params.baremeDefaut,
                coefficient: createDto.coefficient,
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
        const { page, limit, eleveId, matiereId, classeId, periodeId, anneeScolaireId, typeEvaluation, statut } = query;

        const where: FindOptionsWhere<Note> = {};
        if (eleveId) where.eleveId = eleveId;
        if (matiereId) where.matiereId = matiereId;
        if (classeId) where.classeId = classeId;
        if (periodeId) where.periodeId = periodeId;
        if (anneeScolaireId) where.anneeScolaireId = anneeScolaireId;
        if (typeEvaluation) where.typeEvaluation = typeEvaluation;
        if (statut) where.statut = statut;
        if (etablissementId) where.etablissementId = etablissementId;

        const [items, total] = await this.noteRepository.findAndCount({
            where,
            relations: ['eleve', 'enseignant', 'matiere', 'classe', 'periode', 'anneeScolaire'],
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return { items, total };
    }

    async findOne(id: string): Promise<Note> {
        const note = await this.noteRepository.findOne({
            where: { id },
            relations: ['eleve', 'enseignant', 'matiere', 'classe', 'periode'],
        });
        if (!note) throw new AppError('Note non trouvée', 404, 'NOTE_NOT_FOUND');
        return note;
    }

    async update(id: string, updateDto: UpdateNoteDto, utilisateurId: string): Promise<Note> {
        const note = await this.findOne(id);

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
        // Check permissions logic...
        await this.noteRepository.remove(note);
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
