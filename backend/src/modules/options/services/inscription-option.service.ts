/**
 * ==================================
 * eLISAschool - Service Gestion des Options
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Service de gestion des inscriptions aux matières optionnelles
 * pour les élèves (Latin, Arts, LV3, Musique, etc.)
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { InscriptionOption, StatutOption } from '../entities';
import { CreateInscriptionOptionDto, UpdateInscriptionOptionDto, QueryInscriptionOptionsDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { paginateWithRepository, PaginatedResult } from '@common/utils/pagination.util';
import { auditService, AuditAction } from '@modules/auth';

export class InscriptionOptionService {
    private repo: Repository<InscriptionOption>;

    constructor() {
        this.repo = AppDataSource.getRepository(InscriptionOption);
    }

    /**
     * Créer une nouvelle inscription à une option
     */
    async create(dto: CreateInscriptionOptionDto, etablissementId: string, utilisateurId?: string): Promise<InscriptionOption> {
        // Vérifier qu'une inscription active n'existe pas déjà
        const existing = await this.repo.findOne({
            where: {
                eleveId: dto.eleveId,
                matiereId: dto.matiereId,
                anneeScolaireId: dto.anneeScolaireId,
                statut: StatutOption.ACTIVE,
            },
        });

        if (existing) {
            throw new AppError(
                'L\'élève est déjà inscrit à cette option pour cette année scolaire',
                409,
                'OPTION_ALREADY_ACTIVE'
            );
        }

        const inscription = this.repo.create({
            ...dto,
            etablissementId,
            dateInscription: new Date(),
            statut: StatutOption.EN_ATTENTE,
        });

        await this.repo.save(inscription);
        logger.info(`Inscription option créée: élève ${dto.eleveId} → matière ${dto.matiereId}`);

        await auditService.log({
            utilisateurId,
            action: AuditAction.INSCRIPTION_OPTION_CREATE,
            cible: 'InscriptionOption',
            cibleId: inscription.id,
            description: `Inscription d'un élève à une matière optionnelle`,
            nouvellesValeurs: { ...dto },
            module: 'options',
            metadata: { relations: { eleve: dto.eleveId, matiere: dto.matiereId } },
        });

        return inscription;
    }

    /**
     * Trouver toutes les inscriptions avec pagination
     */
    async findAll(dto: QueryInscriptionOptionsDto, etablissementId?: string): Promise<PaginatedResult<InscriptionOption>> {
        const where: any = {};
        if (etablissementId) where.etablissementId = etablissementId;

        if (dto.eleveId) where.eleveId = dto.eleveId;
        if (dto.anneeScolaireId) where.anneeScolaireId = dto.anneeScolaireId;
        if (dto.matiereId) where.matiereId = dto.matiereId;
        if (dto.statut) where.statut = dto.statut;

        const offset = (dto.page - 1) * dto.limit;

        const [data, total] = await this.repo.findAndCount({
            where,
            relations: ['eleve', 'matiere', 'anneeScolaire'],
            order: { createdAt: 'DESC' as const },
            take: dto.limit,
            skip: offset,
        });

        return {
            items: data,
            meta: {
                currentPage: dto.page,
                itemsPerPage: dto.limit,
                totalItems: total,
                totalPages: Math.ceil(total / dto.limit),
                itemCount: data.length,
                hasNextPage: dto.page * dto.limit < total,
                hasPreviousPage: dto.page > 1,
            },
        };
    }

    /**
     * Trouver une inscription par son ID
     */
    async findOne(id: string, etablissementId?: string): Promise<InscriptionOption> {
        const where: any = { id };
        if (etablissementId) where.etablissementId = etablissementId;
        
        const inscription = await this.repo.findOne({
            where,
            relations: ['eleve', 'matiere', 'anneeScolaire'],
        });

        if (!inscription) {
            throw new AppError('Inscription option non trouvée', 404, 'NOT_FOUND');
        }

        return inscription;
    }

    /**
     * Obtenir les options d'un élève
     */
    async findByEleve(eleveId: string, anneeScolaireId: string, etablissementId: string): Promise<InscriptionOption[]> {
        return this.repo.find({
            where: {
                eleveId,
                anneeScolaireId,
                etablissementId,
                statut: StatutOption.ACTIVE,
            },
            relations: ['matiere'],
            order: { createdAt: 'DESC' },
        });
    }

    /**
     * Mettre à jour une inscription
     */
    async update(id: string, dto: UpdateInscriptionOptionDto, etablissementId: string, utilisateurId?: string): Promise<InscriptionOption> {
        const inscription = await this.findOne(id, etablissementId);

        // Si abandon, définir la date
        if (dto.statut === StatutOption.ABANDONNEE && !inscription.dateAbandon) {
            dto.dateAbandon = new Date().toISOString().split('T')[0];
        }

        const anciennesValeurs: Record<string, unknown> = {};
        for (const key of Object.keys(dto)) {
            anciennesValeurs[key] = (inscription as unknown as Record<string, unknown>)[key];
        }

        Object.assign(inscription, dto);
        await this.repo.save(inscription);

        logger.info(`Inscription option mise à jour: ${id} → statut ${dto.statut || inscription.statut}`);

        await auditService.log({
            utilisateurId,
            action: AuditAction.INSCRIPTION_OPTION_UPDATE,
            cible: 'InscriptionOption',
            cibleId: inscription.id,
            description: `Mise à jour d'une inscription à une matière optionnelle`,
            anciennesValeurs,
            nouvellesValeurs: { ...dto },
            module: 'options',
            metadata: { relations: { eleve: inscription.eleveId, matiere: inscription.matiereId } },
        });

        return inscription;
    }

    /**
     * Valider ou refuser une inscription
     */
    async valider(id: string, estValidée: boolean, commentaire?: string, etablissementId?: string, utilisateurId?: string): Promise<InscriptionOption> {
        const inscription = await this.findOne(id, etablissementId!);

        const anciennesValeurs = {
            estValidée: inscription.estValidée,
            statut: inscription.statut,
            motifAbandon: inscription.motifAbandon,
        };

        inscription.estValidée = estValidée;
        if (estValidée && inscription.statut === StatutOption.EN_ATTENTE) {
            inscription.statut = StatutOption.ACTIVE;
        }
        if (commentaire) {
            inscription.motifAbandon = commentaire;
        }

        await this.repo.save(inscription);
        logger.info(`Inscription option ${estValidée ? 'validée' : 'refusée'}: ${id}`);

        await auditService.log({
            utilisateurId,
            action: AuditAction.INSCRIPTION_OPTION_VALIDATE,
            cible: 'InscriptionOption',
            cibleId: inscription.id,
            description: `Inscription à une matière optionnelle ${estValidée ? 'validée' : 'refusée'}`,
            anciennesValeurs,
            nouvellesValeurs: { estValidée, commentaire, statut: inscription.statut },
            module: 'options',
            metadata: { relations: { eleve: inscription.eleveId, matiere: inscription.matiereId } },
        });

        return inscription;
    }

    /**
     * Supprimer une inscription (soft delete via statut)
     */
    async delete(id: string, etablissementId: string, utilisateurId?: string): Promise<void> {
        const inscription = await this.findOne(id, etablissementId);

        const anciennesValeurs = {
            statut: inscription.statut,
            dateAbandon: inscription.dateAbandon,
        };

        inscription.statut = StatutOption.ABANDONNEE;
        inscription.dateAbandon = new Date();
        await this.repo.save(inscription);

        logger.info(`Inscription option supprimée: ${id}`);

        await auditService.log({
            utilisateurId,
            action: AuditAction.INSCRIPTION_OPTION_DELETE,
            cible: 'InscriptionOption',
            cibleId: inscription.id,
            description: `Abandon d'une inscription à une matière optionnelle (soft delete)`,
            anciennesValeurs,
            nouvellesValeurs: { statut: StatutOption.ABANDONNEE },
            module: 'options',
            metadata: { relations: { eleve: inscription.eleveId, matiere: inscription.matiereId } },
        });
    }

    /**
     * Statistiques des options
     */
    async getStatistiques(anneeScolaireId: string, etablissementId: string): Promise<any[]> {
        return this.repo
            .createQueryBuilder('io')
            .select('m.nom', 'matiere')
            .addSelect('COUNT(*)', 'nombreInscrits')
            .addSelect('COUNT(CASE WHEN io.statut = :active THEN 1 END)', 'actifs')
            .addSelect('COUNT(CASE WHEN io.statut = :attente THEN 1 END)', 'enAttente')
            .innerJoin('io.matiere', 'm')
            .where('io.anneeScolaireId = :anneeScolaireId', { anneeScolaireId })
            .andWhere('io.etablissementId = :etablissementId', { etablissementId })
            .groupBy('m.id')
            .addGroupBy('m.nom')
            .orderBy('nombreInscrits', 'DESC')
            .setParameters({
                active: StatutOption.ACTIVE,
                attente: StatutOption.EN_ATTENTE,
            })
            .getRawMany();
    }
}

// Singleton export
export const inscriptionOptionService = new InscriptionOptionService();
