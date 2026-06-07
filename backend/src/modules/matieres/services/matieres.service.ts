/**
 * ==================================
 * eLISAschool - Service Matières
 * ==================================
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Matiere, GroupeMatiere, MatiereNiveau, AffectationMatiere, StatutAffectationMatiere, StatutMatiereNiveau } from '../entities';
import { CreateMatiereDto, UpdateMatiereDto, CreateGroupeMatiereDto, CreateMatiereNiveauDto, UpdateMatiereNiveauDto, AffecterEnseignantDto, QueryMatieresDto } from '../dto';
import { anneesScolairesService } from '@modules/annees-scolaires/services';
import { classesService } from '@modules/classes/services';
import { validationWorkflowService } from '@modules/validation-workflow/services';
import { getParamBoolean } from '@modules/configuration/utils/config.helper';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { paginateWithRepository, PaginatedResult } from '@common/utils/pagination.util';

export class MatieresService {
    private matiereRepo: Repository<Matiere>;
    private groupeRepo: Repository<GroupeMatiere>;
    private niveauRepo: Repository<MatiereNiveau>;
    private affectationRepo: Repository<AffectationMatiere>;

    constructor() {
        this.matiereRepo = AppDataSource.getRepository(Matiere);
        this.groupeRepo = AppDataSource.getRepository(GroupeMatiere);
        this.niveauRepo = AppDataSource.getRepository(MatiereNiveau);
        this.affectationRepo = AppDataSource.getRepository(AffectationMatiere);
    }

    // ==== MATIERES ====

    async create(dto: CreateMatiereDto): Promise<Matiere> {
        const existing = await this.matiereRepo.findOne({ where: { nom: dto.nom } });
        if (existing) throw new AppError('Matière déjà existante', 409, 'MATIERE_EXISTS');

        const matiere = this.matiereRepo.create(dto);
        await this.matiereRepo.save(matiere);
        return matiere;
    }

    /**
     * Rechercher toutes les matières avec pagination
     */
    async findAll(query?: QueryMatieresDto): Promise<PaginatedResult<Matiere>> {
        const { page = 1, limit = 20, groupeId, actif } = query || {};

        const where: any = {};
        
        if (groupeId) {
            where.groupeId = groupeId;
        }

        if (actif !== undefined) {
            where.actif = actif;
        }

        return paginateWithRepository(this.matiereRepo, {
            where,
            order: { nom: 'ASC' },
            page,
            limit,
        });
    }

    async update(id: string, dto: UpdateMatiereDto): Promise<Matiere> {
        const matiere = await this.matiereRepo.findOne({ where: { id } });
        if (!matiere) throw new AppError('Matière non trouvée', 404, 'NOT_FOUND');
        Object.assign(matiere, dto);
        await this.matiereRepo.save(matiere);
        return matiere;
    }

    // ==== GROUPES ====

    async createGroupe(dto: CreateGroupeMatiereDto): Promise<GroupeMatiere> {
        const groupe = this.groupeRepo.create(dto);
        await this.groupeRepo.save(groupe);
        return groupe;
    }

    /**
     * Rechercher tous les groupes avec pagination
     */
    async findAllGroupes(page: number = 1, limit: number = 20): Promise<PaginatedResult<GroupeMatiere>> {
        return paginateWithRepository(this.groupeRepo, {
            order: { ordre: 'ASC' },
            page,
            limit,
        });
    }

    // ==== PROGRAMME (Matière-Niveau) ====

    async addMatiereToNiveau(dto: CreateMatiereNiveauDto, createurId: string, etablissementId?: string): Promise<MatiereNiveau> {
        const existing = await this.niveauRepo.findOne({
            where: { matiereId: dto.matiereId, niveauId: dto.niveauId }
        });
        if (existing) throw new AppError('Matière déjà dans ce niveau', 409, 'MATIERE_IN_LEVEL_EXISTS');

        // Vérifier si la validation est requise
        const requireValidation = await getParamBoolean('matieres.require_validation', false);

        const prog = this.niveauRepo.create({
            ...dto,
            statut: requireValidation
                ? StatutMatiereNiveau.EN_ATTENTE_VALIDATION
                : StatutMatiereNiveau.ACTIF,
        });
        await this.niveauRepo.save(prog);

        // Créer un workflow de validation si requis
        if (requireValidation) {
            await validationWorkflowService.createWorkflow({
                module: 'matieres',
                entiteId: prog.id,
                entiteType: 'MatiereNiveau',
                niveauxRequis: 2,
                etablissementId,
            }, createurId);

            logger.info(`[${etablissementId}] Programme matière-niveau créé en attente de validation: ${prog.id}`);
        } else {
            logger.info(`Programme matière-niveau créé: ${prog.id}`);
        }

        return prog;
    }

    async getProgrammeNiveau(niveauId: string): Promise<MatiereNiveau[]> {
        return this.niveauRepo.find({
            where: { niveauId },
            relations: ['matiere', 'groupe'],
            order: { groupe: { ordre: 'ASC' }, matiere: { nom: 'ASC' } }
        });
    }

    async updateProgramme(id: string, dto: UpdateMatiereNiveauDto, createurId: string, etablissementId?: string): Promise<MatiereNiveau> {
        const prog = await this.niveauRepo.findOne({ where: { id } });
        if (!prog) throw new AppError('Programme non trouvé', 404, 'NOT_FOUND');
        Object.assign(prog, dto);
        await this.niveauRepo.save(prog);

        // Créer un workflow de validation si requis (pour suivi des modifications)
        const requireValidation = await getParamBoolean('matieres.require_validation', false);
        if (requireValidation) {
            await validationWorkflowService.createWorkflow({
                module: 'matieres',
                entiteId: prog.id,
                entiteType: 'MatiereNiveau',
                niveauxRequis: 2,
                etablissementId,
                commentaire: 'Modification du programme',
            }, createurId);

            logger.info(`[${etablissementId}] Programme modifié avec workflow: ${id}`);
        }

        return prog;
    }

    // ==== AFFECTATIONS ENSEIGNANTS ====

    async affecterEnseignant(dto: AffecterEnseignantDto, createurId: string, etablissementId?: string): Promise<AffectationMatiere> {
        const classe = await classesService.findOne(dto.classeId);

        // Vérifier si matière est enseignée dans ce niveau (programme)
        const prog = await this.niveauRepo.findOne({
            where: { matiereId: dto.matiereId, niveauId: classe.niveauId }
        });
        // Warning: Pas obligatoire que ce soit dans le programme pour être enseigné ? Si, logiquement.
        if (!prog) throw new AppError('Cette matière n\'est pas au programme de ce niveau', 400, 'MATIERE_NOT_IN_LEVEL');

        // Vérifier si la validation est requise
        const requireValidation = await getParamBoolean('matieres.require_validation', false);

        // Vérifier doublons ? Un enseignant par matière par classe par année ?
        // Ou plusieurs enseignants possible (co-enseignement) ?
        // Simplification: unique pour l'instant
        const existing = await this.affectationRepo.findOne({
            where: {
                matiereId: dto.matiereId,
                classeId: dto.classeId,
                anneeScolaireId: classe.anneeScolaireId
            }
        });

        if (existing) {
            existing.enseignantId = dto.enseignantId; // Mise à jour de l'enseignant
            if (dto.volumeHoraireHebdo) existing.volumeHoraireHebdo = dto.volumeHoraireHebdo;
            existing.statut = requireValidation
                ? StatutAffectationMatiere.EN_ATTENTE_VALIDATION
                : StatutAffectationMatiere.ACTIVE;
            await this.affectationRepo.save(existing);

            // Créer un workflow si requis
            if (requireValidation) {
                await validationWorkflowService.createWorkflow({
                    module: 'matieres',
                    entiteId: existing.id,
                    entiteType: 'AffectationMatiere',
                    niveauxRequis: 2,
                    etablissementId,
                    commentaire: 'Modification affectation enseignant',
                }, createurId);
            }

            return existing;
        }

        const affectation = this.affectationRepo.create({
            ...dto,
            anneeScolaireId: classe.anneeScolaireId,
            statut: requireValidation
                ? StatutAffectationMatiere.EN_ATTENTE_VALIDATION
                : StatutAffectationMatiere.ACTIVE,
        });
        await this.affectationRepo.save(affectation);

        // Créer un workflow de validation si requis
        if (requireValidation) {
            await validationWorkflowService.createWorkflow({
                module: 'matieres',
                entiteId: affectation.id,
                entiteType: 'AffectationMatiere',
                niveauxRequis: 2,
                etablissementId,
            }, createurId);

            logger.info(`[${etablissementId}] Affectation enseignant créée en attente de validation: ${dto.enseignantId} → ${dto.matiereId}`);
        } else {
            logger.info(`Affectation enseignant créée: ${dto.enseignantId} → ${dto.matiereId}`);
        }

        return affectation;
    }
}

export const matieresService = new MatieresService();
