/**
 * ==================================
 * eLISAschool - Hooks API Promotions v4.0
 * ==================================
 *
 * Hooks TanStack Query pour le CRUD des promotions et bundles.
 * Routes platform : /api/platform/facturation/promotions
 * Routes client    : /api/billing/promotions
 *
 * Version: 4.0.0
 * Auteur: franck arlos chendjou
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
    Promotion,
    BundlePromotion,
    ResultatCascadePromotions,
    UsageStatsResponse,
    PromotionsAnalytics,
} from '@/features/billing/types/promotion.types';

// =============================================
// TYPES
// =============================================

interface PromotionsListeResponse {
    data: Promotion[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

interface PromotionsFilters {
    scope?: string;
    actif?: boolean;
    page?: number;
    limit?: number;
}

// =============================================
// HOOKS PLATFORM — CRUD Promotions
// =============================================

/** Liste paginée des promotions (platform) */
export function usePromotions(filters?: PromotionsFilters) {
    return useQuery<PromotionsListeResponse>({
        queryKey: ['promotions', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters?.scope) params.set('scope', filters.scope);
            if (filters?.actif !== undefined) params.set('actif', String(filters.actif));
            if (filters?.page) params.set('page', String(filters.page));
            if (filters?.limit) params.set('limit', String(filters.limit));

            // apiClient.get retourne le JSON body complet : { success, data, pagination }
            const res = await apiClient.get(`/api/platform/facturation/promotions?${params}`);
            const payload = res as any;
            // Retourner { data, pagination } pour la page
            return {
                data: payload?.data ?? payload ?? [],
                pagination: payload?.pagination,
            } as PromotionsListeResponse;
        },
    });
}

/** Détail d'une promotion */
export function usePromotion(id: string | undefined) {
    return useQuery<Promotion>({
        queryKey: ['promotion', id],
        queryFn: async () => {
            if (!id) throw new Error('ID requis');
            const res = await apiClient.get(`/api/platform/facturation/promotions/${id}`);
            return (res.data as any)?.data ?? res.data;
        },
        enabled: !!id,
    });
}

/** Créer une promotion */
export function useCreatePromotion() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (data: Partial<Promotion>) => {
            const res = await apiClient.post('/api/platform/facturation/promotions', data);
            return (res.data as any)?.data ?? res.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['promotions'] });
        },
    });
}

/** Modifier une promotion */
export function useUpdatePromotion() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Promotion> }) => {
            const res = await apiClient.patch(`/api/platform/facturation/promotions/${id}`, data);
            return (res.data as any)?.data ?? res.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['promotions'] });
        },
    });
}

/** Supprimer une promotion */
export function useDeletePromotion() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/platform/facturation/promotions/${id}`);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['promotions'] });
        },
    });
}

/** Dupliquer une promotion (copie avec nouveau code unique) */
export function useDupliquerPromotion() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const res = await apiClient.post(`/api/platform/facturation/promotions/${id}/dupliquer`);
            return (res.data as any)?.data as Promotion;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['promotions'] });
        },
    });
}

/** Toggle actif/inactif */
export function useTogglePromotion() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const res = await apiClient.post(`/api/platform/facturation/promotions/${id}/toggle`);
            return (res.data as any)?.data ?? res.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['promotions'] });
        },
    });
}

// =============================================
// HOOKS PLATFORM — CRUD Bundles
// =============================================

/** Liste des bundles */
export function useBundles(actif?: boolean) {
    return useQuery<BundlePromotion[]>({
        queryKey: ['bundles', actif],
        queryFn: async () => {
            const params = actif !== undefined ? `?actif=${actif}` : '';
            const res = await apiClient.get(`/api/platform/facturation/promotions/bundles${params}`);
            const payload = res.data as any;
            return payload?.data ?? payload ?? [];
        },
    });
}

/** Créer un bundle */
export function useCreateBundle() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (data: Partial<BundlePromotion>) => {
            const res = await apiClient.post('/api/platform/facturation/promotions/bundles', data);
            return (res.data as any)?.data ?? res.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['bundles'] });
        },
    });
}

/** Modifier un bundle */
export function useUpdateBundle() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<BundlePromotion> }) => {
            const res = await apiClient.patch(`/api/platform/facturation/promotions/bundles/${id}`, data);
            return (res.data as any)?.data ?? res.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['bundles'] });
        },
    });
}

/** Supprimer un bundle */
export function useDeleteBundle() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/platform/facturation/promotions/bundles/${id}`);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['bundles'] });
        },
    });
}

// =============================================
// HOOKS — Simulation cascade
// =============================================

/** Simuler la cascade des promotions */
export function useSimulerCascade() {
    return useMutation({
        mutationFn: async (params: {
            montantPlan: number;
            montantPacks: number;
            montantModules: number;
            contexte?: Record<string, any>;
        }): Promise<ResultatCascadePromotions> => {
            const res = await apiClient.post('/api/platform/facturation/promotions/simuler', params);
            return (res.data as any)?.data ?? res.data;
        },
    });
}

// =============================================
// HOOKS CLIENT — Promotions éligibles
// =============================================

/** Promotions éligibles pour le tenant (client) */
export function usePromotionsEligibles(codeCoupon?: string) {
    return useQuery<Promotion[]>({
        queryKey: ['promotions-eligibles', codeCoupon],
        queryFn: async () => {
            const params = codeCoupon ? `?codeCoupon=${encodeURIComponent(codeCoupon)}` : '';
            const res = await apiClient.get(`/api/billing/promotions/eligibles${params}`);
            const payload = res.data as any;
            return payload?.data ?? payload ?? [];
        },
    });
}

/** Bundles éligibles pour le tenant (client) */
export function useBundlesEligibles(packsSouscritsIds?: string[]) {
    return useQuery<BundlePromotion[]>({
        queryKey: ['bundles-eligibles', packsSouscritsIds],
        queryFn: async () => {
            const params = packsSouscritsIds?.length
                ? `?packsSouscritsIds=${packsSouscritsIds.join(',')}`
                : '';
            const res = await apiClient.get(`/api/billing/promotions/bundles/eligibles${params}`);
            const payload = res.data as any;
            return payload?.data ?? payload ?? [];
        },
    });
}

/** Vérifier un code coupon */
export function useVerifierCoupon() {
    return useMutation({
        mutationFn: async (codeCoupon: string) => {
            const res = await apiClient.post('/api/billing/promotions/verifier-coupon', { codeCoupon });
            return (res.data as any)?.data ?? res.data;
        },
    });
}

// =============================================
// HOOKS PLATFORM — Statistiques d'utilisation
// =============================================

/** Statistiques d'utilisation des promotions (platform) */
export function useUsageStats(
    page = 1,
    limit = 20,
    filters?: { scope?: string; etablissementId?: string }
) {
    return useQuery<UsageStatsResponse>({
        queryKey: ['promotions-usage-stats', page, limit, filters?.scope, filters?.etablissementId],
        queryFn: async () => {
            const params = new URLSearchParams({ page: String(page), limit: String(limit) });
            if (filters?.scope) params.set('scope', filters.scope);
            if (filters?.etablissementId) params.set('etablissementId', filters.etablissementId);
            const res = await apiClient.get(
                `/api/platform/facturation/promotions/usage-stats?${params.toString()}`
            );
            return (res.data as any)?.data ?? res.data;
        },
    });
}

/** Export CSV des statistiques d'utilisation (téléchargement direct) */
export function exporterUsageStatsCSV(filters?: { scope?: string; etablissementId?: string }): void {
    const params = new URLSearchParams();
    if (filters?.scope) params.set('scope', filters.scope);
    if (filters?.etablissementId) params.set('etablissementId', filters.etablissementId);
    const query = params.toString() ? `?${params.toString()}` : '';
    window.open(`/api/platform/facturation/promotions/usage-stats/export${query}`, '_blank');
}

// =============================================
// HOOKS CLIENT — Aperçu cascade
// =============================================

/** Aperçu cascade promotions pour le tenant (prochaine facture) */
export function usePreviewCascade() {
    return useMutation({
        mutationFn: async (codeCoupon?: string): Promise<any> => {
            const res = await apiClient.post('/api/billing/promotions/preview-cascade', { codeCoupon });
            return (res.data as any)?.data;
        },
    });
}

// =============================================
// HOOKS PLATFORM — Analytics avancées
// =============================================

/** Analytics avancées promotions (plateforme) */
export function usePromotionsAnalytics(etablissementId?: string) {
    return useQuery<PromotionsAnalytics>({
        queryKey: ['promotions-analytics', etablissementId],
        queryFn: async () => {
            const params = etablissementId ? `?etablissementId=${etablissementId}` : '';
            const res = await apiClient.get(`/api/platform/facturation/promotions/analytics${params}`);
            return (res.data as any)?.data ?? res.data;
        },
        staleTime: 2 * 60 * 1000, // 2 min
    });
}

// =============================================
// HOOKS CLIENT — Historique promotions
// =============================================

/** Historique des promotions appliquées pour le tenant (client) */
export function useHistoriquePromotionsClient(page = 1, limit = 20) {
    return useQuery<UsageStatsResponse>({
        queryKey: ['promotions-historique-client', page, limit],
        queryFn: async () => {
            const res = await apiClient.get(
                `/api/billing/promotions/historique?page=${page}&limit=${limit}`
            );
            return (res.data as any)?.data ?? res.data;
        },
    });
}

// =============================================
// EXPORT / IMPORT CSV PROMOTIONS
// =============================================

/** Exporte la configuration des promotions en CSV (téléchargement direct) */
export function exporterPromotionsCSV(scope?: string, actif?: boolean): void {
    const params = new URLSearchParams();
    if (scope) params.set('scope', scope);
    if (actif !== undefined) params.set('actif', String(actif));
    const qs = params.toString();
    window.open(`/api/platform/facturation/promotions/export${qs ? `?${qs}` : ''}`, '_blank');
}

/** Import CSV de promotions (mutation) */
export function useImporterPromotionsCSV() {
    const queryClient = useQueryClient();
    return useMutation<
        { created: number; updated: number; errors: Array<{ ligne: number; code: string; erreur: string }> },
        Error,
        string
    >({
        mutationFn: async (csvContent: string) => {
            const res = await apiClient.post('/api/platform/facturation/promotions/import', { csv: csvContent });
            return (res.data as any)?.data ?? res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['promotions'] });
            queryClient.invalidateQueries({ queryKey: ['promotions-analytics'] });
        },
    });
}
