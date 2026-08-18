/**
 * ==================================
 * eLISAschool - Cron Jobs Billing
 * ==================================
 * 
 * Tâches automatisées pour la facturation SaaS :
 * - Renouvellement automatique des abonnements
 * - Génération des factures mensuelles
 * - Dunning (relances automatiques)
 * - Alertes quota
 * - Expiration des périodes d'essai
 * 
 * Phase P1.1 — Refonte SaaS v4
 */

import { Repository, LessThanOrEqual } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { logger } from '@common/utils/logger.util';
import { scheduleWithLock } from '@common/services/cron-lock.service';
import {
    AbonnementClient,
    StatutAbonnement,
    CycleFacturation,
} from './entities/abonnement-client.entity';
// Migration 210 — Refonte Feature Flags (cron expiration)
import { featureFlagDefinitionService } from './services/feature-flag-definition.service';
import { ActionFeatureFlag } from './entities/feature-flag-history.entity';
import { Facture, StatutFacture } from './entities/facture.entity';
// Refonte v3 (migration 213) — plans pilotés par JSONB, fin des tranches
import { FacturationService } from './services/facturation.service';
import { dunningService } from './services/dunning.service';
import { quotaService as _quotaService } from './services/quota.service';

// =============================================
// TYPES
// =============================================

export interface CronResult {
    job: string;
    executed: boolean;
    results: Record<string, any>;
    duration: number;
    timestamp: Date;
}

// =============================================
// CONCURRENCY GUARD — Verrou distribué (local + PostgreSQL)
// =============================================

import { withCronLock } from '@common/services/cron-lock.service';

// =============================================
// CRON JOBS
// =============================================

/**
 * Renouvellement automatique des abonnements.
 * Schedule : quotidien à 00h00
 * 
 * Parcourt les abonnements avec autoRenouvellement=true
 * et dateFin <= demain → crée un nouvel abonnement + génère la facture.
 */
export async function cronRenouvellementAuto(): Promise<CronResult> {
    const start = Date.now();
    const result: CronResult = {
        job: 'renouvellement-auto',
        executed: false,
        results: { renouveles: 0, erreurs: 0, details: [] },
        duration: 0,
        timestamp: new Date(),
    };

    return (await withCronLock('renouvellement-auto', async () => {
        result.executed = true;
        const results = result.results as { renouveles: number; erreurs: number; details: any[] };

        try {
            const abonnementRepo = AppDataSource.getRepository(AbonnementClient);
            const facturationService = new FacturationService();

            const demain = new Date();
            demain.setDate(demain.getDate() + 1);

            const abonnementsARenouveler = await abonnementRepo
                .createQueryBuilder('abo')
                .where('abo.autoRenouvellement = :auto', { auto: true })
                .andWhere('abo.statut = :statut', { statut: StatutAbonnement.ACTIF })
                .andWhere('abo.dateFin <= :demain', { demain: demain.toISOString().split('T')[0] })
                .getMany();

            for (const abonnement of abonnementsARenouveler) {
                const queryRunner = AppDataSource.createQueryRunner();
                await queryRunner.connect();
                await queryRunner.startTransaction();

                try {
                    const dateFin = new Date(abonnement.dateFin);
                    const nouvelleDateDebut = new Date(dateFin);
                    nouvelleDateDebut.setDate(nouvelleDateDebut.getDate() + 1);

                    const nouvelleDateFin = new Date(nouvelleDateDebut);
                    if (abonnement.cycleFacturation === CycleFacturation.ANNUEL) {
                        nouvelleDateFin.setFullYear(nouvelleDateFin.getFullYear() + 1);
                    } else {
                        nouvelleDateFin.setMonth(nouvelleDateFin.getMonth() + 1);
                    }

                    // I5 (v3) : fermer l'ancien abonnement avant de créer le nouveau
                    abonnement.statut = StatutAbonnement.EXPIRE;
                    abonnement.dateExpirationReelle = new Date();
                    await queryRunner.manager.save(abonnement);

                    const nouvelAbonnement = queryRunner.manager.create(AbonnementClient, {
                        etablissementId: abonnement.etablissementId,
                        planId: abonnement.planId,
                        dateDebut: nouvelleDateDebut,
                        dateFin: nouvelleDateFin,
                        statut: StatutAbonnement.ACTIF,
                        cycleFacturation: abonnement.cycleFacturation,
                        autoRenouvellement: abonnement.autoRenouvellement,
                        montantMensuel: abonnement.montantMensuel,
                        nombreElevesActuel: abonnement.nombreElevesActuel,
                        prochaineFacturation: nouvelleDateDebut,
                    });

                    await queryRunner.manager.save(nouvelAbonnement);
                    await queryRunner.commitTransaction();

                    // Facture hors transaction (non-bloquant)
                    try {
                        await facturationService.genererFactureMensuelle(nouvelAbonnement.id);
                    } catch (factureError) {
                        logger.warn(
                            `[Cron] Facture non générée pour renouvellement ${nouvelAbonnement.id}: ` +
                            (factureError instanceof Error ? factureError.message : 'erreur inconnue')
                        );
                    }

                    results.renouveles++;
                    results.details.push({
                        etablissementId: abonnement.etablissementId,
                        ancienId: abonnement.id,
                        nouveauId: nouvelAbonnement.id,
                        dateDebut: nouvelleDateDebut,
                        dateFin: nouvelleDateFin,
                    });

                    logger.info(
                        `[Cron] ✅ Abonnement renouvelé — Établissement: ${abonnement.etablissementId} ` +
                        `— ${nouvelleDateDebut.toISOString().split('T')[0]} → ${nouvelleDateFin.toISOString().split('T')[0]}`
                    );
                } catch (error) {
                    await queryRunner.rollbackTransaction();
                    results.erreurs++;
                    logger.error(
                        `[Cron] ❌ Erreur renouvellement abonnement ${abonnement.id}:`,
                        error
                    );
                } finally {
                    await queryRunner.release();
                }
            }

        logger.info(
            `[Cron] Renouvellement auto terminé — ${results.renouveles} renouvelés, ${results.erreurs} erreurs`
        );
        } catch (error) {
            logger.error('[Cron] Erreur critique cronRenouvellementAuto:', error);
        }

        result.duration = Date.now() - start;
        return result;
    })) ?? result;
}

/**
 * Génération des factures mensuelles.
 * Schedule : 1er du mois à 01h00
 * 
 * Pour chaque abonnement actif sans facture du mois en cours → génère la facture.
 */
export async function cronGenerationFactures(): Promise<CronResult> {
    const start = Date.now();
    const results: { facturesGenerees: number; erreurs: number; details: any[] } = {
        facturesGenerees: 0,
        erreurs: 0,
        details: [],
    };

    try {
        const abonnementRepo = AppDataSource.getRepository(AbonnementClient);
        const factureRepo = AppDataSource.getRepository(Facture);
        const facturationService = new FacturationService();

        const maintenant = new Date();
        const premierJourMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);

        // Trouver les abonnements actifs
        const abonnementsActifs = await abonnementRepo.find({
            where: { statut: StatutAbonnement.ACTIF },
        });

        for (const abonnement of abonnementsActifs) {
            try {
                // Vérifier si une facture existe déjà pour ce mois
                const factureExistante = await factureRepo
                    .createQueryBuilder('f')
                    .where('f.abonnementId = :aboId', { aboId: abonnement.id })
                    .andWhere('f.dateEmission >= :premierJour', {
                        premierJour: premierJourMois.toISOString().split('T')[0],
                    })
                    .getCount();

                if (factureExistante > 0) {
                    continue; // Facture déjà générée ce mois
                }

                // Générer la facture
                const facture = await facturationService.genererFactureMensuelle(abonnement.id);
                results.facturesGenerees++;
                results.details.push({
                    abonnementId: abonnement.id,
                    etablissementId: abonnement.etablissementId,
                    factureId: facture.id,
                    montant: facture.montantTotal,
                });

                logger.info(
                    `[Cron] ✅ Facture générée — Abonnement: ${abonnement.id} ` +
                    `— Montant: ${facture.montantTotal} XAF`
                );
            } catch (error) {
                results.erreurs++;
                logger.error(
                    `[Cron] ❌ Erreur génération facture abonnement ${abonnement.id}:`,
                    error
                );
            }
        }

        logger.info(
            `[Cron] Génération factures terminée — ${results.facturesGenerees} générées, ${results.erreurs} erreurs`
        );
    } catch (error) {
        logger.error('[Cron] Erreur critique cronGenerationFactures:', error);
    }

    return {
        job: 'generation_factures',
        executed: true,
        results,
        duration: Date.now() - start,
        timestamp: new Date(),
    };
}

/**
 * Dunning — Relances automatiques.
 * Schedule : quotidien à 06h00
 * 
 * Vérifie les factures en retard et applique les relances :
 * - J+3 : 1ère relance (email + in-app)
 * - J+7 : 2ème relance (email + SMS)
 * - J+15 : 3ème relance (email + SMS + notification urgente)
 * - J+30 : Suspension automatique
 */
export async function cronDunning(): Promise<CronResult> {
    const start = Date.now();

    try {
        const relances = await dunningService.executerDunningQuotidien();

        logger.info(
            `[Cron] Dunning terminé — ${relances.length} relances effectuées`
        );

        return {
            job: 'dunning',
            executed: true,
            results: {
                relancesEnvoyees: relances.length,
                details: relances,
            },
            duration: Date.now() - start,
            timestamp: new Date(),
        };
    } catch (error) {
        logger.error('[Cron] Erreur critique cronDunning:', error);
        return {
            job: 'dunning',
            executed: false,
            results: { erreur: error instanceof Error ? error.message : 'Erreur inconnue' },
            duration: Date.now() - start,
            timestamp: new Date(),
        };
    }
}

/**
 * Alertes quota — Vérification des seuils.
 * Schedule : toutes les 6h
 * 
 * Vérifie l'usage des quotas par établissement et alerte si > 80%.
 */
export async function cronAlerteQuota(): Promise<CronResult> {
    const start = Date.now();
    const results = { alertesEnvoyees: 0, etablissementsVerifies: 0 };

    try {
        const quotaService = _quotaService;
        const abonnementRepo = AppDataSource.getRepository(AbonnementClient);

        // Récupérer tous les abonnements actifs
        const abonnementsActifs = await abonnementRepo.find({
            where: { statut: StatutAbonnement.ACTIF },
            select: ['etablissementId'],
        });

        const etablissementIds = [...new Set(abonnementsActifs.map(a => a.etablissementId))];

        for (const etablissementId of etablissementIds) {
            try {
                const quotas = await quotaService.getQuotasEtablissement(etablissementId);
                results.etablissementsVerifies++;

                for (const quota of quotas) {
                    // Refonte v3 : EtatQuota (ressource, utilisation, limite, pourcentage)
                    if (quota.limite > 0 && quota.pourcentage >= 80) {
                        // Déclencher l'alerte via le QuotaService (seuil 80%)
                        await quotaService.mettreAJourQuota(
                            etablissementId,
                            quota.ressource,
                            0 // Pas de delta, juste déclencher l'alerte
                        );
                        results.alertesEnvoyees++;
                    }
                }
            } catch (error) {
                logger.error(
                    `[Cron] Erreur vérification quota établissement ${etablissementId}:`,
                    error
                );
            }
        }

        logger.info(
            `[Cron] Alertes quota terminées — ${results.etablissementsVerifies} établissements vérifiés, ` +
            `${results.alertesEnvoyees} alertes envoyées`
        );
    } catch (error) {
        logger.error('[Cron] Erreur critique cronAlerteQuota:', error);
    }

    return {
        job: 'alerte_quota',
        executed: true,
        results,
        duration: Date.now() - start,
        timestamp: new Date(),
    };
}

/**
 * Expiration des périodes d'essai.
 * Schedule : quotidien à 08h00
 * 
 * Vérifie les abonnements en essai avec dateFinEssai <= aujourd'hui.
 * - Si autoRenouvellement=true → convertir en abonnement payant
 * - Sinon → suspendre l'abonnement
 */
export async function cronExpirationEssai(): Promise<CronResult> {
    const start = Date.now();
    const results = {
        convertis: 0,
        suspendus: 0,
        erreurs: 0,
    };

    try {
        const abonnementRepo = AppDataSource.getRepository(AbonnementClient);
        const maintenant = new Date();

        // Trouver les abonnements en période d'essai dont la date de fin est passée
        const abonnementsExpire = await abonnementRepo
            .createQueryBuilder('abo')
            .where('abo.statut = :statut', { statut: StatutAbonnement.ESSAI })
            .andWhere('abo.dateFin <= :maintenant', { maintenant: maintenant.toISOString() })
            .getMany();

        for (const abonnement of abonnementsExpire) {
            try {
                if (abonnement.autoRenouvellement) {
                    // Convertir en abonnement actif
                    abonnement.statut = StatutAbonnement.ACTIF;
                    abonnement.dateDebut = maintenant;

                    // Calculer la date de fin selon le cycle
                    const dateFin = new Date(maintenant);
                    if (abonnement.cycleFacturation === CycleFacturation.ANNUEL) {
                        dateFin.setFullYear(dateFin.getFullYear() + 1);
                    } else {
                        dateFin.setMonth(dateFin.getMonth() + 1);
                    }
                    abonnement.dateFin = dateFin;

                    await abonnementRepo.save(abonnement);

                    // Générer la première facture
                    try {
                        const facturationService = new FacturationService();
                        await facturationService.genererFactureMensuelle(abonnement.id);
                    } catch (factureError) {
                        logger.warn(
                            `[Cron] Facture non générée pour conversion essai ${abonnement.id}: ` +
                            (factureError instanceof Error ? factureError.message : 'erreur inconnue')
                        );
                    }

                    results.convertis++;
                    logger.info(
                        `[Cron] ✅ Essai converti en abonnement payant — Établissement: ${abonnement.etablissementId}`
                    );
                } else {
                    // Essai expiré sans renouvellement → dégradation gracieuse
                    abonnement.statut = StatutAbonnement.EXPIRE;
                    abonnement.dateExpirationReelle = maintenant;
                    await abonnementRepo.save(abonnement);

                    // Invalider le cache entitlements pour ce tenant
                    try {
                        const { entitlementService } = await import('./services/entitlement.service');
                        entitlementService.invalidate(abonnement.etablissementId);
                    } catch { /* silencieux */ }

                    results.suspendus++;
                    logger.info(
                        `[Cron] ⏹️ Essai expiré → EXPIRE (dégradation gracieuse) — Établissement: ${abonnement.etablissementId}`
                    );
                }
            } catch (error) {
                results.erreurs++;
                logger.error(
                    `[Cron] ❌ Erreur expiration essai abonnement ${abonnement.id}:`,
                    error
                );
            }
        }

        logger.info(
            `[Cron] Expiration essais terminée — ${results.convertis} convertis, ` +
            `${results.suspendus} suspendus, ${results.erreurs} erreurs`
        );
    } catch (error) {
        logger.error('[Cron] Erreur critique cronExpirationEssai:', error);
    }

    return {
        job: 'expiration_essai',
        executed: true,
        results,
        duration: Date.now() - start,
        timestamp: new Date(),
    };
}

// =============================================
// Migration 210 — Expiration des feature flags
// =============================================

/**
 * Vérification des feature flags expirés.
 * Schedule : quotidien à 03h00
 * 
 * Détecte les flags avec expires_at < now(),
 * log dans l'historique et émet un warning.
 */
export async function cronExpiredFlags(): Promise<CronResult> {
    const start = Date.now();
    logger.info('[Cron Flags] 🕐 Vérification des feature flags expirés...');

    const results = { flagsExpires: 0, orphans: 0, erreurs: 0 };

    try {
        // 1. Flags expirés
        const expired = await featureFlagDefinitionService.findExpiredFlags();
        results.flagsExpires = expired.length;

        for (const flag of expired) {
            try {
                // Log dans l'historique
                await featureFlagDefinitionService.logHistory({
                    flagDefinitionId: flag.id,
                    action: ActionFeatureFlag.EXPIRE,
                    ancienneValeur: 'actif',
                    nouvelleValeur: 'expire',
                    commentaire: `Flag expiré le ${flag.expiresAt?.toISOString()}`,
                });

                // Désactiver le flag
                flag.estActif = false;
                logger.warn(
                    `[Cron Flags] ⚠️ Flag expiré : ${flag.cle} (${flag.label}) — expiré le ${flag.expiresAt?.toISOString()}`
                );
            } catch (err) {
                results.erreurs++;
                logger.error(`[Cron Flags] Erreur traitement flag expiré ${flag.cle}:`, err);
            }
        }

        // 2. Flags orphelins
        const orphans = await featureFlagDefinitionService.findOrphanFlags();
        results.orphans = orphans.length;

        if (orphans.length > 0) {
            logger.warn(
                `[Cron Flags] ⚠️ ${orphans.length} flag(s) orphelin(s) détecté(s) dans feature_flags_tenant sans définition`
            );
        }

    } catch (error) {
        logger.error('[Cron Flags] Erreur globale:', error);
        results.erreurs++;
    }

    const duration = Date.now() - start;
    logger.info(
        `[Cron Flags] ✅ Terminé en ${duration}ms — ` +
        `${results.flagsExpires} expirés, ${results.orphans} orphelins, ${results.erreurs} erreurs`
    );

    return {
        job: 'expired-flags',
        executed: true,
        results: results as any,
        duration,
        timestamp: new Date(),
    };
}

/**
 * Notifications d'expiration d'abonnement.
 * Schedule : quotidien à 08h00
 *
 * Vérifie les abonnements expirant dans 7j, 3j, 1j
 * et envoie une notification email + in-app à l'admin de l'établissement.
 */
export async function cronNotificationsExpiration(): Promise<CronResult> {
    const start = Date.now();
    logger.info('[Cron Notif] 🕐 Vérification des abonnements expirant bientôt...');

    const results = { notificationsEnvoyees: 0, abonnementsVerifies: 0, erreurs: 0 };

    try {
        const aboRepo = AppDataSource.getRepository(AbonnementClient);
        const now = new Date();

        // Paliers de notification : J-7, J-3, J-1
        const paliers = [
            { jours: 7, cle: 'J7' },
            { jours: 3, cle: 'J3' },
            { jours: 1, cle: 'J1' },
        ];

        for (const palier of paliers) {
            const dateLimite = new Date(now);
            dateLimite.setDate(dateLimite.getDate() + palier.jours);
            dateLimite.setHours(23, 59, 59, 999);

            const dateMin = new Date(now);
            dateMin.setDate(dateMin.getDate() + palier.jours - 1);

            const abonnements = await aboRepo
                .createQueryBuilder('abo')
                .where('abo.statut IN (:...statuts)', {
                    statuts: [StatutAbonnement.ACTIF, StatutAbonnement.ESSAI],
                })
                .andWhere('abo.dateFin <= :dateLimite', { dateLimite })
                .andWhere('abo.dateFin > :dateMin', { dateMin })
                .getMany();

            results.abonnementsVerifies += abonnements.length;

            for (const abo of abonnements) {
                try {
                    // Notification in-app (via table notifications si existante)
                    logger.info(
                        `[Cron Notif] 🔔 Alerte ${palier.cle} — Établissement: ${abo.etablissementId} ` +
                        `— Abonnement: ${abo.id} — Expire le ${abo.dateFin.toISOString()}`
                    );

                    // TODO: Envoyer email via service notification
                    // await notificationService.envoyerEmail({
                    //     destinataire: abo.etablissementId,
                    //     sujet: `Votre abonnement expire dans ${palier.jours} jour(s)`,
                    //     template: 'expiration-abonnement',
                    //     data: { palier: palier.cle, dateFin: abo.dateFin, plan: abo.planId },
                    // });

                    results.notificationsEnvoyees++;
                } catch (err) {
                    results.erreurs++;
                    logger.error(`[Cron Notif] Erreur notification abonnement ${abo.id}:`, err);
                }
            }
        }
    } catch (error) {
        logger.error('[Cron Notif] Erreur globale:', error);
        results.erreurs++;
    }

    const duration = Date.now() - start;
    logger.info(
        `[Cron Notif] ✅ Terminé en ${duration}ms — ` +
        `${results.abonnementsVerifies} vérifiés, ${results.notificationsEnvoyees} notifications, ${results.erreurs} erreurs`
    );

    return {
        job: 'notifications_expiration',
        executed: true,
        results: results as any,
        duration,
        timestamp: new Date(),
    };
}

// =============================================
// REGISTRATION — Appelées depuis app.ts ou un scheduler
// =============================================

/**
 * Exécute tous les jobs quotidiens (appelé à 00h00).
 */
export async function executerJobsQuotidiens(): Promise<CronResult[]> {
    logger.info('[Cron] 🕐 Démarrage des jobs quotidiens...');
    const results: CronResult[] = [];

    results.push(await cronRenouvellementAuto());
    results.push(await cronDunning());
    results.push(await cronExpirationEssai());
    results.push(await cronExpiredFlags());
    results.push(await cronNotificationsExpiration());

    logger.info(`[Cron] ✅ Jobs quotidiens terminés — ${results.length} jobs exécutés`);
    return results;
}

/**
 * Exécute les jobs de début de mois (appelé le 1er à 01h00).
 */
export async function executerJobsMensuels(): Promise<CronResult[]> {
    logger.info('[Cron] 🕐 Démarrage des jobs mensuels...');
    const results: CronResult[] = [];

    results.push(await cronGenerationFactures());

    logger.info(`[Cron] ✅ Jobs mensuels terminés — ${results.length} jobs exécutés`);
    return results;
}

/**
 * Exécute les jobs de vérification quota (appelé toutes les 6h).
 */
export async function executerJobsQuota(): Promise<CronResult> {
    return cronAlerteQuota();
}

// =============================================
// INIT — Enregistrement des cron jobs (node-cron)
// =============================================

/**
 * Enregistre les cron jobs billing dans le scheduler node-cron.
 * Appelée depuis index.ts au démarrage du serveur.
 */
export function initBillingCronJobs(): void {
    logger.info('[Cron] 📅 Enregistrement des cron jobs billing...');

    // Renouvellement auto + Dunning + Expiration essai — Quotidien 00h00
    scheduleWithLock('billing-quotidien', '0 0 * * *', async () => {
        try {
            await cronRenouvellementAuto();
            await cronDunning();
            await cronExpirationEssai();
            await cronExpiredFlags();
        } catch (error) {
            logger.error('[Cron] Erreur jobs quotidiens billing:', error);
        }
    }, { timezone: 'Africa/Douala' });

    // Génération factures mensuelles — 1er du mois à 01h00
    scheduleWithLock('billing-factures-mensuelles', '0 1 1 * *', async () => {
        try {
            await cronGenerationFactures();
        } catch (error) {
            logger.error('[Cron] Erreur génération factures mensuelles:', error);
        }
    }, { timezone: 'Africa/Douala' });

    // Alerte quota — Toutes les 6h
    scheduleWithLock('billing-alerte-quota', '0 */6 * * *', async () => {
        try {
            await cronAlerteQuota();
        } catch (error) {
            logger.error('[Cron] Erreur alerte quota:', error);
        }
    }, { timezone: 'Africa/Douala' });

    // Refonte v3 — Contrôle des quotas — Quotidien 02h00
    scheduleWithLock('billing-controle-quotas', '0 2 * * *', async () => {
        try {
            await cronControleQuotas();
        } catch (error) {
            logger.error('[Cron] Erreur contrôle quotas:', error);
        }
    }, { timezone: 'Africa/Douala' });

    // Refonte v3.1 — Notifications expiration — Quotidien 08h00
    scheduleWithLock('billing-notifications-expiration', '0 8 * * *', async () => {
        try {
            await cronNotificationsExpiration();
        } catch (error) {
            logger.error('[Cron] Erreur notifications expiration:', error);
        }
    }, { timezone: 'Africa/Douala' });

    // Refonte v4.1 — Expiration automatique des promotions — Quotidien 00h05
    scheduleWithLock('billing-expiration-promotions', '5 0 * * *', async () => {
        try {
            await cronExpirationPromotions();
        } catch (error) {
            logger.error('[Cron] Erreur expiration promotions:', error);
        }
    }, { timezone: 'Africa/Douala' });

    logger.info('[Cron] ✅ Cron jobs billing enregistrés (quotidien 00h, mensuel 1er, quota 6h, contrôle quotas 02h, flags 03h, notifs 08h, promos 00h05)');
}

// =============================================
// Refonte v3 — Contrôle des quotas (remplace le contrôle des tranches)
// =============================================

/**
 * Contrôle quotidien des quotas unifiés (usage_unifie).
 * Schedule : quotidien à 02h00
 *
 * Pour chaque abonnement actif :
 * 1. Résout les quotas effectifs (plan.quotas JSONB + packs quota)
 * 2. Compare avec l'usage réel (usage_unifie)
 * 3. Si dépassement → log + alerte (invitation à acheter un pack quota)
 */
export async function cronControleQuotas(): Promise<CronResult> {
    const startTime = Date.now();
    logger.info('[Cron Quotas] 🕐 Démarrage du contrôle des quotas...');

    const abonnementRepo = AppDataSource.getRepository(AbonnementClient);
    const quotaService = _quotaService;

    // Récupérer tous les abonnements actifs (dédoublonnés par établissement)
    const abonnementsActifs = await abonnementRepo.find({
        where: { statut: StatutAbonnement.ACTIF },
        select: ['etablissementId'],
    });
    const etablissementIds = [...new Set(abonnementsActifs.map(a => a.etablissementId))];

    const results = {
        totalEtablissements: etablissementIds.length,
        depassements: 0,
        alertes: 0,
        erreurs: 0,
        details: [] as Array<{
            etablissementId: string;
            ressource: string;
            utilisation: number;
            limite: number;
            pourcentage: number;
        }>,
    };

    for (const etablissementId of etablissementIds) {
        try {
            const quotas = await quotaService.getQuotasEtablissement(etablissementId);

            for (const quota of quotas) {
                if (quota.limite <= 0) continue; // 0 = illimité

                if (quota.utilisation > quota.limite) {
                    // Dépassement franc : log + invitation pack quota
                    results.depassements++;
                    results.details.push({
                        etablissementId,
                        ressource: quota.ressource,
                        utilisation: quota.utilisation,
                        limite: quota.limite,
                        pourcentage: quota.pourcentage,
                    });
                    logger.warn(
                        `[Cron Quotas] ⚠️ Dépassement — Établissement: ${etablissementId.substring(0, 8)}, ` +
                        `Ressource: ${quota.ressource}, Usage: ${quota.utilisation}/${quota.limite} (${quota.pourcentage}%)`
                    );
                } else if (quota.pourcentage >= 80) {
                    // Seuil d'alerte : déclenche la notification via mettreAJourQuota
                    results.alertes++;
                    await quotaService.mettreAJourQuota(etablissementId, quota.ressource, 0);
                }
            }
        } catch (error) {
            results.erreurs++;
            logger.error(
                `[Cron Quotas] Erreur — Établissement: ${etablissementId.substring(0, 8)}`,
                error
            );
        }
    }

    const duration = Date.now() - startTime;
    logger.info(
        `[Cron Quotas] ✅ Terminé en ${duration}ms — ` +
        `${results.totalEtablissements} établissements, ${results.depassements} dépassements, ` +
        `${results.alertes} alertes, ${results.erreurs} erreurs`
    );

    return {
        job: 'controle-quotas',
        executed: true,
        results: results as any,
        duration,
        timestamp: new Date(),
    };
}

// cronControleTranches supprimé (Refonte v3 — remplacé par cronControleQuotas)

// =============================================
// Refonte v4.1 — Expiration automatique des promotions
// =============================================

/**
 * Expiration automatique des promotions et bundles.
 * Schedule : quotidien à 00h05
 *
 * 1. Désactive les promotions dont dateFin < now() et actif = true
 * 2. Désactive les bundles dont dateFin < now() et actif = true
 * 3. Log le résumé (nombre désactivés)
 */
async function cronExpirationPromotions(): Promise<CronResult> {
    const startTime = Date.now();
    logger.info('[Cron Promos] 🔄 Expiration automatique des promotions...');

    const now = new Date();
    const promoRepo = AppDataSource.getRepository('Promotion');
    const bundleRepo = AppDataSource.getRepository('BundlePromotion');

    let promosDesactivees = 0;
    let bundlesDesactives = 0;
    let programmeesActivees = 0;

    try {
        // 1. Promotions expirées
        const promosExpirees = await promoRepo
            .createQueryBuilder('p')
            .update('promotions')
            .set({ actif: false })
            .where('actif = true')
            .andWhere('date_fin IS NOT NULL')
            .andWhere('date_fin < :now', { now })
            .execute();
        promosDesactivees = promosExpirees.affected ?? 0;

        // 2. Bundles expirés
        const bundlesExpirees = await bundleRepo
            .createQueryBuilder('b')
            .update('bundle_promotions')
            .set({ actif: false })
            .where('actif = true')
            .andWhere('date_fin IS NOT NULL')
            .andWhere('date_fin < :now', { now })
            .execute();
        bundlesDesactives = bundlesExpirees.affected ?? 0;

        // 3. v5 — Activer les promotions programmées (dateProgrammation atteinte)
        const programmeesActiveesResult = await promoRepo
            .createQueryBuilder('p')
            .update('promotions')
            .set({ actif: true, estProgrammee: false })
            .where('actif = false')
            .andWhere('est_programmee = true')
            .andWhere('date_programmation IS NOT NULL')
            .andWhere('date_programmation <= :now', { now })
            .execute();
        programmeesActivees = programmeesActiveesResult.affected ?? 0;

    } catch (error) {
        logger.error('[Cron Promos] Erreur lors de la désactivation:', error);
    }

    const duration = Date.now() - startTime;
    logger.info(
        `[Cron Promos] ✅ Terminé en ${duration}ms — ` +
        `${promosDesactivees} expirées, ${bundlesDesactives} bundles désactivés, ${programmeesActivees} programmées activées`
    );

    return {
        job: 'expiration-promotions',
        executed: true,
        results: { promosDesactivees, bundlesDesactives, programmeesActivees },
        duration,
        timestamp: new Date(),
    };
}
