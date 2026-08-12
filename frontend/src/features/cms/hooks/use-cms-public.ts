/**
 * ==================================
 * eLISAschool - Hooks CMS publics
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Hooks TanStack Query pour les données CMS publiques.
 * Utilisés par les routes /e/:code.
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
    EtablissementPublic,
    PageAccueilData,
    CmsPage,
    PagePubliqueData,
    CmsTheme,
    CmsMenu,
    CmsWidget,
} from '../types/cms.types';

// ==================================
// GET /api/public/e/:code — Données établissement
// ==================================
export function useEtablissementPublic(code: string) {
    return useQuery<EtablissementPublic>({
        queryKey: ['public', code, 'etab'],
        queryFn: async () => {
            const res = await apiClient.get<EtablissementPublic>(`/api/public/e/${code}`);
            return res.data!;
        },
        staleTime: 5 * 60 * 1000, // 5 min
        gcTime: 10 * 60 * 1000,   // 10 min
        retry: 2,
    });
}

// ==================================
// GET /api/public/e/:code/accueil — Page d'accueil complète
// ==================================
export function usePageAccueil(code: string) {
    return useQuery<PageAccueilData>({
        queryKey: ['public', code, 'accueil'],
        queryFn: async () => {
            const res = await apiClient.get<PageAccueilData>(`/api/public/e/${code}/accueil`);
            return res.data!;
        },
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 2,
    });
}

// ==================================
// GET /api/public/e/:code/pages — Liste pages publiées
// ==================================
export function usePagesPubliques(code: string) {
    return useQuery<CmsPage[]>({
        queryKey: ['public', code, 'pages'],
        queryFn: async () => {
            const res = await apiClient.get<CmsPage[]>(`/api/public/e/${code}/pages`);
            return res.data || [];
        },
        staleTime: 5 * 60 * 1000,
    });
}

// ==================================
// GET /api/public/e/:code/pages/:slug — Détail page + sections
// ==================================
export function usePagePublique(code: string, slug: string) {
    return useQuery<PagePubliqueData>({
        queryKey: ['public', code, 'page', slug],
        queryFn: async () => {
            const res = await apiClient.get<PagePubliqueData>(`/api/public/e/${code}/pages/${slug}`);
            return res.data!;
        },
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });
}

// ==================================
// GET /api/public/e/:code/theme — Thème actif
// ==================================
export function useThemePublic(code: string) {
    return useQuery<CmsTheme | null>({
        queryKey: ['public', code, 'theme'],
        queryFn: async () => {
            const res = await apiClient.get<CmsTheme>(`/api/public/e/${code}/theme`);
            return res.data || null;
        },
        staleTime: 10 * 60 * 1000, // 10 min (thème change rarement)
    });
}

// ==================================
// GET /api/public/e/:code/menus — Menus navigation
// ==================================
export function useMenusPublic(code: string) {
    return useQuery<CmsMenu[]>({
        queryKey: ['public', code, 'menus'],
        queryFn: async () => {
            const res = await apiClient.get<CmsMenu[]>(`/api/public/e/${code}/menus`);
            return res.data || [];
        },
        staleTime: 5 * 60 * 1000,
    });
}

// ==================================
// GET /api/public/e/:code/widgets — Widgets actifs
// ==================================
export function useWidgetsPublic(code: string) {
    return useQuery<CmsWidget[]>({
        queryKey: ['public', code, 'widgets'],
        queryFn: async () => {
            const res = await apiClient.get<CmsWidget[]>(`/api/public/e/${code}/widgets`);
            return res.data || [];
        },
        staleTime: 5 * 60 * 1000,
    });
}

// ==================================
// POST /api/public/e/:code/contact — Formulaire contact
// ==================================
export async function envoyerContactPublic(
    code: string,
    data: { nom: string; email: string; sujet: string; message: string },
): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.post<{ success: boolean; message: string }>(
        `/api/public/e/${code}/contact`,
        data,
    );
    return res.data!;
}
