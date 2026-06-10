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
            
            logger.info('✅ [Cron] Nettoyage des anciens votes terminé');
        } catch (error) {
            logger.error('❌ [Cron] Erreur nettoyage anciens votes', error);
        }
    }, {
        timezone: 'Africa/Douala',
    });

    // ========================================
    // Cron Job 4: Création des sondages récurrents
    // Exécution: Tous les jours à 1h00 du matin
    // ========================================
    cron.schedule('0 1 * * *', async () => {
        try {
            logger.info('📅 [Cron] Création des sondages récurrents - Démarrage');
            
            const count = await creerOccurrencesRecurrentes();
            
            if (count > 0) {
                logger.info(`✅ [Cron] ${count} sondage(s) récurrent(s) créé(s)`);
            }
        } catch (error) {
            logger.error('❌ [Cron] Erreur création sondages récurrents', error);
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
        },
    });
    
    let count = 0;
    const maintenant = new Date();
    for (const sondage of sondagesActifs) {
        if (sondage.dateLimite && sondage.dateLimite <= maintenant) {
            sondage.statut = StatutSondage.FERME;
            sondage.dateFermeture = new Date();
            await sondageRepo.save(sondage);
            count++;
        }
    }
    
    return count;
}

/**
 * Créer les occurrences de sondages récurrents pour le jour suivant
 */
async function creerOccurrencesRecurrentes(): Promise<number> {
    const { AppDataSource } = await import('@database/data-source');
    const { Sondage, SondageOption, StatutSondage } = await import('./entities');
    
    const sondageRepo = AppDataSource.getRepository(Sondage);
    const optionRepo = AppDataSource.getRepository(SondageOption);
    
    // Récupérer tous les sondages récurrents actifs
    const sondagesRecurrents = await sondageRepo.find({
        where: {
            estRecurrent: true,
            statut: StatutSondage.ACTIF,
        },
        relations: ['options'],
    });
    
    let count = 0;
    const maintenant = new Date();
    
    for (const sondageParent of sondagesRecurrents) {
        // Vérifier si la date de fin est atteinte
        if (sondageParent.dateFinRecurrent && sondageParent.dateFinRecurrent <= maintenant) {
            continue;
        }
        
        // Vérifier si c'est le bon jour selon la fréquence
        const devraitCreer = verifierJourRecurrent(sondageParent, maintenant);
        if (!devraitCreer) {
            continue;
        }
        
        // Créer une nouvelle occurrence
        const nouvelleOccurrence = sondageRepo.create({
            question: sondageParent.question,
            statut: StatutSondage.PROGRAMME,
            estAnonyme: sondageParent.estAnonyme,
            choixMultiple: sondageParent.choixMultiple,
            dateLimite: sondageParent.dateLimite,
            dateProgrammation: calculerProchaineDate(sondageParent),
            nombreDestinataires: sondageParent.nombreDestinataires,
            modeDestinataires: sondageParent.modeDestinataires,
            auteurId: sondageParent.auteurId,
            etablissementId: sondageParent.etablissementId,
            sondageParentId: sondageParent.id,
            estRecurrent: false, // L'occurrence n'est pas récurrente
        });
        
        await sondageRepo.save(nouvelleOccurrence);
        
        // Copier les options
        if (sondageParent.options) {
            const options = sondageParent.options.map((opt) =>
                optionRepo.create({
                    texte: opt.texte,
                    ordre: opt.ordre,
                    sondageId: nouvelleOccurrence.id,
                })
            );
            await optionRepo.save(options);
        }
        
        count++;
    }
    
    return count;
}

/**
 * Vérifier si un sondage récurrent doit être créé aujourd'hui
 */
function verifierJourRecurrent(sondage: any, date: Date): boolean {
    if (!sondage.frequenceRecurrent) {
        return false;
    }
    
    switch (sondage.frequenceRecurrent) {
        case 'quotidien':
            return true;
        case 'hebdomadaire':
            // jourRecurrent: 0=dimanche, 1=lundi, ..., 6=samedi
            return date.getDay() === sondage.jourRecurrent;
        case 'mensuel':
            // jourRecurrent: 1-31 (jour du mois)
            return date.getDate() === sondage.jourRecurrent;
        default:
            return false;
    }
}

/**
 * Calculer la prochaine date d'envoi
 */
function calculerProchaineDate(sondage: any): Date {
    const maintenant = new Date();
    const heure = sondage.heureRecurrent ? new Date(`1970-01-01T${sondage.heureRecurrent}`) : new Date('1970-01-01T09:00:00');
    
    const prochaineDate = new Date(maintenant);
    prochaineDate.setHours(heure.getHours(), heure.getMinutes(), 0, 0);
    
    // Si l'heure est déjà passée, programmer pour demain
    if (prochaineDate <= maintenant) {
        prochaineDate.setDate(prochaineDate.getDate() + 1);
    }
    
    return prochaineDate;
}
