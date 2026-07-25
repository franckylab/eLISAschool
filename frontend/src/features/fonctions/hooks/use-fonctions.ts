/**
 * ==================================
 * eLISAschool - Hooks Fonctions
 * ==================================
 * Hooks TanStack Query pour la gestion des fonctions organisationnelles.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/auth.store';
import { useHandleError } from '@/features/organisation/hooks/use-handle-error';
import { ORGA_KEYS } from '@/features/organisation/hooks/query-keys';
import type { PaginatedResult } from '@shared/types/api.types';
import type { Fonction, CreerFonctionDto, ModifierFonctionDto, FonctionFiltres } from '../types/fonction.types';

const FONCTIONS_KEYS = {
    all: ['fonctions'] as const,
    list: (filtres?: FonctionFiltres) => [...FONCTIONS_KEYS.all, 'list', filtres] as const,
    detail: (id: string) => [...FONCTIONS_KEYS.all, 'detail', id] as const,
    membres: (id: string) => [...FONCTIONS_KEYS.all, 'membres', id] as const,
    arbre: () => [...FONCTIONS_KEYS.all, 'arbre'] as const,
    toutes: () => [...FONCTIONS_KEYS.all, 'toutes'] as const,
};

// ---- Queries ----

export function useFonctions(filtres?: FonctionFiltres) {
    const { isAuthenticated } = useAuthStore();
    const params = new URLSearchParams();
    if (filtres?.recherche) params.set('search', filtres.recherche);
    if (filtres?.parentId !== undefined) {
        if (filtres.parentId === null) params.set('parentId', '');
        else params.set('parentId', filtres.parentId);
    }
    if (filtres?.actif !== undefined) params.set('actif', String(filtres.actif));
    if (filtres?.page) params.set('page', String(filtres.page));
    if (filtres?.limit) params.set('limit', String(filtres.limit));

    return useQuery({
        queryKey: FONCTIONS_KEYS.list(filtres),
        queryFn: async () => {
            const res = await apiClient.get<PaginatedResult<Fonction>>(`/api/organisation/fonctions?${params}`);
            return res.data;
        },
        enabled: isAuthenticated,
        staleTime: 30_000,
        placeholderData: (previousData) => previousData,
    });
}

export function useFonctionMembres(id: string) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: FONCTIONS_KEYS.membres(id),
        queryFn: async () => {
            const res = await apiClient.get<Fonction[]>(`/api/organisation/fonctions/${id}/membres`);
            return res.data ?? [];
        },
        enabled: !!id && isAuthenticated,
        staleTime: 30_000,
    });
}

export function useArbreFonctions() {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: FONCTIONS_KEYS.arbre(),
        queryFn: async () => {
            const res = await apiClient.get<Fonction[]>('/api/organisation/fonctions/arbre');
            return res.data ?? [];
        },
        enabled: isAuthenticated,
        staleTime: 30_000,
    });
}

export function useToutesFonctions() {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: FONCTIONS_KEYS.toutes(),
        queryFn: async () => {
            const res = await apiClient.get<Fonction[]>('/api/organisation/fonctions/all');
            return res.data ?? [];
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

export function useFonction(id: string) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: FONCTIONS_KEYS.detail(id),
        queryFn: async () => {
            const res = await apiClient.get<Fonction>(`/api/organisation/fonctions/${id}`);
            return res.data;
        },
        enabled: !!id && isAuthenticated,
        staleTime: 2 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

// ---- Mutations ----

export function useCreerFonction() {
    const qc = useQueryClient();
    const handleError = useHandleError();
    const { t } = useTranslation('organisation');
    return useMutation({
        mutationFn: async (dto: CreerFonctionDto) => {
            const res = await apiClient.post<Fonction>('/api/organisation/fonctions', dto);
            return res.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: FONCTIONS_KEYS.all });
            qc.invalidateQueries({ queryKey: ORGA_KEYS.organigramme.all });
            qc.invalidateQueries({ queryKey: ORGA_KEYS.stats.all });
            toast.success(t('toasts.fonctionCreee'));
        },
        onError: (e: unknown) => handleError(e, 'Erreur lors de la création de la fonction'),
    });
}

export function useModifierFonction() {
    const qc = useQueryClient();
    const handleError = useHandleError();
    const { t } = useTranslation('organisation');
    return useMutation({
        mutationFn: async ({ id, dto }: { id: string; dto: ModifierFonctionDto }) => {
            const res = await apiClient.patch<Fonction>(`/api/organisation/fonctions/${id}`, dto);
            return res.data;
        },
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: FONCTIONS_KEYS.all });
            qc.invalidateQueries({ queryKey: FONCTIONS_KEYS.detail(data.id) });
            qc.invalidateQueries({ queryKey: ORGA_KEYS.organigramme.all });
            qc.invalidateQueries({ queryKey: ORGA_KEYS.stats.all });
            toast.success(t('toasts.fonctionModifiee'));
        },
        onError: (e: unknown) => handleError(e, 'Erreur lors de la modification de la fonction'),
    });
}

export function useSupprimerFonction() {
    const qc = useQueryClient();
    const handleError = useHandleError();
    const { t } = useTranslation('organisation');
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/organisation/fonctions/${id}`);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: FONCTIONS_KEYS.all });
            qc.invalidateQueries({ queryKey: ORGA_KEYS.organigramme.all });
            qc.invalidateQueries({ queryKey: ORGA_KEYS.stats.all });
            toast.success(t('toasts.fonctionSupprimee'));
        },
        onError: (e: unknown) => handleError(e, 'Erreur lors de la suppression de la fonction'),
    });
}
