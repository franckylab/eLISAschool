/**
 * ==================================
 * eLISAschool - Hooks Emploi du Temps
 * ==================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import type { Creneau, CreerCreneauDto, EmploiDuTempsFiltres, StatistiquesEmploiDuTemps } from '../types/emplois.types';

const EMPLOIS_KEYS = {
    listes: (filtres?: EmploiDuTempsFiltres) => ['emplois', 'liste', filtres] as const,
    detail: (id: string) => ['emplois', 'detail', id] as const,
    stats: () => ['emplois', 'stats'] as const,
    conflits: () => ['emplois', 'conflits'] as const,
};

export function useCreneaux(filtres?: EmploiDuTempsFiltres) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: EMPLOIS_KEYS.listes(filtres),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: Creneau[]; meta: any }>('/api/emplois-du-temps/creneaux', { params: filtres as any });
            return { data: response.data?.data, meta: response.data?.meta };
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

export function useCreneau(id: string) {
    return useQuery({
        queryKey: EMPLOIS_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: Creneau }>(`/api/emplois-du-temps/creneaux/${id}`);
            return response.data?.data;
        },
        enabled: !!id,
    });
}

export function useCreerCreneau() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerCreneauDto) => {
            const response = await apiClient.post<{ success: boolean; data: Creneau }>('/api/emplois-du-temps/creneaux', dto);
            return response.data?.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: EMPLOIS_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: EMPLOIS_KEYS.stats() });
            queryClient.invalidateQueries({ queryKey: EMPLOIS_KEYS.conflits() });
            toast.success('Créneau ajouté avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la création');
        },
    });
}

export function useModifierCreneau(id: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: Partial<CreerCreneauDto>) => {
            const response = await apiClient.patch<{ success: boolean; data: Creneau }>(`/api/emplois-du-temps/creneaux/${id}`, dto);
            return response.data?.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: EMPLOIS_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: EMPLOIS_KEYS.stats() });
            toast.success('Créneau modifié avec succès');
        },
    });
}

export function useSupprimerCreneau() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/emplois-du-temps/creneaux/${id}`);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: EMPLOIS_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: EMPLOIS_KEYS.stats() });
            queryClient.invalidateQueries({ queryKey: EMPLOIS_KEYS.conflits() });
            toast.success('Créneau supprimé avec succès');
        },
    });
}

export function useStatistiquesEmploiDuTemps() {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: EMPLOIS_KEYS.stats(),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: StatistiquesEmploiDuTemps }>('/api/emplois-du-temps/statistiques');
            return response.data?.data;
        },
        enabled: isAuthenticated,
        staleTime: 10 * 60 * 1000,
    });
}

export function useConflitsCreneaux() {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: EMPLOIS_KEYS.conflits(),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: any[] }>('/api/emplois-du-temps/conflits');
            return response.data?.data;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}
