/**
 * ==================================
 * eLISAschool - Hooks TanStack Query — Platform Roles
 * ==================================
 * Version: 1.0.0
 *
 * Hooks pour la gestion des rôles et permissions plateforme.
 * Modèle C — Auth0 Internalisé (Dual-Plane)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// =============================================
// Types
// =============================================

export interface PlatformRole {
    id: string;
    nom: string;
    code?: string;
    description: string | null;
    estSysteme: boolean;
    permissions: string[];
    scopeType?: 'global' | 'groupe';
    createdAt: string;
    updatedAt: string;
}

export interface PlatformPermission {
    id: string;
    code: string;
    libelle: string;
    module: string;
    description: string | null;
    estSysteme: boolean;
    ordre: number;
}

// =============================================
// Roles CRUD
// =============================================

export function usePlatformRoles() {
    return useQuery({
        queryKey: ['platform-roles'],
        queryFn: async () => {
            const { data } = await apiClient.get('/api/platform/roles');
            return data.data as PlatformRole[];
        },
    });
}

export function useCreateRole() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (dto: { nom: string; description?: string; scopeType?: string }) => {
            const { data } = await apiClient.post('/api/platform/roles', dto);
            return data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['platform-roles'] });
        },
    });
}

export function useDeleteRole() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { data } = await apiClient.delete(`/api/platform/roles/${id}`);
            return data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['platform-roles'] });
        },
    });
}

// =============================================
// Permissions (utilisés par la matrice)
// =============================================

export function usePlatformPermissions() {
    return useQuery({
        queryKey: ['platform-permissions'],
        queryFn: async () => {
            const { data } = await apiClient.get('/api/platform/permissions');
            return data.data as PlatformPermission[];
        },
    });
}

export function usePlatformPermissionsMatrix() {
    return useQuery({
        queryKey: ['platform-permissions-matrix'],
        queryFn: async () => {
            const { data } = await apiClient.get('/api/platform/permissions/matrix');
            return data.data;
        },
    });
}

export function useUpdateRolePermissions() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ roleId, permissions }: { roleId: string; permissions: string[] }) => {
            const { data } = await apiClient.patch(`/api/platform/roles/${roleId}/permissions`, { permissions });
            return data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['platform-permissions-matrix'] });
        },
    });
}
