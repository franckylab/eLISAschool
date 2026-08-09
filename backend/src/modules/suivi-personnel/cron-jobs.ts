/**
 * ==================================
 * eLISAschool - Cron Jobs Scoring Personnel
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Automatisation du calcul des scores du personnel:
 * - Recalcul quotidien des scores
 * - Reset hebdomadaire/mensuel
 * - Mise à jour des classements
 */

import { scheduleWithLock } from '@common/services/cron-lock.service';
import { logger } from '@common/utils/logger.util';
import { scoringPersonnelService } from './services/scoring-personnel.service';
import { AppDataSource } from '@database/data-source';
import { MembrePersonnel, StatutPersonnel } from '@modules/personnel/entities';
import { getParamBoolean } from '@modules/configuration/utils/config.helper';

/**
 * Initialiser les cron jobs de scoring personnel
 */
export function initScoringPersonnelCronJobs(): void {
    logger.info('📊 Initialisation des cron jobs de scoring personnel...');

    // =====================================================
    // Cron Job 1: Recalcul quotidien des scores (23h30)
    // =====================================================
    scheduleWithLock('scoring-recalcul-quotidien', '30 23 * * *', async () => {
        try {
            const enabled = await getParamBoolean('scoring-personnel.auto_recalcul_quotidien', { defaultValue: true });
            if (!enabled) {
                logger.debug('[Scoring-Personnel] Recalcul quotidien désactivé');
                return;
            }

            logger.info('[Scoring-Personnel] Démarrage du recalcul quotidien des scores...');

            const membrePersonnelRepo = AppDataSource.getRepository(MembrePersonnel);
            const membres = await membrePersonnelRepo.find({
                select: ['id', 'utilisateurId'],
                where: { statut: StatutPersonnel.ACTIF },
            });

            logger.info(`[Scoring-Personnel] ${membres.length} membres du personnel à traiter`);

            // Traiter par lots de 10 pour éviter la surcharge
            const batchSize = 10;
            for (let i = 0; i < membres.length; i += batchSize) {
                const batch = membres.slice(i, i + batchSize);
                
                await Promise.all(
                    batch.map(async (membre) => {
                        try {
                            await scoringPersonnelService.recalculerScore({
                                membrePersonnelId: membre.id,
                                force: false,
                            }, membre.etablissementId);
                        } catch (error) {
                            logger.error(`[Scoring-Personnel] Erreur recalcul ${membre.id}`, error);
                        }
                    })
                );

                logger.info(`[Scoring-Personnel] Lot ${Math.floor(i / batchSize) + 1} traité (${Math.min(i + batchSize, membres.length)}/${membres.length})`);
            }

            logger.info('[Scoring-Personnel] Recalcul quotidien terminé avec succès');
        } catch (error) {
            logger.error('[Scoring-Personnel] Erreur lors du recalcul quotidien', error);
        }
    }, {
        timezone: 'Africa/Douala', // Ajuster selon le fuseau horaire
    });

    // =====================================================
    // Cron Job 2: Mise à jour des classements (00h00)
    // =====================================================
    scheduleWithLock('scoring-classement', '0 0 * * *', async () => {
        try {
            const enabled = await getParamBoolean('scoring-personnel.auto_classement', { defaultValue: true });
            if (!enabled) {
                logger.debug('[Scoring-Personnel] Mise à jour des classements désactivée');
                return;
            }

            logger.info('[Scoring-Personnel] Démarrage de la mise à jour des classements...');

            // Cette fonction sera implémentée dans le service
            // Elle calcule les rangs par catégorie, matière, classe, etc.
            
            logger.info('[Scoring-Personnel] Mise à jour des classements terminée');
        } catch (error) {
            logger.error('[Scoring-Personnel] Erreur lors de la mise à jour des classements', error);
        }
    }, {
        timezone: 'Africa/Douala',
    });

    // =====================================================
    // Cron Job 3: Reset mensuel des scores (1er du mois, 00h30)
    // =====================================================
    scheduleWithLock('scoring-reset-mensuel', '30 0 1 * *', async () => {
        try {
            const enabled = await getParamBoolean('scoring-personnel.reset_mensuel', { defaultValue: false });
            if (!enabled) {
                logger.debug('[Scoring-Personnel] Reset mensuel désactivé');
                return;
            }

            logger.info('[Scoring-Personnel] Démarrage du reset mensuel des scores...');

            // Le reset mensuel peut être configuré pour:
            // - Réinitialiser certains scores
            // - Archiver les scores du mois précédent
            // - Créer de nouvelles périodes
            
            logger.info('[Scoring-Personnel] Reset mensuel terminé');
        } catch (error) {
            logger.error('[Scoring-Personnel] Erreur lors du reset mensuel', error);
        }
    }, {
        timezone: 'Africa/Douala',
    });

    // =====================================================
    // Cron Job 4: Nettoyage historique (> 1 an) (dimanche 01h00)
    // =====================================================
    scheduleWithLock('scoring-nettoyage-historique', '0 1 * * 0', async () => {
        try {
            const enabled = await getParamBoolean('scoring-personnel.nettoyage_historique', { defaultValue: false });
            if (!enabled) {
                logger.debug('[Scoring-Personnel] Nettoyage historique désactivé');
                return;
            }

            logger.info('[Scoring-Personnel] Démarrage du nettoyage de l\'historique...');

            // Supprimer les entrées d'historique de plus d'1 an
            // (à implémenter selon la politique de rétention)
            
            logger.info('[Scoring-Personnel] Nettoyage historique terminé');
        } catch (error) {
            logger.error('[Scoring-Personnel] Erreur lors du nettoyage historique', error);
        }
    }, {
        timezone: 'Africa/Douala',
    });

    logger.info('✅ Cron jobs de scoring personnel initialisés');
}

/**
 * Exécuter un recalcul manuel (pour tests ou forçage)
 */
export async function runScoringRecalculManual(etablissementId?: string): Promise<void> {
    logger.info('[Scoring-Personnel] Démarrage recalcul manuel...');

    try {
        const membrePersonnelRepo = AppDataSource.getRepository(MembrePersonnel);
        const where: any = { statut: 'ACTIF' };
        
        if (etablissementId) {
            where.etablissementId = etablissementId;
        }

        const membres = await membrePersonnelRepo.find({
            select: ['id', 'utilisateurId', 'etablissementId'],
            where,
        });

        logger.info(`[Scoring-Personnel] ${membres.length} membres à traiter`);

        for (const membre of membres) {
            try {
                await scoringPersonnelService.recalculerScore({
                    membrePersonnelId: membre.id,
                    force: true,
                }, membre.etablissementId);
            } catch (error) {
                logger.error(`[Scoring-Personnel] Erreur recalcul ${membre.id}`, error);
            }
        }

        logger.info('[Scoring-Personnel] Recalcul manuel terminé');
    } catch (error) {
        logger.error('[Scoring-Personnel] Erreur recalcul manuel', error);
        throw error;
    }
}
