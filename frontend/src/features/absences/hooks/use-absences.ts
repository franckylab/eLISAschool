/**
 * ==================================
 * eLISAschool - Hooks Absences
 * ==================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import type { Absence, CreerAbsenceDto, JustifierAbsenceDto, AbsencesFiltres, StatistiquesAbsences } from '../types/absences.types';

const ABSENCES_KEYS = {
    all: ['absences'] as const,
    listes: () => [...ABSENCES_KEYS.all, 'liste'] as const,
    liste: (filtres: AbsencesFiltres) => [...ABSENCES_KEYS.listes(), filtres] as const,
    details: () => [...ABSENCES_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...ABSENCES_KEYS.details(), id] as const,
    stats: () => [...ABSENCES_KEYS.all, 'stats'] as const,
};

export function useAbsences(filtres: AbsencesFiltres = {}) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ABSENCES_KEYS.liste(filtres),
        queryFn: async () => {
            const response = await apiClient.getPaginated<Absence>('/api/absences', {
                page: filtres.page || 1,
                limit: filtres.limit || 20,
                ...filtres,
            });
            return response;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

export function useAbsence(id: string) {
    return useQuery({
        queryKey: ABSENCES_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: Absence }>(`/api/absences/${id}`);
            return response.data.data;
        },
        enabled: !!id && isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

export function useCreerAbsence() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerAbsenceDto) => {
            const response = await apiClient.post<{ success: boolean; data: Absence }>('/api/absences', dto);
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ABSENCES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: ABSENCES_KEYS.stats() });
            toast.success('Absence enregistrée avec succès');
        },
    });
}

export function useJustifierAbsence() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { id: string; dto: JustifierAbsenceDto }) => {
            const response = await apiClient.patch<{ success: boolean; data: Absence }>(`/api/absences/${data.id}/justifier`, data.dto);
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ABSENCES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: ABSENCES_KEYS.stats() });
            toast.success('Absence justifiée avec succès');
        },
    });
}

export function useSupprimerAbsence() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await apiClient.delete(`/api/absences/${id}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ABSENCES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: ABSENCES_KEYS.stats() });
            toast.success('Absence supprimée avec succès');
        },
    });
}

export function useStatistiquesAbsences() {
    return useQuery({
        queryKey: ABSENCES_KEYS.stats(),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: StatistiquesAbsences }>('/api/absences/statistiques');
            return response.data.data;
        },
        enabled: isAuthenticated,
        staleTime: 10 * 60 * 1000,
    });
}
