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
import type { CmsPage, CmsSection, CmsTheme, CmsMenu, CmsWidget, CmsTemplate } from '../types/cms.types';
import type { TypeMedia } from '../types/cms.types';
import type { CmsActualite, CmsTemoignage, CmsEvenement, CmsPartenaire, CmsAbonnementNewsletter } from '../types/cms.types';
import { toast } from 'sonner';

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
        mutationFn: ({ pageId, ...data }: { pageId: string; [key: string]: any }) =>
            apiClient.post<CmsSection>(`/api/cms/pages/${pageId}/sections`, data),
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

// ==================================
// TEMPLATES
// ==================================

export function useCmsTemplates(categorie?: string) {
    return useQuery<CmsTemplate[]>({
        queryKey: ['cms', 'templates', categorie],
        queryFn: async () => {
            const params: Record<string, string> = {};
            if (categorie) params.categorie = categorie;
            const res = await apiClient.get<CmsTemplate[]>('/api/cms/templates', params);
            return res.data || [];
        },
    });
}

export function useCmsTemplate(code: string) {
    return useQuery<CmsTemplate>({
        queryKey: ['cms', 'templates', code],
        queryFn: async () => {
            const res = await apiClient.get<CmsTemplate>(`/api/cms/templates/${code}`);
            return res.data!;
        },
        enabled: !!code,
    });
}

export function useInstancierTemplate() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ code, ...data }: { code: string; titre?: string; slug?: string; publier?: boolean }) =>
            apiClient.post<CmsPage>(`/api/cms/templates/${code}/instancier`, data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms'] }); },
    });
}

// ==================================
// PREVIEW — Token pour pages brouillon
// ==================================

export function useGenererPreviewToken() {
    return useMutation({
        mutationFn: async (pageId: string) => {
            const res = await apiClient.get<{ token: string; slug: string; codeEtablissement: string }>(
                `/api/cms/pages/${pageId}/preview`,
            );
            return res.data!;
        },
    });
}

// ==================================
// RÉINITIALISATION CMS
// ==================================

export function useResetCms() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (options?: { conserverMedias?: boolean; inclureDemo?: boolean }) =>
            apiClient.post<{ pagesRecreees: number; sectionsRecreees: number; mediasCrees: number }>(
                '/api/cms/reinitialiser',
                options || {},
            ),
        onSuccess: (data: any) => {
            qc.invalidateQueries({ queryKey: ['cms'] });
            qc.invalidateQueries({ queryKey: ['public'] });
            const { pagesRecreees, sectionsRecreees, mediasCrees } = data?.data || {};
            toast.success(
                `CMS réinitialisé : ${pagesRecreees || 0} pages, ${sectionsRecreees || 0} sections${mediasCrees ? `, ${mediasCrees} médias démo` : ''}`,
            );
        },
        onError: () => {
            toast.error('Erreur lors de la réinitialisation du CMS');
        },
    });
}

// ==================================
// CONTENU DYNAMIQUE CMS (Phase 5A)
// ==================================

// --- Actualités ---
export function useCmsActualites() {
    return useQuery<CmsActualite[]>({
        queryKey: ['cms', 'contenu', 'actualites'],
        queryFn: async () => {
            const res = await apiClient.get<CmsActualite[]>('/api/cms/contenu/actualites');
            return res.data || [];
        },
    });
}

export function useCreerActualite() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<CmsActualite>) => apiClient.post<CmsActualite>('/api/cms/contenu/actualites', data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms', 'contenu'] }); },
    });
}

export function useModifierActualite() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }: any) => apiClient.patch<CmsActualite>(`/api/cms/contenu/actualites/${id}`, data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms', 'contenu'] }); },
    });
}

export function useSupprimerActualite() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => apiClient.delete(`/api/cms/contenu/actualites/${id}`),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms', 'contenu'] }); },
    });
}

// --- Témoignages ---
export function useCmsTemoignages() {
    return useQuery<CmsTemoignage[]>({
        queryKey: ['cms', 'contenu', 'temoignages'],
        queryFn: async () => {
            const res = await apiClient.get<CmsTemoignage[]>('/api/cms/contenu/temoignages');
            return res.data || [];
        },
    });
}

export function useCreerTemoignage() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<CmsTemoignage>) => apiClient.post<CmsTemoignage>('/api/cms/contenu/temoignages', data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms', 'contenu'] }); },
    });
}

export function useModifierTemoignage() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }: any) => apiClient.patch<CmsTemoignage>(`/api/cms/contenu/temoignages/${id}`, data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms', 'contenu'] }); },
    });
}

export function useSupprimerTemoignage() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => apiClient.delete(`/api/cms/contenu/temoignages/${id}`),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms', 'contenu'] }); },
    });
}

// --- Événements ---
export function useCmsEvenements() {
    return useQuery<CmsEvenement[]>({
        queryKey: ['cms', 'contenu', 'evenements'],
        queryFn: async () => {
            const res = await apiClient.get<CmsEvenement[]>('/api/cms/contenu/evenements');
            return res.data || [];
        },
    });
}

export function useCreerEvenement() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<CmsEvenement>) => apiClient.post<CmsEvenement>('/api/cms/contenu/evenements', data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms', 'contenu'] }); },
    });
}

export function useModifierEvenement() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }: any) => apiClient.patch<CmsEvenement>(`/api/cms/contenu/evenements/${id}`, data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms', 'contenu'] }); },
    });
}

export function useSupprimerEvenement() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => apiClient.delete(`/api/cms/contenu/evenements/${id}`),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms', 'contenu'] }); },
    });
}

// --- Partenaires ---
export function useCmsPartenaires() {
    return useQuery<CmsPartenaire[]>({
        queryKey: ['cms', 'contenu', 'partenaires'],
        queryFn: async () => {
            const res = await apiClient.get<CmsPartenaire[]>('/api/cms/contenu/partenaires');
            return res.data || [];
        },
    });
}

export function useCreerPartenaire() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<CmsPartenaire>) => apiClient.post<CmsPartenaire>('/api/cms/contenu/partenaires', data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms', 'contenu'] }); },
    });
}

export function useModifierPartenaire() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }: any) => apiClient.patch<CmsPartenaire>(`/api/cms/contenu/partenaires/${id}`, data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms', 'contenu'] }); },
    });
}

export function useSupprimerPartenaire() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => apiClient.delete(`/api/cms/contenu/partenaires/${id}`),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms', 'contenu'] }); },
    });
}

// --- Newsletter ---
export function useCmsNewsletter() {
    return useQuery<CmsAbonnementNewsletter[]>({
        queryKey: ['cms', 'contenu', 'newsletter'],
        queryFn: async () => {
            const res = await apiClient.get<CmsAbonnementNewsletter[]>('/api/cms/contenu/newsletter');
            return res.data || [];
        },
    });
}

export function useDesabonnerNewsletter() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => apiClient.post(`/api/cms/contenu/newsletter/desabonner/${id}`),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms', 'contenu'] }); },
    });
}

// --- Stats actualités ---
export function useCmsActualitesStats() {
    return useQuery<{ total: number; publiees: number; vues: number; enUne: number }>({
        queryKey: ['cms', 'contenu', 'actualites', 'stats'],
        queryFn: async () => {
            const res = await apiClient.get('/api/cms/contenu/actualites/stats');
            return res.data!;
        },
    });
}

// ==================================
// SEED DÉMO — Peupler avec contenu riche
// ==================================

export function useSeedDemoCms() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () => apiClient.post('/api/cms/seed-demo'),
        onSuccess: (data: any) => {
            qc.invalidateQueries({ queryKey: ['cms'] });
            qc.invalidateQueries({ queryKey: ['public'] });
            const { mediasCrees, sectionsAjoutees } = data?.data || {};
            toast.success(`Contenu démo créé : ${mediasCrees || 0} médias, ${sectionsAjoutees || 0} sections`);
        },
        onError: () => {
            toast.error('Erreur lors de la création du contenu de démonstration');
        },
    });
}
