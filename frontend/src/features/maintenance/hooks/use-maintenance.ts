/**
 * ==================================
 * eLISAschool - Hooks Maintenance
 * ==================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import type { Intervention, Equipement, StatistiquesMaintenance, FiltresMaintenance, CreerInterventionDto } from '../types/maintenance.types';

const MAINTENANCE_KEYS = {
    interventions: (filtres?: FiltresMaintenance) => ['maintenance', 'interventions', filtres] as const,
    equipements: () => ['maintenance', 'equipements'] as const,
    stats: () => ['maintenance', 'stats'] as const,
};

export function useInterventions(filtres?: FiltresMaintenance) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: MAINTENANCE_KEYS.interventions(filtres),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: Intervention[]; meta: any }>('/api/maintenance/interventions', { params: filtres as any });
            return { data: response.data?.data, meta: response.data?.meta };
        },
        enabled: isAuthenticated,
        staleTime: 3 * 60 * 1000,
    });
}

export function useEquipements() {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: MAINTENANCE_KEYS.equipements(),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: Equipement[] }>('/api/maintenance/equipements');
            return response.data?.data;
        },
        enabled: isAuthenticated,
        staleTime: 10 * 60 * 1000,
    });
}

export function useCreerIntervention() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerInterventionDto) => {
            const response = await apiClient.post<{ success: boolean; data: Intervention }>('/api/maintenance/interventions', dto);
            return response.data?.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: MAINTENANCE_KEYS.interventions() });
            queryClient.invalidateQueries({ queryKey: MAINTENANCE_KEYS.stats() });
            toast.success('Intervention créée avec succès');
        },
    });
}

export function useDemarrerIntervention() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await apiClient.patch<{ success: boolean; data: Intervention }>(`/api/maintenance/interventions/${id}/demarrer`);
            return response.data?.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: MAINTENANCE_KEYS.interventions() });
            toast.success('Intervention démarrée');
        },
    });
}

export function useTerminerIntervention() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { id: string; observations?: string; cout?: number }) => {
            const response = await apiClient.patch<{ success: boolean; data: Intervention }>(`/api/maintenance/interventions/${data.id}/terminer`, {
                observations: data.observations,
                cout: data.cout,
            });
            return response.data?.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: MAINTENANCE_KEYS.interventions() });
            queryClient.invalidateQueries({ queryKey: MAINTENANCE_KEYS.stats() });
            toast.success('Intervention terminée');
        },
    });
}

export function useStatistiquesMaintenance() {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: MAINTENANCE_KEYS.stats(),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: StatistiquesMaintenance }>('/api/maintenance/statistiques');
            return response.data?.data;
        },
        enabled: isAuthenticated,
        staleTime: 10 * 60 * 1000,
    });
}
