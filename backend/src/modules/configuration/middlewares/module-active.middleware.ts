/**
 * ==================================
 * eLISAschool - Middleware Module Actif
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * Middleware de vérification qu'un module est activé et accessible
 * (entitlement + abonnement) avant d'accéder à ses endpoints.
 * 
 * Refonte SaaS — Unification Modules (migration 200)
 * Utilise EntitlementService comme source unique de vérité.
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '@common/filters/error.filter';
import { entitlementService } from '@modules/billing/services/entitlement.service';
import { auditService } from '@modules/auth';

/**
 * Middleware qui vérifie si un module est activé et accessible
 * @param moduleNom Nom du module à vérifier
 */
export function requireModuleActive(moduleNom: string) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const etablissementId = req.utilisateur?.etablissementId;

            if (!etablissementId) {
                // Pas d'établissement → vérifier quand même via le service
                next();
                return;
            }

            // Source unique de vérité : EntitlementService
            const estAccessible = await entitlementService.isAccessible(etablissementId, moduleNom);

            if (!estAccessible) {
                // Récupérer la raison pour un message précis
                const entitlement = await entitlementService.check(etablissementId, moduleNom);

                await auditService.logAccessDenied(
                    req.utilisateur?.id,
                    `Accès refusé au module "${moduleNom}" — raison: ${entitlement.raison}`,
                    req
                );

                // Message adapté selon la raison
                let message: string;
                let code: string;
                switch (entitlement.raison) {
                    case 'ABONNEMENT_INACTIF':
                    case 'ABONNEMENT_EXPIRE':
                    case 'ABONNEMENT_SUSPENDU':
                        message = `Le module "${moduleNom}" nécessite un abonnement actif. ${entitlement.message || ''}`;
                        code = 'ABONNEMENT_REQUIS';
                        break;
                    case 'PLAN_INSUFFICIENT':
                        message = `Plan insuffisant pour accéder au module "${moduleNom}". ${entitlement.message || ''}`;
                        code = 'PLAN_INSUFFICIENT';
                        break;
                    default:
                        message = `Le module "${moduleNom}" est désactivé. Contactez un administrateur.`;
                        code = 'MODULE_INACTIVE';
                }

                throw new AppError(message, 403, code);
            }

            next();
        } catch (error) {
            next(error);
        }
    };
}

export default { requireModuleActive };
