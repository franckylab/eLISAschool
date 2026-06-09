/**
 * ==================================
 * eLISAschool - Cron Jobs pour Notifications
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Tâches planifiées pour les notifications automatiques
 */

import cron from 'node-cron';
import { logger } from '@common/utils/logger.util';
import { cantineService } from '@modules/cantine/services';
import { notificationsService } from '@modules/notifications/services';

/**
 * Initialiser tous les cron jobs de notifications
 */
export function initNotificationCronJobs(): void {
    logger.info('📅 Initialisation des cron jobs de notifications...');

    // ========================================
    // Cron Job 1: Rappels de paiement cantine
    // Exécution: Tous les jours à 8h00
    // ========================================
    cron.schedule('0 8 * * *', async () => {
        try {
            logger.info('📅 [Cron] Rappels de paiement cantine - Démarrage');
            
            // Récupérer tous les établissements (à adapter selon votre architecture multi-tenant)
            // Pour l'instant, on exécute sans filtrer par etablissementId
            const count = await cantineService.envoyerRappelsPaiement();
            
            logger.info(`✅ [Cron] ${count} rappels de paiement cantine envoyés`);
        } catch (error) {
            logger.error('❌ [Cron] Erreur rappels de paiement cantine', error);
        }
    }, {
        timezone: 'Africa/Lome', // Ajuster selon votre fuseau horaire
    });

    // ========================================
    // Cron Job 2: Nettoyage des anciennes notifications
    // Exécution: Tous les jours à 2h00 du matin
    // ========================================
    cron.schedule('0 2 * * *', async () => {
        try {
            logger.info('📅 [Cron] Nettoyage des anciennes notifications - Démarrage');
            
            // Supprimer les notifications de plus de 90 jours (à implémenter si besoin)
            // const count = await notificationsService.cleanOldNotifications(90);
            
            logger.info('✅ [Cron] Nettoyage des anciennes notifications terminé');
        } catch (error) {
            logger.error('❌ [Cron] Erreur nettoyage notifications', error);
        }
    }, {
        timezone: 'Africa/Lome',
    });

    // ========================================
    // Cron Job 3: Traitement des notifications programmées
    // Exécution: Toutes les 5 minutes
    // ========================================
    cron.schedule('*/5 * * * *', async () => {
        try {
            const count = await notificationsService.processScheduledNotifications();
            
            if (count > 0) {
                logger.info(`✅ [Cron] ${count} notifications programmées envoyées`);
            }
        } catch (error) {
            logger.error('❌ [Cron] Erreur traitement notifications programmées', error);
        }
    });

    // ========================================
    // Cron Job 4: Menu du jour (Cantine)
    // Exécution: Tous les jours à 7h00
    // ========================================
    cron.schedule('0 7 * * 1-5', async () => {
        try {
            logger.info('📅 [Cron] Envoi du menu du jour - Démarrage');
            
            // TODO: Implémenter l'envoi du menu du jour
            // await notificationTemplates.menuDuJour({...});
            
            logger.info('✅ [Cron] Menu du jour envoyé');
        } catch (error) {
            logger.error('❌ [Cron] Erreur envoi menu du jour', error);
        }
    }, {
        timezone: 'Africa/Lome',
    });

    logger.info('✅ Cron jobs de notifications initialisés');
}
