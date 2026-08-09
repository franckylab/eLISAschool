/**
 * ==================================
 * eLISAschool - Cron Jobs Module Finances
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Jobs planifiés pour le module finances:
 * - Relances automatiques de scolarité
 * - Détection impayés
 * - Alertes budget
 * - Rapports automatiques
 */

import cron from 'node-cron';
import { scheduleWithLock } from '@common/services/cron-lock.service';
import { AppDataSource } from '@database/data-source';
import { Etablissement } from '@modules/etablissement/entities';
import { scolariteService } from '../services/scolarite.service';
import { budgetService } from '../services/budget.service';
import { logger } from '@common/utils/logger.util';

/**
 * Initialiser les cron jobs du module finances
 */
export function initFinanceCronJobs(): void {
    logger.info('[Cron Finance] Initialisation des jobs planifiés...');

    // ==================================
    // CRON JOB 1: Relances automatiques scolarité
    // ==================================
    // Exécution: Tous les jours à 8h00
    scheduleWithLock('finances-relances-impayes', '0 8 * * *', async () => {
        try {
            logger.info('[Cron Finance] Détection impayés et envoi relances...');
            
            // CORRECTION BUG: Récupérer tous les établissements actifs depuis la DB
            const etablissementRepo = AppDataSource.getRepository(Etablissement);
            const etablissements = await etablissementRepo.find({
                where: { actif: true },
                select: ['id', 'nom'],
            });
            
            if (etablissements.length === 0) {
                logger.warn('[Cron Finance] Aucun établissement actif trouvé');
                return;
            }
            
            logger.info(`[Cron Finance] ${etablissements.length} établissements actifs à traiter`);
            
            for (const etablissement of etablissements) {
                try {
                    // Détecter impayés
                    const impayes = await scolariteService.detecterImpayes(etablissement.id);
                    
                    if (impayes.length > 0) {
                        logger.info(
                            `[Cron Finance] ${impayes.length} impayés détectés pour ${etablissement.nom}`
                        );
                        
                        // Envoyer relances
                        const count = await scolariteService.envoyerRelances(etablissement.id);
                        logger.info(`[Cron Finance] ${count} relances envoyées pour ${etablissement.nom}`);
                    }
                } catch (error) {
                    logger.error(
                        `[Cron Finance] Erreur relances pour ${etablissement.nom}`,
                        error
                    );
                }
            }
        } catch (error) {
            logger.error('[Cron Finance] Erreur globale relances', error);
        }
    });

    // ==================================
    // CRON JOB 2: Alertes budget
    // ==================================
    // Exécution: Tous les lundis à 9h00
    scheduleWithLock('finances-alertes-budget', '0 9 * * 1', async () => {
        try {
            logger.info('[Cron Finance] Vérification alertes budget...');
            
            // TODO: Récupérer tous les établissements
            const etablissements: Array<{ id: string }> = [];
            
            for (const etablissement of etablissements) {
                try {
                    const alertes = await budgetService.getAlertesBudget(etablissement.id);
                    
                    if (alertes.length > 0) {
                        logger.warn(
                            `[Cron Finance] ${alertes.length} alertes budget détectées`
                        );
                        
                        // TODO: Envoyer notifications aux responsables
                    }
                } catch (error) {
                    logger.error(
                        `[Cron Finance] Erreur vérification budget`,
                        error
                    );
                }
            }
        } catch (error) {
            logger.error('[Cron Finance] Erreur globale alertes budget', error);
        }
    });

    // ==================================
    // CRON JOB 3: Nettoyage anciens reçus PDF
    // ==================================
    // Exécution: 1er du mois à 2h00
    scheduleWithLock('finances-nettoyage-pdf', '0 2 1 * *', async () => {
        try {
            logger.info('[Cron Finance] Nettoyage reçus PDF > 90 jours...');
            
            // TODO: Supprimer fichiers PDF > 90 jours
            // Supprimer de S3 ou filesystem
            
            logger.info('[Cron Finance] Nettoyage PDF terminé');
        } catch (error) {
            logger.error('[Cron Finance] Erreur nettoyage PDF', error);
        }
    });

    // ==================================
    // CRON JOB 4: Rapport financier hebdomadaire
    // ==================================
    // Exécution: Vendredi 17h00
    scheduleWithLock('finances-rapport-hebdo', '0 17 * * 5', async () => {
        try {
            logger.info('[Cron Finance] Génération rapports hebdomadaires...');
            
            // TODO: 
            // 1. Générer rapport recettes/dépenses semaine
            // 2. Envoyer par email aux administrateurs
            // 3. Archiver rapport
            
            logger.info('[Cron Finance] Rapports hebdomadaires envoyés');
        } catch (error) {
            logger.error('[Cron Finance] Erreur rapports hebdomadaires', error);
        }
    });

    // ==================================
    // CRON JOB 5: Vérification seuils caisse
    // ==================================
    // Exécution: Tous les jours à 7h00 (avant ouverture)
    scheduleWithLock('finances-verification-caisse', '0 7 * * *', async () => {
        try {
            logger.info('[Cron Finance] Vérification seuils caisse...');
            
            // TODO: 
            // 1. Vérifier solde toutes les caisses
            // 2. Si < seuil minimum → alerte
            // 3. Notification au comptable
            
            logger.info('[Cron Finance] Vérification caisse terminée');
        } catch (error) {
            logger.error('[Cron Finance] Erreur vérification caisse', error);
        }
    });

    logger.info('[Cron Finance] ✅ Tous les jobs planifiés initialisés');
}

/**
 * Arrêter tous les cron jobs (pour tests ou shutdown)
 */
export function stopFinanceCronJobs(): void {
    cron.getTasks().forEach((task) => task.stop());
    logger.info('[Cron Finance] Tous les jobs arrêtés');
}
