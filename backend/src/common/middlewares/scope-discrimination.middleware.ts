/**
 * ==================================
 * eLISAschool - Middleware Scope Discrimination
 * ==================================
 * Version: 1.0.0
 *
 * Discrimination automatique Control Plane / Data Plane
 * selon le préfixe de route et le scope du JWT.
 *
 * - Routes /api/platform/* → requiert jwt.platform !== null
 * - Autres routes → requiert jwt.tenant !== null
 *
 * Modèle C — Auth0 Internalisé (Dual-Plane)
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '@common/filters/error.filter';
import { definePlatformAbility } from '@shared/casl/platform-abilities';
import { defineAbility } from '@shared/casl/abilities';
import { RolePlateforme } from '@shared/enums/roles.enum';
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
 * Middleware de discrimination de scope.
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
        // Control Plane — vérifier que l'utilisateur a un scope plateforme
        const rolePlateforme = utilisateur.roles?.find(
            (r: string) => Object.values(RolePlateforme).includes(r as RolePlateforme),
        );

        if (!rolePlateforme && utilisateur.role !== 'SUPER_ADMIN') {
            logger.warn(`Scope mismatch: ${utilisateur.email} tente d'accéder à une route plateforme sans rôle`);
            throw new AppError(
                'Accès plateforme refusé — rôle plateforme requis',
                403,
                'SCOPE_MISMATCH',
            );
        }

        req.scope = 'platform';
        req.ability = definePlatformAbility({
            identiteId: utilisateur.id,
            role: (utilisateur.role === 'SUPER_ADMIN'
                ? RolePlateforme.SUPER_ADMIN
                : rolePlateforme) as RolePlateforme,
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
