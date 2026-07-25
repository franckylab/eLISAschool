/**
 * ==================================
 * eLISAschool - Hooks Niveaux de Responsabilité
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/lib/api-client';
import { useHandleError } from './use-handle-error';
import type { NiveauResponsabilite } from '../types/organisation.types';
import { ORGA_KEYS } from './query-keys';

const KEYS = ORGA_KEYS.niveaux;

export function useNiveauxResponsabilite() {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: KEYS.all,
        queryFn: async () => { const res = await apiClient.get<NiveauResponsabilite[]>('/api/organisation/niveaux-responsabilite'); return res.data || []; },
        enabled: isAuthenticated,
        staleTime: 30_000,
    });
}

export function useCreerNiveauResponsabilite() {
    const qc = useQueryClient();
    const handleError = useHandleError();
    const { t } = useTranslation('organisation');
    return useMutation({
        mutationFn: async (dto: Partial<NiveauResponsabilite>) => { const res = await apiClient.post<NiveauResponsabilite>('/api/organisation/niveaux-responsabilite', dto); return res.data!; },
        onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.all }); qc.invalidateQueries({ queryKey: ORGA_KEYS.stats.all }); toast.success(t('toasts.niveauCree')); },
        onError: (e: unknown) => handleError(e, 'Erreur création niveau'),
    });
}

export function useModifierNiveauResponsabilite() {
    const qc = useQueryClient();
    const handleError = useHandleError();
    const { t } = useTranslation('organisation');
    return useMutation({
        mutationFn: async ({ id, ...data }: { id: string } & Partial<NiveauResponsabilite>) => { const res = await apiClient.patch<NiveauResponsabilite>(`/api/organisation/niveaux-responsabilite/${id}`, data); return res.data!; },
        onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.all }); qc.invalidateQueries({ queryKey: ORGA_KEYS.stats.all }); toast.success(t('toasts.niveauModifie')); },
        onError: (e: unknown) => handleError(e, 'Erreur modification niveau'),
    });
}

export function useSupprimerNiveauResponsabilite() {
    const qc = useQueryClient();
    const handleError = useHandleError();
    const { t } = useTranslation('organisation');
    return useMutation({
        mutationFn: async (id: string) => { await apiClient.delete(`/api/organisation/niveaux-responsabilite/${id}`); },
        onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.all }); qc.invalidateQueries({ queryKey: ORGA_KEYS.stats.all }); toast.success(t('toasts.niveauSupprime')); },
        onError: (e: unknown) => handleError(e, 'Erreur suppression niveau'),
    });
}
