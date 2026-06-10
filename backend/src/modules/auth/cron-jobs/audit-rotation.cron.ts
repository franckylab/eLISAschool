/**
 * ==================================
 * eLISAschool - Cron Jobs Rotation Audit Logs
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import cron from 'node-cron';
import { auditRotationService } from '../services/audit-rotation.service';
import { logger } from '@common/utils/logger.util';

/**
 * Démarrer les cron jobs de rotation des logs d'audit
 */
export function demarrerCronJobsAudit(): void {
    logger.info('[AuditCron] Démarrage des cron jobs de rotation');

    // Rotation complète : tous les dimanches à 2h du matin
    cron.schedule('0 2 * * 0', async () => {
        logger.info('[AuditCron] Exécution de la rotation hebdomadaire');

        try {
            const resultat = await auditRotationService.executerRotation();

            logger.info('[AuditCron] Rotation terminée', resultat);
        } catch (error) {
            logger.error('[AuditCron] Erreur lors de la rotation', error);
        }
    }, {
        timezone: 'Africa/Douala',
    });

    // Statistiques de stockage : tous les jours à 6h
    cron.schedule('0 6 * * *', async () => {
        try {
            const stats = await auditRotationService.getStatistiquesStockage();
            logger.info('[AuditCron] Statistiques stockage', stats);
        } catch (error) {
            logger.error('[AuditCron] Erreur statistiques', error);
        }
    }, {
        timezone: 'Africa/Douala',
    });

    logger.info('[AuditCron] Cron jobs démarrés:');
    logger.info('  - Rotation hebdomadaire: Dimanche 02:00');
    logger.info('  - Statistiques quotidiennes: 06:00');
}

/**
 * Arrêter tous les cron jobs
 */
export function arreterCronJobsAudit(): void {
    cron.getTasks().forEach((task) => task.stop());
    logger.info('[AuditCron] Tous les cron jobs arrêtés');
}
