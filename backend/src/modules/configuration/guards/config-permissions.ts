/**
 * ==================================
 * eLISAschool - Permissions Configuration
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Définition des permissions granulaires pour le système de configuration
 */

import { Permission } from '@shared/enums/roles.enum';

/**
 * Permissions spécifiques au module Configuration
 * 
 * [RBAC-2] v5.1 — Séparation plateforme/établissement
 * Les permissions EDIT/TOGGLE/BACKUP de portée GLOBALE sont retirées
 * du rôle ADMIN (client). Elles nécessitent les permissions plateforme
 * dédiées (config:plateforme:*) réservées au SUPER_ADMIN.
 * Rapport audit SaaS 2026-08-07
 */
export enum ConfigPermission {
    // Configuration App (lecture — disponible pour tous les admins)
    CONFIG_APP_VIEW = 'config:app:view',
    CONFIG_APP_EDIT = 'config:app:edit',

    // Configuration Modules
    CONFIG_MODULE_VIEW = 'config:module:view',
    CONFIG_MODULE_EDIT = 'config:module:edit',
    CONFIG_MODULE_TOGGLE = 'config:module:toggle',

    // Paramètres
    CONFIG_PARAM_VIEW = 'config:param:view',
    CONFIG_PARAM_CREATE = 'config:param:create',
    CONFIG_PARAM_EDIT = 'config:param:edit',
    CONFIG_PARAM_DELETE = 'config:param:delete',
    CONFIG_PARAM_RESET = 'config:param:reset',

    // Historique
    CONFIG_HISTORY_VIEW = 'config:history:view',
    CONFIG_HISTORY_RESTORE = 'config:history:restore',

    // Sauvegarde/Export
    CONFIG_BACKUP_CREATE = 'config:backup:create',
    CONFIG_BACKUP_RESTORE = 'config:backup:restore',
    CONFIG_EXPORT = 'config:export',
    CONFIG_IMPORT = 'config:import',

    // Cache
    CONFIG_CACHE_INVALIDATE = 'config:cache:invalidate',

    // [RBAC-2] Permissions PLATEFORME — SUPER_ADMIN uniquement
    CONFIG_PLATEFORME_APP_EDIT = 'config:plateforme:app:edit',
    CONFIG_PLATEFORME_MODULE_TOGGLE = 'config:plateforme:module:toggle',
    CONFIG_PLATEFORME_BACKUP_CREATE = 'config:plateforme:backup:create',
    CONFIG_PLATEFORME_BACKUP_RESTORE = 'config:plateforme:backup:restore',
}

/**
 * Mapping des rôles vers les permissions de configuration
 */
export const CONFIG_ROLE_PERMISSIONS: Record<string, ConfigPermission[]> = {
    SUPER_ADMIN: Object.values(ConfigPermission), // Toutes les permissions

    // [RBAC-2] ADMIN (client) — permissions ÉTABLISSEMENT uniquement
    // Les opérations PLATEFORME (app edit global, module toggle global,
    // backup/restore) sont retirées. Elles nécessitent SUPER_ADMIN.
    ADMIN: [
        ConfigPermission.CONFIG_APP_VIEW,
        ConfigPermission.CONFIG_MODULE_VIEW,
        ConfigPermission.CONFIG_MODULE_EDIT,
        ConfigPermission.CONFIG_PARAM_VIEW,
        ConfigPermission.CONFIG_PARAM_EDIT,
        ConfigPermission.CONFIG_HISTORY_VIEW,
        ConfigPermission.CONFIG_EXPORT,
        ConfigPermission.CONFIG_CACHE_INVALIDATE,
    ],

    CHEF_ETABLISSEMENT: [
        ConfigPermission.CONFIG_APP_VIEW,
        ConfigPermission.CONFIG_MODULE_VIEW,
        ConfigPermission.CONFIG_PARAM_VIEW,
        ConfigPermission.CONFIG_HISTORY_VIEW,
    ],

    // Direction d'établissement
    PROVISEUR: [
        ConfigPermission.CONFIG_APP_VIEW,
        ConfigPermission.CONFIG_MODULE_VIEW,
        ConfigPermission.CONFIG_PARAM_VIEW,
        ConfigPermission.CONFIG_HISTORY_VIEW,
    ],
    PRINCIPAL: [
        ConfigPermission.CONFIG_APP_VIEW,
        ConfigPermission.CONFIG_MODULE_VIEW,
        ConfigPermission.CONFIG_PARAM_VIEW,
        ConfigPermission.CONFIG_HISTORY_VIEW,
    ],
    DIRECTEUR: [
        ConfigPermission.CONFIG_APP_VIEW,
        ConfigPermission.CONFIG_MODULE_VIEW,
        ConfigPermission.CONFIG_PARAM_VIEW,
        ConfigPermission.CONFIG_HISTORY_VIEW,
    ],
    CENSEUR: [
        ConfigPermission.CONFIG_APP_VIEW,
        ConfigPermission.CONFIG_MODULE_VIEW,
        ConfigPermission.CONFIG_PARAM_VIEW,
    ],
    DIRECTEUR_ADJOINT: [
        ConfigPermission.CONFIG_APP_VIEW,
        ConfigPermission.CONFIG_MODULE_VIEW,
        ConfigPermission.CONFIG_PARAM_VIEW,
        ConfigPermission.CONFIG_HISTORY_VIEW,
    ],
    RESPONSABLE_PEDAGOGIQUE: [
        ConfigPermission.CONFIG_MODULE_VIEW,
        ConfigPermission.CONFIG_PARAM_VIEW,
    ],

    // Personnel technique (accès limité)
    TECHNICIEN_INFO: [
        ConfigPermission.CONFIG_MODULE_VIEW,
        ConfigPermission.CONFIG_PARAM_VIEW,
    ],

    // Autres rôles : aucune permission de configuration par défaut
};

/**
 * Vérifie si un rôle ou un ensemble de permissions contient une permission de configuration.
 * Vérifie d'abord les permissions dynamiques (JWT/DB), puis le mapping statique par rôle.
 */
export function hasConfigPermission(
    role: string,
    permission: ConfigPermission,
    userPermissions?: string[]
): boolean {
    // Vérifier les permissions dynamiques (assignées via RBAC en DB)
    if (userPermissions && userPermissions.includes(permission)) {
        return true;
    }

    // Fallback au mapping statique par rôle
    const rolePermissions = CONFIG_ROLE_PERMISSIONS[role];
    if (!rolePermissions) return false;
    return rolePermissions.includes(permission);
}

/**
 * Récupère toutes les permissions de configuration pour un rôle
 */
export function getConfigPermissions(role: string): ConfigPermission[] {
    return CONFIG_ROLE_PERMISSIONS[role] || [];
}

export default { ConfigPermission, CONFIG_ROLE_PERMISSIONS, hasConfigPermission, getConfigPermissions };
