/**
 * ==================================
 * eLISAschool - Hooks Sondages
 * ==================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import type { Sondage, CreerSondageDto, VoterDto, SondageFiltres, StatistiquesSondage } from '../types/sondage.types';

const SONDAGES_KEYS = {
    all: ['sondages'] as const,
    listes: () => [...SONDAGES_KEYS.all, 'liste'] as const,
    liste: (filtres: SondageFiltres) => [...SONDAGES_KEYS.listes(), filtres] as const,
    details: () => [...SONDAGES_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...SONDAGES_KEYS.details(), id] as const,
    stats: (id: string) => [...SONDAGES_KEYS.detail(id), 'stats'] as const,
};

export function useSondages(filtres: SondageFiltres = {}) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: SONDAGES_KEYS.liste(filtres),
        queryFn: async () => {
            const params: Record<string, any> = {
                page: filtres.page || 1,
                limit: filtres.limit || 20,
            };

            if (filtres.statut) params.statut = filtres.statut;
            if (filtres.recherche) params.search = filtres.recherche;

            const response = await apiClient.getPaginated<Sondage>('/api/sondages', params);
            return response;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

export function useSondage(id: string) {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: SONDAGES_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: Sondage }>(`/api/sondages/${id}`);
            return response.data?.data;
        },
        enabled: !!id && isAuthenticated,
        staleTime: 5 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

export function useCreerSondage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerSondageDto) => {
            const response = await apiClient.post<{ success: boolean; data: Sondage }>('/api/sondages', dto);
            return response.data?.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: SONDAGES_KEYS.listes() });
            toast.success('Sondage créé avec succès');
        },
    });
}

export function useSupprimerSondage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await apiClient.delete(`/api/sondages/${id}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: SONDAGES_KEYS.listes() });
            toast.success('Sondage supprimé avec succès');
        },
    });
}

export function useVoter() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { sondageId: string; vote: VoterDto }) => {
            const response = await apiClient.post<any>(`/api/sondages/${data.sondageId}/voter`, data.vote);
            return response.data?.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: SONDAGES_KEYS.detail(variables.sondageId) });
            queryClient.invalidateQueries({ queryKey: SONDAGES_KEYS.stats(variables.sondageId) });
            toast.success('Vote enregistré avec succès');
        },
    });
}

export function useStatistiquesSondage(id: string) {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: SONDAGES_KEYS.stats(id),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: StatistiquesSondage }>(`/api/sondages/${id}/analyses`);
            return response.data?.data;
        },
        enabled: !!id && isAuthenticated,
        staleTime: 3 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

export function useExporterSondage() {
    return useMutation({
        mutationFn: async (data: { sondageId: string; format: 'csv' | 'pdf' }) => {
            const response = await apiClient.get(`/api/sondages/${data.sondageId}/analyses/export`, {
                params: { format: data.format } as any,
                responseType: 'blob',
            });
            return { data: response.data, format: data.format };
        },
        onSuccess: ({ data, format }) => {
            const url = window.URL.createObjectURL(new Blob([data as BlobPart]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `sondage-export.${format}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success(`Export ${format.toUpperCase()} téléchargé`);
        },
    });
}
