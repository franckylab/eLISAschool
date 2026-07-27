/**
 * ==================================
 * eLISAschool - Hook Élèves
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * Intégration API avec TanStack Query pour le module Élèves
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';
import { useHandleError } from '@/hooks/use-handle-error';
import { toast } from 'sonner';
import type {
    Eleve,
    CreerEleveDto,
    ModifierEleveDto,
    EleveFiltres,
    EleveStats,
} from '../types/eleve.types';

const ELEVES_KEYS = {
    all: ['eleves'] as const,
    listes: () => [...ELEVES_KEYS.all, 'liste'] as const,
    liste: (filtres: EleveFiltres) => [...ELEVES_KEYS.listes(), filtres] as const,
    details: () => [...ELEVES_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...ELEVES_KEYS.details(), id] as const,
    stats: () => [...ELEVES_KEYS.all, 'stats'] as const,
};

// ─── QUERIES ─────────────────────────────────────────

export function useEleves(filtres: EleveFiltres = {}) {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: ELEVES_KEYS.liste(filtres),
        queryFn: async () => {
            const response = await apiClient.getPaginated<Eleve>('/api/eleves', {
                page: filtres.page || 1,
                limit: filtres.limit || 20,
                sortBy: filtres.sortBy,
                sortOrder: filtres.sortOrder,
                ...filtres,
            });
            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

export function useEleve(id: string) {
    return useQuery({
        queryKey: ELEVES_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<Eleve>(`/api/eleves/${id}`);
            return response.data;
        },
        enabled: !!id,
        staleTime: 10 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

export function useElevesStats(etablissementId?: string) {
    return useQuery({
        queryKey: ELEVES_KEYS.stats(),
        queryFn: async () => {
            const response = await apiClient.get<EleveStats>('/api/eleves/stats');
            return response.data;
        },
        enabled: !!etablissementId,
        staleTime: 15 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

// ─── MUTATIONS ───────────────────────────────────────

export function useCreerEleve() {
    const queryClient = useQueryClient();
    const handleError = useHandleError();
    const { t } = useTranslation('eleves');

    return useMutation({
        mutationFn: async (dto: CreerEleveDto) => {
            const response = await apiClient.post<{ data: Eleve }>('/api/eleves', dto);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ELEVES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: ELEVES_KEYS.stats() });
            toast.success(t('toasts.eleveCree', { nom: data?.data?.nom, prenom: data?.data?.prenom }));
        },
        onError: (err: unknown) => {
            handleError(err, t('toasts.erreurCreation'));
        },
    });
}

export function useModifierEleve() {
    const queryClient = useQueryClient();
    const handleError = useHandleError();
    const { t } = useTranslation('eleves');

    return useMutation({
        mutationFn: async (dto: ModifierEleveDto) => {
            const { id, ...data } = dto;
            const response = await apiClient.patch<{ data: Eleve }>(`/api/eleves/${id}`, data);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ELEVES_KEYS.listes() });
            if (data?.data?.id) {
                queryClient.invalidateQueries({ queryKey: ELEVES_KEYS.detail(data.data.id) });
            }
            queryClient.invalidateQueries({ queryKey: ELEVES_KEYS.stats() });
            toast.success(t('toasts.eleveModifie', { nom: data?.data?.nom, prenom: data?.data?.prenom }));
        },
        onError: (err: unknown) => {
            handleError(err, t('toasts.erreurModification'));
        },
    });
}

export function useSupprimerEleve() {
    const queryClient = useQueryClient();
    const handleError = useHandleError();
    const { t } = useTranslation('eleves');

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/eleves/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ELEVES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: ELEVES_KEYS.stats() });
            toast.success(t('toasts.eleveSupprime'));
        },
        onError: (err: unknown) => {
            handleError(err, t('toasts.erreurSuppression'));
        },
    });
}

export function useImporterEleves() {
    const queryClient = useQueryClient();
    const handleError = useHandleError();
    const { t } = useTranslation('eleves');

    return useMutation({
        mutationFn: async (formData: FormData) => {
            const response = await apiClient.upload<{ data: { importe: number; erreurs: number } }>(
                '/api/eleves/import',
                formData
            );
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ELEVES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: ELEVES_KEYS.stats() });
            toast.success(t('toasts.importReussi', { count: data?.data?.importe }));
        },
        onError: (err: unknown) => {
            handleError(err, t('toasts.erreurImport'));
        },
    });
}

export function useExporterEleves() {
    const handleError = useHandleError();
    const { t } = useTranslation('eleves');

    return useMutation({
        mutationFn: async (filtres?: EleveFiltres) => {
            const response = await apiClient.get<Blob>('/api/eleves/export', {
                format: 'csv',
                ...filtres,
            });
            return response.data;
        },
        onSuccess: (data) => {
            if (!data) return;
            const url = window.URL.createObjectURL(data instanceof Blob ? data : new Blob([data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `eleves_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success(t('toasts.exportReussi'));
        },
        onError: (err: unknown) => {
            handleError(err, t('toasts.erreurExport'));
        },
    });
}
