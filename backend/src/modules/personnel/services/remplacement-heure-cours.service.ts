/**
 * ==================================
 * eLISAschool - Service RemplacementHeureCours
 * ==================================
 * Gestion des remplacements d'enseignants avec workflow de validation.
 * Flux : create → valider/rejeter → exécuter (ou annuler)
 * Intégration : validationWorkflowService + auditService
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { Repository, Between } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import {
    RemplacementHeureCours, StatutRemplacement,
} from '../entities/remplacement-heure-cours.entity';
import { HeureCours, StatutEffectue } from '../entities/heure-cours.entity';
import {
    CreerRemplacementDto, ValiderRemplacementDto,
    RejeterRemplacementDto, QueryRemplacementDto,
} from '../dto/remplacement-heure-cours.dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { auditService } from '@modules/auth/services/audit.service';
import { AuditAction } from '@modules/auth/entities/audit-log.entity';
import { validationWorkflowService } from '@modules/validation-workflow/services/validation-workflow.service';
import { Request } from 'express';

export interface StatistiquesRemplacements {
    total: number;
    enAttente: number;
    validees: number;
    rejetees: number;
    executees: number;
    annulees: number;
    tauxExecution: number;
}

export class RemplacementHeureCoursService {
    private repo: Repository<RemplacementHeureCours>;
    private heureCoursRepo: Repository<HeureCours>;

    constructor() {
        this.repo = AppDataSource.getRepository(RemplacementHeureCours);
        this.heureCoursRepo = AppDataSource.getRepository(HeureCours);
    }

    /**
     * Créer une demande de remplacement
     */
    async create(
        dto: CreerRemplacementDto,
        etablissementId: string,
        demandeurId: string,
        req?: Request,
    ): Promise<RemplacementHeureCours> {
        // Vérifier que la heure de cours existe et appartient à l'établissement
        const heureCours = await this.heureCoursRepo.findOne({
            where: { id: dto.heureCoursId, etablissementId },
        });
        if (!heureCours) {
            throw new AppError('Heure de cours introuvable', 404, 'HEURE_COURS_NOT_FOUND');
        }

        // Vérifier que la heure de cours est planifiée (pas déjà effectuée/annulée)
        if (heureCours.statutEffectue !== StatutEffectue.PLANIFIE) {
            throw new AppError(
                'Seules les heures planifiées peuvent être remplacées',
                400,
                'HEURE_COURS_NON_REMPLACABLE',
            );
        }

        // Vérifier qu'une demande active n'existe pas déjà pour cette heure
        const existante = await this.repo.findOne({
            where: {
                heureCoursId: dto.heureCoursId,
                statut: StatutRemplacement.EN_ATTENTE,
            },
        });
        if (existante) {
            throw new AppError(
                'Une demande de remplacement est déjà en cours pour cette heure',
                409,
                'REMPLACEMENT_EXISTS',
            );
        }

        // Créer la demande
        const remplacement = this.repo.create({
            ...dto,
            etablissementId,
            demandeurId,
            statut: StatutRemplacement.EN_ATTENTE,
            dateDemande: new Date(),
        });
        await this.repo.save(remplacement);

        // Workflow de validation (si activé)
        try {
            await validationWorkflowService.createWorkflow({
                module: 'heures_cours_remplacement',
                entiteId: remplacement.id,
                entiteType: 'RemplacementHeureCours',
                niveauxRequis: 1,
                etablissementId,
            }, demandeurId);
        } catch (error) {
            logger.warn('[Remplacement] Échec création workflow (non bloquant)', error);
        }

        // Audit
        try {
            await auditService.log({
                action: AuditAction.REMPLACEMENT_HEURE_COURS_CREATE,
                entiteType: 'RemplacementHeureCours',
                entiteId: remplacement.id,
                details: {
                    heureCoursId: dto.heureCoursId,
                    motif: dto.motif,
                    remplacantId: dto.remplacantId,
                },
                etablissementId,
            }, req);
        } catch (error) {
            logger.warn('[Remplacement] Échec audit (non bloquant)', error);
        }

        logger.info(`[Remplacement] Demande créée ${remplacement.id} pour heure ${dto.heureCoursId}`);
        return this.findOne(remplacement.id, etablissementId);
    }

    /**
     * Valider et exécuter un remplacement
     */
    async valider(
        id: string,
        dto: ValiderRemplacementDto,
        valideParId: string,
        etablissementId: string,
        req?: Request,
    ): Promise<RemplacementHeureCours> {
        const remplacement = await this.findOne(id, etablissementId);

        if (remplacement.statut !== StatutRemplacement.EN_ATTENTE) {
            throw new AppError(
                'Seules les demandes en attente peuvent être validées',
                400,
                'REMPLACEMENT_NON_VALIDABLE',
            );
        }

        // Mettre à jour le remplacement
        remplacement.statut = StatutRemplacement.EXECUTEE;
        remplacement.remplacantId = dto.remplacantId;
        remplacement.valideParId = valideParId;
        remplacement.dateValidation = new Date();
        remplacement.dateExecution = new Date();
        remplacement.commentaires = dto.commentaires || null;
        await this.repo.save(remplacement);

        // Mettre à jour la heure de cours : statut REMPLACE + remplacant
        await this.heureCoursRepo.update(
            { id: remplacement.heureCoursId },
            {
                statutEffectue: StatutEffectue.REMPLACE,
                remplacantId: dto.remplacantId,
                commentaire: `Remplacement validé: ${remplacement.motif}`,
            },
        );

        // Audit
        try {
            await auditService.log({
                action: AuditAction.REMPLACEMENT_HEURE_COURS_EXECUTE,
                entiteType: 'RemplacementHeureCours',
                entiteId: id,
                details: {
                    heureCoursId: remplacement.heureCoursId,
                    remplacantId: dto.remplacantId,
                    valideParId,
                },
                etablissementId,
            }, req);
        } catch (error) {
            logger.warn('[Remplacement] Échec audit validation (non bloquant)', error);
        }

        logger.info(`[Remplacement] Demande ${id} validée et exécutée`);
        return this.findOne(id, etablissementId);
    }

    /**
     * Rejeter une demande de remplacement
     */
    async rejeter(
        id: string,
        dto: RejeterRemplacementDto,
        valideParId: string,
        etablissementId: string,
        req?: Request,
    ): Promise<RemplacementHeureCours> {
        const remplacement = await this.findOne(id, etablissementId);

        if (remplacement.statut !== StatutRemplacement.EN_ATTENTE) {
            throw new AppError(
                'Seules les demandes en attente peuvent être rejetées',
                400,
                'REMPLACEMENT_NON_REJETABLE',
            );
        }

        remplacement.statut = StatutRemplacement.REJETEE;
        remplacement.valideParId = valideParId;
        remplacement.dateValidation = new Date();
        remplacement.commentaires = dto.motif;
        await this.repo.save(remplacement);

        // Audit
        try {
            await auditService.log({
                action: AuditAction.REMPLACEMENT_HEURE_COURS_REJECT,
                entiteType: 'RemplacementHeureCours',
                entiteId: id,
                details: { motif: dto.motif, valideParId },
                etablissementId,
            }, req);
        } catch (error) {
            logger.warn('[Remplacement] Échec audit rejet (non bloquant)', error);
        }

        logger.info(`[Remplacement] Demande ${id} rejetée`);
        return this.findOne(id, etablissementId);
    }

    /**
     * Annuler une demande (par le demandeur)
     */
    async annuler(
        id: string,
        demandeurId: string,
        etablissementId: string,
        req?: Request,
    ): Promise<RemplacementHeureCours> {
        const remplacement = await this.findOne(id, etablissementId);

        if (remplacement.demandeurId !== demandeurId) {
            throw new AppError(
                'Seul le demandeur peut annuler sa demande',
                403,
                'REMPLACEMENT_NOT_OWNER',
            );
        }

        if (remplacement.statut !== StatutRemplacement.EN_ATTENTE) {
            throw new AppError(
                'Seules les demandes en attente peuvent être annulées',
                400,
                'REMPLACEMENT_NON_ANNULABLE',
            );
        }

        remplacement.statut = StatutRemplacement.ANNULEE;
        await this.repo.save(remplacement);

        // Audit
        try {
            await auditService.log({
                action: AuditAction.REMPLACEMENT_HEURE_COURS_CANCEL,
                entiteType: 'RemplacementHeureCours',
                entiteId: id,
                details: { demandeurId },
                etablissementId,
            }, req);
        } catch (error) {
            logger.warn('[Remplacement] Échec audit annulation (non bloquant)', error);
        }

        logger.info(`[Remplacement] Demande ${id} annulée`);
        return this.findOne(id, etablissementId);
    }

    /**
     * Lister les demandes avec pagination et filtres
     */
    async findAll(
        query: QueryRemplacementDto,
        etablissementId: string,
    ): Promise<{ items: RemplacementHeureCours[]; total: number }> {
        const qb = this.repo.createQueryBuilder('r')
            .leftJoinAndSelect('r.heureCours', 'hc')
            .leftJoinAndSelect('r.demandeur', 'demandeur')
            .leftJoinAndSelect('r.remplacant', 'remplacant')
            .leftJoinAndSelect('r.validePar', 'validePar')
            .leftJoinAndSelect('hc.matiere', 'matiere')
            .leftJoinAndSelect('hc.classeAnnee', 'classeAnnee')
            .leftJoinAndSelect('hc.salle', 'salle')
            .where('r.etablissementId = :etablissementId', { etablissementId });

        // Filtres
        if (query.statut) {
            qb.andWhere('r.statut = :statut', { statut: query.statut });
        }
        if (query.demandeurId) {
            qb.andWhere('r.demandeurId = :demandeurId', { demandeurId: query.demandeurId });
        }
        if (query.heureCoursId) {
            qb.andWhere('r.heureCoursId = :heureCoursId', { heureCoursId: query.heureCoursId });
        }
        if (query.dateDebut) {
            qb.andWhere('r.dateDemande >= :dateDebut', { dateDebut: query.dateDebut });
        }
        if (query.dateFin) {
            qb.andWhere('r.dateDemande <= :dateFin', { dateFin: query.dateFin });
        }

        // Tri
        const orderColumn = query.sortBy === 'dateDemande' ? 'r.dateDemande' : query.sortBy === 'statut' ? 'r.statut' : 'r.createdAt';
        qb.orderBy(orderColumn, query.sortOrder);

        // Pagination
        const total = await qb.getCount();
        qb.skip((query.page - 1) * query.limit).take(query.limit);

        const items = await qb.getMany();
        return { items, total };
    }

    /**
     * Trouver un remplacement par ID avec toutes les relations
     */
    async findOne(id: string, etablissementId: string): Promise<RemplacementHeureCours> {
        const remplacement = await this.repo.findOne({
            where: { id, etablissementId },
            relations: [
                'heureCours', 'heureCours.matiere', 'heureCours.classeAnnee',
                'heureCours.salle', 'heureCours.enseignant',
                'demandeur', 'remplacant', 'validePar',
            ],
        });
        if (!remplacement) {
            throw new AppError('Remplacement introuvable', 404, 'REMPLACEMENT_NOT_FOUND');
        }
        return remplacement;
    }

    /**
     * Statistiques agrégées pour l'établissement
     */
    async getStatistiques(etablissementId: string): Promise<StatistiquesRemplacements> {
        const result = await this.repo.createQueryBuilder('r')
            .select('r.statut', 'statut')
            .addSelect('COUNT(*)', 'count')
            .where('r.etablissementId = :etablissementId', { etablissementId })
            .groupBy('r.statut')
            .getRawMany();

        const stats: Record<string, number> = {};
        let total = 0;
        for (const row of result) {
            stats[row.statut] = parseInt(row.count, 10);
            total += parseInt(row.count, 10);
        }

        const executees = stats[StatutRemplacement.EXECUTEE] || 0;
        const tauxExecution = total > 0 ? Math.round((executees / total) * 100) : 0;

        return {
            total,
            enAttente: stats[StatutRemplacement.EN_ATTENTE] || 0,
            validees: stats[StatutRemplacement.VALIDEE] || 0,
            rejetees: stats[StatutRemplacement.REJETEE] || 0,
            executees,
            annulees: stats[StatutRemplacement.ANNULEE] || 0,
            tauxExecution,
        };
    }
}

export const remplacementHeureCoursService = new RemplacementHeureCoursService();
