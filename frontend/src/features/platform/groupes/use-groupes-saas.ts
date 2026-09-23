/**
 * ==================================
 * eLISAschool — Platform Groupes SaaS · Hooks
 * ==================================
 * TanStack Query centralisé : clés typées, invalidations ciblées,
 * toasts i18n. Pattern ApiResponse : apiClient.get<T>() → { success, data }.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import type {
    ConsolidatedStats,
    EtablissementOption,
    GroupeFormValues,
    GroupeSaaS,
    ModuleCatalogueOption,
    ModuleGroupeOverride,
    PromotionApercu,
} from './types';

const BASE = '/api/platform/facturation/groupes';

export const GROUPES_SAAS_KEYS = {
    all: ['groupes-saas'] as const,
    list: (actif?: boolean) => ['groupes-saas', actif ?? 'tous'] as const,
    detail: (id: string) => ['groupes-saas', id] as const,
    etablissements: ['groupes-saas-etablissements'] as const,
    modules: (id: string) => ['groupes-saas-modules', id] as const,
    catalogue: ['groupes-saas-catalogue'] as const,
    stats: (id: string) => ['groupes-saas-stats', id] as const,
    promotionsPlan: ['groupes-saas-promotions-plan'] as const,
};

function messageErreur(erreur: unknown, repli: string): string {
    if (typeof erreur === 'object' && erreur !== null) {
        const candidate = erreur as { message?: string };
        if (candidate.message) return candidate.message;
    }
    return repli;
}

// ─── Groupes ─────────────────────────────────────────────────────

export function useGroupesSaaS(actif?: boolean) {
    return useQuery({
        queryKey: GROUPES_SAAS_KEYS.list(actif),
        queryFn: async (): Promise<GroupeSaaS[]> => {
            const params: Record<string, string> = {};
            if (actif !== undefined) params.actif = String(actif);
            const res = await apiClient.get<GroupeSaaS[]>(BASE, Object.keys(params).length ? params : undefined);
            return res.data ?? [];
        },
        staleTime: 30_000,
        retry: 1,
    });
}

export function useGroupeSaaS(id: string | null) {
    return useQuery({
        queryKey: id ? GROUPES_SAAS_KEYS.detail(id) : ['groupes-saas-vide'],
        queryFn: async (): Promise<GroupeSaaS> => {
            const res = await apiClient.get<GroupeSaaS>(`${BASE}/${id}`);
            if (!res.data) throw new Error('Groupe introuvable');
            return res.data;
        },
        enabled: !!id,
        staleTime: 30_000,
        retry: 1,
    });
}

export function useCreateGroupeSaaS() {
    const qc = useQueryClient();
    const { t } = useTranslation('admin');
    return useMutation({
        mutationFn: async (values: GroupeFormValues) => {
            const res = await apiClient.post<GroupeSaaS>(BASE, {
                nom: values.nom.trim(),
                code: values.code.trim().toUpperCase(),
                description: values.description?.trim() || undefined,
            });
            if (!res.data) throw new Error(t('groupes.toast.erreurCreation'));
            return res.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: GROUPES_SAAS_KEYS.all });
            toast.success(t('groupes.toast.cree'));
        },
        onError: (e: unknown) => toast.error(messageErreur(e, t('groupes.toast.erreurCreation'))),
    });
}

export function useUpdateGroupeSaaS() {
    const qc = useQueryClient();
    const { t } = useTranslation('admin');
    return useMutation({
        mutationFn: async ({ id, values }: { id: string; values: GroupeFormValues }) => {
            const res = await apiClient.patch<GroupeSaaS>(`${BASE}/${id}`, {
                nom: values.nom.trim(),
                description: values.description?.trim() || undefined,
                actif: values.actif,
            });
            if (!res.data) throw new Error(t('groupes.toast.erreurMaj'));
            return res.data;
        },
        onSuccess: (_data, variables) => {
            qc.invalidateQueries({ queryKey: GROUPES_SAAS_KEYS.all });
            qc.invalidateQueries({ queryKey: GROUPES_SAAS_KEYS.detail(variables.id) });
            toast.success(t('groupes.toast.maj'));
        },
        onError: (e: unknown) => toast.error(messageErreur(e, t('groupes.toast.erreurMaj'))),
    });
}

export function useDeleteGroupeSaaS() {
    const qc = useQueryClient();
    const { t } = useTranslation('admin');
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`${BASE}/${id}`);
            return id;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: GROUPES_SAAS_KEYS.all });
            toast.success(t('groupes.toast.supprime'));
        },
        onError: (e: unknown) => toast.error(messageErreur(e, t('groupes.toast.erreurSuppression'))),
    });
}

// ─── Membres ─────────────────────────────────────────────────────

export function useEtablissementsOptions() {
    return useQuery({
        queryKey: GROUPES_SAAS_KEYS.etablissements,
        queryFn: async (): Promise<EtablissementOption[]> => {
            const res = await apiClient.get<EtablissementOption[]>('/api/platform/etablissements', {
                limit: 200,
            });
            const data = res.data ?? [];
            return data.map((e) => ({
                id: e.id,
                nom: e.nom || 'Établissement',
                ville: e.ville || '',
                codeEtablissement: e.codeEtablissement || '',
            }));
        },
        staleTime: 60_000,
        retry: 1,
    });
}

export function useAddMembreGroupe() {
    const qc = useQueryClient();
    const { t } = useTranslation('admin');
    return useMutation({
        mutationFn: async ({ groupeId, etablissementId }: { groupeId: string; etablissementId: string }) => {
            const res = await apiClient.post(`${BASE}/${groupeId}/membres`, { etablissementId });
            return res.data;
        },
        onSuccess: (_data, variables) => {
            qc.invalidateQueries({ queryKey: GROUPES_SAAS_KEYS.all });
            qc.invalidateQueries({ queryKey: GROUPES_SAAS_KEYS.detail(variables.groupeId) });
            toast.success(t('groupes.toast.membreAjoute'));
        },
        onError: (e: unknown) => toast.error(messageErreur(e, t('groupes.toast.erreurMembre'))),
    });
}

export function useRemoveMembreGroupe() {
    const qc = useQueryClient();
    const { t } = useTranslation('admin');
    return useMutation({
        mutationFn: async ({ groupeId, etablissementId }: { groupeId: string; etablissementId: string }) => {
            await apiClient.delete(`${BASE}/${groupeId}/membres/${etablissementId}`);
        },
        onSuccess: (_data, variables) => {
            qc.invalidateQueries({ queryKey: GROUPES_SAAS_KEYS.all });
            qc.invalidateQueries({ queryKey: GROUPES_SAAS_KEYS.detail(variables.groupeId) });
            toast.success(t('groupes.toast.membreRetire'));
        },
        onError: (e: unknown) => toast.error(messageErreur(e, t('groupes.toast.erreurMembre'))),
    });
}

// ─── Modules ─────────────────────────────────────────────────────

export function useCatalogueModules() {
    return useQuery({
        queryKey: GROUPES_SAAS_KEYS.catalogue,
        queryFn: async (): Promise<ModuleCatalogueOption[]> => {
            const res = await apiClient.get<ModuleCatalogueOption[]>('/api/platform/facturation/modules/catalogue');
            return res.data ?? [];
        },
        staleTime: 60_000,
        retry: 1,
    });
}

export function useModulesGroupe(groupeId: string | null) {
    return useQuery({
        queryKey: groupeId ? GROUPES_SAAS_KEYS.modules(groupeId) : ['groupes-saas-modules-vide'],
        queryFn: async (): Promise<ModuleGroupeOverride[]> => {
            const res = await apiClient.get<ModuleGroupeOverride[]>(`${BASE}/${groupeId}/modules`);
            return res.data ?? [];
        },
        enabled: !!groupeId,
        staleTime: 30_000,
        retry: 1,
    });
}

export function useToggleModuleGroupe() {
    const qc = useQueryClient();
    const { t } = useTranslation('admin');
    return useMutation({
        mutationFn: async ({ groupeId, moduleId, actif }: { groupeId: string; moduleId: string; actif: boolean }) => {
            const res = await apiClient.put(`${BASE}/${groupeId}/modules/${moduleId}`, { actif });
            return res.data;
        },
        onSuccess: (_data, variables) => {
            qc.invalidateQueries({ queryKey: GROUPES_SAAS_KEYS.modules(variables.groupeId) });
            toast.success(t('groupes.toast.moduleMaj'));
        },
        onError: (e: unknown) => toast.error(messageErreur(e, t('groupes.toast.erreurModule'))),
    });
}

export function useGroupesStats(groupeId: string | null) {
    return useQuery<ConsolidatedStats>({
        queryKey: groupeId ? GROUPES_SAAS_KEYS.stats(groupeId) : ['groupes-saas-stats-vide'],
        queryFn: async (): Promise<ConsolidatedStats> => {
            const res = await apiClient.get<ConsolidatedStats>(`${BASE}/${groupeId}/stats`);
            if (!res.data) throw new Error('Statistiques groupe introuvables');
            return res.data;
        },
        enabled: !!groupeId,
        staleTime: 30_000,
        retry: 1,
    });
}

// ─── Promotions (lecture seule — périmètre global, pas lié au groupe) ──

export function usePromotionsPlanActives() {
    return useQuery({
        queryKey: GROUPES_SAAS_KEYS.promotionsPlan,
        queryFn: async (): Promise<PromotionApercu[]> => {
            const res = await apiClient.get<{ data?: PromotionApercu[] } | PromotionApercu[]>(
                '/api/platform/facturation/promotions',
                { scope: 'PLAN', actif: true },
            );
            const raw = res.data as unknown;
            if (Array.isArray(raw)) return raw;
            if (raw && typeof raw === 'object' && Array.isArray((raw as { data?: PromotionApercu[] }).data)) {
                return (raw as { data?: PromotionApercu[] }).data ?? [];
            }
            return [];
        },
        staleTime: 60_000,
        retry: 1,
    });
}

// ─── Barèmes configurables (paliers + plafonds) ────────────────────

export type SourceBareme = 'groupe' | 'global' | 'defaut';

export interface PalierBareme {
    minMembres: number;
    remisePct: number;
}

export interface BaremesConfig {
    paliers: PalierBareme[];
    sourcePaliers: SourceBareme;
    plafondPlan: number;
    sourcePlafondPlan: SourceBareme;
    plafondGroupe: number;
    sourcePlafondGroupe: SourceBareme;
}

export interface BaremesHistoriqueItem {
    id: string;
    createdAt: string;
    action: string;
    cibleNom?: string;
    description?: string;
    ancienneValeur?: unknown;
    nouvelleValeur?: unknown;
    restaurable: boolean;
    utilisateurId?: string;
}

const BAREMES_BASE = '/api/platform/facturation/baremes';

/** Configuration globale effective (barème + plafonds). */
export function useBaremesGlobal() {
    return useQuery({
        queryKey: ['baremes-global'],
        queryFn: async (): Promise<BaremesConfig> => {
            const res = await apiClient.get<BaremesConfig>(`${BAREMES_BASE}/config`);
            if (!res.data) throw new Error('Configuration barèmes introuvable');
            return res.data;
        },
        staleTime: 30_000,
        retry: 1,
    });
}

/** Configuration effective pour un groupe (override → global → défaut + sources). */
export function useBaremesGroupe(groupeId: string | null) {
    return useQuery({
        queryKey: groupeId ? ['baremes-groupe', groupeId] : ['baremes-groupe-vide'],
        queryFn: async (): Promise<BaremesConfig> => {
            const res = await apiClient.get<BaremesConfig>(`${BASE}/${groupeId}/baremes`);
            if (!res.data) throw new Error('Configuration barèmes introuvable');
            return res.data;
        },
        enabled: !!groupeId,
        staleTime: 30_000,
        retry: 1,
    });
}

export interface BaremesGlobalForm {
    paliers?: PalierBareme[];
    plafondPlan?: number;
    plafondGroupe?: number;
}

/** Enregistre la configuration globale (clés fournies uniquement). */
export function useSaveBaremesGlobal() {
    const qc = useQueryClient();
    const { t } = useTranslation('admin');
    return useMutation({
        mutationFn: async (values: BaremesGlobalForm) => {
            const res = await apiClient.put<BaremesConfig>(`${BAREMES_BASE}/config`, values);
            if (!res.data) throw new Error(t('groupes.toast.erreurBaremes'));
            return res.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['baremes-global'] });
            qc.invalidateQueries({ queryKey: ['baremes-groupe'] });
            qc.invalidateQueries({ queryKey: GROUPES_SAAS_KEYS.all });
            toast.success(t('groupes.toast.baremesMaj'));
        },
        onError: (e: unknown) => toast.error(messageErreur(e, t('groupes.toast.erreurBaremes'))),
    });
}

export interface BaremesGroupeForm {
    paliers?: PalierBareme[];
    plafondGroupe?: number;
    heriter?: boolean;
}

/** Enregistre un override groupe (ou réinitialise avec heriter=true). */
export function useSaveBaremesGroupe() {
    const qc = useQueryClient();
    const { t } = useTranslation('admin');
    return useMutation({
        mutationFn: async ({ groupeId, values }: { groupeId: string; values: BaremesGroupeForm }) => {
            const res = await apiClient.put<BaremesConfig>(`${BASE}/${groupeId}/baremes`, values);
            if (!res.data) throw new Error(t('groupes.toast.erreurBaremes'));
            return res.data;
        },
        onSuccess: (_data, variables) => {
            qc.invalidateQueries({ queryKey: ['baremes-groupe', variables.groupeId] });
            qc.invalidateQueries({ queryKey: GROUPES_SAAS_KEYS.stats(variables.groupeId) });
            qc.invalidateQueries({ queryKey: GROUPES_SAAS_KEYS.all });
            toast.success(t('groupes.toast.baremesMaj'));
        },
        onError: (e: unknown) => toast.error(messageErreur(e, t('groupes.toast.erreurBaremes'))),
    });
}

/** Supprime les overrides d'un groupe (retour au global). */
export function useResetBaremesGroupe() {
    const qc = useQueryClient();
    const { t } = useTranslation('admin');
    return useMutation({
        mutationFn: async (groupeId: string) => {
            await apiClient.delete(`${BASE}/${groupeId}/baremes`);
        },
        onSuccess: (_data, groupeId) => {
            qc.invalidateQueries({ queryKey: ['baremes-groupe', groupeId] });
            qc.invalidateQueries({ queryKey: GROUPES_SAAS_KEYS.stats(groupeId) });
            qc.invalidateQueries({ queryKey: GROUPES_SAAS_KEYS.all });
            toast.success(t('groupes.toast.baremesReinitialises'));
        },
        onError: (e: unknown) => toast.error(messageErreur(e, t('groupes.toast.erreurBaremes'))),
    });
}

/** Historique des modifications barèmes (global et/ou groupe). */
export function useBaremesHistorique(groupeId?: string | null) {
    return useQuery({
        queryKey: ['baremes-historique', groupeId ?? 'global'],
        queryFn: async (): Promise<{ items: BaremesHistoriqueItem[]; total: number }> => {
            const params: Record<string, string> = {};
            if (groupeId) params.groupeId = groupeId;
            const res = await apiClient.get<{ items: BaremesHistoriqueItem[]; total: number }>(
                `${BAREMES_BASE}/historique`,
                params,
            );
            const raw = res.data as unknown as { items: BaremesHistoriqueItem[]; total: number } | undefined;
            return { items: raw?.items ?? [], total: raw?.total ?? 0 };
        },
        staleTime: 30_000,
        retry: 1,
    });
}

/** Restaure une entrée d'historique (endpoint configuration existant). */
export function useRestaurerBaremes() {
    const qc = useQueryClient();
    const { t } = useTranslation('admin');
    return useMutation({
        mutationFn: async (historiqueId: string) => {
            await apiClient.post(`/api/platform/configuration/historique/${historiqueId}/restore`);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['baremes-global'] });
            qc.invalidateQueries({ queryKey: ['baremes-groupe'] });
            qc.invalidateQueries({ queryKey: ['baremes-historique'] });
            qc.invalidateQueries({ queryKey: GROUPES_SAAS_KEYS.all });
            toast.success(t('groupes.toast.baremesRestaures'));
        },
        onError: (e: unknown) => toast.error(messageErreur(e, t('groupes.toast.erreurBaremes'))),
    });
}
