/**
 * ==================================
 * eLISAschool - Guard de Permissions
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 * 
 * Vérification des permissions granulaires (RBAC)
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '@common/filters/error.filter';
import { Role, Permission, DEFAULT_ROLE_PERMISSIONS } from '@shared/enums/roles.enum';
import { auditService } from '../services/audit.service';
import { AuditAction } from '../entities/audit-log.entity';

/**
 * Vérifie si un utilisateur a une permission donnée
 */
export function hasPermission(role: Role, permission: Permission): boolean {
    const rolePermissions = DEFAULT_ROLE_PERMISSIONS[role];
    return rolePermissions?.includes(permission) || false;
}

/**
 * Vérifie si un utilisateur a au moins une des permissions requises
 */
export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
    return permissions.some(p => hasPermission(role, p));
}

/**
 * Vérifie si un utilisateur a toutes les permissions requises
 */
export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
    return permissions.every(p => hasPermission(role, p));
}

/**
 * Crée un middleware qui vérifie si l'utilisateur a les permissions requises
 * @param permissions - Liste des permissions requises (au moins une)
 * @param requireAll - Si true, toutes les permissions sont requises
 */
export function requirePermissions(
    permissions: Permission[],
    requireAll: boolean = false
): (req: Request, res: Response, next: NextFunction) => void {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            // Vérification de l'authentification
            if (!req.utilisateur) {
                throw new AppError('Non authentifié', 401, 'UNAUTHENTICATED');
            }

            const userRole = req.utilisateur.role as Role;

            // Super admin bypass
            if (userRole === Role.SUPER_ADMIN) {
                next();
                return;
            }

            // Vérification des permissions
            const hasAccess = requireAll
                ? hasAllPermissions(userRole, permissions)
                : hasAnyPermission(userRole, permissions);

            if (!hasAccess) {
                // Log l'accès refusé
                await auditService.logAccessDenied(
                    req.utilisateur.id,
                    `Permissions requises: ${permissions.join(', ')}`,
                    req
                );

                throw new AppError(
                    'Vous n\'avez pas les permissions nécessaires pour cette action',
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
 * Décorateur pour vérifier une permission unique
 */
export const requirePermission = (permission: Permission) =>
    requirePermissions([permission], false);

// Permissions prédéfinies courantes
export const canViewUsers = requirePermission(Permission.USERS_VIEW);
export const canManageUsers = requirePermissions([Permission.USERS_CREATE, Permission.USERS_EDIT, Permission.USERS_DELETE], false);
export const canViewNotes = requirePermission(Permission.NOTES_VIEW);
export const canManageNotes = requirePermissions([Permission.NOTES_CREATE, Permission.NOTES_EDIT], false);
export const canValidateNotes = requirePermission(Permission.NOTES_VALIDATE);
export const canManageConfig = requirePermission(Permission.CONFIG_EDIT);
export const canViewMonitoring = requirePermission(Permission.MONITORING_VIEW);
export const canManageCantine = requirePermission(Permission.CANTINE_MANAGE);
export const canManageTransport = requirePermission(Permission.TRANSPORT_MANAGE);
export const canBroadcast = requirePermission(Permission.MESSAGES_BROADCAST);
export const canApproveRequests = requirePermission(Permission.REQUETES_APPROVE);
export const canGenerateCards = requirePermission(Permission.CARTES_GENERATE);
export const canPrintDocuments = requirePermission(Permission.DOCUMENTS_PRINT);

export default {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    requirePermissions,
    requirePermission,
};
