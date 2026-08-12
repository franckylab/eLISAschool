/**
 * ==================================
 * eLISAschool - Middleware Scope Discrimination (ADR-005 v11)
 * ==================================
 * Version: 2.0.0 — ADR-005 (v11)
 *
 * Discrimination automatique Control Plane / Data Plane
 * selon le préfixe de route et le scope du JWT.
 *
 * ADR-005 : Source unique de vérité. Plus de definePlatformAbility.
 * Utilise defineAbility() unifié pour les deux contextes.
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '@common/filters/error.filter';
import { defineAbility } from '@shared/casl/abilities';
import { isRolePlateforme } from '@shared/enums/roles.enum';
import { logger } from '@common/utils/logger.util';

/**
 * Étend l'interface Request pour inclure le scope et l'ability CASL.
 */
declare global {
    namespace Express {
        interface Request {
            scope?: 'platform' | 'tenant';
            ability?: any;
        }
    }
}

/**
 * Middleware de discrimination de scope (ADR-005 — unifié).
 * À placer APRÈS authMiddleware et AVANT les contrôleurs.
 */
export function scopeDiscriminationMiddleware(
    req: Request,
    _res: Response,
    next: NextFunction,
): void {
    const isPlatformRoute = req.path.startsWith('/api/platform/')
        || req.originalUrl.startsWith('/api/platform/');

    const utilisateur = (req as any).utilisateur;

    if (!utilisateur) {
        throw new AppError('Authentification requise', 401, 'MISSING_AUTH');
    }

    if (isPlatformRoute) {
        // Control Plane — vérifier que l'utilisateur a un rôle plateforme
        const estPlateforme = isRolePlateforme(utilisateur.role);

        if (!estPlateforme && utilisateur.role !== 'SUPER_ADMIN') {
            logger.warn(`Scope mismatch: ${utilisateur.email} tente d'accéder à une route plateforme sans rôle`);
            throw new AppError(
                'Accès plateforme refusé — rôle plateforme requis',
                403,
                'SCOPE_MISMATCH',
            );
        }

        req.scope = 'platform';
        req.ability = defineAbility({
            id: utilisateur.id,
            role: utilisateur.role,
            etablissementId: utilisateur.etablissementId,
            permissions: utilisateur.permissions,
        });
    } else {
        // Data Plane — scope tenant
        req.scope = 'tenant';
        req.ability = defineAbility({
            id: utilisateur.id,
            role: utilisateur.role,
            etablissementId: utilisateur.etablissementId,
            permissions: utilisateur.permissions,
            etablissements: utilisateur.etablissements,
        });
    }

    next();
}

export default scopeDiscriminationMiddleware;
