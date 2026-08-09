/**
 * ==================================
 * eLISAschool - Hooks TanStack Query — Platform Users
 * ==================================
 * Version: 1.0.0
 *
 * Hooks pour le CRUD utilisateurs plateforme (Control Plane).
 * Modèle C — Auth0 Internalisé (Dual-Plane)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// =============================================
// Types
// =============================================

export interface PlatformUser {
    id: string;
    identiteId: string;
    email: string;
    prenom: string;
    nom: string;
    rolePlateforme: string;
    avatarUrl?: string | null;
    estActif: boolean;
    mfaActive: boolean;
    dernierAcces?: string | null;
    createdAt: string;
}

export interface PlatformUserKpis {
    total: number;
    actifs: number;
    mfaActive: number;
    parRole: Record<string, number>;
    sessionsActives: number;
}

// =============================================
// Queries
// =============================================

export function usePlatformUsers(filters?: { role?: string; statut?: string; search?: string }) {
    return useQuery({
        queryKey: ['platform-users', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters?.search) params.set('search', filters.search);
            if (filters?.role) params.set('role', filters.role);
            if (filters?.statut) params.set('statut', filters.statut);
            const { data } = await apiClient.get(`/api/platform/utilisateurs?${params}`);
            return data.data;
        },
    });
}

export function usePlatformUserKpis() {
    return useQuery({
        queryKey: ['platform-users-kpis'],
        queryFn: async () => {
            const { data } = await apiClient.get('/api/platform/utilisateurs/kpis');
            return data.data as PlatformUserKpis;
        },
    });
}

export function usePlatformUserDetail(id: string) {
    return useQuery({
        queryKey: ['platform-user', id],
        queryFn: async () => {
            const { data } = await apiClient.get(`/api/platform/utilisateurs/${id}`);
            return data.data;
        },
        enabled: !!id,
    });
}

// =============================================
// Mutations
// =============================================

export function useCreatePlatformUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (dto: { email: string; prenom: string; nom: string; rolePlateforme: string }) => {
            const { data } = await apiClient.post('/api/platform/utilisateurs', dto);
            return data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['platform-users'] });
            queryClient.invalidateQueries({ queryKey: ['platform-users-kpis'] });
        },
    });
}

export function useUpdatePlatformUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...dto }: { id: string; rolePlateforme?: string; estActif?: boolean }) => {
            const { data } = await apiClient.patch(`/api/platform/utilisateurs/${id}`, dto);
            return data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['platform-users'] });
        },
    });
}

export function useSuspendrePlatformUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { data } = await apiClient.post(`/api/platform/utilisateurs/${id}/suspendre`);
            return data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['platform-users'] });
        },
    });
}

export function useReactiverPlatformUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { data } = await apiClient.post(`/api/platform/utilisateurs/${id}/reactiver`);
            return data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['platform-users'] });
        },
    });
}

export function useResetMfaPlatformUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { data } = await apiClient.post(`/api/platform/utilisateurs/${id}/reset-mfa`);
            return data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['platform-users'] });
        },
    });
}
