/**
 * ==================================
 * eLISAschool - Cron Jobs Module Auth
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Tâches planifiées pour le module d'authentification
 */

import cron from 'node-cron';
import { blocageAuthService } from './services/blocage-auth.service';
import { logger } from '@common/utils/logger.util';

/**
 * Initialise les cron jobs du module auth
 */
export function initAuthCronJobs(): void {
    logger.info('[Auth Cron] Initialisation des tâches planifiées...');

    // Nettoyage des anciennes tentatives de connexion (toutes les heures à 00:00)
    cron.schedule('0 * * * *', async () => {
        try {
            const nbNettoyes = await blocageAuthService.nettoyerAnciennesTentatives();
            
            if (nbNettoyes > 0) {
                logger.info(`[Auth Cron] Nettoyage tentatives: ${nbNettoyes} entrées supprimées`);
            }
        } catch (error) {
            logger.error('[Auth Cron] Erreur lors du nettoyage des tentatives', error);
        }
    }, {
        scheduled: true,
        timezone: 'Africa/Douala'
    });

    logger.info('[Auth Cron] Tâches planifiées initialisées avec succès');
}
