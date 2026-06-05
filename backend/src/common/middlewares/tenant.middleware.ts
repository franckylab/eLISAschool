/**
 * ==================================
 * eLISAschool - Middleware Multi-Tenancy
 * ==================================
 * Version: 1.0.0
 * 
 * Filtre automatiquement les requêtes par établissement.
 * Lit l'etablissementId depuis le JWT (req.utilisateur) et
 * l'attache à la requête pour que les services puissent l'utiliser.
 * 
 * Les SUPER_ADMIN peuvent accéder à tous les établissements.
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { Role } from '@modules/auth/entities';

/**
 * Middleware multi-tenancy : attache l'etablissementId à la requête
 * 
 * Comportement :
 * - SUPER_ADMIN : accès à tous les établissements (etablissementId optionnel dans le query)
 * - ADMIN/CHEF_ETABLISSEMENT : utilise l'etablissementId du JWT
 * - Autres rôles : utilise l'etablissementId du JWT (obligatoire)
 */
export function tenantMiddleware(req: Request, _res: Response, next: NextFunction): void {
    try {
        if (!req.utilisateur) {
            // Pas d'authentification → pas de filtrage
            next();
            return;
        }

        const userRole = req.utilisateur.role as Role;
        const userEtablissementId = req.utilisateur.etablissementId;

        // SUPER_ADMIN peut accéder à tous les établissements
        if (userRole === Role.SUPER_ADMIN) {
            // L'admin peut spécifier un établissement via query param
            const queryEtablissementId = req.query.etablissementId as string | undefined;
            req.etablissementId = queryEtablissementId || undefined;
            next();
            return;
        }

        // Pour les autres rôles, l'etablissementId du JWT est obligatoire
        if (!userEtablissementId) {
            throw new AppError(
                'Aucun établissement associé à votre compte',
                403,
                'NO_ETABLISSEMENT'
            );
        }

        req.etablissementId = userEtablissementId;
        next();
    } catch (error) {
        next(error);
    }
}

/**
 * Middleware optionnel : attache l'etablissementId sans erreur si absent
 */
export function optionalTenantMiddleware(req: Request, _res: Response, next: NextFunction): void {
    if (req.utilisateur?.etablissementId) {
        req.etablissementId = req.utilisateur.etablissementId;
    }
    next();
}

export default tenantMiddleware;
