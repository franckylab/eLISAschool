/**
 * ==================================
 * eLISAschool - Service Quotas
 * ==================================
 * 
 * Vérification et enforcement des quotas par établissement.
 * Alerte à 80%, blocage à 100%.
 * 
 * Phase 4.3 — Refonte SaaS
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { logger } from '@common/utils/logger.util';
import { QuotaUtilisation, AbonnementClient, StatutAbonnement } from '../entities';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '@common/filters/error.filter';
import { NotificationOrchestratorService } from '@modules/notifications/services/notification-orchestrator.service';

export class QuotaService {
    private quotaRepo: Repository<QuotaUtilisation>;
    private abonnementRepo: Repository<AbonnementClient>;
    private orchestrator: NotificationOrchestratorService;

    constructor(orchestrator?: NotificationOrchestratorService) {
        this.quotaRepo = AppDataSource.getRepository(QuotaUtilisation);
        this.abonnementRepo = AppDataSource.getRepository(AbonnementClient);
        this.orchestrator = orchestrator ?? new NotificationOrchestratorService();
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
        const quota = await this.quotaRepo.findOne({
            where: { etablissementId, typeQuota },
        });

        if (!quota) {
            // Pas de quota défini = pas de limite
            return { autorise: true, utilisation: 0, limite: 0, pourcentage: 0 };
        }

        if (quota.limiteMax === 0) {
            // Limite 0 = illimité
            return { autorise: true, utilisation: quota.utilisationActuelle, limite: 0, pourcentage: 0 };
        }

        const nouvelleUtilisation = quota.utilisationActuelle + consommation;
        const pourcentage = (nouvelleUtilisation / quota.limiteMax) * 100;

        return {
            autorise: !quota.bloquer || nouvelleUtilisation <= quota.limiteMax,
            utilisation: quota.utilisationActuelle,
            limite: quota.limiteMax,
            pourcentage: Math.round(pourcentage * 100) / 100,
        };
    }

    /**
     * Met à jour l'utilisation d'un quota.
     */
    async mettreAJourQuota(etablissementId: string, typeQuota: string, delta: number): Promise<void> {
        let quota = await this.quotaRepo.findOne({
            where: { etablissementId, typeQuota },
        });

        if (!quota) {
            quota = this.quotaRepo.create({
                etablissementId,
                typeQuota,
                utilisationActuelle: 0,
                limiteMax: 0,
            });
        }

        quota.utilisationActuelle = Math.max(0, quota.utilisationActuelle + delta);

        // Vérifier les seuils d'alerte
        if (quota.limiteMax > 0) {
            const pourcentage = (quota.utilisationActuelle / quota.limiteMax) * 100;

            if (pourcentage >= 80 && !quota.alerte80pourcent) {
                quota.alerte80pourcent = true;
                logger.warn(
                    `[Quotas] ⚠️ Alerte 80% — Établissement: ${etablissementId} ` +
                    `— Quota: ${typeQuota} — ${quota.utilisationActuelle}/${quota.limiteMax} (${pourcentage.toFixed(1)}%)`
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
                quota.bloquer = true;
            } else {
                quota.bloquer = false;
            }
        }

        await this.quotaRepo.save(quota);
    }

    /**
     * Synchronise les quotas d'un établissement avec son plan.
     * Appelé après un changement de plan.
     */
    async synchroniserQuotas(etablissementId: string): Promise<void> {
        const abonnement = await this.abonnementRepo.findOne({
            where: {
                etablissementId,
                statut: StatutAbonnement.ACTIF,
            },
            relations: ['plan'],
        });

        if (!abonnement?.plan) {
            return;
        }

        const plan = abonnement.plan;

        // Synchroniser les quotas principaux
        const quotasToSync = [
            { type: 'eleves', limite: plan.maxEleves },
            { type: 'utilisateurs', limite: plan.maxUtilisateurs },
            { type: 'classes', limite: plan.maxClasses },
            { type: 'stockage_go', limite: plan.stockageMaxGo },
            { type: 'sms_mensuel', limite: plan.smsInclus },
        ];

        for (const { type, limite } of quotasToSync) {
            let quota = await this.quotaRepo.findOne({
                where: { etablissementId, typeQuota: type },
            });

            if (!quota) {
                quota = this.quotaRepo.create({
                    etablissementId,
                    typeQuota: type,
                    utilisationActuelle: 0,
                    limiteMax: limite,
                });
            } else {
                quota.limiteMax = limite;
            }

            await this.quotaRepo.save(quota);
        }

        logger.info(`[Quotas] Synchronisés pour établissement ${etablissementId}`);
    }

    /**
     * Récupère l'état de tous les quotas d'un établissement.
     */
    async getQuotasEtablissement(etablissementId: string): Promise<QuotaUtilisation[]> {
        return this.quotaRepo.find({
            where: { etablissementId },
            order: { typeQuota: 'ASC' },
        });
    }
}

/**
 * Middleware requireQuota — Vérifie le quota avant une action.
 * 
 * @example
 * router.post('/eleves', authMiddleware, requireQuota('eleves', 1), createEleve);
 */
export function requireQuota(typeQuota: string, consommation: number = 1) {
    return async (req: Request, _res: Response, next: NextFunction) => {
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

            if (!result.autorise) {
                throw new AppError(
                    `Quota dépassé: ${typeQuota} (${result.utilisation}/${result.limite}). ` +
                    `Veuillez upgrader votre plan pour continuer.`,
                    403,
                    'QUOTA_EXCEEDED'
                );
            }

            // Ajouter les infos de quota dans la requête pour le controller
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
