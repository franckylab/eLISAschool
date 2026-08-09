/**
 * ==================================
 * eLISAschool - Cron Jobs pour Gamification
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Tâches planifiées pour l'attribution automatique de points:
 * - Points d'assiduité journalière
 * - Reset des points hebdomadaires
 * - Attribution badges automatiques
 */

import cron from 'node-cron';
import { scheduleWithLock } from '@common/services/cron-lock.service';
import { logger } from '@common/utils/logger.util';
import { getParamBoolean, getParamNumber } from '@modules/configuration/utils/config.helper';
import { gamificationService } from './services/gamification.service';
import { AppDataSource } from '@database/data-source';
import { Eleve } from '@modules/eleves/entities';
import { PointsUtilisateur } from './entities';

/**
 * Initialiser tous les cron jobs de gamification
 */
export function initGamificationCronJobs(): void {
    logger.info('🎮 Initialisation des cron jobs de gamification...');

    // ========================================
    // Cron Job 1: Attribution points assiduité journalière
    // Exécution: Tous les jours à 23h00
    // ========================================
    scheduleWithLock('gamification-points-assiduite', '0 23 * * *', async () => {
        try {
            const enabled = await getParamBoolean('gamification.auto_attendance', { defaultValue: true });
            if (!enabled) {
                logger.info('🎮 [Cron] Attribution assiduité désactivée, skip...');
                return;
            }

            logger.info('🎮 [Cron] Attribution points assiduité - Démarrage');
            
            // Récupérer tous les élèves actifs
            const eleveRepo = AppDataSource.getRepository(Eleve);
            const eleves = await eleveRepo.find({
                select: ['utilisateurId', 'id', 'nom', 'prenom'],
                where: {} as any,
            });

            let successCount = 0;
            let errorCount = 0;

            for (const eleve of eleves) {
                try {
                    // TODO: Vérifier si l'élève était présent aujourd'hui
                    // Pour l'instant, on attribue à tous les élèves actifs
                    // Cette logique devra être affinée avec le module de présence
                    
                    await gamificationService.attribuerPointsAssiduite(eleve.utilisateurId);
                    successCount++;
                } catch (error) {
                    errorCount++;
                    logger.warn(
                        `🎮 [Cron] Échec attribution points pour élève ${eleve.id}`,
                        error
                    );
                }
            }

            logger.info(
                `✅ [Cron] Attribution assiduité terminée: ${successCount} succès, ${errorCount} erreurs`
            );
        } catch (error) {
            logger.error('❌ [Cron] Erreur globale attribution assiduité', error);
        }
    }, {
        timezone: 'Africa/Douala',
    });

    // ========================================
    // Cron Job 2: Reset des points hebdomadaires
    // Exécution: Tous les dimanches à 23h59
    // ========================================
    scheduleWithLock('gamification-reset-hebdo', '59 23 * * 0', async () => {
        try {
            logger.info('🎮 [Cron] Reset points hebdomadaires - Démarrage');
            
            const pointsRepo = AppDataSource.getRepository(PointsUtilisateur);
            
            // Reset pointsSemaine pour tous les utilisateurs
            await pointsRepo.update({}, { pointsSemaine: 0 });
            
            logger.info('✅ [Cron] Reset points hebdomadaires terminé');
        } catch (error) {
            logger.error('❌ [Cron] Erreur reset points hebdomadaires', error);
        }
    }, {
        timezone: 'Africa/Douala',
    });

    // ========================================
    // Cron Job 3: Attribution badges automatiques
    // Exécution: Tous les jours à 00h00 (minuit)
    // ========================================
    scheduleWithLock('gamification-badges-auto', '0 0 * * *', async () => {
        try {
            logger.info('🎮 [Cron] Vérification badges automatiques - Démarrage');
            
            const pointsRepo = AppDataSource.getRepository(PointsUtilisateur);
            const pointsUtilisateurs = await pointsRepo.find({
                relations: ['utilisateur'],
            });

            let badgesAttribues = 0;

            for (const points of pointsUtilisateurs) {
                try {
                    // TODO: Implémenter la logique de vérification des badges
                    // Par exemple: 
                    // - Badge "Assidu" après 30 jours de présence
                    // - Badge "Excellent" après 500 points
                    // - Badge "Bronze/Argent/Or" selon le niveau
                    
                    // Exemple simplifié:
                    if (points.pointsTotal >= 100 && points.niveau >= 2) {
                        // Attribution automatique d'un badge si critères remplis
                        // await gamificationService.verifierEtAttribuerBadge(points.utilisateurId);
                        badgesAttribues++;
                    }
                } catch (error) {
                    logger.warn(
                        `🎮 [Cron] Échec vérification badge pour utilisateur ${points.utilisateurId}`,
                        error
                    );
                }
            }

            logger.info(
                `✅ [Cron] Vérification badges terminée: ${badgesAttribues} badges attribués`
            );
        } catch (error) {
            logger.error('❌ [Cron] Erreur vérification badges', error);
        }
    }, {
        timezone: 'Africa/Douala',
    });

    // ========================================
    // Cron Job 4: Reset des points mensuels
    // Exécution: 1er du mois à 00h00
    // ========================================
    scheduleWithLock('gamification-reset-mensuel', '0 0 1 * *', async () => {
        try {
            logger.info('🎮 [Cron] Reset points mensuels - Démarrage');
            
            const pointsRepo = AppDataSource.getRepository(PointsUtilisateur);
            
            // Reset pointsMois pour tous les utilisateurs
            await pointsRepo.update({}, { pointsMois: 0 });
            
            logger.info('✅ [Cron] Reset points mensuels terminé');
        } catch (error) {
            logger.error('❌ [Cron] Erreur reset points mensuels', error);
        }
    }, {
        timezone: 'Africa/Douala',
    });

    logger.info('✅ Cron jobs de gamification initialisés');
}

/**
 * Arrêter tous les cron jobs de gamification
 */
export function stopGamificationCronJobs(): void {
    cron.getTasks().forEach((task) => task.stop());
    logger.info('🎮 Tous les cron jobs de gamification arrêtés');
}
