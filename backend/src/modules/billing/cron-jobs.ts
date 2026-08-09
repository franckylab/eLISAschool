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

import { Repository, LessThanOrEqual, MoreThan } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { logger } from '@common/utils/logger.util';
import { scheduleWithLock } from '@common/services/cron-lock.service';
import {
    AbonnementClient,
    StatutAbonnement,
    CycleFacturation,
} from './entities/abonnement-client.entity';
import { Facture, StatutFacture } from './entities/facture.entity';
import { PlanAbonnement, StatutPlan, ModeFacturationTranches } from './entities/plan-abonnement.entity';
import { FacturationService } from './services/facturation.service';
import { dunningService } from './services/dunning.service';
import { quotaService as _quotaService } from './services/quota.service';
import { TrancheConfigService } from './services/tranche-config.service';

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

    return withCronLock('renouvellement-auto', async () => {
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
    }) ?? result;
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
                    if (quota.limiteMax > 0) {
                        const pourcentage = (quota.utilisationActuelle / quota.limiteMax) * 100;

                        if (pourcentage >= 80 && !quota.alerte80pourcent) {
                            // Déclencher l'alerte via le QuotaService
                            await quotaService.mettreAJourQuota(
                                etablissementId,
                                quota.typeQuota,
                                0 // Pas de delta, juste déclencher l'alerte
                            );
                            results.alertesEnvoyees++;
                        }
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
    const results = { convertis: number, suspendus: number, erreurs: number } = {
        convertis: 0,
        suspendus: 0,
        erreurs: 0,
    };

    try {
        const abonnementRepo = AppDataSource.getRepository(AbonnementClient);
        const maintenant = new Date();

        // Trouver les abonnements en attente (essai) dont la date de fin est passée
        const abonnementsExpire = await abonnementRepo
            .createQueryBuilder('abo')
            .where('abo.statut = :statut', { statut: StatutAbonnement.EN_ATTENTE })
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
                    // Suspendre — essai terminé sans renouvellement
                    abonnement.statut = StatutAbonnement.ANNULE;
                    await abonnementRepo.save(abonnement);

                    results.suspendus++;
                    logger.info(
                        `[Cron] ⏹️ Essai terminé sans renouvellement — Établissement: ${abonnement.etablissementId}`
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

    // Lot B v7 — Contrôle des tranches — Quotidien 02h00
    scheduleWithLock('billing-controle-tranches', '0 2 * * *', async () => {
        try {
            await cronControleTranches();
        } catch (error) {
            logger.error('[Cron] Erreur contrôle tranches:', error);
        }
    }, { timezone: 'Africa/Douala' });

    logger.info('[Cron] ✅ Cron jobs billing enregistrés (quotidien 00h, mensuel 1er, quota 6h, tranches 02h)');
}

// =============================================
// LOT B v7 — Contrôle des tranches
// =============================================

/**
 * Contrôle quotidien des tranches en mode auto.
 * Schedule : quotidien à 02h00
 * 
 * Pour chaque abonnement actif en mode 'auto' :
 * 1. Compte le nombre réel d'élèves
 * 2. Vérifie si un seuil de tranche a été franchi
 * 3. Si franchissement → facture complémentaire au prorata + notification
 * 4. Si dépassement plafond → état QUOTA_DEPASSE + workflow critique
 */
export async function cronControleTranches(): Promise<CronResult> {
    const startTime = Date.now();
    logger.info('[Cron Tranches] 🕐 Démarrage du contrôle des tranches...');

    const abonnementRepo = AppDataSource.getRepository(AbonnementClient);
    const trancheConfigService = new TrancheConfigService();

    // Récupérer tous les abonnements actifs avec plan en mode auto
    const abonnementsAuto = await abonnementRepo.find({
        where: { statut: StatutAbonnement.ACTIF },
        relations: ['plan'],
    });

    const abonnementsModeAuto = abonnementsAuto.filter(
        a => a.plan?.modeFacturationTranches === ModeFacturationTranches.AUTO
    );

    const results = {
        totalAbonnements: abonnementsModeAuto.length,
        franchissements: 0,
        depassements: 0,
        erreurs: 0,
        details: [] as Array<{
            etablissementId: string;
            nbEleves: number;
            trancheActive: string | null;
            action: 'aucune' | 'franchissement' | 'depassement';
        }>,
    };

    for (const abonnement of abonnementsModeAuto) {
        try {
            // Compter les élèves réels de l'établissement
            const nbEleves = await AppDataSource.query(
                `SELECT COUNT(*)::int as count FROM eleves WHERE "etablissementId" = $1 AND "statut" = 'ACTIF'`,
                [abonnement.etablissementId]
            ).then((r: Array<{ count: number }>) => r[0]?.count ?? 0);

            const calcul = await trancheConfigService.calculerMontantTranches(abonnement.etablissementId, nbEleves);

            results.details.push({
                etablissementId: abonnement.etablissementId,
                nbEleves,
                trancheActive: calcul.trancheActive?.label ?? null,
                action: calcul.depassement.estEnDepassement ? 'depassement' :
                        calcul.trancheActive ? 'franchissement' : 'aucune',
            });

            // Cas 1 : Dépassement du plafond max → état QUOTA_DEPASSE
            if (calcul.depassement.estEnDepassement) {
                results.depassements++;
                logger.warn(
                    `[Cron Tranches] ⚠️ Dépassement plafond — Établissement: ${abonnement.etablissementId.substring(0, 8)}, ` +
                    `Élèves: ${nbEleves}, Plafond: ${calcul.plafondMaxEleves}, Dépassement: ${calcul.depassement.depassementPourcent}%`
                );
                // TODO Lot F: créer une action_critique workflow
                // Pour l'instant, on log et on notifie
            }

            // Cas 2 : Franchissement de seuil de tranche → facture complémentaire
            if (calcul.trancheActive && calcul.montantTranches > 0) {
                // Vérifier si une facture complémentaire existe déjà pour ce cycle
                const debutCycle = abonnement.cycleActuel?.debutCycle ?? new Date();
                const factureExistante = await AppDataSource.getRepository(Facture).findOne({
                    where: {
                        abonnementId: abonnement.id,
                        typeFacture: 'COMPLEMENTAIRE' as any,
                        createdAt: MoreThan(debutCycle),
                    },
                });

                if (!factureExistante) {
                    results.franchissements++;
                    logger.info(
                        `[Cron Tranches] 📈 Franchissement — Établissement: ${abonnement.etablissementId.substring(0, 8)}, ` +
                        `Tranche: ${calcul.trancheActive.label ?? 'inconnue'}, Montant: ${calcul.montantTranches} XAF`
                    );
                    // TODO: générer facture complémentaire au prorata (reste du cycle)
                }
            }
        } catch (error) {
            results.erreurs++;
            logger.error(
                `[Cron Tranches] Erreur — Établissement: ${abonnement.etablissementId.substring(0, 8)}`,
                error
            );
        }
    }

    const duration = Date.now() - startTime;
    logger.info(
        `[Cron Tranches] ✅ Terminé en ${duration}ms — ` +
        `${results.totalAbonnements} abonnements, ${results.franchissements} franchissements, ` +
        `${results.depassements} dépassements, ${results.erreurs} erreurs`
    );

    return {
        job: 'controle-tranches',
        executed: true,
        results: results as any,
        duration,
        timestamp: new Date(),
    };
}
