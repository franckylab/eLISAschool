/**
 * ==================================
 * eLISAschool - Hook Années Scolaires
 * ==================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';
import type { AnneeScolaire, CreerAnneeScolaireDto, ModifierAnneeScolaireDto, AnneeScolaireFiltres } from '../types/annee-scolaire.types';
import { toast } from 'sonner';

const ANNEES_KEYS = {
    all: ['annees-scolaires'] as const,
    listes: () => [...ANNEES_KEYS.all, 'liste'] as const,
    liste: (filtres: AnneeScolaireFiltres) => [...ANNEES_KEYS.listes(), filtres] as const,
    details: () => [...ANNEES_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...ANNEES_KEYS.details(), id] as const,
    active: () => [...ANNEES_KEYS.all, 'active'] as const,
};

export function useAnneesScolaires(filtres: AnneeScolaireFiltres = {}) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ANNEES_KEYS.liste(filtres),
        queryFn: async () => {
            const response = await apiClient.getPaginated<AnneeScolaire>('/api/annees-scolaires', {
                page: filtres.page || 1,
                limit: filtres.limit || 20,
                ...filtres,
            });
            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 15 * 60 * 1000,
    });
}

export function useAnneeScolaire(id: string) {
    return useQuery({
        queryKey: ANNEES_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<{ data: AnneeScolaire }>(`/api/annees-scolaires/${id}`);
            return response.data;
        },
        enabled: !!id,
    });
}

export function useAnneeScolaireActive() {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: ANNEES_KEYS.active(),
        queryFn: async () => {
            const response = await apiClient.get<{ data: AnneeScolaire }>('/api/annees-scolaires/active');
            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 30 * 60 * 1000,
    });
}

export function useCreerAnneeScolaire() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (dto: CreerAnneeScolaireDto) => {
            const response = await apiClient.post<{ data: AnneeScolaire }>('/api/annees-scolaires', dto);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ANNEES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: ANNEES_KEYS.active() });
            toast.success('Année scolaire créée avec succès');
        },
        onError: (error: any) => toast.error(error?.message || 'Erreur lors de la création'),
    });
}

export function useModifierAnneeScolaire() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (dto: ModifierAnneeScolaireDto) => {
            const { id, ...data } = dto;
            const response = await apiClient.patch<{ data: AnneeScolaire }>(`/api/annees-scolaires/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ANNEES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: ANNEES_KEYS.active() });
            toast.success('Année scolaire modifiée avec succès');
        },
        onError: (error: any) => toast.error(error?.message || 'Erreur lors de la modification'),
    });
}

export function useActiverAnneeScolaire() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await apiClient.post<{ data: AnneeScolaire }>(`/api/annees-scolaires/${id}/activer`, {});
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ANNEES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: ANNEES_KEYS.active() });
            toast.success('Année scolaire activée');
        },
        onError: (error: any) => toast.error(error?.message || 'Erreur lors de l\'activation'),
    });
}

export function useSupprimerAnneeScolaire() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/annees-scolaires/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ANNEES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: ANNEES_KEYS.active() });
            toast.success('Année scolaire supprimée avec succès');
        },
        onError: (error: any) => toast.error(error?.message || 'Erreur lors de la suppression'),
    });
}
