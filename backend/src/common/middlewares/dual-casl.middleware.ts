/**
 * ==================================
 * eLISAschool - Dual CASL Middleware (ADR-005 v11)
 * ==================================
 * ADR-005 : Source unique de vérité.
 *
 * Résout le bon ability CASL selon le contexte de la route :
 * - /api/platform/* → defineAbility (rôles plateforme via permissions unifiées)
 * - /api/* (tenant) → defineAbility (permissions tenant)
 *
 * Attache req.ability et req.contexteType à la requête.
 */

import { Request, Response, NextFunction } from 'express';
import { defineAbility, type AppAbility } from '@shared/casl/abilities';
import { logger } from '@common/utils/logger.util';

/**
 * Extension de l'interface Request pour le dual CASL.
 */
declare global {
    namespace Express {
        interface Request {
            ability?: AppAbility;
            contexteType?: 'PLATEFORME' | 'TENANT';
            platformRole?: string | null;
        }
    }
}

/**
 * Middleware Dual CASL (ADR-005 — unifié).
 *
 * ADR-005 : Plus de definePlatformAbility. Utilise defineAbility() pour les deux
 * contextes. Les permissions plateforme sont stockées dans la table permissions
 * unifiée (même schéma que les permissions tenant).
 */
export async function dualCaslMiddleware(
    req: Request,
    _res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        if (!req.utilisateur) {
            next();
            return;
        }

        const isPlatformRoute = req.path.startsWith('/api/platform/')
            || req.originalUrl.startsWith('/api/platform/');

        if (isPlatformRoute) {
            // CONTROL PLANE — defineAbility avec contexte plateforme
            req.ability = defineAbility({
                id: req.utilisateur.id,
                role: req.utilisateur.role,
                etablissementId: req.utilisateur.etablissementId,
                permissions: req.utilisateur.permissions || [],
            });
            req.contexteType = 'PLATEFORME';
            req.platformRole = req.utilisateur.role || null;

            logger.debug(
                `[DualCASL] Platform → role=${req.utilisateur.role}, path=${req.path}`,
            );
        } else {
            // DATA PLANE — defineAbility (tenant)
            req.ability = defineAbility({
                id: req.utilisateur.id,
                role: req.utilisateur.role,
                etablissementId: req.utilisateur.etablissementId,
                permissions: req.utilisateur.permissions || [],
                etablissements: req.utilisateur.etablissements,
            });
            req.contexteType = 'TENANT';
            req.platformRole = null;

            logger.debug(
                `[DualCASL] Tenant → role=${req.utilisateur.role}, perms=${permissions.length}, path=${req.path}`,
            );
        }

        next();
    } catch (error) {
        logger.error('[DualCASL] Erreur résolution abilities CASL', { error });
        next(error);
    }
}

export default dualCaslMiddleware;

// =============================================
// Guards granulaires plateforme
// =============================================

/**
 * Guard : exige un rôle plateforme (ADR-005 : via req.platformRole).
 */
export function requirePlatformAccess() {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.platformRole) {
            res.status(403).json({
                success: false,
                error: {
                    code: 'PLATFORM_ACCESS_DENIED',
                    message: 'Accès plateforme requis',
                },
            });
            return;
        }
        next();
    };
}

/**
 * Guard : exige une permission CASL spécifique.
 * Utilise req.ability (résolu par dualCaslMiddleware).
 */
export function requirePlatformCasl(action: string, subject: string) {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.ability) {
            res.status(403).json({
                success: false,
                error: {
                    code: 'PLATFORM_ACCESS_DENIED',
                    message: 'Ability CASL non résolue',
                },
            });
            return;
        }

        if (req.ability.can(action as any, subject as any)) {
            next();
            return;
        }

        res.status(403).json({
            success: false,
            error: {
                code: 'PLATFORM_PERMISSION_DENIED',
                message: `Permission refusée : ${action} ${subject} (rôle: ${req.platformRole || 'aucun'})`,
            },
        });
    };
}
