/**
 * ==================================
 * eLISAschool - Hooks Bulletins
 * ==================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import type { Bulletin, GenererBulletinDto, BulletinFiltres } from '../types/bulletin.types';

const BULLETINS_KEYS = {
    all: ['bulletins'] as const,
    listes: () => [...BULLETINS_KEYS.all, 'liste'] as const,
    liste: (filtres: BulletinFiltres) => [...BULLETINS_KEYS.listes(), filtres] as const,
    details: () => [...BULLETINS_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...BULLETINS_KEYS.details(), id] as const,
};

export function useBulletins(filtres: BulletinFiltres = {}) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: BULLETINS_KEYS.liste(filtres),
        queryFn: async () => {
            const response = await apiClient.getPaginated<Bulletin>('/api/bulletins', {
                page: filtres.page || 1,
                limit: filtres.limit || 20,
                ...filtres,
            });
            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 10 * 60 * 1000,
    });
}

export function useBulletin(id: string) {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: BULLETINS_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: Bulletin }>(`/api/bulletins/${id}`);
            return response.data?.data;
        },
        enabled: isAuthenticated && !!id,
        staleTime: 10 * 60 * 1000,
    });
}

export function useGenererBulletin() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: GenererBulletinDto) => {
            const response = await apiClient.post<{ success: boolean; data: Bulletin }>('/api/bulletins/generer', dto);
            return response.data?.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: BULLETINS_KEYS.listes() });
            toast.success('Bulletin généré avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la génération');
        },
    });
}

export function useGenererBulletinsEnMasse() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { classeId: string; periodeId: string; anneeScolaireId: string }) => {
            const response = await apiClient.post<{ success: boolean; data: { genere: number; total: number } }>(
                '/api/bulletins/generer-en-masse',
                data
            );
            return response.data?.data;
        },
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: BULLETINS_KEYS.listes() });
            if (result) {
                toast.success(`${result.genere}/${result.total} bulletins générés avec succès`);
            }
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la génération en masse');
        },
    });
}

export function useExporterBulletin() {
    return useMutation({
        mutationFn: async (bulletinId: string) => {
            const response = await apiClient.get(`/api/bulletins/${bulletinId}/export`, {
                responseType: 'blob',
            });
            return response.data;
        },
        onSuccess: (data) => {
            const url = window.URL.createObjectURL(new Blob([data as BlobPart]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `bulletin.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Bulletin téléchargé');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de l\'export');
        },
    });
}

export function useSupprimerBulletin() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/bulletins/${id}`);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: BULLETINS_KEYS.listes() });
            toast.success('Bulletin supprimé avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la suppression');
        },
    });
}
