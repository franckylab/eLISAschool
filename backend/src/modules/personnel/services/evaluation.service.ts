/**
 * eLISAschool - Module Personnel/RH
 * Service pour la gestion des évaluations des enseignants
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { paginateWithQueryBuilder } from '@common/utils/pagination.util';
import { auditService } from '@modules/auth/services/audit.service';
import { AuditAction } from '@modules/auth/entities/audit-log.entity';
import { EvaluationEnseignant } from '../entities/evaluation-enseignant.entity';
import { CreateEvaluationDto, UpdateEvaluationDto, QueryEvaluationDto } from '../dto/evaluation.dto';

export class EvaluationService {
    private repo: Repository<EvaluationEnseignant>;

    constructor() {
        this.repo = AppDataSource.getRepository(EvaluationEnseignant);
    }

    async create(dto: CreateEvaluationDto, etablissementId: string, createurId?: string, req?: any) {
        const entity = this.repo.create({
            ...dto,
            etablissementId,
        });
        await this.repo.save(entity);

        if (createurId) {
            await auditService.log({
                utilisateurId: createurId,
                action: AuditAction.EVALUATION_ENSEIGNANT_CREATE,
                cible: 'EvaluationEnseignant',
                cibleId: entity.id,
                description: `Création évaluation ${entity.id}`,
                nouvellesValeurs: dto,
                module: 'personnel',
            }, req);
        }

        logger.info(`Évaluation créée: ${entity.id}`);
        return entity;
    }

    async findAll(query: QueryEvaluationDto, etablissementId: string) {
        const qb = this.repo.createQueryBuilder('evaluation')
            .where('evaluation.etablissementId = :etablissementId', { etablissementId })
            .leftJoinAndSelect('evaluation.enseignant', 'enseignant')
            .orderBy('evaluation.dateEvaluation', 'DESC');

        // Filtres
        if (query.enseignantId) {
            qb.andWhere('evaluation.enseignantId = :enseignantId', { enseignantId: query.enseignantId });
        }
        if (query.evaluateurId) {
            qb.andWhere('evaluation.evaluateurId = :evaluateurId', { evaluateurId: query.evaluateurId });
        }
        if (query.categorie) {
            qb.andWhere('evaluation.categorie = :categorie', { categorie: query.categorie });
        }
        if (query.dateDebut) {
            qb.andWhere('evaluation.dateEvaluation >= :dateDebut', { dateDebut: query.dateDebut });
        }
        if (query.dateFin) {
            qb.andWhere('evaluation.dateEvaluation <= :dateFin', { dateFin: query.dateFin });
        }

        return paginateWithQueryBuilder(qb, query.page, query.limit);
    }

    async findOne(id: string, etablissementId: string) {
        const entity = await this.repo.findOne({
            where: { id, etablissementId },
            relations: ['enseignant'],
        });

        if (!entity) {
            throw new AppError('Évaluation non trouvée', 404, 'NOT_FOUND');
        }

        return entity;
    }

    async update(id: string, dto: UpdateEvaluationDto, userId: string, etablissementId: string, req?: any) {
        const entity = await this.findOne(id, etablissementId);

        Object.assign(entity, dto);
        await this.repo.save(entity);

        await auditService.log({
            utilisateurId: userId,
            action: AuditAction.EVALUATION_ENSEIGNANT_UPDATE,
            cible: 'EvaluationEnseignant',
            cibleId: id,
            description: `Modification évaluation ${id}`,
            nouvellesValeurs: dto,
            module: 'personnel',
        }, req);

        return entity;
    }

    async delete(id: string, userId: string, etablissementId: string, req?: any) {
        const entity = await this.findOne(id, etablissementId);

        await this.repo.remove(entity);

        await auditService.log({
            utilisateurId: userId,
            action: AuditAction.EVALUATION_ENSEIGNANT_DELETE,
            cible: 'EvaluationEnseignant',
            cibleId: id,
            description: `Suppression évaluation ${id}`,
            module: 'personnel',
        }, req);

        return { success: true };
    }

    async getMoyenneEnseignant(enseignantId: string, dateDebut: string, dateFin: string, etablissementId: string) {
        const qb = this.repo
            .createQueryBuilder('evaluation')
            .where('evaluation.enseignantId = :enseignantId', { enseignantId })
            .andWhere('evaluation.etablissementId = :etablissementId', { etablissementId })
            .andWhere('evaluation.dateEvaluation BETWEEN :dateDebut AND :dateFin', { dateDebut, dateFin })
            .select('AVG(evaluation.note)', 'moyenne')
            .addSelect('COUNT(evaluation.id)', 'nombreEvaluations');

        const result = await qb.getRawOne();

        return {
            moyenne: result?.moyenne ? parseFloat(result.moyenne).toFixed(2) : null,
            nombreEvaluations: result ? parseInt(result.nombreEvaluations, 10) || 0 : 0,
        };
    }

    async getResumeParCategorie(enseignantId: string, annee: number, etablissementId: string) {
        const resultats = await this.repo
            .createQueryBuilder('evaluation')
            .where('evaluation.enseignantId = :enseignantId', { enseignantId })
            .andWhere('evaluation.etablissementId = :etablissementId', { etablissementId })
            .andWhere('EXTRACT(YEAR FROM evaluation.dateEvaluation) = :annee', { annee })
            .select(['evaluation.categorie as categorie', 'AVG(evaluation.note) as moyenne'])
            .groupBy('evaluation.categorie')
            .getRawMany();

        const resume: Record<string, number> = {};
        resultats.forEach((r: { categorie: string; moyenne: string }) => {
            resume[r.categorie] = parseFloat(r.moyenne);
        });

        return resume;
    }
}

export const evaluationService = new EvaluationService();
