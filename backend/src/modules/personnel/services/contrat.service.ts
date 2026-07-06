/**
 * ==================================
 * eLISAschool - Service Contrat Personnel
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { Repository, LessThanOrEqual } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { ContratPersonnel, TypeContrat, StatutContrat } from '../entities';
import { CreateContratDto, UpdateContratDto, QueryContratDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { paginateWithQueryBuilder, PaginatedResult } from '@common/utils/pagination.util';
import { validationWorkflowService } from '@modules/validation-workflow/services';
import { getParamBoolean } from '@modules/configuration/utils/config.helper';
import { auditService } from '@modules/auth/services/audit.service';
import { AuditAction } from '@modules/auth/entities/audit-log.entity';

export class ContratService {
    private repo: Repository<ContratPersonnel>;

    constructor() {
        this.repo = AppDataSource.getRepository(ContratPersonnel);
    }

    /**
     * Créer un nouveau contrat avec validation workflow optionnelle
     */
    async create(
        dto: CreateContratDto,
        etablissementId: string,
        createurId?: string,
        req?: any
    ): Promise<ContratPersonnel> {
        // Vérifier qu'il n'y a pas déjà un contrat actif pour ce membre
        if (dto.statut === 'ACTIF') {
            const contratActif = await this.repo.findOne({
                where: {
                    membrePersonnelId: dto.membrePersonnelId,
                    etablissementId,
                    statut: StatutContrat.ACTIF,
                },
            });

            if (contratActif) {
                // Expirer l'ancien contrat automatiquement
                contratActif.statut = StatutContrat.RENEGOCIE;
                await this.repo.save(contratActif);
                logger.info(`Contrat ${contratActif.id} ré-renégocié pour membre ${dto.membrePersonnelId}`);
            }
        }

        const contrat = this.repo.create({
            ...dto,
            typeContrat: dto.typeContrat as any,
            statut: dto.statut as any,
            dateDebut: new Date(dto.dateDebut),
            dateFin: dto.dateFin ? new Date(dto.dateFin) : null,
            etablissementId,
        });

        await this.repo.save(contrat);

        // Workflow validation si requis
        const requireValidation = await getParamBoolean('personnel.contrat_require_validation', false);
        if (requireValidation && createurId) {
            await validationWorkflowService.createWorkflow({
                module: 'personnel',
                entiteId: contrat.id,
                entiteType: 'ContratPersonnel',
                niveauxRequis: 2,
                etablissementId,
                commentaire: `Nouveau contrat ${dto.typeContrat} pour membre ${dto.membrePersonnelId}`,
            }, createurId);

            logger.info(`[${etablissementId}] Contrat créé en attente de validation: ${contrat.id}`);
        } else {
            logger.info(`Contrat créé: ${contrat.id} pour membre ${dto.membrePersonnelId}`);
        }

        // Audit
        if (createurId) {
            await auditService.log({
                utilisateurId: createurId,
                action: AuditAction.CONTRAT_PERSONNEL_CREATE,
                cible: 'ContratPersonnel',
                cibleId: contrat.id,
                description: `Création contrat ${dto.typeContrat} pour membre ${dto.membrePersonnelId}`,
                nouvellesValeurs: dto,
                module: 'personnel',
            }, req);
        }

        return contrat;
    }

    /**
     * Rechercher tous les contrats avec pagination et filtres
     */
    async findAll(
        query: QueryContratDto,
        etablissementId?: string
    ): Promise<PaginatedResult<ContratPersonnel>> {
        const { page, limit, search, membrePersonnelId, typeContrat, statut } = query;

        const qb = this.repo
            .createQueryBuilder('c')
            .leftJoinAndSelect('c.membrePersonnel', 'mp')
            .leftJoinAndSelect('mp.utilisateur', 'u')
            .where('1=1');

        // Filtre par établissement (multi-tenancy)
        if (etablissementId) {
            qb.andWhere('c.etablissementId = :etablissementId', { etablissementId });
        }

        // Filtres optionnels
        if (membrePersonnelId) {
            qb.andWhere('c.membrePersonnelId = :membrePersonnelId', { membrePersonnelId });
        }

        if (typeContrat) {
            qb.andWhere('c.typeContrat = :typeContrat', { typeContrat });
        }

        if (statut) {
            qb.andWhere('c.statut = :statut', { statut });
        }

        // Recherche textuelle
        if (search) {
            qb.andWhere(
                '(c.clauses ILIKE :search OR c.typeContrat ILIKE :search)',
                { search: `%${search}%` }
            );
        }

        // Tri avec validation
        const allowedFields = ['createdAt', 'dateDebut', 'dateFin', 'statut', 'typeContrat'];
        const orderField = allowedFields.includes(query.sortBy) ? query.sortBy : 'createdAt';
        qb.orderBy(`c.${orderField}`, query.sortOrder);

        // Pagination optimisée
        return paginateWithQueryBuilder(qb, page, limit, false);
    }

    /**
     * Récupérer un contrat par son ID
     */
    async findOne(id: string, etablissementId?: string): Promise<ContratPersonnel> {
        const contrat = await this.repo.findOne({
            where: { id, ...(etablissementId ? { etablissementId } : {}) },
            relations: ['membrePersonnel', 'membrePersonnel.utilisateur', 'etablissement'],
        });

        if (!contrat) {
            throw new AppError('Contrat non trouvé', 404, 'NOT_FOUND');
        }

        return contrat;
    }

    /**
     * Récupérer l'historique des contrats d'un membre
     */
    async getHistoriqueByMembre(
        membreId: string,
        etablissementId: string
    ): Promise<ContratPersonnel[]> {
        return this.repo.find({
            where: { membrePersonnelId: membreId, etablissementId },
            relations: ['membrePersonnel', 'membrePersonnel.utilisateur'],
            order: { dateDebut: 'DESC' },
        });
    }

    /**
     * Récupérer le contrat actif d'un membre
     */
    async getContratActif(
        membreId: string,
        etablissementId: string
    ): Promise<ContratPersonnel | null> {
        return this.repo.findOne({
            where: {
                membrePersonnelId: membreId,
                etablissementId,
                statut: StatutContrat.ACTIF,
            },
            relations: ['membrePersonnel'],
        });
    }

    /**
     * Mettre à jour un contrat
     */
    async update(
        id: string,
        dto: UpdateContratDto,
        userId: string,
        etablissementId: string,
        req?: any
    ): Promise<ContratPersonnel> {
        const contrat = await this.findOne(id, etablissementId);

        const anciennesValeurs = {
            typeContrat: contrat.typeContrat,
            statut: contrat.statut,
            salaireBase: contrat.salaireBase,
        };

        if (dto.dateDebut) dto.dateDebut = new Date(dto.dateDebut) as any;
        if (dto.dateFin) dto.dateFin = new Date(dto.dateFin) as any;

        Object.assign(contrat, dto);
        await this.repo.save(contrat);

        // Audit
        await auditService.log({
            utilisateurId: userId,
            action: AuditAction.CONTRAT_PERSONNEL_UPDATE,
            cible: 'ContratPersonnel',
            cibleId: id,
            description: `Modification contrat ${id}`,
            anciennesValeurs,
            nouvellesValeurs: dto,
            module: 'personnel',
        }, req);

        logger.info(`Contrat modifié: ${id}`);
        return contrat;
    }

    /**
     * Supprimer un contrat (soft delete via changement statut)
     */
    async delete(id: string, userId: string, etablissementId: string, req?: any): Promise<void> {
        const contrat = await this.findOne(id, etablissementId);

        contrat.statut = StatutContrat.ROMPU;
        await this.repo.save(contrat);

        // Audit
        await auditService.log({
            utilisateurId: userId,
            action: AuditAction.CONTRAT_PERSONNEL_DELETE,
            cible: 'ContratPersonnel',
            cibleId: id,
            description: `Suppression contrat ${id}`,
            module: 'personnel',
        }, req);

        logger.info(`Contrat supprimé: ${id}`);
    }

    /**
     * Détecter les contrats expirant dans N jours
     */
    async getContratsExpirantBientot(
        jours: number,
        etablissementId: string
    ): Promise<ContratPersonnel[]> {
        const dateLimite = new Date();
        dateLimite.setDate(dateLimite.getDate() + jours);

        return this.repo.find({
            where: {
                etablissementId,
                statut: StatutContrat.ACTIF,
                dateFin: LessThanOrEqual(dateLimite) as any,
            },
            relations: ['membrePersonnel', 'membrePersonnel.utilisateur'],
            order: { dateFin: 'ASC' },
        });
    }
}

export const contratService = new ContratService();
