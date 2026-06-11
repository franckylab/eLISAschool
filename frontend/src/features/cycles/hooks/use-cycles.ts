/**
 * ==================================
 * eLISAschool - Hooks Cycles
 * ==================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import type { Cycle, CreerCycleDto, ModifierCycleDto, CycleFiltres } from '../types/cycle.types';

const CYCLES_KEYS = {
    all: ['cycles'] as const,
    listes: () => [...CYCLES_KEYS.all, 'liste'] as const,
    liste: (filtres: CycleFiltres) => [...CYCLES_KEYS.listes(), filtres] as const,
    details: () => [...CYCLES_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...CYCLES_KEYS.details(), id] as const,
};

export function useCycles(filtres: CycleFiltres = {}) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: CYCLES_KEYS.liste(filtres),
        queryFn: async () => {
            const response = await apiClient.getPaginated<Cycle>('/api/cycles', {
                page: filtres.page || 1,
                limit: filtres.limit || 20,
                ...filtres,
            });
            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 10 * 60 * 1000,
    });
}

export function useCycle(id: string) {
    return useQuery({
        queryKey: CYCLES_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: Cycle }>(`/api/cycles/${id}`);
            return response.data?.data;
        },
        enabled: !!id && isAuthenticated,
        staleTime: 10 * 60 * 1000,
    });
}

export function useCreerCycle() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerCycleDto) => {
            const response = await apiClient.post<{ success: boolean; data: Cycle }>('/api/cycles', dto);
            return response.data?.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CYCLES_KEYS.listes() });
            toast.success('Cycle créé avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la création');
        },
    });
}

export function useModifierCycle() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...dto }: ModifierCycleDto) => {
            const response = await apiClient.patch<{ success: boolean; data: Cycle }>(`/api/cycles/${id}`, dto);
            return response.data?.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: CYCLES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: CYCLES_KEYS.detail(variables.id) });
            toast.success('Cycle modifié avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la modification');
        },
    });
}

export function useSupprimerCycle() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/cycles/${id}`);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CYCLES_KEYS.listes() });
            toast.success('Cycle supprimé avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la suppression');
        },
    });
}
