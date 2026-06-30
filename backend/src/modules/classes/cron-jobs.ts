/**
 * ==================================
 * eLISAschool - Cron Jobs pour Module Classes
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Tâches planifiées :
 * - Réconciliation hebdomadaire du compteur effectifActuel
 */

import cron from 'node-cron';
import { logger } from '@common/utils/logger.util';
import { AppDataSource } from '@database/data-source';
import { ClasseAnnee } from './entities/classe-annee.entity';
import { classesService } from './services/classes.service';

/**
 * Initialiser les cron jobs du module Classes
 */
export function initClassesCronJobs(): void {
    logger.info('📅 Initialisation des cron jobs de classes...');

    // ========================================
    // Cron Job : Réconciliation effectifActuel
    // Exécution : Tous les lundis à 3h00
    // ========================================
    cron.schedule('0 3 * * 1', async () => {
        try {
            logger.info('🔄 [Cron] Démarration réconciliation effectifActuel des classes...');

            const classeAnneeRepo = AppDataSource.getRepository(ClasseAnnee);
            const classesAnnees = await classeAnneeRepo.find({
                where: { actif: true },
                select: ['id'],
            });

            let corrections = 0;
            for (const ca of classesAnnees) {
                try {
                    const result = await classesService.reconcilierEffectif(ca.id);
                    if (result.ancien !== result.nouveau) {
                        corrections++;
                    }
                } catch (err) {
                    logger.warn(`[Cron] Erreur réconciliation ClasseAnnee ${ca.id}: ${(err as any).message}`);
                }
            }

            if (corrections > 0) {
                logger.warn(`⚠️ [Cron] Réconciliation terminée : ${corrections} classe(s) corrigée(s) sur ${classesAnnees.length}`);
            } else {
                logger.info(`✅ [Cron] Réconciliation terminée : tous les compteurs sont cohérents (${classesAnnees.length} classes vérifiées)`);
            }
        } catch (error) {
            logger.error('❌ [Cron] Erreur réconciliation effectif classes', error);
        }
    });

    logger.info('📅 Cron jobs de classes initialisés');
}
