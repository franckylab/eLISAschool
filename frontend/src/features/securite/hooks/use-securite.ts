/**
 * ==================================
 * eLISAschool - Hooks Sécurité
 * ==================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import type { Incident, Ronde, StatistiquesSecurite, FiltresSecurite, CreerIncidentDto } from '../types/securite.types';

const SECURITE_KEYS = {
    incidents: (filtres?: FiltresSecurite) => ['securite', 'incidents', filtres] as const,
    rondes: () => ['securite', 'rondes'] as const,
    stats: () => ['securite', 'stats'] as const,
};

export function useIncidents(filtres?: FiltresSecurite) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: SECURITE_KEYS.incidents(filtres),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: Incident[]; meta: any }>('/api/securite/incidents', { params: filtres });
            return { data: response.data.data, meta: response.data.meta };
        },
        enabled: isAuthenticated,
        staleTime: 3 * 60 * 1000,
    });
}

export function useRondes() {
    return useQuery({
        queryKey: SECURITE_KEYS.rondes(),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: Ronde[] }>('/api/securite/rondes');
            return response.data.data;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

export function useCreerIncident() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerIncidentDto) => {
            const response = await apiClient.post<{ success: boolean; data: Incident }>('/api/securite/incidents', dto);
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: SECURITE_KEYS.incidents() });
            queryClient.invalidateQueries({ queryKey: SECURITE_KEYS.stats() });
            toast.success('Incident signalé avec succès');
        },
    });
}

export function useResoudreIncident() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { id: string; mesuresPrises?: string }) => {
            const response = await apiClient.patch<{ success: boolean; data: Incident }>(`/api/securite/incidents/${data.id}/resoudre`, {
                mesuresPrises: data.mesuresPrises,
            });
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: SECURITE_KEYS.incidents() });
            queryClient.invalidateQueries({ queryKey: SECURITE_KEYS.stats() });
            toast.success('Incident résolu');
        },
    });
}

export function useStatistiquesSecurite() {
    return useQuery({
        queryKey: SECURITE_KEYS.stats(),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: StatistiquesSecurite }>('/api/securite/statistiques');
            return response.data.data;
        },
        enabled: isAuthenticated,
        staleTime: 10 * 60 * 1000,
    });
}
