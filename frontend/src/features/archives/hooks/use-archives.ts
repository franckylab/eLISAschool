/**
 * ==================================
 * eLISAschool - Hooks Archives
 * ==================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import type { Archive, CreerArchiveDto, StatistiquesArchives, ArchiveFiltres } from '../types/archives.types';

const ARCHIVES_KEYS = {
    listes: (filtres?: ArchiveFiltres) => ['archives', 'liste', filtres] as const,
    detail: (id: string) => ['archives', 'detail', id] as const,
    stats: () => ['archives', 'stats'] as const,
};

export function useArchives(filtres?: ArchiveFiltres) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ARCHIVES_KEYS.listes(filtres),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: Archive[]; meta: any }>('/api/archives', { params: filtres });
            return { data: response.data.data, meta: response.data.meta };
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

export function useArchive(id: string) {
    return useQuery({
        queryKey: ARCHIVES_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: Archive }>(`/api/archives/${id}`);
            return response.data.data;
        },
        enabled: !!id,
    });
}

export function useCreerArchive() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { dto: CreerArchiveDto; fichier: File }) => {
            const formData = new FormData();
            formData.append('fichier', data.fichier);
            formData.append('titre', data.dto.titre);
            if (data.dto.description) formData.append('description', data.dto.description);
            formData.append('categorie', data.dto.categorie);
            if (data.dto.anneeScolaire) formData.append('anneeScolaire', data.dto.anneeScolaire);
            if (data.dto.tags) formData.append('tags', JSON.stringify(data.dto.tags));

            const response = await apiClient.post<{ success: boolean; data: Archive }>('/api/archives', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ARCHIVES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: ARCHIVES_KEYS.stats() });
            toast.success('Archive créée avec succès');
        },
    });
}

export function useSupprimerArchive() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/archives/${id}`);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ARCHIVES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: ARCHIVES_KEYS.stats() });
            toast.success('Archive supprimée avec succès');
        },
    });
}

export function useTelechargerArchive() {
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await apiClient.get(`/api/archives/${id}/telecharger`, {
                responseType: 'blob',
            });
            return response.data;
        },
        onSuccess: (data, id) => {
            const url = window.URL.createObjectURL(new Blob([data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `archive-${id}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Téléchargement lancé');
        },
    });
}

export function useStatistiquesArchives() {
    return useQuery({
        queryKey: ARCHIVES_KEYS.stats(),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: StatistiquesArchives }>('/api/archives/statistiques');
            return response.data.data;
        },
        enabled: isAuthenticated,
        staleTime: 10 * 60 * 1000,
    });
}
