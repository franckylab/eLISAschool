/**
 * ==================================
 * eLISAschool - Hooks Atelier
 * ==================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import type { Atelier, InscriptionAtelier, SeanceAtelier, StatistiquesAtelier, FiltresAtelier, CreerAtelierDto } from '../types/atelier.types';

const ATELIER_KEYS = {
    ateliers: (filtres?: FiltresAtelier) => ['atelier', 'liste', filtres] as const,
    inscriptions: (filtres?: FiltresAtelier) => ['atelier', 'inscriptions', filtres] as const,
    seances: (atelierId: string) => ['atelier', 'seances', atelierId] as const,
    stats: () => ['atelier', 'stats'] as const,
};

export function useAteliers(filtres?: FiltresAtelier) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ATELIER_KEYS.ateliers(filtres),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: Atelier[] }>('/api/ateliers', { params: filtres });
            return response.data.data;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

export function useInscriptions(filtres?: FiltresAtelier) {
    return useQuery({
        queryKey: ATELIER_KEYS.inscriptions(filtres),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: InscriptionAtelier[]; meta: any }>('/api/ateliers/inscriptions', { params: filtres });
            return { data: response.data.data, meta: response.data.meta };
        },
        enabled: isAuthenticated,
        staleTime: 3 * 60 * 1000,
    });
}

export function useCreerAtelier() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerAtelierDto) => {
            const response = await apiClient.post<{ success: boolean; data: Atelier }>('/api/ateliers', dto);
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ATELIER_KEYS.ateliers() });
            queryClient.invalidateQueries({ queryKey: ATELIER_KEYS.stats() });
            toast.success('Atelier créé avec succès');
        },
    });
}

export function useInscrireAtelier() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { atelierId: string; eleveId: string }) => {
            const response = await apiClient.post<{ success: boolean; data: InscriptionAtelier }>('/api/ateliers/inscriptions', data);
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ATELIER_KEYS.inscriptions() });
            toast.success('Inscription réussie');
        },
    });
}

export function useStatistiquesAtelier() {
    return useQuery({
        queryKey: ATELIER_KEYS.stats(),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: StatistiquesAtelier }>('/api/ateliers/statistiques');
            return response.data.data;
        },
        enabled: isAuthenticated,
        staleTime: 10 * 60 * 1000,
    });
}
