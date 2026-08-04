/**
 * ==================================
 * eLISAschool - Hooks Congés
 * ==================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import type { Conge, CreerCongeDto, StatistiquesConges, CongeFiltres } from '../types/conges.types';

const CONGES_KEYS = {
    listes: (filtres?: CongeFiltres) => ['conges', 'liste', filtres] as const,
    detail: (id: string) => ['conges', 'detail', id] as const,
    stats: () => ['conges', 'stats'] as const,
};

export function useConges(filtres?: CongeFiltres) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: CONGES_KEYS.listes(filtres),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: Conge[]; meta: any }>('/api/conges', { params: filtres as any });
            return { data: response.data?.data, meta: response.data?.meta };
        },
        enabled: isAuthenticated,
        staleTime: 3 * 60 * 1000,
    });
}

export function useConge(id: string) {
    return useQuery({
        queryKey: CONGES_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: Conge }>(`/api/conges/${id}`);
            return response.data?.data;
        },
        enabled: !!id,
        placeholderData: (previousData) => previousData,
    });
}

export function useCreerConge() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerCongeDto) => {
            const response = await apiClient.post<{ success: boolean; data: Conge }>('/api/conges', dto);
            return response.data?.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CONGES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: CONGES_KEYS.stats() });
            toast.success('Demande de congé créée avec succès');
        },
    });
}

export function useValiderConge() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { id: string; action: 'accepter' | 'refuser'; motifRefus?: string }) => {
            const response = await apiClient.patch<{ success: boolean; data: Conge }>(`/api/conges/${data.id}/valider`, {
                action: data.action,
                motifRefus: data.motifRefus,
            });
            return response.data?.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CONGES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: CONGES_KEYS.stats() });
            toast.success('Congé validé avec succès');
        },
    });
}

export function useSupprimerConge() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/conges/${id}`);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CONGES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: CONGES_KEYS.stats() });
            toast.success('Congé supprimé avec succès');
        },
    });
}

export function useStatistiquesConges() {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: CONGES_KEYS.stats(),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: StatistiquesConges }>('/api/conges/statistiques');
            return response.data?.data;
        },
        enabled: isAuthenticated,
        staleTime: 10 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}
