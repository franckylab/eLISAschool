/**
 * ==================================
 * eLISAschool - Hooks Annonces
 * ==================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import type { Annonce, CreerAnnonceDto, ModifierAnnonceDto, AnnonceFiltres, StatistiquesAnnonces } from '../types/annonce.types';

const ANNONCES_KEYS = {
    all: ['annonces'] as const,
    listes: () => [...ANNONCES_KEYS.all, 'liste'] as const,
    liste: (filtres: AnnonceFiltres) => [...ANNONCES_KEYS.listes(), filtres] as const,
    details: () => [...ANNONCES_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...ANNONCES_KEYS.details(), id] as const,
    stats: () => [...ANNONCES_KEYS.all, 'stats'] as const,
};

export function useAnnonces(filtres: AnnonceFiltres = {}) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ANNONCES_KEYS.liste(filtres),
        queryFn: async () => {
            const response = await apiClient.getPaginated<Annonce>('/api/annonces', {
                page: filtres.page || 1,
                limit: filtres.limit || 20,
                ...filtres,
            });
            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

export function useAnnonce(id: string) {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: ANNONCES_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: Annonce }>(`/api/annonces/${id}`);
            return response.data?.data;
        },
        enabled: !!id && isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

export function useStatistiquesAnnonces() {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: ANNONCES_KEYS.stats(),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: StatistiquesAnnonces }>('/api/annonces/statistiques');
            return response.data?.data;
        },
        enabled: isAuthenticated,
        staleTime: 10 * 60 * 1000,
    });
}

export function useCreerAnnonce() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerAnnonceDto) => {
            const response = await apiClient.post<{ success: boolean; data: Annonce }>('/api/annonces', dto);
            return response.data?.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ANNONCES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: ANNONCES_KEYS.stats() });
            toast.success('Annonce créée avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la création');
        },
    });
}

export function useModifierAnnonce() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...dto }: ModifierAnnonceDto) => {
            const response = await apiClient.patch<{ success: boolean; data: Annonce }>(`/api/annonces/${id}`, dto);
            return response.data?.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ANNONCES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: ANNONCES_KEYS.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: ANNONCES_KEYS.stats() });
            toast.success('Annonce modifiée avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la modification');
        },
    });
}

export function useSupprimerAnnonce() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/annonces/${id}`);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ANNONCES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: ANNONCES_KEYS.stats() });
            toast.success('Annonce supprimée avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la suppression');
        },
    });
}
