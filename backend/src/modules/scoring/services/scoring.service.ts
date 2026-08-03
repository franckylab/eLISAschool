/**
 * ==================================
 * eLISAschool - Service Scoring
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { ScoreEleve, HistoriqueScore, RegleScoring, TypeIndicateur } from '../entities';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { getParamNumber, getParamBoolean } from '@modules/configuration/utils/config.helper';

/**
 * Service de scoring avec configuration centralisée
 */
export class ScoringService {
    private scoreRepo: Repository<ScoreEleve>;
    private historiqueRepo: Repository<HistoriqueScore>;
    private regleRepo: Repository<RegleScoring>;

    constructor() {
        this.scoreRepo = AppDataSource.getRepository(ScoreEleve);
        this.historiqueRepo = AppDataSource.getRepository(HistoriqueScore);
        this.regleRepo = AppDataSource.getRepository(RegleScoring);
    }

    // ============ SCORES ============

    async getScore(eleveId: string, type: TypeIndicateur): Promise<ScoreEleve | null> {
        return this.scoreRepo.findOne({ where: { eleveId, type } });
    }

    async getAllScores(eleveId: string): Promise<ScoreEleve[]> {
        return this.scoreRepo.find({ where: { eleveId } });
    }

    async getScoreGlobal(eleveId: string): Promise<number> {
        const scores = await this.getAllScores(eleveId);
        if (scores.length === 0) return 0;

        // Calculer le score global pondéré
        const academique = scores.find(s => s.type === TypeIndicateur.ACADEMIQUE)?.score || 0;
        const comportement = scores.find(s => s.type === TypeIndicateur.COMPORTEMENT)?.score || 0;
        const assiduite = scores.find(s => s.type === TypeIndicateur.ASSIDUITE)?.score || 0;
        const participation = scores.find(s => s.type === TypeIndicateur.PARTICIPATION)?.score || 0;

        // Pondération configurable via paramètres
        const poids = {
            academique: await getParamNumber('scoring.weight_academic', { defaultValue: 40 }),
            comportement: await getParamNumber('scoring.weight_behavior', { defaultValue: 25 }),
            assiduite: await getParamNumber('scoring.weight_attendance', { defaultValue: 25 }),
            participation: await getParamNumber('scoring.weight_participation', { defaultValue: 10 }),
        };

        const total = poids.academique + poids.comportement + poids.assiduite + poids.participation;

        return (
            (Number(academique) * poids.academique +
                Number(comportement) * poids.comportement +
                Number(assiduite) * poids.assiduite +
                Number(participation) * poids.participation) /
            total
        );
    }

    async attribuerPoints(
        eleveId: string,
        type: TypeIndicateur,
        points: number,
        raison?: string
    ): Promise<ScoreEleve> {
        let score = await this.getScore(eleveId, type);

        if (!score) {
            score = this.scoreRepo.create({ eleveId, type, score: 0 });
        }

        score.score = Number(score.score) + points;
        await this.scoreRepo.save(score);

        // Historique
        const historique = this.historiqueRepo.create({
            eleveId,
            type,
            score: points,
            date: new Date(),
            raison,
        });
        await this.historiqueRepo.save(historique);

        logger.info(`Points attribués: ${eleveId} +${points} (${type})`);
        return score;
    }

    async calculerRangs(periodeId?: string, type: TypeIndicateur = TypeIndicateur.GLOBAL): Promise<void> {
        const scores = await this.scoreRepo.find({
            where: { type, periodeId },
            order: { score: 'DESC' },
        });

        for (let i = 0; i < scores.length; i++) {
            scores[i].rang = i + 1;
        }

        await this.scoreRepo.save(scores);
        logger.info(`Rangs calculés pour ${scores.length} élèves`);
    }

    // ============ CLASSEMENT ============

    async getClassement(
        type: TypeIndicateur = TypeIndicateur.GLOBAL,
        limite: number = 10,
        periodeId?: string
    ): Promise<ScoreEleve[]> {
        const where: any = { type };
        if (periodeId) where.periodeId = periodeId;

        return this.scoreRepo.find({
            where,
            order: { score: 'DESC' },
            take: limite,
        });
    }

    async getClassementClasse(classeId: string, type: TypeIndicateur = TypeIndicateur.GLOBAL): Promise<any[]> {
        // TODO: Joindre avec la table des élèves pour filtrer par classe
        return [];
    }

    // ============ RÈGLES ============

    async getRegles(type?: TypeIndicateur): Promise<RegleScoring[]> {
        const where: any = { actif: true };
        if (type) where.type = type;
        return this.regleRepo.find({ where, order: { points: 'DESC' } });
    }

    async createRegle(data: Partial<RegleScoring>): Promise<RegleScoring> {
        const regle = this.regleRepo.create(data);
        await this.regleRepo.save(regle);
        return regle;
    }

    async appliquerRegle(eleveId: string, evenement: string): Promise<number> {
        const regles = await this.regleRepo.find({
            where: { evenement, actif: true },
        });

        let pointsTotal = 0;
        for (const regle of regles) {
            await this.attribuerPoints(eleveId, regle.type, regle.points, `Règle: ${regle.nom}`);
            pointsTotal += regle.points;
        }

        return pointsTotal;
    }

    // ============ HISTORIQUE ============

    async getHistorique(
        eleveId: string,
        options: { type?: TypeIndicateur; dateDebut?: Date; dateFin?: Date }
    ): Promise<HistoriqueScore[]> {
        const qb = this.historiqueRepo.createQueryBuilder('h')
            .where('h.eleveId = :eleveId', { eleveId })
            .orderBy('h.date', 'DESC');

        if (options.type) qb.andWhere('h.type = :type', { type: options.type });
        if (options.dateDebut) qb.andWhere('h.date >= :dateDebut', { dateDebut: options.dateDebut });
        if (options.dateFin) qb.andWhere('h.date <= :dateFin', { dateFin: options.dateFin });

        return qb.getMany();
    }

    // ============ RECALCUL ============

    async recalculerScoreGlobal(eleveId: string): Promise<ScoreEleve> {
        const global = await this.getScoreGlobal(eleveId);

        let score = await this.getScore(eleveId, TypeIndicateur.GLOBAL);
        if (!score) {
            score = this.scoreRepo.create({ eleveId, type: TypeIndicateur.GLOBAL, score: 0 });
        }

        score.score = global;
        await this.scoreRepo.save(score);

        return score;
    }
}

export const scoringService = new ScoringService();
