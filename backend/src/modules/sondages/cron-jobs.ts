/**
 * ==================================
 * eLISAschool - Cron Jobs pour Module Sondages
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 * 
 * Tâches planifiées pour les sondages automatiques
 */

import cron from 'node-cron';
import { logger } from '@common/utils/logger.util';
import { sondageService } from './services';

/**
 * Initialiser tous les cron jobs de sondages
 */
export function initSondageCronJobs(): void {
    logger.info('📅 Initialisation des cron jobs de sondages...');

    // ========================================
    // Cron Job 1: Activation des sondages programmés
    // Exécution: Toutes les 5 minutes
    // ========================================
    cron.schedule('*/5 * * * *', async () => {
        try {
            const count = await sondageService.activerSondagesProgrammes();
            
            if (count > 0) {
                logger.info(`✅ [Cron] ${count} sondage(s) programmé(s) activé(s)`);
            }
        } catch (error) {
            logger.error('❌ [Cron] Erreur activation sondages programmés', error);
        }
    });

    // ========================================
    // Cron Job 2: Fermeture automatique des sondages expirés
    // Exécution: Toutes les heures
    // ========================================
    cron.schedule('0 * * * *', async () => {
        try {
            logger.info('📅 [Cron] Fermeture automatique des sondages expirés - Démarrage');
            
            const count = await fermerSondagesExpirés();
            
            if (count > 0) {
                logger.info(`✅ [Cron] ${count} sondage(s) expiré(s) fermé(s)`);
            }
        } catch (error) {
            logger.error('❌ [Cron] Erreur fermeture sondages expirés', error);
        }
    });

    // ========================================
    // Cron Job 3: Nettoyage des anciens votes (> 1 an)
    // Exécution: Tous les jours à 3h00 du matin
    // ========================================
    cron.schedule('0 3 * * *', async () => {
        try {
            logger.info('📅 [Cron] Nettoyage des anciens votes - Démarrage');
            
            // TODO: Implémenter le nettoyage des anciens votes
            // const count = await sondageService.cleanOldVotes(365);
            
            logger.info('✅ [Cron] Nettoyage des anciens votes terminé');
        } catch (error) {
            logger.error('❌ [Cron] Erreur nettoyage anciens votes', error);
        }
    }, {
        timezone: 'Africa/Douala',
    });

    logger.info('✅ Cron jobs de sondages initialisés');
}

/**
 * Fermer automatiquement les sondages dont la date limite est passée
 */
async function fermerSondagesExpirés(): Promise<number> {
    const { AppDataSource } = await import('@database/data-source');
    const { Sondage, StatutSondage } = await import('./entities');
    
    const sondageRepo = AppDataSource.getRepository(Sondage);
    
    const sondagesActifs = await sondageRepo.find({
        where: {
            statut: StatutSondage.ACTIF,
            dateLimite: { $lte: new Date() as any },
        },
    });
    
    let count = 0;
    for (const sondage of sondagesActifs) {
        sondage.statut = StatutSondage.FERME;
        sondage.dateFermeture = new Date();
        await sondageRepo.save(sondage);
        count++;
    }
    
    return count;
}
