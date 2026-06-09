/**
 * ==================================
 * eLISAschool - Service ProgrammeChapitre
 * ==================================
 * Module: Programmes Pédagogiques
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { Repository, In } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { ProgrammeChapitre } from '../entities/programme-chapitre.entity';
import { CreateProgrammeChapitreDto, UpdateProgrammeChapitreDto, QueryProgrammeChapitreDto } from '../dto/programme-chapitre.dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { paginateWithQueryBuilder } from '@common/utils/pagination.util';
import { auditService } from '@modules/auth/services/audit.service';
import { AuditAction } from '@modules/auth/entities/audit-log.entity';

export class ProgrammeChapitreService {
    private repo: Repository<ProgrammeChapitre>;

    constructor() {
        this.repo = AppDataSource.getRepository(ProgrammeChapitre);
    }

    /**
     * Créer un nouveau chapitre de programme
     */
    async create(
        dto: CreateProgrammeChapitreDto,
        etablissementId: string,
        createurId?: string,
        req?: any
    ): Promise<ProgrammeChapitre> {
        const entity = this.repo.create({
            ...dto,
            etablissementId,
        });
        await this.repo.save(entity);

        // Audit trail
        if (createurId) {
            await auditService.log({
                utilisateurId: createurId,
                action: AuditAction.PROGRAMME_CHAPITRE_CREATE,
                cible: 'ProgrammeChapitre',
                cibleId: entity.id,
                description: `Création chapitre: ${entity.titre}`,
                nouvellesValeurs: dto,
                module: 'programmes',
            }, req);
        }

        logger.info(`Chapitre programme créé: ${entity.id} - ${entity.titre}`);
        return entity;
    }

    /**
     * Rechercher tous les chapitres avec filtres et pagination
     */
    async findAll(query: QueryProgrammeChapitreDto, etablissementId: string) {
        const qb = this.repo.createQueryBuilder('chapitre')
            .where('chapitre.etablissementId = :etablissementId', { etablissementId })
            .leftJoinAndSelect('chapitre.matiereNiveau', 'matiereNiveau')
            .leftJoinAndSelect('chapitre.periode', 'periode')
            .orderBy('chapitre.ordre', 'ASC');

        // Filtres
        if (query.matiereNiveauId) {
            qb.andWhere('chapitre.matiereNiveauId = :matiereNiveauId', { matiereNiveauId: query.matiereNiveauId });
        }
        if (query.periodeId) {
            qb.andWhere('chapitre.periodeId = :periodeId', { periodeId: query.periodeId });
        }
        if (query.statut) {
            qb.andWhere('chapitre.statut = :statut', { statut: query.statut });
        }

        return paginateWithQueryBuilder(qb, query.page, query.limit);
    }

    /**
     * Rechercher un chapitre par ID
     */
    async findOne(id: string, etablissementId: string): Promise<ProgrammeChapitre> {
        const entity = await this.repo.findOne({
            where: { id, etablissementId },
            relations: ['matiereNiveau', 'periode'],
        });

        if (!entity) {
            throw new AppError('Chapitre de programme non trouvé', 404, 'NOT_FOUND');
        }

        return entity;
    }

    /**
     * Mettre à jour un chapitre
     */
    async update(
        id: string,
        dto: UpdateProgrammeChapitreDto,
        userId: string,
        etablissementId: string,
        req?: any
    ): Promise<ProgrammeChapitre> {
        const entity = await this.findOne(id, etablissementId);

        Object.assign(entity, dto);
        await this.repo.save(entity);

        // Audit trail
        await auditService.log({
            utilisateurId: userId,
            action: AuditAction.PROGRAMME_CHAPITRE_UPDATE,
            cible: 'ProgrammeChapitre',
            cibleId: id,
            description: `Modification chapitre: ${entity.titre}`,
            nouvellesValeurs: dto,
            module: 'programmes',
        }, req);

        return entity;
    }

    /**
     * Supprimer un chapitre
     */
    async delete(id: string, userId: string, etablissementId: string, req?: any): Promise<{ success: boolean }> {
        const entity = await this.findOne(id, etablissementId);

        await this.repo.remove(entity);

        // Audit trail
        await auditService.log({
            utilisateurId: userId,
            action: AuditAction.PROGRAMME_CHAPITRE_DELETE,
            cible: 'ProgrammeChapitre',
            cibleId: id,
            description: `Suppression chapitre: ${entity.titre}`,
            module: 'programmes',
        }, req);

        return { success: true };
    }

    /**
     * Obtenir tous les chapitres pour une matière-niveau
     */
    async getChapitresParMatiereNiveau(
        matiereNiveauId: string,
        etablissementId: string,
        periodeId?: string
    ): Promise<ProgrammeChapitre[]> {
        const qb = this.repo.createQueryBuilder('chapitre')
            .where('chapitre.matiereNiveauId = :matiereNiveauId', { matiereNiveauId })
            .andWhere('chapitre.etablissementId = :etablissementId', { etablissementId })
            .leftJoinAndSelect('chapitre.periode', 'periode')
            .orderBy('chapitre.ordre', 'ASC');

        if (periodeId) {
            qb.andWhere('chapitre.periodeId = :periodeId', { periodeId });
        }

        return qb.getMany();
    }

    /**
     * Obtenir tous les chapitres pour une période
     */
    async getChapitresParPeriode(
        etablissementId: string,
        periodeId: string
    ): Promise<ProgrammeChapitre[]> {
        return this.repo.find({
            where: { periodeId, etablissementId },
            relations: ['matiereNiveau'],
            order: { ordre: 'ASC' },
        });
    }

    /**
     * Obtenir le volume horaire total pour une matière-niveau
     */
    async getVolumeHoraireTotal(matiereNiveauId: string): Promise<{ prevu: number; chapitreCount: number }> {
        const result = await this.repo
            .createQueryBuilder('chapitre')
            .where('chapitre.matiereNiveauId = :matiereNiveauId', { matiereNiveauId })
            .select('SUM(chapitre.dureePrevueHeures)', 'prevu')
            .addSelect('COUNT(chapitre.id)', 'chapitreCount')
            .getRawOne();

        return {
            prevu: parseFloat(result.prevu) || 0,
            chapitreCount: parseInt(result.chapitreCount) || 0,
        };
    }

    /**
     * Calculer la progression réelle basée sur les chapitres
     * (utilisera les progressions associées aux chapitres)
     */
    async calculerProgressionReelle(
        matiereNiveauId: string,
        classeId: string,
        enseignantId: string,
        periodeId?: string
    ): Promise<{
        chapitresTotal: number;
        chapitresRealises: number;
        pourcentageReel: number;
        chapitresEnRetard: ProgrammeChapitre[];
    }> {
        // Importer ProgressionProgramme ici pour éviter dépendance circulaire
        const { ProgressionProgramme } = await import('@modules/personnel/entities');
        const progressionRepo = AppDataSource.getRepository(ProgressionProgramme);

        // Récupérer tous les chapitres
        const chapitresQb = this.repo.createQueryBuilder('chapitre')
            .where('chapitre.matiereNiveauId = :matiereNiveauId', { matiereNiveauId })
            .andWhere('chapitre.etablissementId IN (SELECT e.id FROM etablissements e)');

        if (periodeId) {
            chapitresQb.andWhere('chapitre.periodeId = :periodeId', { periodeId });
        }

        const chapitres = await chapitresQb.getMany();
        const chapitresTotal = chapitres.length;

        if (chapitresTotal === 0) {
            return {
                chapitresTotal: 0,
                chapitresRealises: 0,
                pourcentageReel: 0,
                chapitresEnRetard: [],
            };
        }

        // Récupérer les progressions pour ces chapitres
        const chapitreIds = chapitres.map(c => c.id);
        const progressions = await progressionRepo.find({
            where: {
                enseignantId,
                classeId,
                programmeChapitreId: In(chapitreIds),
            },
        });

        // Compter les chapitres réalisés (progression >= 100%)
        const chapitresRealises = progressions.filter(p => Number(p.pourcentageRealise) >= 100).length;
        const pourcentageReel = (chapitresRealises / chapitresTotal) * 100;

        // Identifier les chapitres en retard (pas de progression ou < 100%)
        const chapitresAvecProgression = new Set(progressions.map(p => p.programmeChapitreId));
        const chapitresEnRetard = chapitres.filter(c => !chapitresAvecProgression.has(c.id));

        return {
            chapitresTotal,
            chapitresRealises,
            pourcentageReel: Math.round(pourcentageReel * 100) / 100,
            chapitresEnRetard,
        };
    }
}

export const programmeChapitreService = new ProgrammeChapitreService();
