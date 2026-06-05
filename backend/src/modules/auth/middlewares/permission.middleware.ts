/**
 * ==================================
 * eLISAschool - Middleware de Permission Unifié
 * ==================================
 * Version: 2.0.0
 * Auteur: xAI Éducation
 * 
 * Ce middleware combine l'ancien système (enum Role) et le nouveau système (permissions)
 * pour une transition fluide et sans rupture.
 * 
 * Utilisation:
 *   - requirePermission('cantine:menus:create')
 *   - requireAnyPermission(['notes:view', 'bulletins:view'])
 *   - requireAllPermissions(['notes:create', 'notes:bulk:create'])
 */

import { Request, Response, NextFunction } from 'express';
import { permissionResolverService } from '../services/permission-resolver.service';
import { AppError } from '@common/filters/error.filter';

/**
 * Middleware pour exiger UNE permission spécifique
 * 
 * @example
 * router.post('/menus', requirePermission('cantine:menus:create'), handler);
 */
export function requirePermission(permission: string) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Vérifier si l'utilisateur est authentifié
            if (!req.utilisateur || !req.utilisateur.id) {
                throw new AppError('Non authentifié', 401, 'UNAUTHORIZED');
            }

            // Résoudre les permissions de l'utilisateur (avec cache)
            const userPermissions = await permissionResolverService.resolvePermissions(
                req.utilisateur.id
            );

            // Vérifier si la permission est présente
            const hasPermission = userPermissions.has(permission);

            if (!hasPermission) {
                throw new AppError(
                    `Permission requise: ${permission}`,
                    403,
                    'INSUFFICIENT_PERMISSIONS'
                );
            }

            next();
        } catch (error) {
            next(error);
        }
    };
}

/**
 * Middleware pour exiger AU MOINS UNE des permissions (OR logique)
 * 
 * @example
 * router.get('/bulletins', requireAnyPermission(['bulletins:view', 'bulletins:edit']), handler);
 */
export function requireAnyPermission(permissions: string[]) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.utilisateur || !req.utilisateur.id) {
                throw new AppError('Non authentifié', 401, 'UNAUTHORIZED');
            }

            const userPermissions = await permissionResolverService.resolvePermissions(
                req.utilisateur.id
            );

            // Vérifier si l'utilisateur a AU MOINS UNE des permissions
            const hasAny = permissions.some(p => userPermissions.has(p));

            if (!hasAny) {
                throw new AppError(
                    `Au moins une permission requise: ${permissions.join(', ')}`,
                    403,
                    'INSUFFICIENT_PERMISSIONS'
                );
            }

            next();
        } catch (error) {
            next(error);
        }
    };
}

/**
 * Middleware pour exiger TOUTES les permissions (AND logique)
 * 
 * @example
 * router.post('/notes/bulk', requireAllPermissions(['notes:create', 'notes:bulk:create']), handler);
 */
export function requireAllPermissions(permissions: string[]) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.utilisateur || !req.utilisateur.id) {
                throw new AppError('Non authentifié', 401, 'UNAUTHORIZED');
            }

            const userPermissions = await permissionResolverService.resolvePermissions(
                req.utilisateur.id
            );

            // Vérifier si l'utilisateur a TOUTES les permissions
            const hasAll = permissions.every(p => userPermissions.has(p));

            if (!hasAll) {
                const missing = permissions.filter(p => !userPermissions.has(p));
                throw new AppError(
                    `Permissions manquantes: ${missing.join(', ')}`,
                    403,
                    'INSUFFICIENT_PERMISSIONS'
                );
            }

            next();
        } catch (error) {
            next(error);
        }
    };
}

/**
 * Middleware pour vérifier une permission dans un service (non-middleware)
 * 
 * @example
 * await checkPermission(utilisateurId, 'cantine:menus:create');
 */
export async function checkPermission(
    utilisateurId: string,
    permission: string
): Promise<boolean> {
    const userPermissions = await permissionResolverService.resolvePermissions(
        utilisateurId
    );
    return userPermissions.has(permission);
}

/**
 * Helper pour créer des guards conditionnels basés sur le contexte
 * 
 * @example
 * router.post('/bulletins/:id/publier',
 *     requirePermissionWithContext('bulletins:publier', (req) => req.params.id),
 *     handler
 * );
 */
export function requirePermissionWithContext(
    permission: string,
    contextExtractor: (req: Request) => string
) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.utilisateur || !req.utilisateur.id) {
                throw new AppError('Non authentifié', 401, 'UNAUTHORIZED');
            }

            // Extraire le contexte (ex: ID de l'établissement)
            const context = contextExtractor(req);

            // Vérifier la permission avec contexte
            const hasPermission = await permissionResolverService.hasPermission(
                req.utilisateur.id,
                permission
            );

            if (!hasPermission) {
                throw new AppError(
                    `Permission requise: ${permission} dans le contexte ${context}`,
                    403,
                    'INSUFFICIENT_PERMISSIONS'
                );
            }

            next();
        } catch (error) {
            next(error);
        }
    };
}

// ==================================
// EXPORTS
// ==================================

export default {
    requirePermission,
    requireAnyPermission,
    requireAllPermissions,
    checkPermission,
    requirePermissionWithContext,
};
