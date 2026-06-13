/**
 * ==================================
 * eLISAschool - Hooks Examens
 * ==================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import type { Examen, CreerExamenDto, ResultatExamen, StatistiquesExamen, ExamenFiltres } from '../types/examens.types';

const EXAMENS_KEYS = {
    listes: (filtres?: ExamenFiltres) => ['examens', 'liste', filtres] as const,
    detail: (id: string) => ['examens', 'detail', id] as const,
    resultats: (examenId: string) => ['examens', 'resultats', examenId] as const,
    stats: () => ['examens', 'stats'] as const,
};

export function useExamens(filtres?: ExamenFiltres) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: EXAMENS_KEYS.listes(filtres),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: Examen[]; meta: any }>('/api/examens', { params: filtres });
            return { data: response.data?.data, meta: response.data?.meta };
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

export function useExamen(id: string) {
    return useQuery({
        queryKey: EXAMENS_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: Examen }>(`/api/examens/${id}`);
            return response.data?.data;
        },
        enabled: !!id,
    });
}

export function useCreerExamen() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerExamenDto) => {
            const response = await apiClient.post<{ success: boolean; data: Examen }>('/api/examens', dto);
            return response.data?.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: EXAMENS_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: EXAMENS_KEYS.stats() });
            toast.success('Examen créé avec succès');
        },
    });
}

export function useModifierExamen(id: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: Partial<CreerExamenDto>) => {
            const response = await apiClient.patch<{ success: boolean; data: Examen }>(`/api/examens/${id}`, dto);
            return response.data?.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: EXAMENS_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: EXAMENS_KEYS.stats() });
            toast.success('Examen modifié avec succès');
        },
    });
}

export function useSupprimerExamen() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/examens/${id}`);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: EXAMENS_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: EXAMENS_KEYS.stats() });
            toast.success('Examen supprimé avec succès');
        },
    });
}

export function useResultatsExamen(examenId: string) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: EXAMENS_KEYS.resultats(examenId),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: ResultatExamen[] }>(`/api/examens/${examenId}/resultats`);
            return response.data?.data;
        },
        enabled: !!examenId && isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

export function useSaisirResultat() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { examenId: string; eleveId: string; note: number; remarque?: string }) => {
            const response = await apiClient.post<{ success: boolean; data: ResultatExamen }>(
                `/api/examens/${data.examenId}/resultats`,
                { eleveId: data.eleveId, note: data.note, remarque: data.remarque }
            );
            return response.data?.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: EXAMENS_KEYS.resultats(variables.examenId) });
            toast.success('Résultat enregistré avec succès');
        },
    });
}

export function useStatistiquesExamens() {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: EXAMENS_KEYS.stats(),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: StatistiquesExamen }>('/api/examens/statistiques');
            return response.data?.data;
        },
        enabled: isAuthenticated,
        staleTime: 10 * 60 * 1000,
    });
}
