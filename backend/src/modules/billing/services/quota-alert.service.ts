/**
 * ==================================
 * eLISAschool - Quota Alert Service
 * ==================================
 * [Phase 4.2] Service dédié aux alertes de consommation de quotas.
 * Alertes à 80% (warning), 90% (critique), 100% (blocage).
 * Notification admin établissement (email + in-app).
 * Refonte v3 (migration 213) : lecture via usage_unifie + quota effectif (plan + packs).
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { logger } from '@common/utils/logger.util';
import {
    AbonnementClient,
    StatutAbonnement,
} from '../entities';
import { quotaService } from './quota.service';
import { NotificationOrchestratorService } from '@modules/notifications/services/notification-orchestrator.service';

// =============================================
// Types
// =============================================

interface AlerteQuota {
    etablissementId: string;
    typeQuota: string;
    seuil: number;          // 80, 90, 100
    utilisation: number;
    limite: number;
    pourcentage: number;
    bloquer: boolean;
}

interface ResultatVerification {
    alertes: AlerteQuota[];
    totalAlertes: number;
    alertesCritiques: number;
}

// =============================================
// Seuils d'alerte
// =============================================

const SEUILS_ALERTES = {
    WARNING: 80,
    CRITIQUE: 90,
    BLOCAGE: 100,
} as const;

// =============================================
// Service
// =============================================

export class QuotaAlertService {
    private abonnementRepo: Repository<AbonnementClient>;
    private orchestrator: NotificationOrchestratorService;

    /** Cache des dernières alertes envoyées (éviter le spam) */
    private alertesEnvoyees: Map<string, number> = new Map();

    /** Durée minimale entre deux alertes pour un même quota (ms) — 1 heure */
    private readonly COOLDOWN_ALERTES = 60 * 60 * 1000;

    constructor(orchestrator?: NotificationOrchestratorService) {
        this.abonnementRepo = AppDataSource.getRepository(AbonnementClient);
        this.orchestrator = orchestrator ?? new NotificationOrchestratorService();
    }

    /**
     * Vérifie tous les quotas d'un établissement et déclenche les alertes nécessaires.
     * Appelé périodiquement ou après une mise à jour de quota.
     */
    async verifierEtAlerter(etablissementId: string): Promise<ResultatVerification> {
        // Refonte v3 : quotas résolus depuis usage_unifie + quota effectif (plan + packs)
        const quotas = await quotaService.getQuotasEtablissement(etablissementId);

        const alertes: AlerteQuota[] = [];
        let alertesCritiques = 0;

        for (const quota of quotas) {
            if (quota.limite <= 0) continue; // 0 = illimité

            const pourcentage = quota.pourcentage;

            // Déterminer le seuil atteint
            let seuilAtteint = 0;
            if (pourcentage >= SEUILS_ALERTES.BLOCAGE) {
                seuilAtteint = SEUILS_ALERTES.BLOCAGE;
                alertesCritiques++;
            } else if (pourcentage >= SEUILS_ALERTES.CRITIQUE) {
                seuilAtteint = SEUILS_ALERTES.CRITIQUE;
                alertesCritiques++;
            } else if (pourcentage >= SEUILS_ALERTES.WARNING) {
                seuilAtteint = SEUILS_ALERTES.WARNING;
            }

            if (seuilAtteint > 0) {
                const alerte: AlerteQuota = {
                    etablissementId,
                    typeQuota: quota.ressource,
                    seuil: seuilAtteint,
                    utilisation: quota.utilisation,
                    limite: quota.limite,
                    pourcentage: Math.round(pourcentage * 10) / 10,
                    bloquer: pourcentage >= SEUILS_ALERTES.BLOCAGE,
                };
                alertes.push(alerte);

                // Envoyer la notification si pas déjà fait récemment
                await this.envoyerAlerteSiNecessaire(alerte);
            }
        }

        if (alertes.length > 0) {
            logger.warn(
                `[QuotaAlert] ${alertes.length} alerte(s) pour établissement ${etablissementId} ` +
                `(${alertesCritiques} critique(s))`
            );
        }

        return {
            alertes,
            totalAlertes: alertes.length,
            alertesCritiques,
        };
    }

    /**
     * Vérifie tous les établissements actifs (job cron).
     * Retourne le résumé global.
     */
    async verifierTous(): Promise<{
        totalEtabVerifies: number;
        totalAlertes: number;
        totalCritiques: number;
    }> {
        const abonnements = await this.abonnementRepo.find({
            where: { statut: StatutAbonnement.ACTIF },
            select: ['etablissementId'],
        });

        let totalAlertes = 0;
        let totalCritiques = 0;

        for (const ab of abonnements) {
            try {
                const resultat = await this.verifierEtAlerter(ab.etablissementId);
                totalAlertes += resultat.totalAlertes;
                totalCritiques += resultat.alertesCritiques;
            } catch (error) {
                logger.error(
                    `[QuotaAlert] Erreur vérification quota — Établissement: ${ab.etablissementId}`,
                    error
                );
            }
        }

        logger.info(
            `[QuotaAlert] Vérification globale — ${abonnements.length} étab. vérifiés, ` +
            `${totalAlertes} alerte(s), ${totalCritiques} critique(s)`
        );

        return {
            totalEtabVerifies: abonnements.length,
            totalAlertes,
            totalCritiques,
        };
    }

    /**
     * Envoie une alerte si le cooldown est respecté.
     */
    private async envoyerAlerteSiNecessaire(
        alerte: AlerteQuota,
    ): Promise<void> {
        const cle = `${alerte.etablissementId}:${alerte.typeQuota}:${alerte.seuil}`;
        const dernierEnvoi = this.alertesEnvoyees.get(cle) || 0;
        const maintenant = Date.now();

        if (maintenant - dernierEnvoi < this.COOLDOWN_ALERTES) {
            return; // Cooldown actif
        }

        try {
            // Envoyer la notification via l'orchestrator
            const niveauLabel =
                alerte.seuil >= SEUILS_ALERTES.BLOCAGE ? 'CRITIQUE — Quota atteint' :
                alerte.seuil >= SEUILS_ALERTES.CRITIQUE ? 'CRITIQUE' :
                'ATTENTION';

            await this.orchestrator.envoyerAlerteQuota(
                [alerte.etablissementId],
                alerte.typeQuota,
                alerte.pourcentage,
                alerte.etablissementId,
            );

            this.alertesEnvoyees.set(cle, maintenant);

            logger.info(
                `[QuotaAlert] Alerte ${niveauLabel} envoyée — ` +
                `Établissement: ${alerte.etablissementId} — ` +
                `Quota: ${alerte.typeQuota} — ${alerte.pourcentage}%`
            );
        } catch (error) {
            logger.error(
                `[QuotaAlert] Erreur envoi alerte — ${alerte.etablissementId}/${alerte.typeQuota}`,
                error,
            );
        }
    }

    /**
     * Réinitialise les alertes d'un établissement (après upgrade de plan).
     */
    async reinitialiserAlertes(etablissementId: string): Promise<void> {
        // Nettoyer le cache
        for (const [cle] of this.alertesEnvoyees) {
            if (cle.startsWith(`${etablissementId}:`)) {
                this.alertesEnvoyees.delete(cle);
            }
        }

        logger.info(`[QuotaAlert] Alertes réinitialisées — Établissement: ${etablissementId}`);
    }

    /**
     * Récupère l'historique des alertes envoyées (pour debug/monitoring).
     */
    getAlertesRecentes(): Array<{ cle: string; timestamp: number }> {
        const result: Array<{ cle: string; timestamp: number }> = [];
        for (const [cle, timestamp] of this.alertesEnvoyees) {
            result.push({ cle, timestamp });
        }
        return result.sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);
    }
}

export default QuotaAlertService;
export const quotaAlertService = new QuotaAlertService();
