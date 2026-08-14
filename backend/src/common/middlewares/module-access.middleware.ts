/**
 * ==================================
 * eLISAschool - Middleware Module Access v4 (Entitlement unifié)
 * ==================================
 * Version: 4.0.0
 *
 * Refonte SaaS — Unification Modules (migration 200)
 *
 * Délègue entièrement à entitlementService (source unique de vérité).
 * Remplace l'ancienne logique configurationService + moduleResolutionService.
 *
 * Vérifie :
 *   1. Module BASE → bypass total
 *   2. Entitlement via cascade complète (plan → groupe → supplément → catalogue)
 *   3. Messages d'erreur adaptés selon la raison (402/403)
 *
 * @example
 * router.use('/api/transport', authMiddleware, requireModuleAccess('transport'), transportController);
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '@common/filters/error.filter';
import { entitlementService } from '@modules/billing/services/entitlement.service';
import { auditService } from '@modules/auth';
import { logger } from '@common/utils/logger.util';

/**
 * Middleware factory — vérifie l'accès à un module via entitlementService.
 * Wrapper de compatibilité autour de la source unique de vérité.
 */
export function requireModuleAccess(moduleNom: string) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            // SUPER_ADMIN → accès total
            if (req.utilisateur?.role === 'SUPER_ADMIN') {
                next();
                return;
            }

            const etablissementId = req.utilisateur?.etablissementId;

            if (!etablissementId) {
                // Pas d'établissement identifié → laisser passer (comme avant)
                next();
                return;
            }

            // Source unique de vérité : EntitlementService
            const entitlement = await entitlementService.check(etablissementId, moduleNom);

            // P1.2 — Dégradation gracieuse : mode lecture seule (J0–J15)
            // Accessible pour GET, bloqué pour POST/PUT/DELETE/PATCH
            if (entitlement.lectureSeule && req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
                throw new AppError(
                    `Mode lecture seule actif — les modifications sont temporairement désactivées. ` +
                    `Renouvelez votre abonnement pour retrouver l'accès complet.`,
                    403,
                    'DEGRADATION_LECTURE_SEULE',
                );
            }

            if (!entitlement.accessible) {
                await auditService.logAccessDenied(
                    req.utilisateur?.id,
                    `Accès refusé au module "${moduleNom}" — raison: ${entitlement.raison}`,
                    req
                );

                // Message et code HTTP adaptés selon la raison
                let message: string;
                let code: string;
                let httpStatus: number;

                switch (entitlement.raison) {
                    case 'ABONNEMENT_INACTIF':
                    case 'ABONNEMENT_EXPIRE':
                    case 'ABONNEMENT_SUSPENDU':
                        message = `Le module "${moduleNom}" nécessite un abonnement actif. ${entitlement.message || ''}`;
                        code = 'ABONNEMENT_REQUIS';
                        httpStatus = 402;
                        break;
                    case 'PLAN_INSUFFICIENT':
                        message = `Plan insuffisant pour accéder au module "${moduleNom}". ${entitlement.message || ''}`;
                        code = 'PLAN_INSUFFICIENT';
                        httpStatus = 403;
                        break;
                    case 'OVERRIDE_DESACTIVE':
                        message = `Le module "${moduleNom}" est désactivé au niveau du groupe. ${entitlement.message || ''}`;
                        code = 'MODULE_OVERRIDE';
                        httpStatus = 403;
                        break;
                    default:
                        message = `Le module "${moduleNom}" est désactivé. Contactez un administrateur.`;
                        code = 'MODULE_INACTIVE';
                        httpStatus = 403;
                }

                throw new AppError(message, httpStatus, code);
            }

            // Ajouter les infos module dans la requête
            (req as any).moduleInfo = {
                nom: moduleNom,
                source: entitlement.source,
                raison: entitlement.raison,
                planActuel: entitlement.planActuel,
            };

            logger.debug(
                `[ModuleAccess] Accès OK — Module: ${moduleNom} — ` +
                `Source: ${entitlement.source} — Établissement: ${etablissementId}`
            );

            next();
        } catch (error) {
            next(error);
        }
    };
}

export default requireModuleAccess;
