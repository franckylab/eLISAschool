/**
 * ==================================
 * eLISAschool - Middleware Quota Enforcement
 * ==================================
 * Version: 2.0.0
 * 
 * Middleware de vérification des quotas avant création de ressources.
 * Alerte à 80%, blocage à 100% avec message upgrade.
 * 
 * Phase C.1 — Refonte SaaS v2
 * 
 * @example
 * router.post('/eleves', authMiddleware, requireQuotaMiddleware('eleves', 1), createEleve);
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '@common/filters/error.filter';
import { QuotaService } from '@modules/billing/services/quota.service';
import { logger } from '@common/utils/logger.util';

const quotaService = new QuotaService();

/**
 * Middleware factory — crée un middleware de vérification de quota.
 * 
 * @param resource — Type de ressource ('eleves', 'utilisateurs', 'classes', etc.)
 * @param count — Nombre de ressources à consommer (défaut: 1)
 */
export function requireQuotaMiddleware(resource: string, count: number = 1) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const etablissementId = req.etablissementId || req.utilisateur?.etablissementId;

            // Pas de contexte tenant → laisser passer
            if (!etablissementId) {
                next();
                return;
            }

            // SUPER_ADMIN exempté des quotas
            if (req.utilisateur?.role === 'SUPER_ADMIN') {
                next();
                return;
            }

            const result = await quotaService.verifierQuota(etablissementId, resource, count);

            // Ajouter les infos de quota dans la requête (pour headers de réponse)
            (req as any).quotaInfo = result;

            // Ajouter les headers de quota dans la réponse
            res.set({
                'X-Quota-Used': String(result.utilisation),
                'X-Quota-Limit': String(result.limite),
                'X-Quota-Percent': String(Math.round(result.pourcentage)),
            });

            if (!result.autorise) {
                logger.warn(
                    `[Quota] Blocage — Ressource: ${resource} — ` +
                    `Établissement: ${etablissementId} — ` +
                    `${result.utilisation}/${result.limite} (${result.pourcentage}%)`
                );

                throw new AppError(
                    `Quota "${resource}" dépassé (${result.utilisation}/${result.limite}). ` +
                    `Veuillez upgrader votre abonnement pour continuer.`,
                    429,
                    'QUOTA_EXCEEDED'
                );
            }

            // Alerte 80% — logger pour monitoring
            if (result.pourcentage >= 80 && result.pourcentage < 100) {
                logger.info(
                    `[Quota] Alerte 80% — Ressource: ${resource} — ` +
                    `Établissement: ${etablissementId} — ${result.pourcentage}%`
                );
            }

            next();
        } catch (error) {
            next(error);
        }
    };
}

export default requireQuotaMiddleware;
