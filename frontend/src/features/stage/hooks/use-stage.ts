/**
 * ==================================
 * eLISAschool - Hooks Stage
 * ==================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import type { Stage, Entreprise, StatistiquesStages, FiltresStage, CreerStageDto } from '../types/stage.types';

const STAGE_KEYS = {
    stages: (filtres?: FiltresStage) => ['stage', 'liste', filtres] as const,
    entreprises: () => ['stage', 'entreprises'] as const,
    stats: () => ['stage', 'stats'] as const,
};

export function useStages(filtres?: FiltresStage) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: STAGE_KEYS.stages(filtres),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: Stage[]; meta: any }>('/api/stages', { params: filtres as any });
            return { data: response.data?.data, meta: response.data?.meta };
        },
        enabled: isAuthenticated,
        staleTime: 3 * 60 * 1000,
    });
}

export function useEntreprises() {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: STAGE_KEYS.entreprises(),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: Entreprise[] }>('/api/stages/entreprises');
            return response.data?.data;
        },
        enabled: isAuthenticated,
        staleTime: 10 * 60 * 1000,
    });
}

export function useCreerStage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerStageDto) => {
            const response = await apiClient.post<{ success: boolean; data: Stage }>('/api/stages', dto);
            return response.data?.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: STAGE_KEYS.stages() });
            queryClient.invalidateQueries({ queryKey: STAGE_KEYS.stats() });
            toast.success('Stage créé avec succès');
        },
    });
}

export function useValiderStage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await apiClient.patch<{ success: boolean; data: Stage }>(`/api/stages/${id}/valider`);
            return response.data?.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: STAGE_KEYS.stages() });
            toast.success('Stage validé');
        },
    });
}

export function useEvaluerStage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { stageId: string; note: number; appreciation: string }) => {
            const response = await apiClient.patch<{ success: boolean; data: Stage }>(`/api/stages/${data.stageId}/evaluer`, {
                note: data.note,
                appreciation: data.appreciation,
            });
            return response.data?.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: STAGE_KEYS.stages() });
            queryClient.invalidateQueries({ queryKey: STAGE_KEYS.stats() });
            toast.success('Évaluation enregistrée');
        },
    });
}

export function useStatistiquesStages() {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: STAGE_KEYS.stats(),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: StatistiquesStages }>('/api/stages/statistiques');
            return response.data?.data;
        },
        enabled: isAuthenticated,
        staleTime: 10 * 60 * 1000,
    });
}
