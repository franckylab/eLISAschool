/**
 * ==================================
 * eLISAschool - Service Scoring Personnel
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Service de calcul et gestion des scores du personnel avec:
 * - Attribution automatique de points
 * - Calcul multi-dimensionnel (catégorie, matière, classe, période)
 * - Classement et ranking
 * - Historique complet des modifications
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import {
    ScorePersonnel,
    RegleScoringPersonnel,
    HistoriqueScorePersonnel,
    TypeModificationScore,
} from '../entities/scoring-personnel.entity';
import {
    AttribuerPointsPersonnelDto,
    CreateRegleScoringDto,
    UpdateRegleScoringDto,
    ClassementPersonnelDto,
    RecalculerScoreDto,
} from '../dto/scoring-personnel.dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { getParamBoolean, getParamNumber } from '@modules/configuration/utils/config.helper';
import { IncidentPersonnel, GraviteIncidentPersonnel } from '../entities/incident-personnel.entity';
import { AbsencePersonnel, TypeAbsencePersonnel } from '@modules/personnel/entities';
import { EvaluationPersonnel } from '../entities/evaluation-personnel.entity';

export class ScoringPersonnelService {
    private scoreRepo: Repository<ScorePersonnel>;
    private regleRepo: Repository<RegleScoringPersonnel>;
    private historiqueRepo: Repository<HistoriqueScorePersonnel>;
    private incidentRepo: Repository<IncidentPersonnel>;
    private absenceRepo: Repository<AbsencePersonnel>;
    private evaluationRepo: Repository<EvaluationPersonnel>;

    private cache = new Map<string, { value: any; timestamp: number }>();
    private readonly CACHE_TTL = 60 * 1000; // 1 minute

    constructor() {
        this.scoreRepo = AppDataSource.getRepository(ScorePersonnel);
        this.regleRepo = AppDataSource.getRepository(RegleScoringPersonnel);
        this.historiqueRepo = AppDataSource.getRepository(HistoriqueScorePersonnel);
        this.incidentRepo = AppDataSource.getRepository(IncidentPersonnel);
        this.absenceRepo = AppDataSource.getRepository(AbsencePersonnel);
        this.evaluationRepo = AppDataSource.getRepository(EvaluationPersonnel);
    }

    // =====================================================
    // ATTRIBUTION DE POINTS
    // =====================================================

    /**
     * Attribuer des points à un membre du personnel
     */
    async attribuerPoints(dto: AttribuerPointsPersonnelDto, etablissementId: string, anneeScolaireId: string, utilisateurId?: string): Promise<HistoriqueScorePersonnel> {
        // Vérifier si la règle est active
        const regleActive = await getParamBoolean('scoring-personnel.actif', { defaultValue: false });
        if (!regleActive && !dto.declencheurAutomatique) {
            throw new AppError('Le scoring personnel est désactivé', 403, 'SCORING_INACTIVE');
        }

        // Récupérer ou créer le score
        let score = await this.scoreRepo.findOne({
            where: {
                membrePersonnelId: dto.membrePersonnelId,
                etablissementId,
                anneeScolaireId,
            },
        });

        if (!score) {
            score = this.scoreRepo.create({
                membrePersonnelId: dto.membrePersonnelId,
                etablissementId,
                anneeScolaireId,
                scoreGlobal: 0,
                scoreAssiduite: 0,
                scoreComportement: 0,
                scorePerformance: 0,
                scorePedagogie: 0,
                pointsPositifs: 0,
                pointsNegatifs: 0,
            });
            await this.scoreRepo.save(score);
        }

        // Calculer les points
        const pointsAnciens = score.pointsPositifs + score.pointsNegatifs;
        const pointsDelta = dto.points;
        const pointsNouveaux = pointsAnciens + pointsDelta;

        // Mettre à jour le score approprié
        if (dto.typeAction === 'ASSIDUITE') {
            score.scoreAssiduite = Math.max(0, Math.min(100, score.scoreAssiduite + pointsDelta));
        } else if (dto.typeAction === 'COMPORTEMENT') {
            score.scoreComportement = Math.max(0, Math.min(100, score.scoreComportement + pointsDelta));
        } else if (dto.typeAction === 'PERFORMANCE') {
            score.scorePerformance = Math.max(0, Math.min(100, score.scorePerformance + pointsDelta));
        } else if (dto.typeAction === 'PEDAGOGIE') {
            score.scorePedagogie = Math.max(0, Math.min(100, score.scorePedagogie + pointsDelta));
        }

        // Mettre à jour les compteurs
        if (pointsDelta > 0) {
            score.pointsPositifs += pointsDelta;
        } else {
            score.pointsNegatifs += Math.abs(pointsDelta);
        }

        // Calculer le score global (moyenne pondérée)
        score.scoreGlobal = this.calculerScoreGlobal(score);
        score.derniereMAJ = new Date();

        await this.scoreRepo.save(score);

        // Créer l'entrée d'historique
        const historique = this.historiqueRepo.create({
            scorePersonnelId: score.id,
            membrePersonnelId: dto.membrePersonnelId,
            etablissementId,
            anneeScolaireId,
            typeModification: TypeModificationScore.ATTRIBUTION_POINTS,
            sourceModule: dto.sourceModule,
            sourceId: dto.sourceId,
            pointsAnciens,
            pointsNouveaux,
            pointsDelta,
            categorieScore: dto.categorieScore || dto.typeAction.toLowerCase(),
            raison: dto.description,
            declencheurAutomatique: dto.declencheurAutomatique,
            utilisateurId,
        });

        await this.historiqueRepo.save(historique);

        logger.info(`[Scoring-Personnel] Points attribués: ${pointsDelta} à ${dto.membrePersonnelId} (${dto.typeAction})`);

        // Invalidation du cache
        this.invalidateCache(etablissementId, anneeScolaireId);

        return historique;
    }

    // =====================================================
    // CALCUL MULTI-DIMENSIONNEL
    // =====================================================

    /**
     * Recalculer le score d'un membre du personnel
     */
    async recalculerScore(dto: RecalculerScoreDto, etablissementId: string, utilisateurId?: string): Promise<ScorePersonnel> {
        const anneeScolaireId = dto.anneeScolaireId || (await this.getAnneeScolaireCourante(etablissementId));

        // Récupérer le score existant
        let score = await this.scoreRepo.findOne({
            where: {
                membrePersonnelId: dto.membrePersonnelId,
                etablissementId,
                anneeScolaireId,
            },
        });

        if (!score && !dto.force) {
            throw new AppError('Aucun score trouvé pour ce membre du personnel', 404, 'SCORE_NOT_FOUND');
        }

        if (!score) {
            score = this.scoreRepo.create({
                membrePersonnelId: dto.membrePersonnelId,
                etablissementId,
                anneeScolaireId,
                scoreGlobal: 0,
                scoreAssiduite: 0,
                scoreComportement: 0,
                scorePerformance: 0,
                scorePedagogie: 0,
                pointsPositifs: 0,
                pointsNegatifs: 0,
            });
        }

        // Recalculer depuis les données sources
        const [incidents, absences, evaluations] = await Promise.all([
            this.incidentRepo.find({
                where: {
                    membrePersonnelId: dto.membrePersonnelId,
                    etablissementId,
                    anneeScolaireId,
                    periodeId: dto.periodeId || undefined,
                },
            }),
            this.absenceRepo.find({
                where: {
                    membrePersonnelId: dto.membrePersonnelId,
                    etablissementId,
                },
            }),
            this.evaluationRepo.find({
                where: {
                    membrePersonnelId: dto.membrePersonnelId,
                    etablissementId,
                    anneeScolaireId,
                    periodeId: dto.periodeId || undefined,
                },
            }),
        ]);

        // Calculer les scores par catégorie
        score.scoreAssiduite = this.calculerScoreAssiduite(absences);
        score.scoreComportement = this.calculerScoreComportement(incidents);
        score.scorePerformance = this.calculerScorePerformance(evaluations);
        score.scorePedagogie = this.calculerScorePedagogie(evaluations);

        // Compter les événements
        score.nombreIncidents = incidents.length;
        score.nombreAbsences = absences.length;
        score.nombreRetards = absences.filter(a => a.type === TypeAbsencePersonnel.RETARD).length;
        score.nombreEvaluations = evaluations.length;

        // Note moyenne
        const evaluationsWithNote = evaluations.filter(e => e.noteGlobale !== null);
        if (evaluationsWithNote.length > 0) {
            score.noteMoyenneEvaluations = evaluationsWithNote.reduce((sum, e) => sum + (e.noteGlobale || 0), 0) / evaluationsWithNote.length;
        }

        // Score global
        score.scoreGlobal = this.calculerScoreGlobal(score);
        score.derniereMAJ = new Date();

        await this.scoreRepo.save(score);

        logger.info(`[Scoring-Personnel] Score recalculé pour ${dto.membrePersonnelId}: ${score.scoreGlobal}`);

        return score;
    }

    // =====================================================
    // CLASSEMENT MULTI-DIMENSIONNEL
    // =====================================================

    /**
     * Obtenir le classement du personnel avec filtres multi-dimensionnels
     */
    async getClassement(dto: ClassementPersonnelDto, etablissementId: string): Promise<{ data: ScorePersonnel[]; total: number; pagination: any }> {
        const { page, limit, anneeScolaireId, periodeId, categorie, matiereId, classeId, sortBy, sortOrder } = dto;

        const offset = (page - 1) * limit;

        // Construire les conditions WHERE
        const where: any = {
            etablissementId,
            anneeScolaireId,
        };

        if (periodeId) where.periodeId = periodeId;
        if (categorie) where.categorie = categorie;
        if (matiereId) where.matiereId = matiereId;
        if (classeId) where.classeId = classeId;

        // Récupérer les données avec pagination
        const [data, total] = await this.scoreRepo.findAndCount({
            where,
            relations: ['membrePersonnel', 'membrePersonnel.utilisateur', 'matiere', 'classe'],
            select: {
                id: true,
                scoreGlobal: true,
                scoreAssiduite: true,
                scoreComportement: true,
                scorePerformance: true,
                scorePedagogie: true,
                pointsPositifs: true,
                pointsNegatifs: true,
                nombreIncidents: true,
                nombreAbsences: true,
                nombreRetards: true,
                nombreEvaluations: true,
                noteMoyenneEvaluations: true,
                rangGlobal: true,
                rangParCategorie: true,
                rangParMatiere: true,
                rangParClasse: true,
                categorie: true,
                membrePersonnel: {
                    id: true,
                    matricule: true,
                    posteExact: true,
                    utilisateur: {
                        id: true,
                        email: true,
                    },
                },
                matiere: {
                    id: true,
                    nom: true,
                },
                classe: {
                    id: true,
                    nom: true,
                },
            },
            order: {
                [sortBy]: sortOrder,
            },
            take: limit,
            skip: offset,
        });

        // Calculer la pagination
        const pagination = {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1,
        };

        return { data, total, pagination };
    }

    // =====================================================
    // GESTION DES RÈGLES DE SCORING
    // =====================================================

    /**
     * Créer une règle de scoring
     */
    async createRegle(dto: CreateRegleScoringDto, etablissementId: string): Promise<RegleScoringPersonnel> {
        // Vérifier l'unicité du code
        const existing = await this.regleRepo.findOne({
            where: { code: dto.code, etablissementId },
        });

        if (existing) {
            throw new AppError(`Une règle avec le code ${dto.code} existe déjà`, 409, 'REGLE_EXISTS');
        }

        const regle = this.regleRepo.create({
            ...dto,
            etablissementId,
            dateDebut: dto.dateDebut ? new Date(dto.dateDebut) : undefined,
            dateFin: dto.dateFin ? new Date(dto.dateFin) : undefined,
        });

        await this.regleRepo.save(regle);

        logger.info(`[Scoring-Personnel] Règle créée: ${dto.code} (${dto.pointsAttribues} points)`);

        return regle;
    }

    /**
     * Mettre à jour une règle de scoring
     */
    async updateRegle(id: string, dto: UpdateRegleScoringDto, etablissementId: string): Promise<RegleScoringPersonnel> {
        const regle = await this.regleRepo.findOne({
            where: { id, etablissementId },
        });

        if (!regle) {
            throw new AppError('Règle non trouvée', 404, 'NOT_FOUND');
        }

        Object.assign(regle, dto);
        await this.regleRepo.save(regle);

        logger.info(`[Scoring-Personnel] Règle mise à jour: ${regle.code}`);

        return regle;
    }

    /**
     * Obtenir toutes les règles actives
     */
    async getReglesActives(etablissementId: string): Promise<RegleScoringPersonnel[]> {
        const cacheKey = `regles-actives:${etablissementId}`;
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.value;
        }

        const regles = await this.regleRepo.find({
            where: {
                etablissementId,
                estActif: true,
            },
            order: { priorite: 'DESC' },
        });

        this.cache.set(cacheKey, { value: regles, timestamp: Date.now() });

        return regles;
    }

    // =====================================================
    // MÉTHODES DE CALCUL
    // =====================================================

    /**
     * Calculer le score global (moyenne pondérée)
     */
    private calculerScoreGlobal(score: ScorePersonnel): number {
        const ponderationAssiduite = 0.25;
        const ponderationComportement = 0.25;
        const ponderationPerformance = 0.30;
        const ponderationPedagogie = 0.20;

        return (
            score.scoreAssiduite * ponderationAssiduite +
            score.scoreComportement * ponderationComportement +
            score.scorePerformance * ponderationPerformance +
            score.scorePedagogie * ponderationPedagogie
        );
    }

    /**
     * Calculer le score d'assiduité
     */
    private calculerScoreAssiduite(absences: AbsencePersonnel[]): number {
        const maxScore = 100;
        const penaliteAbsence = 10;
        const penaliteRetard = 3;

        let score = maxScore;
        for (const absence of absences) {
            if (absence.type === TypeAbsencePersonnel.ABSENCE_NON_JUSTIFIEE) {
                score -= penaliteAbsence;
            } else if (absence.type === TypeAbsencePersonnel.RETARD) {
                score -= penaliteRetard;
            }
        }

        return Math.max(0, Math.min(100, score));
    }

    /**
     * Calculer le score de comportement
     */
    private calculerScoreComportement(incidents: IncidentPersonnel[]): number {
        const maxScore = 100;
        const penaliteParGravite = {
            [GraviteIncidentPersonnel.MINEUR]: 5,
            [GraviteIncidentPersonnel.MODERE]: 10,
            [GraviteIncidentPersonnel.GRAVE]: 20,
            [GraviteIncidentPersonnel.TRES_GRAVE]: 40,
        };

        let score = maxScore;
        for (const incident of incidents) {
            score -= penaliteParGravite[incident.gravite] || 0;
        }

        return Math.max(0, Math.min(100, score));
    }

    /**
     * Calculer le score de performance
     */
    private calculerScorePerformance(evaluations: EvaluationPersonnel[]): number {
        const evaluationsWithNote = evaluations.filter(e => e.noteGlobale !== null && e.noteGlobale !== undefined);
        if (evaluationsWithNote.length === 0) return 50; // Score neutre par défaut

        const moyenne = evaluationsWithNote.reduce((sum, e) => sum + (e.noteGlobale || 0), 0) / evaluationsWithNote.length;

        // Convertir note /20 en score /100
        return Math.min(100, (moyenne / 20) * 100);
    }

    /**
     * Calculer le score pédagogique
     */
    private calculerScorePedagogie(evaluations: EvaluationPersonnel[]): number {
        // Pour l'instant, même logique que performance (à affiner selon besoins)
        return this.calculerScorePerformance(evaluations);
    }

    // =====================================================
    // UTILITAIRES
    // =====================================================

    /**
     * Obtenir l'année scolaire courante
     */
    private async getAnneeScolaireCourante(etablissementId: string): Promise<string> {
        const { AnneeScolaire } = await import('@modules/annees-scolaires/entities');
        const anneeRepo = AppDataSource.getRepository(AnneeScolaire);

        const annee = await anneeRepo.findOne({
            where: {
                etablissementId,
                enCours: true,
            },
        });

        if (!annee) {
            throw new AppError('Aucune année scolaire active trouvée', 404, 'ANNEE_NOT_FOUND');
        }

        return annee.id;
    }

    /**
     * Invalider le cache
     */
    private invalidateCache(etablissementId: string, anneeScolaireId?: string): void {
        if (anneeScolaireId) {
            this.cache.delete(`regles-actives:${etablissementId}`);
        } else {
            this.cache.clear();
        }
    }
}

// Singleton exporté
export const scoringPersonnelService = new ScoringPersonnelService();
