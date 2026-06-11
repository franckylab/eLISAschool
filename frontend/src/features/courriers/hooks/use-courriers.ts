/**
 * ==================================
 * eLISAschool - Hooks Courriers
 * ==================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import type { Courrier, CreerCourrierDto, StatistiquesCourriers, CourrierFiltres } from '../types/courriers.types';

const COURRIERS_KEYS = {
    listes: (filtres?: CourrierFiltres) => ['courriers', 'liste', filtres] as const,
    detail: (id: string) => ['courriers', 'detail', id] as const,
    stats: () => ['courriers', 'stats'] as const,
};

export function useCourriers(filtres?: CourrierFiltres) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: COURRIERS_KEYS.listes(filtres),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: Courrier[]; meta: any }>('/api/courriers', { params: filtres });
            return { data: response.data.data, meta: response.data.meta };
        },
        enabled: isAuthenticated,
        staleTime: 3 * 60 * 1000,
    });
}

export function useCourrier(id: string) {
    return useQuery({
        queryKey: COURRIERS_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: Courrier }>(`/api/courriers/${id}`);
            return response.data.data;
        },
        enabled: !!id,
    });
}

export function useCreerCourrier() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerCourrierDto) => {
            const response = await apiClient.post<{ success: boolean; data: Courrier }>('/api/courriers', dto);
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: COURRIERS_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: COURRIERS_KEYS.stats() });
            toast.success('Courrier créé avec succès');
        },
    });
}

export function useModifierCourrier(id: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: Partial<CreerCourrierDto>) => {
            const response = await apiClient.patch<{ success: boolean; data: Courrier }>(`/api/courriers/${id}`, dto);
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: COURRIERS_KEYS.listes() });
            toast.success('Courrier modifié avec succès');
        },
    });
}

export function useMarquerCommeLu() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await apiClient.patch<{ success: boolean; data: Courrier }>(`/api/courriers/${id}/marquer-lu`);
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: COURRIERS_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: COURRIERS_KEYS.stats() });
        },
    });
}

export function useSupprimerCourrier() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/courriers/${id}`);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: COURRIERS_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: COURRIERS_KEYS.stats() });
            toast.success('Courrier supprimé avec succès');
        },
    });
}

export function useStatistiquesCourriers() {
    return useQuery({
        queryKey: COURRIERS_KEYS.stats(),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: StatistiquesCourriers }>('/api/courriers/statistiques');
            return response.data.data;
        },
        enabled: isAuthenticated,
        staleTime: 10 * 60 * 1000,
    });
}
