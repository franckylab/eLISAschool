/**
 * ==================================
 * eLISAschool - Hooks Bulletins
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * Hooks TanStack Query du module Bulletins.
 * Endpoints backend : /api/bulletins, /api/bulletins/generate,
 * /api/bulletins/:id/export (HTML A4 imprimable).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';
import { useHandleError } from './use-handle-error';
import type {
    Bulletin,
    GenererBulletinsDto,
    ModifierBulletinDto,
    BulletinFiltres,
} from '../types/bulletin.types';

export const BULLETINS_KEYS = {
    all: ['bulletins'] as const,
    listes: () => [...BULLETINS_KEYS.all, 'liste'] as const,
    liste: (filtres: BulletinFiltres) => [...BULLETINS_KEYS.listes(), filtres] as const,
    details: () => [...BULLETINS_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...BULLETINS_KEYS.details(), id] as const,
};

/**
 * Ne conserve que les paramètres non vides.
 */
function nettoyerParams(source: Record<string, string | number | undefined>): Record<string, string | number> {
    const params: Record<string, string | number> = {};
    for (const [cle, valeur] of Object.entries(source)) {
        if (valeur !== undefined && valeur !== '') {
            params[cle] = valeur;
        }
    }
    return params;
}

export function useBulletins(filtres: BulletinFiltres = {}) {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: BULLETINS_KEYS.liste(filtres),
        queryFn: async () => {
            const response = await apiClient.getPaginated<Bulletin>('/api/bulletins', {
                page: filtres.page || 1,
                limit: filtres.limit || 20,
                ...nettoyerParams({
                    recherche: filtres.recherche,
                    eleveId: filtres.eleveId,
                    classeAnneeId: filtres.classeAnneeId,
                    periodeId: filtres.periodeId,
                    publie: filtres.publie,
                    sortBy: filtres.sortBy,
                    sortOrder: filtres.sortOrder,
                }),
            });
            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

export function useBulletin(id: string) {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: BULLETINS_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<Bulletin>(`/api/bulletins/${id}`);
            return response.data;
        },
        enabled: isAuthenticated && !!id,
        staleTime: 5 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

/**
 * Génération de bulletins — POST /api/bulletins/generate.
 * Génère pour toute la classe si eleveId est omis.
 */
export function useGenererBulletins() {
    const queryClient = useQueryClient();
    const { t } = useTranslation('bulletins');
    const handleError = useHandleError();

    return useMutation({
        mutationFn: async (dto: GenererBulletinsDto) => {
            const response = await apiClient.post<Bulletin[]>('/api/bulletins/generate', dto);
            return response.data ?? [];
        },
        onSuccess: (bulletins) => {
            queryClient.invalidateQueries({ queryKey: BULLETINS_KEYS.all });
            toast.success(t('toastGeneres', { count: bulletins.length }));
        },
        onError: (e: unknown) => handleError(e, t('erreurGeneration')),
    });
}

/**
 * Modification d'un bulletin (appréciations, publication).
 * publie: true exige bulletins:publier côté backend.
 */
export function useModifierBulletin() {
    const queryClient = useQueryClient();
    const { t } = useTranslation('bulletins');
    const handleError = useHandleError();

    return useMutation({
        mutationFn: async ({ id, ...dto }: ModifierBulletinDto) => {
            const response = await apiClient.patch<Bulletin>(`/api/bulletins/${id}`, dto);
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: BULLETINS_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: BULLETINS_KEYS.detail(variables.id) });
            if (variables.publie === true) {
                toast.success(t('toastPublie'));
            } else if (variables.publie === false) {
                toast.success(t('toastDepublie'));
            } else {
                toast.success(t('toastModifie'));
            }
        },
        onError: (e: unknown) => handleError(e, t('erreurModification')),
    });
}

export function useSupprimerBulletin() {
    const queryClient = useQueryClient();
    const { t } = useTranslation('bulletins');
    const handleError = useHandleError();

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/bulletins/${id}`);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: BULLETINS_KEYS.listes() });
            toast.success(t('toastSupprime'));
        },
        onError: (e: unknown) => handleError(e, t('erreurSuppression')),
    });
}

/**
 * Export d'un bulletin : récupère le document HTML A4 du backend
 * puis l'ouvre dans un nouvel onglet et déclenche l'impression.
 */
export function useExporterBulletin() {
    const { t } = useTranslation('bulletins');
    const handleError = useHandleError();

    return useMutation({
        mutationFn: async (bulletinId: string) => {
            const baseUrl: string = import.meta.env.VITE_API_URL ?? '';
            const token = apiClient.getAccessToken();
            const response = await fetch(`${baseUrl}/api/bulletins/${bulletinId}/export`, {
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                credentials: 'include',
            });
            if (!response.ok) {
                throw new Error(t('erreurExport'));
            }
            return response.text();
        },
        onSuccess: (html) => {
            const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const fenetre = window.open(url, '_blank');
            if (!fenetre) {
                URL.revokeObjectURL(url);
                toast.error(t('erreurPopupBloquee'));
                return;
            }
            fenetre.focus();
            // Laisse le temps au document de se rendre avant l'impression
            fenetre.addEventListener('load', () => {
                fenetre.setTimeout(() => fenetre.print(), 300);
                URL.revokeObjectURL(url);
            });
            toast.success(t('toastExporte'));
        },
        onError: (e: unknown) => handleError(e, t('erreurExport')),
    });
}
