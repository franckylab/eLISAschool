/**
 * ==================================
 * eLISAschool - Service Correlation Programme
 * ==================================
 * Module: Programmes Pédagogiques
 * Corrèle progression, évaluation et gamification
 */

import { Repository, In } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { getParamNumber, getParamBoolean } from '@modules/configuration/utils/config.helper';
import { ProgrammeChapitre } from '../entities/programme-chapitre.entity';
import { ProgressionProgramme } from '@modules/personnel/entities';
import { EvaluationEnseignant } from '@modules/personnel/entities/evaluation-enseignant.entity';
import { gamificationService } from '@modules/gamification/services';
import { TypeActionPoints } from '@modules/gamification/entities';

export class CorrelationProgrammeService {
    private chapitreRepo: Repository<ProgrammeChapitre>;
    private progressionRepo: Repository<ProgressionProgramme>;
    private evaluationRepo: Repository<EvaluationEnseignant>;

    constructor() {
        this.chapitreRepo = AppDataSource.getRepository(ProgrammeChapitre);
        this.progressionRepo = AppDataSource.getRepository(ProgressionProgramme);
        this.evaluationRepo = AppDataSource.getRepository(EvaluationEnseignant);
    }

    /**
     * Corrèle la progression déclarée d'un enseignant avec le programme officiel
     */
    async correlerProgressionProgramme(
        enseignantId: string,
        matiereId: string,
        classeId: string,
        etablissementId: string,
        periodeId?: string
    ): Promise<{
        progressionDeclaree: number;
        progressionReelle: number;
        ecart: number;
        estConforme: boolean;
        chapitresProgramme: {
            total: number;
            realises: number;
            enCours: number;
            nonCommences: number;
        };
        recommandations: string[];
    }> {
        // 1. Récupérer la progression déclarée
        const progressionQb = this.progressionRepo.createQueryBuilder('p')
            .where('p.enseignantId = :enseignantId', { enseignantId })
            .andWhere('p.matiereId = :matiereId', { matiereId })
            .andWhere('p.classeId = :classeId', { classeId })
            .orderBy('p.dateEvaluation', 'DESC')
            .limit(1);

        if (periodeId) {
            progressionQb.andWhere('p.periodeId = :periodeId', { periodeId });
        }

        const progression = await progressionQb.getOne();
        const progressionDeclaree = progression ? Number(progression.pourcentageRealise) : 0;

        // 2. Récupérer les chapitres du programme
        const chapitresQb = this.chapitreRepo.createQueryBuilder('c')
            .where('c.matiereNiveauId IN (SELECT mn.id FROM matieres_niveaux mn WHERE mn.matiereId = :matiereId)', { matiereId })
            .andWhere('c.etablissementId = :etablissementId', { etablissementId });

        if (periodeId) {
            chapitresQb.andWhere('c.periodeId = :periodeId', { periodeId });
        }

        const chapitres = await chapitresQb.getMany();
        const chapitresTotal = chapitres.length;

        if (chapitresTotal === 0) {
            return {
                progressionDeclaree,
                progressionReelle: 0,
                ecart: 0,
                estConforme: true,
                chapitresProgramme: { total: 0, realises: 0, enCours: 0, nonCommences: 0 },
                recommandations: ['Aucun chapitre de programme défini pour cette matière'],
            };
        }

        // 3. Calculer la progression réelle
        const chapitreIds = chapitres.map(c => c.id);
        const progressions = await this.progressionRepo.find({
            where: {
                enseignantId,
                classeId,
                programmeChapitreId: In(chapitreIds),
            },
        });

        const chapitresRealises = progressions.filter(p => Number(p.pourcentageRealise) >= 100).length;
        const chapitresEnCours = progressions.filter(p => {
            const pct = Number(p.pourcentageRealise);
            return pct > 0 && pct < 100;
        }).length;
        const chapitresNonCommences = chapitresTotal - chapitresRealises - chapitresEnCours;
        const progressionReelle = (chapitresRealises / chapitresTotal) * 100;

        // 4. Calculer l'écart
        const ecart = Math.abs(progressionDeclaree - progressionReelle);
        const seuilConforme = await getParamNumber('programme.ecart_acceptable_progression', { etablissementId, defaultValue: 10 });
        const estConforme = ecart <= seuilConforme;

        // 5. Générer recommandations
        const recommandations: string[] = [];
        if (!estConforme) {
            recommandations.push(`Écart important (${ecart.toFixed(1)}%) entre progression déclarée et réelle`);
        }
        if (chapitresNonCommences > chapitresTotal * 0.3) {
            recommandations.push(`${chapitresNonCommences} chapitres non commencés (${((chapitresNonCommences / chapitresTotal) * 100).toFixed(0)}%)`);
        }
        if (progressionReelle < 50 && new Date().getMonth() >= 5) {
            recommandations.push('Progression inférieure à 50% après 6 mois - risque de retard');
        }

        return {
            progressionDeclaree,
            progressionReelle: Math.round(progressionReelle * 100) / 100,
            ecart: Math.round(ecart * 100) / 100,
            estConforme,
            chapitresProgramme: {
                total: chapitresTotal,
                realises: chapitresRealises,
                enCours: chapitresEnCours,
                nonCommences: chapitresNonCommences,
            },
            recommandations,
        };
    }

    /**
     * Évalue un enseignant basé sur la corrélation progression + notes élèves
     */
    async evaluerParCorrelation(
        enseignantId: string,
        etablissementId: string,
        periodeId?: string
    ): Promise<{
        scoreProgression: number;
        scoreNotesEleves: number;
        scoreGlobal: number;
        badgeEligible: string | null;
    }> {
        // 1. Récupérer les évaluations pédagogiques de l'enseignant
        const evalQb = this.evaluationRepo.createQueryBuilder('e')
            .where('e.enseignantId = :enseignantId', { enseignantId })
            .andWhere('e.etablissementId = :etablissementId', { etablissementId })
            .andWhere('e.categorie = :categorie', { categorie: 'PEDAGOGIQUE' })
            .orderBy('e.dateEvaluation', 'DESC')
            .limit(10);

        if (periodeId) {
            evalQb.andWhere('e.dateEvaluation >= (SELECT "dateDebut" FROM periodes WHERE id = :periodeId)', { periodeId });
            evalQb.andWhere('e.dateEvaluation <= (SELECT "dateFin" FROM periodes WHERE id = :periodeId)', { periodeId });
        }

        const evaluations = await evalQb.getMany();
        const moyenneEvaluations = evaluations.length > 0
            ? evaluations.reduce((sum, e) => sum + Number(e.note), 0) / evaluations.length
            : 0;

        // 2. Récupérer les progressions de l'enseignant pour calculer le score progression
        const progressions = await this.progressionRepo.find({
            where: { enseignantId, etablissementId },
        });

        const progressionMoyenne = progressions.length > 0
            ? progressions.reduce((sum, p) => sum + Number(p.pourcentageRealise), 0) / progressions.length
            : 0;

        // Score progression sur 20
        let scoreProgression = 0;
        if (progressionMoyenne >= 90) {
            scoreProgression = 20;
        } else if (progressionMoyenne >= 70) {
            scoreProgression = 15;
        } else if (progressionMoyenne >= 50) {
            scoreProgression = 12;
        } else {
            scoreProgression = 8;
        }

        // 3. Score global (pondération)
        const poidsProgression = 0.4;
        const poidsNotes = 0.4; // Utilise les évaluations pédagogiques comme proxy
        const poidsAssiduite = 0.2;

        const scoreGlobal = (scoreProgression * poidsProgression) + (moyenneEvaluations * poidsNotes) + (15 * poidsAssiduite);

        // 4. Déterminer badge éligible
        let badgeEligible: string | null = null;
        const gamificationActive = await getParamBoolean('programme.gamification_enseignants_actif', { etablissementId, defaultValue: false });

        if (gamificationActive) {
            if (progressionMoyenne >= 100) {
                badgeEligible = 'PROGRESSIONNISTE';
            } else if (moyenneEvaluations >= 16) {
                badgeEligible = 'PEDAGOGUE_EXCELLENT';
            } else if (progressionMoyenne >= 90) {
                badgeEligible = 'CONFORMITE_PARFAITE';
            }
        }

        return {
            scoreProgression: Math.round(scoreProgression * 100) / 100,
            scoreNotesEleves: Math.round(moyenneEvaluations * 100) / 100,
            scoreGlobal: Math.round(scoreGlobal * 100) / 100,
            badgeEligible,
        };
    }

    /**
     * Déclenche la gamification basée sur les critères programme
     * NON-BLOQUANT - try/catch interne
     */
    async declencherGamificationEnseignant(
        enseignantId: string,
        etablissementId: string
    ): Promise<void> {
        try {
            const gamificationActive = await getParamBoolean('programme.gamification_enseignants_actif', { etablissementId, defaultValue: false });
            if (!gamificationActive) {
                return;
            }

            // Évaluer l'enseignant
            const evaluation = await this.evaluerParCorrelation(enseignantId, etablissementId);

            // Attribuer points selon critères
            if (evaluation.scoreGlobal >= 16) {
                await gamificationService.attribuerPoints({
                    utilisateurId: enseignantId,
                    points: 30,
                    action: TypeActionPoints.EVALUATION_EXCELLENTE,
                    description: `Évaluation excellente: ${evaluation.scoreGlobal}/20`,
                    sourceModule: 'programmes',
                    sourceId: `eval-${enseignantId}-${Date.now()}`,
                });
            }

            if (evaluation.badgeEligible) {
                // Le badge sera attribué par le système de gamification
                logger.info(`Badge éligible pour enseignant ${enseignantId}: ${evaluation.badgeEligible}`);
            }

            logger.info(`Gamification déclenchée pour enseignant ${enseignantId} (score: ${evaluation.scoreGlobal})`);
        } catch (error) {
            logger.warn(`[Programmes] Échec gamification enseignant (non bloquant)`, error);
        }
    }

    /**
     * Dashboard de corrélation pour un établissement
     */
    async getDashboardCorrelation(
        etablissementId: string,
        periodeId?: string
    ): Promise<{
        enseignantsConformes: number;
        enseignantsEnRetard: number;
        moyenneCorrelation: number;
        topEnseignants: Array<{ nom: string; matiere: string; score: number }>;
        alertes: Array<{ enseignantId: string; matiere: string; ecart: number }>;
    }> {
        // Simplifié - à optimiser avec des requêtes agrégées
        const progressions = await this.progressionRepo.find({
            where: { etablissementId },
            relations: ['enseignant'],
        });

        let enseignantsConformes = 0;
        let enseignantsEnRetard = 0;
        let totalEcart = 0;
        const alertes: Array<{ enseignantId: string; matiere: string; ecart: number }> = [];

        for (const progression of progressions) {
            const correlation = await this.correlerProgressionProgramme(
                progression.enseignantId,
                progression.matiereId,
                progression.classeId,
                etablissementId,
                progression.periodeId || periodeId
            );

            if (correlation.estConforme) {
                enseignantsConformes++;
            } else {
                enseignantsEnRetard++;
                alertes.push({
                    enseignantId: progression.enseignantId,
                    matiere: progression.matiereId,
                    ecart: correlation.ecart,
                });
            }

            totalEcart += correlation.ecart;
        }

        const moyenneCorrelation = progressions.length > 0 ? totalEcart / progressions.length : 0;

        return {
            enseignantsConformes,
            enseignantsEnRetard,
            moyenneCorrelation: Math.round(moyenneCorrelation * 100) / 100,
            topEnseignants: [], // À implémenter avec jointures
            alertes,
        };
    }
}

export const correlationProgrammeService = new CorrelationProgrammeService();
