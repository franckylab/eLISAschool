/**
 * ==================================
 * eLISAschool - Hooks Évaluations
 * ==================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import type { Evaluation, CreerEvaluationDto, StatistiquesEvaluations, EvaluationFiltres } from '../types/evaluations.types';

const EVALUATIONS_KEYS = {
    listes: (filtres?: EvaluationFiltres) => ['evaluations', 'liste', filtres] as const,
    detail: (id: string) => ['evaluations', 'detail', id] as const,
    stats: () => ['evaluations', 'stats'] as const,
};

export function useEvaluations(filtres?: EvaluationFiltres) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: EVALUATIONS_KEYS.listes(filtres),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: Evaluation[]; meta: any }>('/api/evaluations', { params: filtres });
            return { data: response.data.data, meta: response.data.meta };
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

export function useEvaluation(id: string) {
    return useQuery({
        queryKey: EVALUATIONS_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: Evaluation }>(`/api/evaluations/${id}`);
            return response.data.data;
        },
        enabled: !!id,
    });
}

export function useCreerEvaluation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerEvaluationDto) => {
            const response = await apiClient.post<{ success: boolean; data: Evaluation }>('/api/evaluations', dto);
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: EVALUATIONS_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: EVALUATIONS_KEYS.stats() });
            toast.success('Évaluation créée avec succès');
        },
    });
}

export function useFinaliserEvaluation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await apiClient.patch<{ success: boolean; data: Evaluation }>(`/api/evaluations/${id}/finaliser`);
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: EVALUATIONS_KEYS.listes() });
            toast.success('Évaluation finalisée avec succès');
        },
    });
}

export function useSupprimerEvaluation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/evaluations/${id}`);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: EVALUATIONS_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: EVALUATIONS_KEYS.stats() });
            toast.success('Évaluation supprimée avec succès');
        },
    });
}

export function useStatistiquesEvaluations() {
    return useQuery({
        queryKey: EVALUATIONS_KEYS.stats(),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: StatistiquesEvaluations }>('/api/evaluations/statistiques');
            return response.data.data;
        },
        enabled: isAuthenticated,
        staleTime: 10 * 60 * 1000,
    });
}
