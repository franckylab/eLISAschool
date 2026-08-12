/**
 * ==================================
 * eLISAschool - Hooks TanStack Query — Platform Users
 * ==================================
 * Version: 3.0.0 — Refactorisation plateforme
 * Auteur: franck arlos chendjou
 *
 * Hooks pour le CRUD utilisateurs plateforme (Control Plane).
 * Pattern aligné sur use-utilisateurs.ts (tenant).
 *
 * ADR-005 — Auth unifiée (source unique de vérité)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

// =============================================
// Query Keys
// =============================================

const PLATFORM_USERS_KEYS = {
    all: ['platform-users'] as const,
    listes: () => [...PLATFORM_USERS_KEYS.all, 'liste'] as const,
    liste: (filtres: PlatformUserFiltres) => [...PLATFORM_USERS_KEYS.listes(), filtres] as const,
    details: () => [...PLATFORM_USERS_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...PLATFORM_USERS_KEYS.details(), id] as const,
    kpis: () => [...PLATFORM_USERS_KEYS.all, 'kpis'] as const,
    audits: () => [...PLATFORM_USERS_KEYS.all, 'audit'] as const,
    audit: (id: string, page?: number) => [...PLATFORM_USERS_KEYS.audits(), id, page] as const,
};

// =============================================
// Types
// =============================================

export interface PlatformUser {
    id: string;
    email: string;
    prenom: string;
    nom: string;
    role: string;
    avatarUrl?: string | null;
    estActif: boolean;
    statut?: 'ACTIF' | 'INACTIF' | 'SUSPENDU' | 'ARCHIVE';
    mfaActive: boolean;
    deuxFacteursActif?: boolean;
    dernierAcces?: string | null;
    dernierAccesPlatforme?: string | null;
    createdAt: string;
    groupeEtablissementIds?: string[];
}

export interface PlatformUserFiltres {
    search?: string;
    role?: string;
    statut?: string;
    scope?: 'plateforme' | 'tenant' | 'tous';
    etablissementId?: string;
    mfaActive?: boolean;
}

export interface PlatformUserKpis {
    total: number;
    actifs: number;
    mfaActif: number;
    mfaActive?: number; // alias compat
    mfaPourcentage: number;
    parRole: Record<string, number>;
    sessionsActives?: number;
    parPlanGestion?: {
        plateforme: number;
        tenant: number;
    };
}

// =============================================
// Queries
// =============================================

/** Liste des utilisateurs plateforme */
export function usePlatformUsers(filters: PlatformUserFiltres = {}) {
    return useQuery({
        queryKey: PLATFORM_USERS_KEYS.liste(filters),
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters.search) params.set('search', filters.search);
            if (filters.role) params.set('role', filters.role);
            if (filters.statut) params.set('statut', filters.statut);
            if (filters.scope && filters.scope !== 'tous') params.set('scope', filters.scope);
            if (filters.etablissementId) params.set('etablissementId', filters.etablissementId);
            if (filters.mfaActive !== undefined) params.set('mfaActive', String(filters.mfaActive));
            const response = await apiClient.get<{ items: PlatformUser[]; total: number }>(`/api/platform/utilisateurs?${params}`);
            return response.data || { items: [], total: 0 };
        },
        staleTime: 2 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

/** KPIs utilisateurs plateforme */
export function usePlatformUserKpis() {
    return useQuery({
        queryKey: PLATFORM_USERS_KEYS.kpis(),
        queryFn: async () => {
            const response = await apiClient.get<PlatformUserKpis>('/api/platform/utilisateurs/kpis');
            return response.data as PlatformUserKpis;
        },
        staleTime: 2 * 60 * 1000,
    });
}

/** Détail d'un utilisateur plateforme */
export function usePlatformUserDetail(id: string) {
    return useQuery({
        queryKey: PLATFORM_USERS_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<PlatformUser>(`/api/platform/utilisateurs/${id}`);
            if (!response.data) throw new Error('Utilisateur introuvable');
            return response.data;
        },
        enabled: !!id,
        staleTime: 2 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

// =============================================
// Mutations
// =============================================

/** Créer un compte plateforme */
export function useCreatePlatformUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (dto: { email: string; prenom: string; nom: string; role: string }) => {
            const response = await apiClient.post<PlatformUser>('/api/platform/utilisateurs', dto);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PLATFORM_USERS_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: PLATFORM_USERS_KEYS.kpis() });
            toast.success('Compte plateforme créé avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Erreur lors de la création');
        },
    });
}

/** Modifier un utilisateur (rôle, etc.) */
export function useUpdatePlatformUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...dto }: { id: string; role?: string; estActif?: boolean }) => {
            const response = await apiClient.patch<PlatformUser>(`/api/platform/utilisateurs/${id}`, dto);
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: PLATFORM_USERS_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: PLATFORM_USERS_KEYS.detail(variables.id) });
            toast.success('Utilisateur modifié avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Erreur lors de la modification');
        },
    });
}

/** Suspendre un compte plateforme */
export function useSuspendrePlatformUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await apiClient.post<PlatformUser>(`/api/platform/utilisateurs/${id}/suspendre`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PLATFORM_USERS_KEYS.listes() });
            toast.success('Compte suspendu');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Erreur lors de la suspension');
        },
    });
}

/** Réactiver un compte plateforme */
export function useReactiverPlatformUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await apiClient.post<PlatformUser>(`/api/platform/utilisateurs/${id}/reactiver`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PLATFORM_USERS_KEYS.listes() });
            toast.success('Compte réactivé');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Erreur lors de la réactivation');
        },
    });
}

/** Reset MFA d'un utilisateur plateforme */
export function useResetMfaPlatformUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await apiClient.post<PlatformUser>(`/api/platform/utilisateurs/${id}/reset-mfa`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PLATFORM_USERS_KEYS.details() });
            queryClient.invalidateQueries({ queryKey: PLATFORM_USERS_KEYS.listes() });
            toast.success('MFA réinitialisé');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Erreur lors du reset MFA');
        },
    });
}

/** Révoquer toutes les sessions d'un utilisateur plateforme */
export function useRevoquerSessionsPlatformUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await apiClient.post<PlatformUser>(`/api/platform/utilisateurs/${id}/revoquer-sessions`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PLATFORM_USERS_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: PLATFORM_USERS_KEYS.kpis() });
            toast.success('Sessions révoquées');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Erreur lors de la révocation');
        },
    });
}

/** Forcer la réinitialisation du mot de passe */
export function useForcePasswordResetPlatformUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await apiClient.post<PlatformUser>(`/api/platform/utilisateurs/${id}/force-reset-password`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PLATFORM_USERS_KEYS.listes() });
            toast.success('Réinitialisation du mot de passe envoyée');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Erreur lors de la réinitialisation');
        },
    });
}

/** Toggle statut utilisateur (actif/inactif) */
export function useToggleStatutPlatformUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, estActif }: { id: string; estActif: boolean }) => {
            const endpoint = estActif ? 'suspendre' : 'reactiver';
            const response = await apiClient.post<PlatformUser>(`/api/platform/utilisateurs/${id}/${endpoint}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PLATFORM_USERS_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: PLATFORM_USERS_KEYS.kpis() });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Erreur lors du changement de statut');
        },
    });
}

// =============================================
// Archive / Désarchiver
// =============================================

/** Archiver un utilisateur (statut ARCHIVE) */
export function useArchiverPlatformUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await apiClient.post(`/api/platform/utilisateurs/${id}/archiver`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PLATFORM_USERS_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: PLATFORM_USERS_KEYS.kpis() });
            toast.success('Utilisateur archivé');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Erreur lors de l\'archivage');
        },
    });
}

/** Désarchiver un utilisateur (restore depuis ARCHIVE) */
export function useDesarchiverPlatformUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, statut }: { id: string; statut?: string }) => {
            const response = await apiClient.post(`/api/platform/utilisateurs/${id}/desarchiver`, { statut });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PLATFORM_USERS_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: PLATFORM_USERS_KEYS.kpis() });
            toast.success('Utilisateur désarchivé');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Erreur lors du désarchivage');
        },
    });
}

// =============================================
// Audit trail utilisateur
// =============================================

export interface AuditLogEntry {
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

export interface AuditPaginated {
    items: AuditLogEntry[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

/** Audit trail d'un utilisateur (paginé) */
export function usePlatformUserAudit(userId: string, page = 1, module?: string) {
    return useQuery({
        queryKey: PLATFORM_USERS_KEYS.audit(userId, page),
        queryFn: async () => {
            const params = new URLSearchParams({ page: String(page), limit: '50' });
            if (module) params.set('module', module);
            const response = await apiClient.get<AuditPaginated>(`/api/platform/utilisateurs/${userId}/audit?${params}`);
            return response.data;
        },
        enabled: !!userId,
        staleTime: 30 * 1000,
    });
}

// =============================================
// Export CSV
// =============================================

/** Export CSV des utilisateurs */
export function useExportCsvPlatformUsers() {
    return useMutation({
        mutationFn: async (filtres: PlatformUserFiltres = {}) => {
            const params = new URLSearchParams();
            if (filtres.search) params.set('search', filtres.search);
            if (filtres.role) params.set('role', filtres.role);
            if (filtres.statut) params.set('statut', filtres.statut);
            if (filtres.scope && filtres.scope !== 'tous') params.set('scope', filtres.scope);
            const response = await fetch(`/api/platform/utilisateurs/export/csv?${params}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            if (!response.ok) throw new Error('Erreur export');
            return response.blob();
        },
        onSuccess: (blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `utilisateurs-export-${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success('Export CSV téléchargé');
        },
        onError: () => {
            toast.error('Erreur lors de l\'export CSV');
        },
    });
}
