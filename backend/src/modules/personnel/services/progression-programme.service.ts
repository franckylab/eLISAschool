/**
 * eLISAschool - Module Personnel/RH
 * Service pour la gestion des progressions de programme
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { paginateWithQueryBuilder } from '@common/utils/pagination.util';
import { auditService } from '@modules/auth/services/audit.service';
import { AuditAction } from '@modules/auth/entities/audit-log.entity';
import { ProgressionProgramme } from '../entities/progression-programme.entity';
import { CreateProgressionDto, UpdateProgressionDto, QueryProgressionDto } from '../dto/progression-programme.dto';
import { Request } from 'express';

export class ProgressionProgrammeService {
    private repo: Repository<ProgressionProgramme>;

    constructor() {
        this.repo = AppDataSource.getRepository(ProgressionProgramme);
    }

    async create(dto: CreateProgressionDto, etablissementId: string, createurId?: string, req?: Request) {
        // Déterminer le mode de calcul
        const modeCalcul = dto.programmeChapitreId ? 'CHAPITRE' : (dto.modeCalcul || 'LEGACY');

        const entity = this.repo.create({
            ...dto,
            etablissementId,
            modeCalcul,
        });
        await this.repo.save(entity);

        if (createurId) {
            await auditService.log({
                utilisateurId: createurId,
                action: AuditAction.PROGRESSION_PROGRAMME_CREATE,
                cible: 'ProgressionProgramme',
                cibleId: entity.id,
                description: `Création progression ${entity.id} (mode: ${modeCalcul})`,
                nouvellesValeurs: dto,
                module: 'personnel',
                etablissementId,
                parentCible: 'MembrePersonnel', parentCibleId: dto.enseignantId,
            }, req);
        }

        logger.info(`Progression créée: ${entity.id} (mode: ${modeCalcul})`);
        return entity;
    }

    async findAll(query: QueryProgressionDto, etablissementId: string) {
        const qb = this.repo.createQueryBuilder('progression')
            .where('progression.etablissementId = :etablissementId', { etablissementId })
            .leftJoinAndSelect('progression.enseignant', 'enseignant')
            .orderBy('progression.dateEvaluation', 'DESC');

        // Filtres
        if (query.enseignantId) {
            qb.andWhere('progression.enseignantId = :enseignantId', { enseignantId: query.enseignantId });
        }
        if (query.matiereId) {
            qb.andWhere('progression.matiereId = :matiereId', { matiereId: query.matiereId });
        }
        if (query.classeId) {
            qb.andWhere('progression.classeId = :classeId', { classeId: query.classeId });
        }
        if (query.periodeId) {
            qb.andWhere('progression.periodeId = :periodeId', { periodeId: query.periodeId });
        }

        return paginateWithQueryBuilder(qb, query.page, query.limit);
    }

    async findOne(id: string, etablissementId: string) {
        const entity = await this.repo.findOne({
            where: { id, etablissementId },
            relations: ['enseignant'],
        });

        if (!entity) {
            throw new AppError('Progression non trouvée', 404, 'NOT_FOUND');
        }

        return entity;
    }

    async update(id: string, dto: UpdateProgressionDto, userId: string, etablissementId: string, req?: Request) {
        const entity = await this.findOne(id, etablissementId);

        Object.assign(entity, dto);
        await this.repo.save(entity);

        await auditService.log({
            utilisateurId: userId,
            action: AuditAction.PROGRESSION_PROGRAMME_UPDATE,
            cible: 'ProgressionProgramme',
            cibleId: id,
            description: `Modification progression ${id}`,
            nouvellesValeurs: dto,
            module: 'personnel',
            etablissementId,
            parentCible: 'MembrePersonnel', parentCibleId: entity.enseignantId,
        }, req);

        return entity;
    }

    async delete(id: string, userId: string, etablissementId: string, req?: Request) {
        const entity = await this.findOne(id, etablissementId);

        await this.repo.remove(entity);

        await auditService.log({
            utilisateurId: userId,
            action: AuditAction.PROGRESSION_PROGRAMME_DELETE,
            cible: 'ProgressionProgramme',
            cibleId: id,
            description: `Suppression progression ${id}`,
            module: 'personnel',
            etablissementId,
            parentCible: 'MembrePersonnel', parentCibleId: entity.enseignantId,
        }, req);

        return { success: true };
    }

    async getProgressionClasseMatiere(classeId: string, matiereId: string, periodeId: string | undefined, etablissementId: string) {
        const qb = this.repo
            .createQueryBuilder('progression')
            .where('progression.classeId = :classeId', { classeId })
            .andWhere('progression.matiereId = :matiereId', { matiereId })
            .andWhere('progression.etablissementId = :etablissementId', { etablissementId })
            .leftJoinAndSelect('progression.enseignant', 'enseignant')
            .orderBy('progression.dateEvaluation', 'DESC');

        if (periodeId) {
            qb.andWhere('progression.periodeId = :periodeId', { periodeId });
        }

        const progressions = await qb.getMany();

        return {
            progressions,
            moyenneProgression: progressions.length > 0
                ? (progressions.reduce((sum, p) => sum + Number(p.pourcentageRealise), 0) / progressions.length).toFixed(2)
                : 0,
        };
    }

    async getAlertesRetard(etablissementId: string) {
        // Récupérer les progressions < 50% alors que la période est au-delà du milieu
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        
        // Considerer que si on est après le 6ème mois, les progressions devraient être > 50%
        if (currentMonth <= 6) {
            return [];
        }

        const alertes = await this.repo
            .createQueryBuilder('progression')
            .where('progression.etablissementId = :etablissementId', { etablissementId })
            .andWhere('progression.pourcentageRealise < :seuil', { seuil: 50 })
            .leftJoinAndSelect('progression.enseignant', 'enseignant')
            .orderBy('progression.pourcentageRealise', 'ASC')
            .getMany();

        return alertes;
    }

    /**
     * Obtenir une progression avec sa corrélation au programme officiel
     */
    async getProgressionAvecCorrelation(id: string, etablissementId: string) {
        // Import dynamique pour éviter dépendance circulaire
        const { correlationProgrammeService } = await import('@modules/programmes/services/correlation-programme.service');
        
        const progression = await this.findOne(id, etablissementId);

        const correlation = await correlationProgrammeService.correlerProgressionProgramme(
            progression.enseignantId,
            progression.matiereId,
            progression.classeId,
            etablissementId,
            progression.periodeId
        );

        return { progression, correlation };
    }
}

export const progressionProgrammeService = new ProgressionProgrammeService();
