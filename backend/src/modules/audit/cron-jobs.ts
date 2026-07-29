/**
 * ==================================
 * eLISAschool - Cron Jobs Audit
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Tâches planifiées pour la maintenance des logs d'audit.
 */

import cron from 'node-cron';
import { logger } from '@common/utils/logger.util';
import { auditRetentionService } from './services/retention.service';

export function initAuditCronJobs(): void {
    cron.schedule('0 2 * * *', async () => {
        try {
            const result = await auditRetentionService.purgerLogsExpires();
            if (result.purges > 0) {
                logger.info(`[CRON AUDIT] Purge rétention terminée: ${result.purges} logs supprimés.`);
            }
        } catch (error) {
            logger.error('[CRON AUDIT] Erreur purge rétention:', error);
        }
    });

    logger.info('[CRON AUDIT] Tâche de purge rétention planifiée (02:00 quotidien).');
}
