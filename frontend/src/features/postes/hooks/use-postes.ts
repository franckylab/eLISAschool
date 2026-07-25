/**
 * ==================================
 * eLISAschool - Hooks Postes
 * ==================================
 * Hooks TanStack Query pour la gestion des postes organisationnels.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';
import { useHandleError } from '@/features/organisation/hooks/use-handle-error';
import { ORGA_KEYS } from '@/features/organisation/hooks/query-keys';
import type { Poste, CreatePosteDto, UpdatePosteDto, PosteFiltres } from '../types/poste.types';
import type { AffectationPoste } from '@/features/personnel/types/affectation.types';

const POSTES_KEYS = {
    all: ['postes'] as const,
    list: (filtres?: PosteFiltres) => [...POSTES_KEYS.all, 'list', filtres] as const,
    detail: (id: string) => [...POSTES_KEYS.all, 'detail', id] as const,
    vacants: () => [...POSTES_KEYS.all, 'vacants'] as const,
    parFonction: (fonctionId: string) => [...POSTES_KEYS.all, 'fonction', fonctionId] as const,
    statistiques: () => [...POSTES_KEYS.all, 'statistiques'] as const,
};

export function usePostes(filtres?: PosteFiltres) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: POSTES_KEYS.list(filtres),
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filtres?.page) params.set('page', String(filtres.page));
            if (filtres?.limit) params.set('limit', String(filtres.limit));
            if (filtres?.search) params.set('search', filtres.search);
            if (filtres?.statut) params.set('statut', filtres.statut);
            if (filtres?.fonctionId) params.set('fonctionId', filtres.fonctionId);
            if (filtres?.uniteOrganisationnelleId) params.set('uniteOrganisationnelleId', filtres.uniteOrganisationnelleId);
            if (filtres?.vacant !== undefined) params.set('vacant', String(filtres.vacant));
            if (filtres?.sortBy) params.set('sortBy', filtres.sortBy);
            if (filtres?.sortOrder) params.set('sortOrder', filtres.sortOrder);
            const res = await apiClient.get<{ items: Poste[]; meta: Record<string, number> }>(`/api/organisation/postes?${params}`);
            const payload = res.data;
            return {
                items: (payload?.items ?? []) as Poste[],
                meta: payload?.meta ?? { currentPage: 1, itemsPerPage: filtres?.limit ?? 20, totalItems: 0, totalPages: 1 },
            };
        },
        enabled: isAuthenticated,
        staleTime: 30_000,
        placeholderData: (previousData) => previousData,
    });
}

export function useTousPostes() {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: [...POSTES_KEYS.all, 'all'],
        queryFn: async () => {
            const res = await apiClient.get<Poste[]>('/api/organisation/postes/all');
            return res.data ?? [];
        },
        staleTime: 5 * 60 * 1000,
        placeholderData: (previousData) => previousData,
        enabled: isAuthenticated,
    });
}

export function usePostesVacants() {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: POSTES_KEYS.vacants(),
        queryFn: async () => {
            const res = await apiClient.get<Poste[]>('/api/organisation/postes/vacants');
            return res.data ?? [];
        },
        staleTime: 2 * 60 * 1000,
        placeholderData: (previousData) => previousData,
        enabled: isAuthenticated,
    });
}

export function usePostesParFonction(fonctionId: string) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: POSTES_KEYS.parFonction(fonctionId),
        queryFn: async () => {
            const res = await apiClient.get<Poste[]>(`/api/organisation/postes/fonction/${fonctionId}`);
            return res.data ?? [];
        },
        enabled: !!fonctionId && isAuthenticated,
        staleTime: 30_000,
        placeholderData: (previousData) => previousData,
    });
}

export function usePoste(id: string) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: POSTES_KEYS.detail(id),
        queryFn: async () => {
            const res = await apiClient.get<Poste>(`/api/organisation/postes/${id}`);
            return res.data;
        },
        enabled: !!id && isAuthenticated,
        staleTime: 2 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

export function usePosteOccupants(id: string) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: [...POSTES_KEYS.detail(id), 'occupants'],
        queryFn: async () => {
            const res = await apiClient.get<AffectationPoste[]>(`/api/organisation/postes/${id}/occupants`);
            return res.data ?? [];
        },
        enabled: !!id && isAuthenticated,
        staleTime: 30_000,
    });
}

export function useCreerPoste() {
    const qc = useQueryClient();
    const handleError = useHandleError();
    const { t } = useTranslation('organisation');
    return useMutation({
        mutationFn: async (dto: CreatePosteDto) => {
            const res = await apiClient.post<Poste>('/api/organisation/postes', dto);
            return res.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: POSTES_KEYS.all });
            qc.invalidateQueries({ queryKey: ORGA_KEYS.organigramme.all });
            qc.invalidateQueries({ queryKey: ORGA_KEYS.unites.all });
            toast.success(t('toasts.posteCree'));
        },
        onError: (e: unknown) => handleError(e, 'Erreur lors de la création du poste'),
    });
}

export function useModifierPoste() {
    const qc = useQueryClient();
    const handleError = useHandleError();
    const { t } = useTranslation('organisation');
    return useMutation({
        mutationFn: async ({ id, dto }: { id: string; dto: UpdatePosteDto }) => {
            const res = await apiClient.patch<Poste>(`/api/organisation/postes/${id}`, dto);
            return res.data;
        },
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: POSTES_KEYS.all });
            qc.invalidateQueries({ queryKey: POSTES_KEYS.detail(data.id) });
            qc.invalidateQueries({ queryKey: ORGA_KEYS.organigramme.all });
            qc.invalidateQueries({ queryKey: ORGA_KEYS.unites.all });
            toast.success(t('toasts.posteModifie'));
        },
        onError: (e: unknown) => handleError(e, 'Erreur lors de la modification du poste'),
    });
}

export function useSupprimerPoste() {
    const qc = useQueryClient();
    const handleError = useHandleError();
    const { t } = useTranslation('organisation');
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/organisation/postes/${id}`);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: POSTES_KEYS.all });
            qc.invalidateQueries({ queryKey: ORGA_KEYS.organigramme.all });
            qc.invalidateQueries({ queryKey: ORGA_KEYS.unites.all });
            toast.success(t('toasts.posteSupprime'));
        },
        onError: (e: unknown) => handleError(e, 'Erreur lors de la suppression du poste'),
    });
}
