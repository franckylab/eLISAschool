/**
 * ==================================
 * eLISAschool - Hooks TanStack Query — Platform Permissions
 * ==================================
 * Version: 1.0.0
 *
 * Hooks pour la consultation et gestion des permissions plateforme.
 * Modèle C — Auth0 Internalisé (Dual-Plane)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// =============================================
// Types
// =============================================

export interface PlatformPermission {
    id: string;
    code: string;
    libelle: string;
    module: string;
    description: string | null;
    estSysteme: boolean;
    ordre: number;
}

export interface PermissionsMatrixData {
    permissions: Array<{
        code: string;
        libelle: string;
        module: string;
        description: string | null;
    }>;
    roles: Array<{
        role: string;
        permissions: string[];
        total: number;
    }>;
    modules: string[];
}

// =============================================
// Queries
// =============================================

export function useAllPlatformPermissions() {
    return useQuery({
        queryKey: ['platform-permissions-all'],
        queryFn: async () => {
            const { data } = await apiClient.get('/api/platform/permissions');
            return data.data as PlatformPermission[];
        },
    });
}

export function usePermissionsMatrix() {
    return useQuery({
        queryKey: ['platform-permissions-matrix-full'],
        queryFn: async () => {
            const { data } = await apiClient.get('/api/platform/permissions/matrix');
            return data.data as PermissionsMatrixData;
        },
    });
}

export function usePermissionsByModule() {
    return useQuery({
        queryKey: ['platform-permissions-modules'],
        queryFn: async () => {
            const { data } = await apiClient.get('/api/platform/permissions/modules');
            return data.data as Record<string, PlatformPermission[]>;
        },
    });
}

// =============================================
// Mutations
// =============================================

export function useUpdatePermissions() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ roleId, permissions }: { roleId: string; permissions: string[] }) => {
            const { data } = await apiClient.put(`/api/platform/roles/${roleId}/permissions`, { permissions });
            return data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['platform-permissions-matrix-full'] });
            queryClient.invalidateQueries({ queryKey: ['platform-permissions-all'] });
        },
    });
}
