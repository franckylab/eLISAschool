/**
 * ==================================
 * eLISAschool - Hooks Analytics
 * ==================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import type { DashboardAnalytics, KPI, CreerKPIDto, StatistiquesAnalytics, FiltresAnalytics } from '../types/analytics.types';

const ANALYTICS_KEYS = {
    dashboard: (filtres?: FiltresAnalytics) => ['analytics', 'dashboard', filtres] as const,
    kpis: (filtres?: FiltresAnalytics) => ['analytics', 'kpis', filtres] as const,
    kpi: (id: string) => ['analytics', 'kpi', id] as const,
    stats: () => ['analytics', 'stats'] as const,
};

export function useDashboardAnalytics(filtres?: FiltresAnalytics) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ANALYTICS_KEYS.dashboard(filtres),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: DashboardAnalytics }>('/api/analytics/dashboard', {
                params: filtres,
            });
            return response.data?.data;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

export function useKPIs(filtres?: FiltresAnalytics) {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: ANALYTICS_KEYS.kpis(filtres),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: KPI[] }>('/api/analytics/kpis', { params: filtres });
            return response.data?.data;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

export function useKPI(id: string) {
    return useQuery({
        queryKey: ANALYTICS_KEYS.kpi(id),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: KPI }>(`/api/analytics/kpis/${id}`);
            return response.data?.data;
        },
        enabled: !!id,
    });
}

export function useCreerKPI() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerKPIDto) => {
            const response = await apiClient.post<{ success: boolean; data: KPI }>('/api/analytics/kpis', dto);
            return response.data?.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ANALYTICS_KEYS.kpis() });
            queryClient.invalidateQueries({ queryKey: ANALYTICS_KEYS.stats() });
            toast.success('KPI créé avec succès');
        },
    });
}

export function useModifierKPI(id: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: Partial<CreerKPIDto>) => {
            const response = await apiClient.patch<{ success: boolean; data: KPI }>(`/api/analytics/kpis/${id}`, dto);
            return response.data?.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ANALYTICS_KEYS.kpis() });
            toast.success('KPI modifié avec succès');
        },
    });
}

export function useSupprimerKPI() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/analytics/kpis/${id}`);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ANALYTICS_KEYS.kpis() });
            queryClient.invalidateQueries({ queryKey: ANALYTICS_KEYS.stats() });
            toast.success('KPI supprimé avec succès');
        },
    });
}

export function useActualiserKPI() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await apiClient.post<{ success: boolean; data: KPI }>(`/api/analytics/kpis/${id}/actualiser`);
            return response.data?.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ANALYTICS_KEYS.kpis() });
            toast.success('KPI actualisé avec succès');
        },
    });
}

export function useStatistiquesAnalytics() {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: ANALYTICS_KEYS.stats(),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: StatistiquesAnalytics }>('/api/analytics/statistiques');
            return response.data?.data;
        },
        enabled: isAuthenticated,
        staleTime: 10 * 60 * 1000,
    });
}
