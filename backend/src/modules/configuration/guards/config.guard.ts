/**
 * ==================================
 * eLISAschool - Guard Configuration
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Middleware de vérification des permissions de configuration
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '@common/filters/error.filter';
import { ConfigPermission, hasConfigPermission } from './config-permissions';
import { auditService, AuditAction } from '@modules/auth';

/**
 * Crée un middleware qui vérifie les permissions de configuration
 */
export function requireConfigPermission(
    permission: ConfigPermission
): (req: Request, res: Response, next: NextFunction) => void {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.utilisateur) {
                throw new AppError('Non authentifié', 401, 'UNAUTHENTICATED');
            }

            const userRole = req.utilisateur.role;

            // Super admin bypass
            if (userRole === 'SUPER_ADMIN') {
                next();
                return;
            }

            // ADMIN bypass (cohérence frontend: ADMIN voit tout)
            if (userRole === 'ADMIN') {
                next();
                return;
            }

            // Vérification avec fallback: d'abord les permissions JWT dynamiques,
            // puis le mapping statique par rôle
            const userPermissions: string[] = (req.utilisateur as any).permissions || [];
            if (!hasConfigPermission(userRole, permission, userPermissions)) {
                await auditService.logAccessDenied(
                    req.utilisateur.id,
                    `Permission configuration requise: ${permission}`,
                    req
                );

                throw new AppError(
                    'Vous n\'avez pas les permissions nécessaires pour cette action',
                    403,
                    'INSUFFICIENT_CONFIG_PERMISSIONS'
                );
            }

            next();
        } catch (error) {
            next(error);
        }
    };
}

// Guards prédéfinis pour les actions courantes
export const canViewConfigApp = requireConfigPermission(ConfigPermission.CONFIG_APP_VIEW);
export const canEditConfigApp = requireConfigPermission(ConfigPermission.CONFIG_APP_EDIT);
export const canViewConfigModule = requireConfigPermission(ConfigPermission.CONFIG_MODULE_VIEW);
export const canEditConfigModule = requireConfigPermission(ConfigPermission.CONFIG_MODULE_EDIT);
export const canToggleModule = requireConfigPermission(ConfigPermission.CONFIG_MODULE_TOGGLE);
export const canViewParams = requireConfigPermission(ConfigPermission.CONFIG_PARAM_VIEW);
export const canCreateParams = requireConfigPermission(ConfigPermission.CONFIG_PARAM_CREATE);
export const canEditParams = requireConfigPermission(ConfigPermission.CONFIG_PARAM_EDIT);
export const canDeleteParams = requireConfigPermission(ConfigPermission.CONFIG_PARAM_DELETE);
export const canResetParams = requireConfigPermission(ConfigPermission.CONFIG_PARAM_RESET);
export const canViewHistory = requireConfigPermission(ConfigPermission.CONFIG_HISTORY_VIEW);
export const canRestoreHistory = requireConfigPermission(ConfigPermission.CONFIG_HISTORY_RESTORE);
export const canCreateBackup = requireConfigPermission(ConfigPermission.CONFIG_BACKUP_CREATE);
export const canRestoreBackup = requireConfigPermission(ConfigPermission.CONFIG_BACKUP_RESTORE);
export const canExportConfig = requireConfigPermission(ConfigPermission.CONFIG_EXPORT);
export const canImportConfig = requireConfigPermission(ConfigPermission.CONFIG_IMPORT);
export const canInvalidateCache = requireConfigPermission(ConfigPermission.CONFIG_CACHE_INVALIDATE);

export default {
    requireConfigPermission,
    canViewConfigApp,
    canEditConfigApp,
    canViewParams,
    canEditParams,
};
