/**
 * ==================================
 * eLISAschool - Hooks Pointages
 * ==================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import type { Pointage, CreerPointageDto, StatistiquesPointages, PointageFiltres } from '../types/pointages.types';

const POINTAGES_KEYS = {
    listes: (filtres?: PointageFiltres) => ['pointages', 'liste', filtres] as const,
    detail: (id: string) => ['pointages', 'detail', id] as const,
    stats: () => ['pointages', 'stats'] as const,
};

export function usePointages(filtres?: PointageFiltres) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: POINTAGES_KEYS.listes(filtres),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: Pointage[]; meta: any }>('/api/pointages', { params: filtres as any });
            return { data: response.data?.data, meta: response.data?.meta };
        },
        enabled: isAuthenticated,
        staleTime: 3 * 60 * 1000,
    });
}

export function usePointage(id: string) {
    return useQuery({
        queryKey: POINTAGES_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: Pointage }>(`/api/pointages/${id}`);
            return response.data?.data;
        },
        enabled: !!id,
    });
}

export function useCreerPointage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerPointageDto) => {
            const response = await apiClient.post<{ success: boolean; data: Pointage }>('/api/pointages', dto);
            return response.data?.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: POINTAGES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: POINTAGES_KEYS.stats() });
            toast.success('Pointage enregistré avec succès');
        },
    });
}

export function useModifierPointage(id: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: Partial<CreerPointageDto>) => {
            const response = await apiClient.patch<{ success: boolean; data: Pointage }>(`/api/pointages/${id}`, dto);
            return response.data?.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: POINTAGES_KEYS.listes() });
            toast.success('Pointage modifié avec succès');
        },
    });
}

export function useSupprimerPointage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/pointages/${id}`);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: POINTAGES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: POINTAGES_KEYS.stats() });
            toast.success('Pointage supprimé avec succès');
        },
    });
}

export function usePointerArrivee() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { personnelId: string; heureArrivee: string }) => {
            const response = await apiClient.post<{ success: boolean; data: Pointage }>('/api/pointages/arrivee', data);
            return response.data?.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: POINTAGES_KEYS.listes() });
            toast.success('Arrivée pointée avec succès');
        },
    });
}

export function usePointerDepart() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { pointageId: string; heureDepart: string }) => {
            const response = await apiClient.patch<{ success: boolean; data: Pointage }>(`/api/pointages/${data.pointageId}/depart`, {
                heureDepart: data.heureDepart,
            });
            return response.data?.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: POINTAGES_KEYS.listes() });
            toast.success('Départ pointé avec succès');
        },
    });
}

export function useStatistiquesPointages() {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: POINTAGES_KEYS.stats(),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: StatistiquesPointages }>('/api/pointages/statistiques');
            return response.data?.data;
        },
        enabled: isAuthenticated,
        staleTime: 10 * 60 * 1000,
    });
}
