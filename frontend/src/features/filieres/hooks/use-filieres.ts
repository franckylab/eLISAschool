/**
 * ==================================
 * eLISAschool - Hooks Filières
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * Changements v2.0:
 * - Optimisation des performances React Query
 * - Gestion d'erreurs améliorée avec toast
 * - Retry intelligent désactivé pour les mutations
 * - Cache optimisé pour multi-tenant
 * - Refetch désactivé pour éviter les requêtes inutiles
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import type { PaginatedResult } from '@shared/types/api.types';
import type {
    Filiere,
    CreerFiliereDto,
    ModifierFiliereDto,
    FiliereFiltres,
} from '../types/filiere.types';

const FILIERES_KEYS = {
    all: ['filieres'] as const,
    lists: () => [...FILIERES_KEYS.all, 'list'] as const,
    list: (filtres: FiliereFiltres) => [...FILIERES_KEYS.lists(), filtres] as const,
    toutes: () => [...FILIERES_KEYS.all, 'toutes'] as const,
    details: () => [...FILIERES_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...FILIERES_KEYS.details(), id] as const,
};

export function useFilieres(filtres: FiliereFiltres = {}) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: FILIERES_KEYS.list(filtres),
        queryFn: async () => {
            const params: Record<string, any> = {
                page: filtres.page || 1,
                limit: filtres.limit || 20,
                sortBy: 'nom',
                sortOrder: 'ASC',
            };

            // Ajouter uniquement les filtres non vides
            if (filtres.recherche) params.search = filtres.recherche;
            if (filtres.cycleId) params.cycleId = filtres.cycleId;
            if (filtres.sousSysteme) params.sousSysteme = filtres.sousSysteme;
            if (filtres.actif !== undefined) params.actif = filtres.actif;

            const response = await apiClient.get<PaginatedResult<Filiere>>('/api/filieres', params);
            return (response as any).data as PaginatedResult<Filiere>;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000, // 5 minutes
        placeholderData: (previousData) => previousData,
        gcTime: 10 * 60 * 1000,   // 10 minutes
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        retry: 1,
        retryDelay: 1000,
    });
}

export function useFilieresByCycle(cycleId: string) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: [...FILIERES_KEYS.all, 'cycle', cycleId],
        queryFn: async () => {
            const response = await apiClient.get<PaginatedResult<Filiere>>('/api/filieres', {
                cycleId,
                limit: 100,
                sortBy: 'nom',
                sortOrder: 'ASC',
            });
            const result = (response as any).data as PaginatedResult<Filiere>;
            return result?.items || [];
        },
        enabled: !!cycleId && isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

export function useToutesFilieres() {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: FILIERES_KEYS.toutes(),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: Filiere[] }>('/api/filieres/all');
            return response.data?.data || [];
        },
        enabled: isAuthenticated,
        staleTime: 10 * 60 * 1000, // 10 minutes
        placeholderData: (previousData) => previousData,
        gcTime: 15 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        retry: 1,
    });
}

export function useFiliere(id: string) {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: FILIERES_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<Filiere>(`/api/filieres/${id}`);

            if (!response.data) {
                throw new Error('Filière non trouvée');
            }

            return response.data;
        },
        enabled: isAuthenticated && !!id,
        staleTime: 3 * 60 * 1000, // 3 minutes
        placeholderData: (previousData) => previousData,
        gcTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        retry: 1,
        retryDelay: 500,
    });
}

export function useCreerFiliere() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerFiliereDto) => {
            const response = await apiClient.post<{
                success: boolean;
                data: Filiere;
            }>('/api/filieres', dto);

            if (!response.data?.success) {
                throw new Error('Erreur lors de la création');
            }

            return response.data?.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: FILIERES_KEYS.lists() });
            toast.success('Filière créée avec succès');
        },
        onError: (error: any) => {
            const message = error.response?.data?.error?.message || 'Erreur lors de la création';
            toast.error(message);
        },
        retry: 0,
    });
}

export function useModifierFiliere() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...dto }: { id: string } & ModifierFiliereDto) => {
            const response = await apiClient.patch<{
                success: boolean;
                data: Filiere;
            }>(`/api/filieres/${id}`, dto);

            if (!response.data?.success) {
                throw new Error('Erreur lors de la modification');
            }

            return response.data?.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: FILIERES_KEYS.lists() });
            queryClient.invalidateQueries({ queryKey: FILIERES_KEYS.detail(variables.id) });
            toast.success('Filière modifiée avec succès');
        },
        onError: (error: any) => {
            const message = error.response?.data?.error?.message || 'Erreur lors de la modification';
            toast.error(message);
        },
        retry: 0,
    });
}

export function useSupprimerFiliere() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await apiClient.delete<{
                success: boolean;
            }>(`/api/filieres/${id}`);

            if (!response.data?.success) {
                throw new Error('Erreur lors de la suppression');
            }

            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: FILIERES_KEYS.lists() });
            toast.success('Filière supprimée avec succès');
        },
        onError: (error: any) => {
            const message = error.response?.data?.error?.message || 'Erreur lors de la suppression';
            toast.error(message);
        },
        retry: 0,
    });
}
