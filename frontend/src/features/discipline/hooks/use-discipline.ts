/**
 * ==================================
 * eLISAschool - Hooks Discipline
 * ==================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import type { Sanction, CreerSanctionDto, ModifierSanctionDto, SanctionFiltres, StatistiquesDiscipline } from '../types/discipline.types';

const DISCIPLINE_KEYS = {
    all: ['discipline'] as const,
    listes: () => [...DISCIPLINE_KEYS.all, 'liste'] as const,
    liste: (filtres: SanctionFiltres) => [...DISCIPLINE_KEYS.listes(), filtres] as const,
    details: () => [...DISCIPLINE_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...DISCIPLINE_KEYS.details(), id] as const,
    stats: () => [...DISCIPLINE_KEYS.all, 'stats'] as const,
};

export function useSanctions(filtres: SanctionFiltres = {}) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: DISCIPLINE_KEYS.liste(filtres),
        queryFn: async () => {
            const response = await apiClient.getPaginated<Sanction>('/api/discipline/sanctions', {
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

export function useSanction(id: string) {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: DISCIPLINE_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: Sanction }>(`/api/discipline/sanctions/${id}`);
            return response.data?.data;
        },
        enabled: !!id && isAuthenticated,
        staleTime: 5 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

export function useCreerSanction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerSanctionDto) => {
            const response = await apiClient.post<{ success: boolean; data: Sanction }>('/api/discipline/sanctions', dto);
            return response.data?.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: DISCIPLINE_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: DISCIPLINE_KEYS.stats() });
            toast.success('Sanction enregistrée avec succès');
        },
    });
}

export function useModifierSanction(id: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: ModifierSanctionDto) => {
            const response = await apiClient.patch<{ success: boolean; data: Sanction }>(`/api/discipline/sanctions/${id}`, dto);
            return response.data?.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: DISCIPLINE_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: DISCIPLINE_KEYS.detail(id) });
            queryClient.invalidateQueries({ queryKey: DISCIPLINE_KEYS.stats() });
            toast.success('Sanction modifiée avec succès');
        },
    });
}

export function useSupprimerSanction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await apiClient.delete(`/api/discipline/sanctions/${id}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: DISCIPLINE_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: DISCIPLINE_KEYS.stats() });
            toast.success('Sanction supprimée avec succès');
        },
    });
}

export function useAmnistierSanction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await apiClient.patch<{ success: boolean; data: Sanction }>(`/api/discipline/sanctions/${id}/amnistier`);
            return response.data?.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: DISCIPLINE_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: DISCIPLINE_KEYS.stats() });
            toast.success('Sanction amnistiée avec succès');
        },
    });
}

export function useStatistiquesDiscipline() {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: DISCIPLINE_KEYS.stats(),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: StatistiquesDiscipline }>('/api/discipline/statistiques');
            return response.data?.data;
        },
        enabled: isAuthenticated,
        staleTime: 10 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}
