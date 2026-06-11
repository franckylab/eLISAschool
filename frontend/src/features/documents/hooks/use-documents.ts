/**
 * ==================================
 * eLISAschool - Hooks Documents
 * ==================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import type { Document, CreerDocumentDto, ModifierDocumentDto, DocumentFiltres, StatistiquesDocuments } from '../types/document.types';

const DOCUMENTS_KEYS = {
    all: ['documents'] as const,
    listes: () => [...DOCUMENTS_KEYS.all, 'liste'] as const,
    liste: (filtres: DocumentFiltres) => [...DOCUMENTS_KEYS.listes(), filtres] as const,
    details: () => [...DOCUMENTS_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...DOCUMENTS_KEYS.details(), id] as const,
    stats: () => [...DOCUMENTS_KEYS.all, 'stats'] as const,
};

export function useDocuments(filtres: DocumentFiltres = {}) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: DOCUMENTS_KEYS.liste(filtres),
        queryFn: async () => {
            const response = await apiClient.getPaginated<Document>('/api/documents', {
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

export function useDocument(id: string) {
    return useQuery({
        queryKey: DOCUMENTS_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: Document }>(`/api/documents/${id}`);
            return response.data?.data;
        },
        enabled: !!id && isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

export function useCreerDocument() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { dto: CreerDocumentDto; fichier: File }) => {
            const formData = new FormData();
            formData.append('fichier', data.fichier);
            formData.append('titre', data.dto.titre);
            if (data.dto.description) formData.append('description', data.dto.description);
            formData.append('categorie', data.dto.categorie);
            formData.append('estPublic', String(data.dto.estPublic || false));
            if (data.dto.tags) formData.append('tags', JSON.stringify(data.dto.tags));

            const response = await apiClient.post<{ success: boolean; data: Document }>('/api/documents', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data?.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: DOCUMENTS_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: DOCUMENTS_KEYS.stats() });
            toast.success('Document uploadé avec succès');
        },
    });
}

export function useModifierDocument(id: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: ModifierDocumentDto) => {
            const response = await apiClient.patch<{ success: boolean; data: Document }>(`/api/documents/${id}`, dto);
            return response.data?.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: DOCUMENTS_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: DOCUMENTS_KEYS.detail(id) });
            queryClient.invalidateQueries({ queryKey: DOCUMENTS_KEYS.stats() });
            toast.success('Document modifié avec succès');
        },
    });
}

export function useSupprimerDocument() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await apiClient.delete(`/api/documents/${id}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: DOCUMENTS_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: DOCUMENTS_KEYS.stats() });
            toast.success('Document supprimé avec succès');
        },
    });
}

export function useTelechargerDocument() {
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await apiClient.get(`/api/documents/${id}/telecharger`, {
                responseType: 'blob',
            });
            return response.data;
        },
        onSuccess: (data, id) => {
            const url = window.URL.createObjectURL(new Blob([data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `document-${id}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Téléchargement lancé');
        },
    });
}

export function useStatistiquesDocuments() {
    return useQuery({
        queryKey: DOCUMENTS_KEYS.stats(),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: StatistiquesDocuments }>('/api/documents/statistiques');
            return response.data?.data;
        },
        enabled: isAuthenticated,
        staleTime: 10 * 60 * 1000,
    });
}
