/**
 * ==================================
 * eLISAschool - Hooks TanStack Query — Platform Roles
 * ==================================
 * Version: 3.0.0 — Refactorisation plateforme
 * Auteur: franck arlos chendjou
 *
 * Hooks pour la gestion des rôles plateforme (Control Plane).
 * Pattern aligné sur use-roles-permissions.ts (tenant).
 *
 * ADR-005 — Auth unifiée (source unique de vérité)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

// =============================================
// Query Keys
// =============================================

const PLATFORM_ROLES_KEYS = {
    all: ['platform-roles'] as const,
    listes: () => [...PLATFORM_ROLES_KEYS.all, 'liste'] as const,
    liste: (filtres: PlatformRoleFiltres) => [...PLATFORM_ROLES_KEYS.listes(), filtres] as const,
    details: () => [...PLATFORM_ROLES_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...PLATFORM_ROLES_KEYS.details(), id] as const,
    stats: () => [...PLATFORM_ROLES_KEYS.all, 'stats'] as const,
    audits: () => [...PLATFORM_ROLES_KEYS.all, 'audit'] as const,
    audit: (id: string, page?: number) => [...PLATFORM_ROLES_KEYS.audits(), id, page] as const,
    comparaison: () => [...PLATFORM_ROLES_KEYS.all, 'comparaison'] as const,
};

// =============================================
// Types
// =============================================

export interface PlatformRole {
    id: string;
    nom: string;
    code?: string;
    libelle?: string;
    description: string | null;
    estSysteme: boolean;
    scope?: 'plateforme' | 'tenant';
    permissions: string[];
    nbUtilisateurs?: number;
    scopeType?: 'global' | 'groupe';
    etablissementId?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface PlatformRoleFiltres {
    recherche?: string;
    estSysteme?: boolean;
    scope?: 'plateforme' | 'tenant' | 'tous';
}

export interface PlatformRoleStats {
    totalRoles: number;
    rolesSysteme: number;
    rolesPersonnalises: number;
    rolesPlateforme?: number;
    rolesTenant?: number;
}

// =============================================
// Queries
// =============================================

/** Liste des rôles (tous contextes ou filtrés) */
export function usePlatformRoles(filtres: PlatformRoleFiltres = {}) {
    return useQuery({
        queryKey: PLATFORM_ROLES_KEYS.liste(filtres),
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filtres.scope && filtres.scope !== 'tous') params.set('scope', filtres.scope);

            const response = await apiClient.get<PlatformRole[]>(`/api/platform/roles${params.toString() ? `?${params}` : ''}`);
            return response.data || [];
        },
        staleTime: 10 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

/** Détail d'un rôle */
export function usePlatformRoleDetail(id: string) {
    return useQuery({
        queryKey: PLATFORM_ROLES_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<PlatformRole>(`/api/platform/roles/${id}`);
            if (!response.data) throw new Error('Rôle introuvable');
            return response.data;
        },
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

/** Permissions détaillées d'un rôle */
export function usePlatformRolePermissions(id: string) {
    return useQuery({
        queryKey: [...PLATFORM_ROLES_KEYS.detail(id), 'permissions'],
        queryFn: async () => {
            const response = await apiClient.get<{ roleId: string; nom: string; permissions: string[] }>(`/api/platform/roles/${id}/permissions`);
            // L'API retourne { roleId, nom, permissions: string[] }
            return response.data?.permissions || [];
        },
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    });
}

/** Utilisateurs ayant ce rôle */
export function usePlatformRoleUsers(roleId: string) {
    return useQuery({
        queryKey: [...PLATFORM_ROLES_KEYS.detail(roleId), 'users'],
        queryFn: async () => {
            const response = await apiClient.get<{
                roleId: string;
                nomRole: string;
                total: number;
                utilisateurs: Array<{
                    id: string;
                    email: string;
                    pseudonyme: string | null;
                    prenom: string | null;
                    nom: string | null;
                    role: string;
                    statut: string;
                    estActif: boolean;
                    estPlateforme: boolean;
                    deuxFacteursActif: boolean;
                    derniereConnexion: string | null;
                }>;
            }>(`/api/platform/roles/${roleId}/users`);
            return response.data;
        },
        enabled: !!roleId,
        staleTime: 5 * 60 * 1000,
    });
}

/** Stats rôles (total, système, personnalisés) */
export function useStatsRolesPlateforme() {
    return useQuery({
        queryKey: PLATFORM_ROLES_KEYS.stats(),
        queryFn: async () => {
            const response = await apiClient.get<PlatformRole[]>('/api/platform/roles');
            const roles = response.data || [];
            return {
                totalRoles: roles.length,
                rolesSysteme: roles.filter(r => r.estSysteme).length,
                rolesPersonnalises: roles.filter(r => !r.estSysteme).length,
                rolesPlateforme: roles.filter(r => r.scope === 'plateforme').length,
                rolesTenant: roles.filter(r => r.scope === 'tenant' || !r.scope).length,
            } as PlatformRoleStats;
        },
        staleTime: 5 * 60 * 1000,
        placeholderData: { totalRoles: 0, rolesSysteme: 0, rolesPersonnalises: 0, rolesPlateforme: 0, rolesTenant: 0 },
    });
}

// =============================================
// Mutations
// =============================================

/** Créer un rôle personnalisé */
export function useCreatePlatformRole() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (dto: { nom: string; description?: string; scopeType?: string }) => {
            const response = await apiClient.post<PlatformRole>('/api/platform/roles', dto);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PLATFORM_ROLES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: PLATFORM_ROLES_KEYS.stats() });
            toast.success('Rôle créé avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Erreur lors de la création du rôle');
        },
    });
}

/** Modifier un rôle (permissions, nom, description) */
export function useModifierRolePlateforme() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...dto }: { id: string; nom?: string; description?: string; permissions?: string[] }) => {
            const response = await apiClient.patch<PlatformRole>(`/api/platform/roles/${id}`, dto);
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: PLATFORM_ROLES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: PLATFORM_ROLES_KEYS.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: PLATFORM_ROLES_KEYS.stats() });
            toast.success('Rôle modifié avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Erreur lors de la modification');
        },
    });
}

/** Supprimer un rôle personnalisé */
export function useSupprimerRolePlateforme() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/platform/roles/${id}`);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PLATFORM_ROLES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: PLATFORM_ROLES_KEYS.stats() });
            toast.success('Rôle supprimé avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
        },
    });
}

// =============================================
// Matrice permissions (toutes les permissions disponibles)
// =============================================

export interface MatriceModule {
    module: string;
    label: string;
    permissions: string[];
}

export interface MatricePermissions {
    modules: MatriceModule[];
    totalPermissions: number;
}

/** Récupère la matrice complète des permissions (toutes les permissions en base) */
export function useMatricePermissions() {
    return useQuery({
        queryKey: ['platform-roles', 'matrice'],
        queryFn: async () => {
            const response = await apiClient.get<MatricePermissions>('/api/platform/roles/matrice');
            return response.data;
        },
        staleTime: 30 * 60 * 1000, // 30 min — la matrice change rarement
    });
}

// =============================================
// Audit trail rôle
// =============================================

export interface RoleAuditLogEntry {
    id: string;
    action: string;
    module: string;
    cible: string;
    cibleId: string;
    description: string;
    severity: string;
    anciennesValeurs: any;
    nouvellesValeurs: any;
    estEchec: boolean;
    createdAt: string;
    utilisateurId: string;
}

export interface RoleAuditPaginated {
    items: RoleAuditLogEntry[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

/** Audit trail d'un rôle (paginé) */
export function usePlatformRoleAudit(roleId: string, page = 1) {
    return useQuery({
        queryKey: PLATFORM_ROLES_KEYS.audit(roleId, page),
        queryFn: async () => {
            const params = new URLSearchParams({ page: String(page), limit: '50' });
            const response = await apiClient.get<RoleAuditPaginated>(`/api/platform/roles/${roleId}/audit?${params}`);
            return response.data;
        },
        enabled: !!roleId,
        staleTime: 30 * 1000,
    });
}

// =============================================
// Duplication de rôle
// =============================================

/** Dupliquer un rôle avec ses permissions */
export function useDupliquerRolePlateforme() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, nom }: { id: string; nom?: string }) => {
            const response = await apiClient.post<PlatformRole>(`/api/platform/roles/${id}/dupliquer`, { nom });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PLATFORM_ROLES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: PLATFORM_ROLES_KEYS.stats() });
            toast.success('Rôle dupliqué avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Erreur lors de la duplication');
        },
    });
}

// =============================================
// Comparaison permissions multi-rôles
// =============================================

export interface ComparaisonPermission {
    permission: string;
    module: string;
    parRole: Record<string, boolean>;
}

export interface ComparaisonModule {
    module: string;
    permissions: ComparaisonPermission[];
    total: number;
}

export interface ComparaisonResult {
    roles: Array<{ id: string; nom: string; code: string; nbPermissions: number }>;
    modules: ComparaisonModule[];
    totalPermissions: number;
}

/** Comparer les permissions de 2 à 5 rôles */
export function useComparerPermissions() {
    return useMutation({
        mutationFn: async (roleIds: string[]) => {
            const response = await apiClient.post<ComparaisonResult>('/api/platform/roles/comparer', { roleIds });
            return response.data;
        },
    });
}

// =============================================
// Legacy exports (compatibilité)
// =============================================

export { useCreatePlatformRole as useCreateRole };
export { useSupprimerRolePlateforme as useDeleteRole };
export { useModifierRolePlateforme as useUpdatePlatformRole };
export { useSupprimerRolePlateforme as useDeletePlatformRole };
