/**
 * ==================================
 * eLISAschool - Hooks Périodes
 * ==================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import type { Periode, CreerPeriodeDto, ModifierPeriodeDto, PeriodeFiltres } from '../types/periode.types';

const PERIODES_KEYS = {
    all: ['periodes'] as const,
    listes: () => [...PERIODES_KEYS.all, 'liste'] as const,
    liste: (filtres: PeriodeFiltres) => [...PERIODES_KEYS.listes(), filtres] as const,
    details: () => [...PERIODES_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...PERIODES_KEYS.details(), id] as const,
};

export function usePeriodes(filtres: PeriodeFiltres = {}) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: PERIODES_KEYS.liste(filtres),
        queryFn: async () => {
            const response = await apiClient.getPaginated<Periode>('/api/periodes', {
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

export function usePeriode(id: string) {
    return useQuery({
        queryKey: PERIODES_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: Periode }>(`/api/periodes/${id}`);
            return response.data?.data;
        },
        enabled: !!id && isAuthenticated,
        staleTime: 10 * 60 * 1000,
    });
}

export function useCreerPeriode() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerPeriodeDto) => {
            const response = await apiClient.post<{ success: boolean; data: Periode }>('/api/periodes', dto);
            return response.data?.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PERIODES_KEYS.listes() });
            toast.success('Période créée avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la création');
        },
    });
}

export function useModifierPeriode() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...dto }: ModifierPeriodeDto) => {
            const response = await apiClient.patch<{ success: boolean; data: Periode }>(`/api/periodes/${id}`, dto);
            return response.data?.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: PERIODES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: PERIODES_KEYS.detail(variables.id) });
            toast.success('Période modifiée avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la modification');
        },
    });
}

export function useSupprimerPeriode() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/periodes/${id}`);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PERIODES_KEYS.listes() });
            toast.success('Période supprimée avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la suppression');
        },
    });
}
