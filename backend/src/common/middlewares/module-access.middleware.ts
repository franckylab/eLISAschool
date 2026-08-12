/**
 * ==================================
 * eLISAschool - Middleware Module Access v3 (Premium Gating — catalogue unifié)
 * ==================================
 * Version: 3.0.0
 *
 * Remplace les sets hardcodés MODULES_GRATUITS/MODULES_PREMIUM par le
 * catalogue unique `modules_catalogue` (Lot A — Refonte SaaS v7).
 *
 * Vérifie :
 *   1. Activation du module (ParametreSysteme → MODULE_REGISTRY fallback)
 *   2. Si module facturable (catalogue : PREMIUM/ADDON) :
 *      a. Abonnement actif requis → 402 SUBSCRIPTION_REQUIRED
 *      b. Module souscrit (plan.modulesInclus ou AbonnementModule) → 403 MODULE_PREMIUM_REQUIS
 *
 * @example
 * router.use('/api/transport', authMiddleware, requireModuleAccess('transport'), transportController);
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '@common/filters/error.filter';
import { configurationService } from '@modules/configuration/services/configuration.service';
import { auditService } from '@modules/auth';
import { logger } from '@common/utils/logger.util';
import { AppDataSource } from '@database/data-source';
import { AbonnementClient, StatutAbonnement } from '@modules/billing/entities/abonnement-client.entity';
import { moduleResolutionService } from '@modules/billing/services/module-resolution.service';

/**
 * Middleware factory — vérifie l'accès à un module (catalogue + facturation).
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

            // 1. Vérifier que le module est activé (paramètre → registre fallback)
            const estActif = await configurationService.isModuleActive(moduleNom, etablissementId);

            if (!estActif) {
                await auditService.logAccessDenied(
                    req.utilisateur?.id,
                    `Tentative d'accès au module désactivé: ${moduleNom}`,
                    req
                );

                throw new AppError(
                    `Le module "${moduleNom}" est désactivé. Contactez un administrateur.`,
                    403,
                    'MODULE_INACTIVE'
                );
            }

            // 2. Gating facturation via le catalogue unifié
            const estFacturable = await moduleResolutionService.isModuleFacturable(moduleNom);

            if (estFacturable) {
                const abonnementRepo = AppDataSource.getRepository(AbonnementClient);
                const abonnement = await abonnementRepo.findOne({
                    where: {
                        etablissementId,
                        statut: StatutAbonnement.ACTIF,
                    },
                    relations: ['plan'],
                });

                if (!abonnement) {
                    throw new AppError(
                        `Le module "${moduleNom}" nécessite un abonnement actif. ` +
                        `Veuillez souscrire à un plan pour y accéder.`,
                        402,
                        'SUBSCRIPTION_REQUIRED'
                    );
                }

                const souscrit = etablissementId
                    ? await moduleResolutionService.isModuleSouscrit(etablissementId, moduleNom)
                    : false;

                if (!souscrit) {
                    throw new AppError(
                        `Le module "${moduleNom}" n'est pas inclus dans votre plan. ` +
                        `Souscrivez-le en supplément pour y accéder.`,
                        403,
                        'MODULE_PREMIUM_REQUIS'
                    );
                }

                logger.info(
                    `[ModuleAccess] Accès premium — Module: ${moduleNom} — ` +
                    `Établissement: ${etablissementId} — Plan: ${abonnement.plan?.nom || 'N/A'}`
                );
            }

            // Ajouter les infos module dans la requête
            (req as any).moduleInfo = {
                nom: moduleNom,
                isPremium: estFacturable,
            };

            next();
        } catch (error) {
            next(error);
        }
    };
}

export default requireModuleAccess;