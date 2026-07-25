/**
 * ==================================
 * eLISAschool - Hooks Templates Organisation
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * v2.0 — Ajout filtres par facettes, combinaisons, clonage
 */

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/lib/api-client';
import { useHandleError } from './use-handle-error';
import type {
    TemplateOrganisation,
    GenererOrganisationDto,
    ResultatGeneration,
    TemplateFiltres,
    CombinaisonsValides,
} from '../types/organisation.types';
import { ORGA_KEYS } from './query-keys';

const KEYS = ORGA_KEYS.templates;

/**
 * Liste des templates — avec filtres optionnels par facettes (v5.1)
 */
export function useTemplatesOrganisation(filtres?: TemplateFiltres) {
    const { isAuthenticated } = useAuthStore();
    const hasFilters = filtres && (
        filtres.nature || filtres.systeme || filtres.langue
        || filtres.niveau || filtres.complexite || filtres.categorie
        || filtres.search || filtres.page || filtres.limit
    );

    return useQuery({
        queryKey: hasFilters ? KEYS.filtered(filtres) : KEYS.all,
        queryFn: async () => {
            const params: Record<string, string> = {};
            if (filtres) {
                if (filtres.nature) params.nature = filtres.nature;
                if (filtres.systeme) params.systeme = filtres.systeme;
                if (filtres.langue) params.langue = filtres.langue;
                if (filtres.niveau) params.niveau = filtres.niveau;
                if (filtres.complexite) params.complexite = filtres.complexite;
                if (filtres.categorie) params.categorie = filtres.categorie;
                if (filtres.search) params.search = filtres.search;
                if (filtres.actif !== undefined) params.actif = String(filtres.actif);
                if (filtres.page) params.page = String(filtres.page);
                if (filtres.limit) params.limit = String(filtres.limit);
            }
            const res = await apiClient.get<{ data: TemplateOrganisation[] } | TemplateOrganisation[]>(
                '/api/organisation/templates', params,
            );
            // Supporte les deux formats de réponse (array direct ou { data })
            const body = res.data;
            if (Array.isArray(body)) return body;
            return body?.data ?? [];
        },
        enabled: isAuthenticated,
        staleTime: 30_000,
    });
}

/**
 * Combinaisons de facettes disponibles pour le filtrage (v5.1)
 */
export function useCombinaisonsTemplates() {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: KEYS.combinaisons,
        queryFn: async () => {
            const res = await apiClient.get<CombinaisonsValides>('/api/organisation/templates/combinaisons');
            return res.data!;
        },
        enabled: isAuthenticated,
        staleTime: 60_000,
    });
}

export function useCreerTemplateOrganisation() {
    const qc = useQueryClient();
    const handleError = useHandleError();
    const { t } = useTranslation('organisation');
    return useMutation({
        mutationFn: async (dto: Partial<TemplateOrganisation>) => { const res = await apiClient.post<TemplateOrganisation>('/api/organisation/templates', dto); return res.data!; },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KEYS.all });
            qc.invalidateQueries({ queryKey: KEYS.combinaisons });
            toast.success(t('toasts.templateCree'));
        },
        onError: (e: unknown) => handleError(e, 'Erreur création template'),
    });
}

export function useModifierTemplateOrganisation() {
    const qc = useQueryClient();
    const handleError = useHandleError();
    const { t } = useTranslation('organisation');
    return useMutation({
        mutationFn: async ({ id, ...data }: { id: string } & Partial<TemplateOrganisation>) => { const res = await apiClient.patch<TemplateOrganisation>(`/api/organisation/templates/${id}`, data); return res.data!; },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KEYS.all });
            qc.invalidateQueries({ queryKey: KEYS.combinaisons });
            toast.success(t('toasts.templateModifie'));
        },
        onError: (e: unknown) => handleError(e, 'Erreur modification template'),
    });
}

export function useSupprimerTemplateOrganisation() {
    const qc = useQueryClient();
    const handleError = useHandleError();
    const { t } = useTranslation('organisation');
    return useMutation({
        mutationFn: async (id: string) => { await apiClient.delete(`/api/organisation/templates/${id}`); },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KEYS.all });
            qc.invalidateQueries({ queryKey: KEYS.combinaisons });
            toast.success(t('toasts.templateSupprime'));
        },
        onError: (e: unknown) => handleError(e, 'Erreur suppression template'),
    });
}

/**
 * Cloner un template pour l'établissement courant (v5.1)
 */
export function useClonerTemplateOrganisation() {
    const qc = useQueryClient();
    const handleError = useHandleError();
    const { t } = useTranslation('organisation');
    return useMutation({
        mutationFn: async ({ id, nom }: { id: string; nom?: string }) => {
            const res = await apiClient.post<TemplateOrganisation>(
                `/api/organisation/templates/${id}/cloner`,
                { nom },
            );
            return res.data!;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KEYS.all });
            toast.success(t('toasts.templateClone'));
        },
        onError: (e: unknown) => handleError(e, 'Erreur clonage template'),
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
