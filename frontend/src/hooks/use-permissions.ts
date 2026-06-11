/**
 * ==================================
 * eLISAschool - Hook de Permissions RBAC
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Hook pour vérifier les permissions de l'utilisateur connecté
 */

import { useMemo } from 'react';
import { useAuthStore } from '@/stores/auth.store';

interface UsePermissionsReturn {
    hasPermission: (permission: string) => boolean;
    hasAnyPermission: (permissions: string[]) => boolean;
    hasAllPermissions: (permissions: string[]) => boolean;
    isRole: (role: string) => boolean;
    isAdmin: boolean;
    isSuperAdmin: boolean;
    permissions: string[];
    role: string | null;
}

export function usePermissions(): UsePermissionsReturn {
    const { utilisateur } = useAuthStore();

    const role = useMemo(() => {
        return utilisateur?.role || null;
    }, [utilisateur?.role]);

    const isSuperAdmin = role === 'SUPER_ADMIN';

    const permissions = useMemo(() => {
        // SUPER_ADMIN a TOUTES les permissions (sécurité frontend)
        if (isSuperAdmin) {
            return ['*']; // Wildcard pour indiquer toutes les permissions
        }
        return utilisateur?.permissions || [];
    }, [utilisateur?.permissions, isSuperAdmin]);

    const hasPermission = useMemo(() => {
        return (permission: string) => {
            // SUPER_ADMIN a toutes les permissions (wildcard *)
            if (permissions.includes('*')) {
                return true;
            }
            return permissions.includes(permission);
        };
    }, [permissions]);

    const hasAnyPermission = useMemo(() => {
        return (permissionsList: string[]) => {
            // SUPER_ADMIN a toutes les permissions
            if (permissions.includes('*')) {
                return true;
            }
            return permissionsList.some((p) => permissions.includes(p));
        };
    }, [permissions]);

    const hasAllPermissions = useMemo(() => {
        return (permissionsList: string[]) => {
            // SUPER_ADMIN a toutes les permissions
            if (permissions.includes('*')) {
                return true;
            }
            return permissionsList.every((p) => permissions.includes(p));
        };
    }, [permissions]);

    const isRole = useMemo(() => {
        return (roleToCheck: string) => {
            return role === roleToCheck;
        };
    }, [role]);

    return {
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        isRole,
        isAdmin: role === 'ADMIN',
        isSuperAdmin,
        permissions,
        role,
    };
}
