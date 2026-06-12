/**
 * ==================================
 * eLISAschool - Hooks Rôles et Permissions
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * Hooks TanStack Query pour la gestion des rôles et permissions
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import type { 
    Role, 
    CreerRoleDto, 
    ModifierRoleDto, 
    RoleFiltres,
    Permission,
    PermissionGroupe,
    AttribuerPermissionDto 
} from '../types/utilisateur.types';

const ROLES_KEYS = {
    all: ['roles'] as const,
    listes: () => [...ROLES_KEYS.all, 'liste'] as const,
    liste: (filtres: RoleFiltres) => [...ROLES_KEYS.listes(), filtres] as const,
    details: () => [...ROLES_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...ROLES_KEYS.details(), id] as const,
    permissions: () => [...ROLES_KEYS.all, 'permissions'] as const,
    permissionsByModule: (module: string) => [...ROLES_KEYS.permissions(), module] as const,
};

// ==================== HOOKS RÔLES ====================

export function useRoles(filtres: RoleFiltres = {}) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ROLES_KEYS.liste(filtres),
        queryFn: async () => {
            const params: Record<string, string | number | boolean | undefined> = {};
            if (filtres.estSysteme !== undefined) params.estSysteme = filtres.estSysteme;
            if (filtres.recherche) params.recherche = filtres.recherche;

            const response = await apiClient.get<Role[]>('/api/rbac/roles', params);
            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
}

export function useRole(id: string) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ROLES_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<Role>(`/api/rbac/roles/${id}`);
            if (!response.data) {
                throw new Error('Rôle non trouvé');
            }
            return response.data;
        },
        enabled: !!id && isAuthenticated,
        staleTime: 10 * 60 * 1000,
    });
}

export function useTousRoles() {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: [...ROLES_KEYS.all, 'tous'],
        queryFn: async () => {
            const response = await apiClient.get<Role[]>('/api/rbac/roles/tous');
            if (!response.data) {
                throw new Error('Aucun rôle disponible');
            }
            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 15 * 60 * 1000, // 15 minutes
    });
}

export function useCreerRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerRoleDto) => {
            const response = await apiClient.post<Role>('/api/rbac/roles', dto);
            if (!response.data) {
                throw new Error('Erreur lors de la création');
            }
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ROLES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: [...ROLES_KEYS.all, 'tous'] });
            queryClient.invalidateQueries({ queryKey: [...ROLES_KEYS.all, 'stats'] });
            toast.success('Rôle créé avec succès');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Erreur lors de la création du rôle');
        },
    });
}

export function useModifierRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...dto }: ModifierRoleDto) => {
            const response = await apiClient.patch<Role>(`/api/rbac/roles/${id}`, dto);
            if (!response.data) {
                throw new Error('Erreur lors de la modification');
            }
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ROLES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: [...ROLES_KEYS.all, 'tous'] });
            queryClient.invalidateQueries({ queryKey: ROLES_KEYS.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: [...ROLES_KEYS.all, 'stats'] });
            toast.success('Rôle modifié avec succès');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Erreur lors de la modification');
        },
    });
}

export function useSupprimerRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/rbac/roles/${id}`);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ROLES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: [...ROLES_KEYS.all, 'tous'] });
            toast.success('Rôle supprimé avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la suppression');
        },
    });
}

// ==================== HOOKS PERMISSIONS ====================

export function usePermissions() {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ROLES_KEYS.permissions(),
        queryFn: async () => {
            const response = await apiClient.get<Permission[]>('/api/rbac/permissions');
            if (!response.data) {
                throw new Error('Permissions non disponibles');
            }
            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 30 * 60 * 1000, // 30 minutes - permissions changent rarement
    });
}

export function usePermissionsByModule(module: string) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ROLES_KEYS.permissionsByModule(module),
        queryFn: async () => {
            const response = await apiClient.get<PermissionGroupe>(
                `/api/rbac/permissions/module/${module}`
            );
            if (!response.data) {
                throw new Error('Permissions du module non disponibles');
            }
            return response.data;
        },
        enabled: !!module && isAuthenticated,
        staleTime: 30 * 60 * 1000,
    });
}

export function useToutesPermissions() {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: [...ROLES_KEYS.permissions(), 'groupes'],
        queryFn: async () => {
            const response = await apiClient.get<Record<string, Permission[]>>(
                '/api/rbac/permissions/modules'  // ← Retourne Record<string, Permission[]>
            );
            if (!response.data) {
                throw new Error('Permissions non disponibles');
            }
            
            // Transformer l'objet Record<string, Permission[]> en tableau PermissionGroupe[]
            const permissionsGroupes: PermissionGroupe[] = Object.entries(response.data).map(([module, permissions]) => ({
                module,
                libelle: module.charAt(0).toUpperCase() + module.slice(1).replace(/[-_]/g, ' '),
                permissions: permissions.map(p => ({
                    id: p.id,
                    code: p.code,
                    libelle: p.libelle,
                    module: p.module,
                    description: p.description,
                    action: p.action,
                })),
            }));
            
            return permissionsGroupes;
        },
        enabled: isAuthenticated,
        staleTime: 30 * 60 * 1000,
    });
}

export function useAttribuerPermissions() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ roleId, permissions }: AttribuerPermissionDto) => {
            const response = await apiClient.post<Role>(
                `/api/rbac/roles/${roleId}/permissions`,
                { permissions }
            );
            if (!response.data) {
                throw new Error('Erreur lors de l\'attribution des permissions');
            }
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ROLES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: ROLES_KEYS.detail(variables.roleId) });
            queryClient.invalidateQueries({ queryKey: [...ROLES_KEYS.all, 'tous'] });
            toast.success('Permissions attribuées avec succès');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Erreur lors de l\'attribution des permissions');
        },
    });
}

// ==================== HOOKS STATISTIQUES ====================

export function useStatsRoles() {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: [...ROLES_KEYS.all, 'stats'],
        queryFn: async () => {
            const response = await apiClient.get<{
                totalRoles: number;
                rolesSysteme: number;
                rolesPersonnalises: number;
                rolesParModule: Array<{ module: string; count: number }>;
            }>('/api/rbac/roles/stats');
            
            if (!response.data) {
                throw new Error('Statistiques non disponibles');
            }
            
            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

export function useUsersByRole(roleId: string) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: [...ROLES_KEYS.detail(roleId), 'users'],
        queryFn: async () => {
            const response = await apiClient.get<Array<{
                id: string;
                email: string;
                nom: string;
                prenom: string;
                telephone?: string;
                statut?: string;
            }>>(`/api/rbac/roles/${roleId}/users`);
            
            if (!response.data) {
                throw new Error('Utilisateurs non disponibles');
            }
            
            return response.data;
        },
        enabled: !!roleId && isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}
