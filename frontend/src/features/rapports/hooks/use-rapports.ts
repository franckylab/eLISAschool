/**
 * ==================================
 * eLISAschool - Hooks Rapports
 * ==================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import type { Rapport, CreerRapportDto, TemplateRapport, StatistiquesRapports, FiltresRapports } from '../types/rapports.types';

const RAPPORTS_KEYS = {
    listes: (filtres?: FiltresRapports) => ['rapports', 'liste', filtres] as const,
    detail: (id: string) => ['rapports', 'detail', id] as const,
    templates: () => ['rapports', 'templates'] as const,
    stats: () => ['rapports', 'stats'] as const,
};

export function useRapports(filtres?: FiltresRapports) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: RAPPORTS_KEYS.listes(filtres),
        queryFn: async () => {
            const params: Record<string, any> = {
                page: filtres?.page || 1,
                limit: filtres?.limit || 20,
            };

            if (filtres?.type) params.type = filtres.type;
            if (filtres?.statut) params.statut = filtres.statut;
            if (filtres?.dateDebut) params.dateDebut = filtres.dateDebut;
            if (filtres?.dateFin) params.dateFin = filtres.dateFin;

            const response = await apiClient.get<{ success: boolean; data: Rapport[]; meta: any }>('/api/rapports', params);
            return { data: response.data?.data, meta: response.data?.meta };
        },
        enabled: isAuthenticated,
        staleTime: 3 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

export function useRapport(id: string) {
    return useQuery({
        queryKey: RAPPORTS_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: Rapport }>(`/api/rapports/${id}`);
            return response.data?.data;
        },
        enabled: !!id,
        placeholderData: (previousData) => previousData,
    });
}

export function useTemplatesRapports() {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: RAPPORTS_KEYS.templates(),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: TemplateRapport[] }>('/api/rapports/templates');
            return response.data?.data;
        },
        enabled: isAuthenticated,
        staleTime: 10 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

export function useCreerRapport() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerRapportDto) => {
            const response = await apiClient.post<{ success: boolean; data: Rapport }>('/api/rapports', dto);
            return response.data?.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: RAPPORTS_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: RAPPORTS_KEYS.stats() });
            toast.success('Rapport créé avec succès');
        },
    });
}

export function useTelechargerRapport() {
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await apiClient.get(`/api/rapports/${id}/telecharger`, {
                responseType: 'blob',
            });
            return response.data;
        },
        onSuccess: (data, id) => {
            const url = window.URL.createObjectURL(new Blob([data as BlobPart]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `rapport-${id}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Téléchargement lancé');
        },
    });
}

export function useArchiverRapport() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await apiClient.patch<{ success: boolean; data: Rapport }>(`/api/rapports/${id}/archiver`);
            return response.data?.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: RAPPORTS_KEYS.listes() });
            toast.success('Rapport archivé avec succès');
        },
    });
}

export function useSupprimerRapport() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/rapports/${id}`);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: RAPPORTS_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: RAPPORTS_KEYS.stats() });
            toast.success('Rapport supprimé avec succès');
        },
    });
}

export function useStatistiquesRapports() {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: RAPPORTS_KEYS.stats(),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: StatistiquesRapports }>('/api/rapports/statistiques');
            return response.data?.data;
        },
        enabled: isAuthenticated,
        staleTime: 10 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}
