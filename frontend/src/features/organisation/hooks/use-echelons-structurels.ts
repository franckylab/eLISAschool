/**
 * ==================================
 * eLISAschool - Hooks Échelons Structurels
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
import type { EchelonStructurel } from '../types/organisation.types';
import { ORGA_KEYS } from './query-keys';

const KEYS = ORGA_KEYS.echelons;

export function useEchelonsStructurels() {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: KEYS.all,
        queryFn: async () => {
            const res = await apiClient.get<EchelonStructurel[]>('/api/organisation/echelons-structurels');
            return res.data || [];
        },
        enabled: isAuthenticated,
        staleTime: 30_000,
    });
}

export function useCreerEchelonStructurel() {
    const qc = useQueryClient();
    const handleError = useHandleError();
    const { t } = useTranslation('organisation');
    return useMutation({
        mutationFn: async (dto: Partial<EchelonStructurel>) => {
            const res = await apiClient.post<EchelonStructurel>('/api/organisation/echelons-structurels', dto);
            return res.data!;
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.all }); qc.invalidateQueries({ queryKey: ORGA_KEYS.organigramme.all }); qc.invalidateQueries({ queryKey: ORGA_KEYS.stats.all }); toast.success(t('toasts.echelonCree')); },
        onError: (e: unknown) => handleError(e, 'Erreur création échelon'),
    });
}

export function useModifierEchelonStructurel() {
    const qc = useQueryClient();
    const handleError = useHandleError();
    const { t } = useTranslation('organisation');
    return useMutation({
        mutationFn: async ({ id, ...data }: { id: string } & Partial<EchelonStructurel>) => {
            const res = await apiClient.patch<EchelonStructurel>(`/api/organisation/echelons-structurels/${id}`, data);
            return res.data!;
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.all }); qc.invalidateQueries({ queryKey: ORGA_KEYS.organigramme.all }); qc.invalidateQueries({ queryKey: ORGA_KEYS.stats.all }); toast.success(t('toasts.echelonModifie')); },
        onError: (e: unknown) => handleError(e, 'Erreur modification échelon'),
    });
}

export function useSupprimerEchelonStructurel() {
    const qc = useQueryClient();
    const handleError = useHandleError();
    const { t } = useTranslation('organisation');
    return useMutation({
        mutationFn: async (id: string) => { await apiClient.delete(`/api/organisation/echelons-structurels/${id}`); },
        onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.all }); qc.invalidateQueries({ queryKey: ORGA_KEYS.organigramme.all }); qc.invalidateQueries({ queryKey: ORGA_KEYS.stats.all }); toast.success(t('toasts.echelonSupprime')); },
        onError: (e: unknown) => handleError(e, 'Erreur suppression échelon'),
    });
}
