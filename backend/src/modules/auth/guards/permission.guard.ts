/**
 * ==================================
 * eLISAschool - Guard de Permissions
 * ==================================
 * Version: 2.0.0
 * Auteur: xAI Éducation
 * 
 * Vérification des permissions granulaires (RBAC)
 * Supporte le nouveau système dynamique avec fallback vers l'ancien système
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '@common/filters/error.filter';
import { Role as RoleEnum, Permission, DEFAULT_ROLE_PERMISSIONS } from '@shared/enums/roles.enum';
import { auditService } from '../services/audit.service';
import { AuditAction } from '../entities/audit-log.entity';

/**
 * Vérifie si un utilisateur a une permission donnée
 * Utilise les permissions du JWT (nouveau système) avec fallback vers l'ancien système
 */
export function hasPermission(req: Request, permission: Permission): boolean {
    const utilisateur = req.utilisateur;
    if (!utilisateur) return false;

    // Mode 1 : Nouveau système - permissions dans le JWT
    if (utilisateur.permissions && Array.isArray(utilisateur.permissions)) {
        return utilisateur.permissions.includes(permission);
    }

    // Mode 2 : Fallback - Ancien système statique
    const rolePermissions = DEFAULT_ROLE_PERMISSIONS[utilisateur.role as RoleEnum];
    return rolePermissions?.includes(permission) || false;
}

/**
 * Vérifie si un utilisateur a au moins une des permissions requises
 */
export function hasAnyPermission(req: Request, permissions: Permission[]): boolean {
    return permissions.some(p => hasPermission(req, p));
}

/**
 * Vérifie si un utilisateur a toutes les permissions requises
 */
export function hasAllPermissions(req: Request, permissions: Permission[]): boolean {
    return permissions.every(p => hasPermission(req, p));
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

            // Super admin bypass (vérifie le rôle dans le JWT)
            const userRole = req.utilisateur.role;
            const userRoles = req.utilisateur.roles || [userRole];
            if (userRoles.includes('SUPER_ADMIN')) {
                next();
                return;
            }

            // Vérification des permissions (utilise le nouveau système avec fallback)
            const hasAccess = requireAll
                ? hasAllPermissions(req, permissions)
                : hasAnyPermission(req, permissions);

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
