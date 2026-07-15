/**
 * ==================================
 * eLISAschool - Hooks Cycles
 * ==================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import type { PaginatedResult } from '@shared/types/api.types';
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
            const response = await apiClient.get<PaginatedResult<Cycle>>('/api/cycles', {
                page: filtres.page || 1,
                limit: filtres.limit || 20,
                search: filtres.recherche,
                actif: filtres.actif,
                sortBy: filtres.sortBy || 'ordre',
                sortOrder: filtres.sortOrder || 'ASC',
            });
            return (response as any).data as PaginatedResult<Cycle>;
        },
        enabled: isAuthenticated,
        staleTime: 10 * 60 * 1000,
    });
}

export function useCycle(id: string) {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: CYCLES_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<Cycle>(`/api/cycles/${id}`);
            if (!response.data) {
                throw new Error('Cycle non trouvé');
            }
            return response.data;
        },
        enabled: !!id && isAuthenticated,
        staleTime: 10 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

export function useCreerCycle() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerCycleDto) => {
            const response = await apiClient.post<Cycle>('/api/cycles', dto);
            return (response as any).data;
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
            const response = await apiClient.patch<Cycle>(`/api/cycles/${id}`, dto);
            return (response as any).data;
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
