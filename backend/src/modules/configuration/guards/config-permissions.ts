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
 */
export enum ConfigPermission {
    // Configuration App
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
}

/**
 * Mapping des rôles vers les permissions de configuration
 */
export const CONFIG_ROLE_PERMISSIONS: Record<string, ConfigPermission[]> = {
    SUPER_ADMIN: Object.values(ConfigPermission), // Toutes les permissions

    ADMIN: [
        ConfigPermission.CONFIG_APP_VIEW,
        ConfigPermission.CONFIG_APP_EDIT,
        ConfigPermission.CONFIG_MODULE_VIEW,
        ConfigPermission.CONFIG_MODULE_EDIT,
        ConfigPermission.CONFIG_MODULE_TOGGLE,
        ConfigPermission.CONFIG_PARAM_VIEW,
        ConfigPermission.CONFIG_PARAM_EDIT,
        ConfigPermission.CONFIG_HISTORY_VIEW,
        ConfigPermission.CONFIG_BACKUP_CREATE,
        ConfigPermission.CONFIG_EXPORT,
        ConfigPermission.CONFIG_CACHE_INVALIDATE,
    ],

    CHEF_ETABLISSEMENT: [
        ConfigPermission.CONFIG_APP_VIEW,
        ConfigPermission.CONFIG_MODULE_VIEW,
        ConfigPermission.CONFIG_PARAM_VIEW,
        ConfigPermission.CONFIG_HISTORY_VIEW,
    ],

    // Autres rôles : aucune permission de configuration
};

/**
 * Vérifie si un rôle a une permission de configuration
 */
export function hasConfigPermission(role: string, permission: ConfigPermission): boolean {
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
