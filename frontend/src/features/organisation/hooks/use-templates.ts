/**
 * ==================================
 * eLISAschool - Hooks Templates Organisation
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
import type { TemplateOrganisation, GenererOrganisationDto, ResultatGeneration } from '../types/organisation.types';
import { ORGA_KEYS } from './query-keys';

const KEYS = ORGA_KEYS.templates;

export function useTemplatesOrganisation() {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: KEYS.all,
        queryFn: async () => { const res = await apiClient.get<TemplateOrganisation[]>('/api/organisation/templates'); return res.data || []; },
        enabled: isAuthenticated,
        staleTime: 30_000,
    });
}

export function useCreerTemplateOrganisation() {
    const qc = useQueryClient();
    const handleError = useHandleError();
    const { t } = useTranslation('organisation');
    return useMutation({
        mutationFn: async (dto: Partial<TemplateOrganisation>) => { const res = await apiClient.post<TemplateOrganisation>('/api/organisation/templates', dto); return res.data!; },
        onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.all }); toast.success(t('toasts.templateCree')); },
        onError: (e: unknown) => handleError(e, 'Erreur création template'),
    });
}

export function useModifierTemplateOrganisation() {
    const qc = useQueryClient();
    const handleError = useHandleError();
    const { t } = useTranslation('organisation');
    return useMutation({
        mutationFn: async ({ id, ...data }: { id: string } & Partial<TemplateOrganisation>) => { const res = await apiClient.patch<TemplateOrganisation>(`/api/organisation/templates/${id}`, data); return res.data!; },
        onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.all }); toast.success(t('toasts.templateModifie')); },
        onError: (e: unknown) => handleError(e, 'Erreur modification template'),
    });
}

export function useSupprimerTemplateOrganisation() {
    const qc = useQueryClient();
    const handleError = useHandleError();
    const { t } = useTranslation('organisation');
    return useMutation({
        mutationFn: async (id: string) => { await apiClient.delete(`/api/organisation/templates/${id}`); },
        onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.all }); toast.success(t('toasts.templateSupprime')); },
        onError: (e: unknown) => handleError(e, 'Erreur suppression template'),
    });
}

export function useGenererOrganisation() {
    const qc = useQueryClient();
    const handleError = useHandleError();
    const { t } = useTranslation('organisation');
    return useMutation({
        mutationFn: async (dto: GenererOrganisationDto) => { const res = await apiClient.post<ResultatGeneration>('/api/organisation/generer', dto); return res.data!; },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ORGA_KEYS.unites.all });
            qc.invalidateQueries({ queryKey: ORGA_KEYS.organigramme.all });
            qc.invalidateQueries({ queryKey: ORGA_KEYS.stats.all });
            toast.success(t('toasts.organisationGeneree'));
        },
        onError: (e: unknown) => handleError(e, 'Erreur génération organisation'),
    });
}
