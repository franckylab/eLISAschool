/**
 * ==================================
 * eLISAschool - Hooks Événements
 * ==================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import type { Evenement, CreerEvenementDto, ModifierEvenementDto, EvenementFiltres, StatistiquesEvenements } from '../types/evenement.types';

const EVENEMENTS_KEYS = {
    all: ['evenements'] as const,
    listes: () => [...EVENEMENTS_KEYS.all, 'liste'] as const,
    liste: (filtres: EvenementFiltres) => [...EVENEMENTS_KEYS.listes(), filtres] as const,
    details: () => [...EVENEMENTS_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...EVENEMENTS_KEYS.details(), id] as const,
    stats: () => [...EVENEMENTS_KEYS.all, 'stats'] as const,
    participants: (id: string) => [...EVENEMENTS_KEYS.detail(id), 'participants'] as const,
};

export function useEvenements(filtres: EvenementFiltres = {}) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: EVENEMENTS_KEYS.liste(filtres),
        queryFn: async () => {
            const response = await apiClient.getPaginated<Evenement>('/api/evenements', {
                page: filtres.page || 1,
                limit: filtres.limit || 20,
                ...filtres,
            });
            return response;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

export function useEvenement(id: string) {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: EVENEMENTS_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: Evenement }>(`/api/evenements/${id}`);
            return response.data?.data;
        },
        enabled: !!id && isAuthenticated,
        staleTime: 5 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

export function useCreerEvenement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerEvenementDto) => {
            const response = await apiClient.post<{ success: boolean; data: Evenement }>('/api/evenements', dto);
            return response.data?.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: EVENEMENTS_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: EVENEMENTS_KEYS.stats() });
            toast.success('Événement créé avec succès');
        },
    });
}

export function useModifierEvenement(id: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: ModifierEvenementDto) => {
            const response = await apiClient.patch<{ success: boolean; data: Evenement }>(`/api/evenements/${id}`, dto);
            return response.data?.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: EVENEMENTS_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: EVENEMENTS_KEYS.detail(id) });
            queryClient.invalidateQueries({ queryKey: EVENEMENTS_KEYS.stats() });
            toast.success('Événement modifié avec succès');
        },
    });
}

export function useSupprimerEvenement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await apiClient.delete(`/api/evenements/${id}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: EVENEMENTS_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: EVENEMENTS_KEYS.stats() });
            toast.success('Événement supprimé avec succès');
        },
    });
}

export function useStatistiquesEvenements() {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: EVENEMENTS_KEYS.stats(),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: StatistiquesEvenements }>('/api/evenements/statistiques');
            return response.data?.data;
        },
        enabled: isAuthenticated,
        staleTime: 10 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

export function useInscrireEvenement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { evenementId: string; utilisateurIds: string[] }) => {
            const response = await apiClient.post<any>(`/api/evenements/${data.evenementId}/participants`, {
                utilisateur_ids: data.utilisateurIds,
            });
            return response.data?.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: EVENEMENTS_KEYS.detail(variables.evenementId) });
            queryClient.invalidateQueries({ queryKey: EVENEMENTS_KEYS.participants(variables.evenementId) });
            toast.success(`${variables.utilisateurIds.length} participant(s) inscrit(s)`);
        },
    });
}
