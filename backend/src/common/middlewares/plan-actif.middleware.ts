/**
 * ==================================
 * eLISAschool - Middleware requirePlanActif (Refonte v3)
 * ==================================
 * Version: 3.0.0
 * Auteur: franck arlos chendjou
 *
 * Invariant plan-centrique v3 : aucun accès aux routes métier sans
 * abonnement actif (ACTIF ou ESSAI en cours). Les modules critiques
 * (auth, utilisateurs, configuration, notifications) sont exemptés par
 * le moteur via modules_catalogue.estCritique, pas ici.
 *
 * @example
 * app.use('/api/notes', authMiddleware, requirePlanActif(), notesController);
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '@common/filters/error.filter';
import { entitlementService } from '@modules/billing/services/entitlement.service';
import { logger } from '@common/utils/logger.util';

/**
 * Middleware factory — exige un plan d'abonnement actif pour le tenant.
 * @param exemptPaths Préfixes de chemin exemptés (ex: routes de souscription)
 */
export function requirePlanActif(exemptPaths: string[] = []) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            // SUPER_ADMIN → accès total (plane plateforme)
            if (req.utilisateur?.role === 'SUPER_ADMIN') {
                next();
                return;
            }

            const etablissementId = req.utilisateur?.etablissementId;
            if (!etablissementId) {
                // Pas d'établissement identifié → laisser passer (auth gère le reste)
                next();
                return;
            }

            // Chemins exemptés (souscription, facturation, profil…)
            if (exemptPaths.some((prefix) => req.path.startsWith(prefix))) {
                next();
                return;
            }

            const planActif = await entitlementService.hasPlanActif(etablissementId);
            if (!planActif) {
                logger.warn(`[PlanActif] Accès refusé — aucun plan actif (tenant ${etablissementId}, path ${req.path})`);
                throw new AppError(
                    'Un plan d\'abonnement actif est requis pour accéder à eLISAschool. Souscrivez un plan depuis le marché.',
                    402,
                    'AUCUN_PLAN_ACTIF',
                );
            }

            // Header de statut cache (observabilité)
            res.setHeader('X-Cache-Status', entitlementService.lastCacheStatus);
            next();
        } catch (error) {
            next(error);
        }
    };
}

export default requirePlanActif;
