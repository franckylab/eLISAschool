/**
 * ==================================
 * eLISAschool - Service Quotas (Refonte v3)
 * ==================================
 *
 * Vérification et enforcement des quotas par établissement.
 * Refonte v3 (migration 213) :
 *   - Stock d'usage unique : table usage_unifie (ex quotas_utilisation + usage_meters)
 *   - Quota effectif = plan.quotas[ressource] + Σ packs souscrits actifs
 *   - Suppression de synchroniserQuotas (colonnes dures → JSONB plan.quotas)
 * Alerte à 80%, blocage à 100%.
 *
 * Version: 3.0.0
 * Auteur: franck arlos chendjou
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { logger } from '@common/utils/logger.util';
import { UsageUnifie, SourceUsage } from '../entities/usage-unifie.entity';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '@common/filters/error.filter';
import { NotificationOrchestratorService } from '@modules/notifications/services/notification-orchestrator.service';
import { packQuotaService, QuotaEffectifResult } from './pack-quota.service';

export interface EtatQuota {
    ressource: string;
    utilisation: number;
    limite: number;
    quotaPlan: number;
    quotaPacks: number;
    pourcentage: number;
}

export class QuotaService {
    private usageRepo: Repository<UsageUnifie>;
    private orchestrator: NotificationOrchestratorService;

    constructor(orchestrator?: NotificationOrchestratorService) {
        this.usageRepo = AppDataSource.getRepository(UsageUnifie);
        this.orchestrator = orchestrator ?? new NotificationOrchestratorService();
    }

    /**
     * Quota effectif d'une ressource : plan.quotas + Σ packs actifs.
     * Retourne limite 0 = illimité.
     */
    async quotaEffectif(etablissementId: string, ressource: string): Promise<QuotaEffectifResult> {
        return packQuotaService.quotaEffectif(etablissementId, ressource);
    }

    /**
     * Vérifie si un établissement peut effectuer une action
     * qui consomme un quota (ex: créer un élève).
     */
    async verifierQuota(etablissementId: string, typeQuota: string, consommation: number = 1): Promise<{
        autorise: boolean;
        utilisation: number;
        limite: number;
        pourcentage: number;
    }> {
        const effectif = await this.quotaEffectif(etablissementId, typeQuota);

        if (effectif.quotaEffectif === 0) {
            // Limite 0 = illimité
            const usage = await this.getConsommation(etablissementId, typeQuota);
            return { autorise: true, utilisation: usage, limite: 0, pourcentage: 0 };
        }

        const utilisation = await this.getConsommation(etablissementId, typeQuota);
        const nouvelleUtilisation = utilisation + consommation;
        const pourcentage = (nouvelleUtilisation / effectif.quotaEffectif) * 100;

        return {
            autorise: nouvelleUtilisation <= effectif.quotaEffectif,
            utilisation,
            limite: effectif.quotaEffectif,
            pourcentage: Math.round(pourcentage * 100) / 100,
        };
    }

    /**
     * Met à jour l'utilisation d'un quota (delta positif ou négatif).
     * Les compteurs mensuels (ressources 'sms', 'export'…) utilisent la
     * période courante, les stocks structurels utilisent 'GLOBAL'.
     */
    async mettreAJourQuota(etablissementId: string, typeQuota: string, delta: number): Promise<void> {
        const periode = this.estCompteurPeriodique(typeQuota)
            ? new Date().toISOString().slice(0, 7)
            : 'GLOBAL';

        let usage = await this.usageRepo.findOne({
            where: { etablissementId, ressource: typeQuota, periode },
        });

        if (!usage) {
            usage = this.usageRepo.create({
                etablissementId,
                ressource: typeQuota,
                periode,
                consommation: 0,
                source: this.estCompteurPeriodique(typeQuota) ? SourceUsage.METER : SourceUsage.QUOTA,
            });
        }

        usage.consommation = Math.max(0, usage.consommation + delta);
        await this.usageRepo.save(usage);

        // Vérifier les seuils d'alerte sur le quota effectif
        const effectif = await this.quotaEffectif(etablissementId, typeQuota);
        if (effectif.quotaEffectif > 0) {
            const pourcentage = (usage.consommation / effectif.quotaEffectif) * 100;

            if (pourcentage >= 80 && pourcentage < 100) {
                logger.warn(
                    `[Quotas] ⚠️ Alerte 80% — Établissement: ${etablissementId} ` +
                    `— Quota: ${typeQuota} — ${usage.consommation}/${effectif.quotaEffectif} (${pourcentage.toFixed(1)}%)`
                );

                // Envoyer notification à l'admin de l'établissement (non-bloquant)
                try {
                    await this.orchestrator.envoyerAlerteQuota(
                        [etablissementId],
                        typeQuota,
                        Math.round(pourcentage),
                        etablissementId,
                    );
                } catch (notifError) {
                    logger.warn(
                        `[Quotas] Échec envoi notification quota (non bloquant) — ${etablissementId}/${typeQuota}`,
                        notifError
                    );
                }
            }

            if (pourcentage >= 100) {
                logger.warn(
                    `[Quotas] 🚫 Quota atteint — Établissement: ${etablissementId} ` +
                    `— ${typeQuota}: ${usage.consommation}/${effectif.quotaEffectif}`
                );
            }
        }
    }

    /**
     * Récupère l'état de tous les quotas d'un établissement :
     * consommation issue d'usage_unifie + limites effectives (plan + packs).
     */
    async getQuotasEtablissement(etablissementId: string): Promise<EtatQuota[]> {
        const usages = await this.usageRepo.find({
            where: { etablissementId },
            order: { ressource: 'ASC' },
        });

        const etats: EtatQuota[] = [];
        const dejaVus = new Set<string>();

        for (const usage of usages) {
            if (usage.periode !== 'GLOBAL' && usage.periode !== new Date().toISOString().slice(0, 7)) {
                continue; // Ignorer les périodes passées
            }
            dejaVus.add(usage.ressource);
            const effectif = await this.quotaEffectif(etablissementId, usage.ressource);
            etats.push({
                ressource: usage.ressource,
                utilisation: usage.consommation,
                limite: effectif.quotaEffectif,
                quotaPlan: effectif.quotaPlan,
                quotaPacks: effectif.quotaPacks,
                pourcentage: effectif.quotaEffectif > 0
                    ? Math.round((usage.consommation / effectif.quotaEffectif) * 10000) / 100
                    : 0,
            });
        }

        return etats;
    }

    /** Consommation courante d'une ressource (stock GLOBAL ou compteur du mois) */
    private async getConsommation(etablissementId: string, ressource: string): Promise<number> {
        const periode = this.estCompteurPeriodique(ressource)
            ? new Date().toISOString().slice(0, 7)
            : 'GLOBAL';
        const usage = await this.usageRepo.findOne({
            where: { etablissementId, ressource, periode },
        });
        return usage?.consommation ?? 0;
    }

    /** Compteurs remis à zéro chaque mois vs stocks structurels */
    private estCompteurPeriodique(ressource: string): boolean {
        return ['sms', 'export_pdf', 'exports'].includes(ressource);
    }
}

/**
 * Middleware requireQuota — Vérifie le quota avant une action.
 *
 * @example
 * router.post('/eleves', authMiddleware, requireQuota('eleves', 1), createEleve);
 */
export function requireQuota(typeQuota: string, consommation: number = 1) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const etablissementId = req.etablissementId || req.utilisateur?.etablissementId;

            if (!etablissementId) {
                next();
                return;
            }

            // SUPER_ADMIN n'est pas soumis aux quotas
            if (req.utilisateur?.role === 'SUPER_ADMIN') {
                next();
                return;
            }

            const result = await quotaService.verifierQuota(etablissementId, typeQuota, consommation);

            // Headers d'observabilité quota (I3 v3)
            res.setHeader('X-Quota-Resource', typeQuota);
            res.setHeader('X-Quota-Usage', String(result.utilisation));
            res.setHeader('X-Quota-Limit', String(result.limite));
            res.setHeader('X-Quota-Percentage', String(result.pourcentage));

            if (!result.autorise) {
                throw new AppError(
                    `Quota dépassé: ${typeQuota} (${result.utilisation}/${result.limite}). ` +
                    `Veuillez upgrader votre plan ou acheter un pack quota pour continuer.`,
                    429,
                    'QUOTA_EXCEEDED'
                );
            }

            // Injecter les infos quota dans la requête pour le controller
            (req as any).quotaInfo = result;

            next();
        } catch (error) {
            next(error);
        }
    };
}

export default QuotaService;

// Singleton — instance partagée (évite les instanciations multiples)
export const quotaService = new QuotaService();
