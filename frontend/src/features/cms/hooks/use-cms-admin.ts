/**
 * ==================================
 * eLISAschool - Hooks CMS admin (CRUD)
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Hooks TanStack Query pour la gestion CMS authentifiée.
 * CRUD pages, sections, thèmes, menus, widgets, versions.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { CmsPage, CmsSection, CmsTheme, CmsMenu, CmsWidget } from '../types/cms.types';
import type { TypeMedia } from '../types/cms.types';

// ==================================
// PAGES
// ==================================

export function useCmsPages() {
    return useQuery<CmsPage[]>({
        queryKey: ['cms', 'pages'],
        queryFn: async () => {
            const res = await apiClient.get<CmsPage[]>('/api/cms/pages');
            return res.data || [];
        },
    });
}

export function useCmsPage(id: string) {
    return useQuery<CmsPage>({
        queryKey: ['cms', 'pages', id],
        queryFn: async () => {
            const res = await apiClient.get<CmsPage>(`/api/cms/pages/${id}`);
            return res.data!;
        },
        enabled: !!id,
    });
}

export function useCreerPage() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => apiClient.post<CmsPage>('/api/cms/pages', data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms'] }); },
    });
}

export function useModifierPage() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }: any) => apiClient.patch<CmsPage>(`/api/cms/pages/${id}`, data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms'] }); },
    });
}

export function useSupprimerPage() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => apiClient.delete(`/api/cms/pages/${id}`),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms'] }); },
    });
}

export function usePublierPage() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => apiClient.post<CmsPage>(`/api/cms/pages/${id}/publier`),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms'] }); },
    });
}

// ==================================
// SECTIONS
// ==================================

export function useCreerSection() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => apiClient.post<CmsSection>('/api/cms/sections', data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms'] }); },
    });
}

export function useModifierSection() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }: any) => apiClient.patch<CmsSection>(`/api/cms/sections/${id}`, data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms'] }); },
    });
}

export function useSupprimerSection() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => apiClient.delete(`/api/cms/sections/${id}`),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms'] }); },
    });
}

export function useReordonnerSections() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: { pageId: string; sections: { id: string; ordre: number }[] }) =>
            apiClient.post('/api/cms/sections/reordonner', data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms'] }); },
    });
}

// ==================================
// THÈMES
// ==================================

export function useCmsThemes() {
    return useQuery<CmsTheme[]>({
        queryKey: ['cms', 'themes'],
        queryFn: async () => {
            const res = await apiClient.get<CmsTheme[]>('/api/cms/themes');
            return res.data || [];
        },
    });
}

export function useActiverTheme() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => apiClient.post(`/api/cms/themes/${id}/activer`),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms'] }); },
    });
}

// ==================================
// MENUS
// ==================================

export function useCmsMenus() {
    return useQuery<CmsMenu[]>({
        queryKey: ['cms', 'menus'],
        queryFn: async () => {
            const res = await apiClient.get<CmsMenu[]>('/api/cms/menus');
            return res.data || [];
        },
    });
}

export function useCreerMenu() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => apiClient.post<CmsMenu>('/api/cms/menus', data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms'] }); },
    });
}

export function useModifierMenu() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }: any) => apiClient.patch<CmsMenu>(`/api/cms/menus/${id}`, data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms'] }); },
    });
}

export function useSupprimerMenu() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => apiClient.delete(`/api/cms/menus/${id}`),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms'] }); },
    });
}

// ==================================
// WIDGETS
// ==================================

export function useCmsWidgets() {
    return useQuery<CmsWidget[]>({
        queryKey: ['cms', 'widgets'],
        queryFn: async () => {
            const res = await apiClient.get<CmsWidget[]>('/api/cms/widgets');
            return res.data || [];
        },
    });
}

export function useCreerWidget() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => apiClient.post<CmsWidget>('/api/cms/widgets', data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms'] }); },
    });
}

export function useModifierWidget() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }: any) => apiClient.patch<CmsWidget>(`/api/cms/widgets/${id}`, data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms'] }); },
    });
}

export function useSupprimerWidget() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => apiClient.delete(`/api/cms/widgets/${id}`),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms'] }); },
    });
}

// ==================================
// MÉDIAS
// ==================================

export function useCmsMedias(type?: string, dossier?: string) {
    return useQuery<any[]>({
        queryKey: ['cms', 'medias', type, dossier],
        queryFn: async () => {
            const params: Record<string, string> = {};
            if (type) params.type = type;
            if (dossier) params.dossier = dossier;
            const res = await apiClient.get<any[]>('/api/cms/medias', params);
            return res.data || [];
        },
    });
}

export function useCreerMedia() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: { nom: string; url: string; type: TypeMedia; taille: number; mimeType: string; dossier?: string }) =>
            apiClient.post<any>('/api/cms/medias', data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms', 'medias'] }); },
    });
}

export function useSupprimerMedia() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => apiClient.delete(`/api/cms/medias/${id}`),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms', 'medias'] }); },
    });
}

// ==================================
// VERSIONS (historique)
// ==================================

export function useCmsVersions(entiteType: string, entiteId: string) {
    return useQuery<any[]>({
        queryKey: ['cms', 'versions', entiteType, entiteId],
        queryFn: async () => {
            const res = await apiClient.get<any[]>(`/api/cms/versions?entiteType=${entiteType}&entiteId=${entiteId}`);
            return res.data || [];
        },
        enabled: !!entiteId,
    });
}

export function useRestaurerVersion() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => apiClient.post(`/api/cms/versions/${id}/restaurer`),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms'] }); },
    });
}
