/**
 * ==================================
 * eLISAschool - Hooks Modes de Rémunération
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
import type { ModeRemuneration } from '../types/organisation.types';
import { ORGA_KEYS } from './query-keys';

const KEYS = ORGA_KEYS.modes;

export function useModesRemuneration() {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: KEYS.all,
        queryFn: async () => { const res = await apiClient.get<ModeRemuneration[]>('/api/organisation/modes-remuneration'); return res.data || []; },
        enabled: isAuthenticated,
        staleTime: 30_000,
    });
}

export function useCreerModeRemuneration() {
    const qc = useQueryClient();
    const handleError = useHandleError();
    const { t } = useTranslation('organisation');
    return useMutation({
        mutationFn: async (dto: Partial<ModeRemuneration>) => { const res = await apiClient.post<ModeRemuneration>('/api/organisation/modes-remuneration', dto); return res.data!; },
        onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.all }); toast.success(t('toasts.modeCree')); },
        onError: (e: unknown) => handleError(e, 'Erreur création mode de rémunération'),
    });
}

export function useModifierModeRemuneration() {
    const qc = useQueryClient();
    const handleError = useHandleError();
    const { t } = useTranslation('organisation');
    return useMutation({
        mutationFn: async ({ id, ...data }: { id: string } & Partial<ModeRemuneration>) => { const res = await apiClient.patch<ModeRemuneration>(`/api/organisation/modes-remuneration/${id}`, data); return res.data!; },
        onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.all }); toast.success(t('toasts.modeModifie')); },
        onError: (e: unknown) => handleError(e, 'Erreur modification mode de rémunération'),
    });
}

export function useSupprimerModeRemuneration() {
    const qc = useQueryClient();
    const handleError = useHandleError();
    const { t } = useTranslation('organisation');
    return useMutation({
        mutationFn: async (id: string) => { await apiClient.delete(`/api/organisation/modes-remuneration/${id}`); },
        onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.all }); toast.success(t('toasts.modeSupprime')); },
        onError: (e: unknown) => handleError(e, 'Erreur suppression mode de rémunération'),
    });
}
