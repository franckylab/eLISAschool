/**
 * ==================================
 * eLISAschool - Hooks Emploi du Temps
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { useHandleError } from '@/hooks/use-handle-error';
import type {
    CreneauHoraire, PaginatedResponse, CreneauFilters,
    PreferenceEDT, Conflit, DonneesVerification,
    TemplateEDT,
    StatistiquesEDT, StatistiquesFilters,
    ResultatPreviewEDT, AuditConflitsResult,
    ResultatUpdateCreneau,
} from '../types/edt.types';

export type {
    JourSemaine, TypeCreneau, StatutCreneau,
    CreneauHoraire, PaginatedResponse, CreneauFilters,
    PreferenceEDT, CreneauImposable,
    TypeConflit, SeveriteConflit, Conflit, DonneesVerification,
    TemplateEDT,
    StatistiquesEDT, StatistiquesFilters,
    CreneauPreview, ConflitPreview, ResumePreview, ResultatPreviewEDT,
    AuditConflitDetail, AuditConflitsResult,
    ResultatUpdateCreneau,
} from '../types/edt.types';

const EDT_KEYS = {
    all: ['emploi-du-temps'] as const,
    list: (filters: Record<string, string | number | boolean | undefined>) => ['emploi-du-temps', 'list', filters] as const,
    detail: (id: string) => ['emploi-du-temps', id] as const,
    preferences: ['emploi-du-temps', 'preferences'] as const,
    statistiques: (filters: StatistiquesFilters) => ['emploi-du-temps', 'statistiques', filters] as const,
    preview: ['emploi-du-temps', 'preview'] as const,
    audit: ['emploi-du-temps', 'audit'] as const,
    templates: {
        all: ['emploi-du-temps', 'templates'] as const,
        detail: (id: string) => ['emploi-du-temps', 'templates', id] as const,
    },
};

// ─── Créneaux CRUD ──────────────────────────────────

export function useCreneaux(filters: CreneauFilters = {}) {
    return useQuery({
        queryKey: EDT_KEYS.list(filters as Record<string, string | number | boolean | undefined>),
        queryFn: async () => {
            const params: Record<string, string | number | boolean> = {};
            for (const [k, v] of Object.entries(filters)) {
                if (v !== undefined && v !== '') params[k] = v as string | number | boolean;
            }
            const response = await apiClient.get<PaginatedResponse<CreneauHoraire>>('/api/emploi-du-temps', params);
            return response.data;
        },
        staleTime: 2 * 60 * 1000,
    });
}

export function useCreneau(id: string) {
    return useQuery({
        queryKey: EDT_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<CreneauHoraire>(`/api/emploi-du-temps/${id}`);
            return response.data;
        },
        enabled: !!id,
        placeholderData: (previousData) => previousData,
    });
}

export function useCreerCreneau() {
    const qc = useQueryClient();
    const { t } = useTranslation('emplois');
    const handleError = useHandleError();
    return useMutation({
        mutationFn: async (dto: Partial<CreneauHoraire>) => {
            const res = await apiClient.post<CreneauHoraire>('/api/emploi-du-temps', dto);
            return res.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: EDT_KEYS.all });
            toast.success(t('toasts.creneauCree'));
        },
        onError: (err: unknown) => {
            handleError(err, t('toasts.erreurCreation'));
        },
    });
}

export function useUpdateCreneau() {
    const qc = useQueryClient();
    const { t } = useTranslation('emplois');
    const handleError = useHandleError();
    return useMutation({
        mutationFn: async ({ id, ...dto }: { id: string } & Partial<CreneauHoraire> & { propagerForce?: boolean }) => {
            const res = await apiClient.patch<ResultatUpdateCreneau>(`/api/emploi-du-temps/${id}`, dto);
            return res.data;
        },
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: EDT_KEYS.all });
            const rapport = data?.rapport;
            if (rapport && rapport.instancesQuiSuivent > 0) {
                toast.success(t('toasts.creneauModifiePropage', {
                    count: rapport.instancesQuiSuivent,
                    ignorees: rapport.instancesInchangees,
                }));
            } else {
                toast.success(t('toasts.creneauModifie'));
            }
        },
        onError: (err: unknown) => {
            // Q5 : le 409 CONFLITS_PROPAGATION est géré par le composant (proposition de forcer)
            if (typeof err === 'object' && err !== null && (err as { code?: string }).code === 'CONFLITS_PROPAGATION') {
                return;
            }
            handleError(err, t('toasts.erreurModification'));
        },
    });
}

export function useSupprimerCreneau() {
    const qc = useQueryClient();
    const { t } = useTranslation('emplois');
    const handleError = useHandleError();
    return useMutation({
        mutationFn: async (id: string) => {
            const res = await apiClient.delete<{ instancesAnnulees: number }>(`/api/emploi-du-temps/${id}`);
            return res.data;
        },
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: EDT_KEYS.all });
            const annulees = data?.instancesAnnulees ?? 0;
            toast.success(
                annulees > 0
                    ? t('toasts.creneauSupprimeAvecInstances', { count: annulees })
                    : t('toasts.creneauSupprime'),
            );
        },
        onError: (err: unknown) => {
            handleError(err, t('toasts.erreurSuppression'));
        },
    });
}

// ─── Génération ─────────────────────────────────────

export function usePrevisualiserEDT() {
    const { t } = useTranslation('emplois');
    const handleError = useHandleError();
    return useMutation({
        mutationFn: async (dto: { classeAnneeId: string; templateId?: string; options?: { regenerer?: boolean; respecterContraintes?: boolean } }) => {
            const res = await apiClient.post<ResultatPreviewEDT>('/api/emploi-du-temps/previsualiser', dto);
            return res.data;
        },
        onError: (err: unknown) => {
            handleError(err, t('toasts.erreurPreview'));
        },
    });
}

export function useGenererEDT() {
    const qc = useQueryClient();
    const { t } = useTranslation('emplois');
    const handleError = useHandleError();
    return useMutation({
        mutationFn: async (dto: { classeAnneeId: string; templateId?: string; options?: { regenerer?: boolean; respecterContraintes?: boolean } }) => {
            const res = await apiClient.post<{ nombreCreneaux: number; conflits: string[] }>('/api/emploi-du-temps/generer', dto);
            return res;
        },
        onSuccess: (res) => {
            qc.invalidateQueries({ queryKey: EDT_KEYS.all });
            if (res?.success) toast.success(res.message || t('toasts.genererOk'));
            else toast.warning(`${res?.message || ''} — ${res?.data?.conflits?.length || 0} ${t('conflits')}`);
        },
        onError: (err: unknown) => {
            handleError(err, t('toasts.erreurGeneration'));
        },
    });
}

// ─── Préférences ────────────────────────────────────

export function usePreferencesEDT() {
    return useQuery({
        queryKey: EDT_KEYS.preferences,
        queryFn: async () => {
            const res = await apiClient.get<PreferenceEDT>('/api/emploi-du-temps/preferences');
            return res.data;
        },
        staleTime: 5 * 60 * 1000,
    });
}

export function useUpdatePreferencesEDT() {
    const qc = useQueryClient();
    const { t } = useTranslation('emplois');
    const handleError = useHandleError();
    return useMutation({
        mutationFn: async (dto: Partial<PreferenceEDT>) => {
            const res = await apiClient.put<PreferenceEDT>('/api/emploi-du-temps/preferences', dto);
            return res.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: EDT_KEYS.preferences });
            toast.success(t('toasts.preferencesMaj'));
        },
        onError: (err: unknown) => {
            handleError(err, t('toasts.erreurPreferences'));
        },
    });
}

// ─── Templates ──────────────────────────────────────

export function useTemplatesEDT() {
    return useQuery({
        queryKey: EDT_KEYS.templates.all,
        queryFn: async () => {
            const res = await apiClient.get<TemplateEDT[]>('/api/emploi-du-temps/templates');
            return res.data;
        },
        staleTime: 10 * 60 * 1000,
    });
}

export function useTemplateEDT(id: string) {
    return useQuery({
        queryKey: EDT_KEYS.templates.detail(id),
        queryFn: async () => {
            const res = await apiClient.get<TemplateEDT>(`/api/emploi-du-temps/templates/${id}`);
            return res.data;
        },
        enabled: !!id,
    });
}

export function useCreerTemplateEDT() {
    const qc = useQueryClient();
    const { t } = useTranslation('emplois');
    const handleError = useHandleError();
    return useMutation({
        mutationFn: async (dto: Partial<TemplateEDT>) => {
            const res = await apiClient.post<TemplateEDT>('/api/emploi-du-temps/templates', dto);
            return res.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: EDT_KEYS.templates.all });
            toast.success(t('toasts.templateCree'));
        },
        onError: (err: unknown) => {
            handleError(err, t('toasts.erreurCreation'));
        },
    });
}

export function useSupprimerTemplateEDT() {
    const qc = useQueryClient();
    const { t } = useTranslation('emplois');
    const handleError = useHandleError();
    return useMutation({
        mutationFn: async (id: string) => { await apiClient.delete(`/api/emploi-du-temps/templates/${id}`); },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: EDT_KEYS.templates.all });
            toast.success(t('toasts.templateSupprime'));
        },
        onError: (err: unknown) => {
            handleError(err, t('toasts.erreurSuppression'));
        },
    });
}

export function useDupliquerTemplateEDT() {
    const qc = useQueryClient();
    const { t } = useTranslation('emplois');
    const handleError = useHandleError();
    return useMutation({
        mutationFn: async ({ id, nom }: { id: string; nom?: string }) => {
            const res = await apiClient.post<TemplateEDT>(`/api/emploi-du-temps/templates/${id}/dupliquer`, { nom });
            return res.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: EDT_KEYS.templates.all });
            toast.success(t('toasts.templateDuplique'));
        },
        onError: (err: unknown) => {
            handleError(err, t('toasts.erreurCreation'));
        },
    });
}

// ─── Vérification conflits ─────────────────────────

export function useVerifierConflits() {
    return useMutation({
        mutationFn: async (donnees: DonneesVerification) => {
            const res = await apiClient.post<Conflit[]>('/api/emploi-du-temps/verifier-conflits', donnees);
            return res.data;
        },
    });
}

// ─── Statistiques ──────────────────────────────────

export function useStatistiquesEDT(filters: StatistiquesFilters = {}) {
    return useQuery({
        queryKey: EDT_KEYS.statistiques(filters),
        queryFn: async () => {
            const params: Record<string, string> = {};
            for (const [k, v] of Object.entries(filters)) {
                if (v) params[k] = v;
            }
            const res = await apiClient.get<StatistiquesEDT>('/api/emploi-du-temps/statistiques', params);
            return res.data;
        },
        staleTime: 2 * 60 * 1000,
    });
}

// ─── Audit Conflits ────────────────────────────────

export function useAuditConflits(options?: { periodeId?: string; anneeScolaireId?: string }) {
    return useQuery({
        queryKey: [...EDT_KEYS.audit, options] as const,
        queryFn: async () => {
            const params: Record<string, string> = {};
            if (options?.periodeId) params.periodeId = options.periodeId;
            if (options?.anneeScolaireId) params.anneeScolaireId = options.anneeScolaireId;
            const res = await apiClient.get<AuditConflitsResult>('/api/emploi-du-temps/audit-conflits', params);
            return res.data;
        },
        staleTime: 1 * 60 * 1000,
    });
}
