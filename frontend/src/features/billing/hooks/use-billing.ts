/**
 * ==================================
 * eLISAschool - Hooks API Billing
 * ==================================
 * Hooks centralisés pour les appels API billing.
 *
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
    Plan,
    PackQuota,
    MonAbonnement,
    CycleFacturation,
} from '@/features/billing/types/plan.types';

// =============================================
// Plans catalogue
// =============================================

export function usePlans() {
    return useQuery<Plan[]>({
        queryKey: ['plans-catalogue'],
        queryFn: async () => {
            const res = await apiClient.get<Plan[]>('/api/billing/plans');
            const payload = res.data as any;
            const liste: Plan[] = Array.isArray(payload) ? payload : payload?.data ?? [];
            return [...liste].sort((a, b) => (a.rang ?? 0) - (b.rang ?? 0));
        },
    });
}

// =============================================
// Abonnement actuel
// =============================================

export function useAbonnementActuel() {
    return useQuery<MonAbonnement | null>({
        queryKey: ['mon-abonnement'],
        queryFn: async () => {
            const res = await apiClient.get<MonAbonnement | null>('/api/billing/mon-abonnement');
            const payload = res.data as any;
            return payload?.data !== undefined && !Array.isArray(payload) && payload?.statut === undefined ? payload.data : payload;
        },
    });
}

// =============================================
// Cycles de facturation
// =============================================

export function useCyclesFacturation() {
    return useQuery<CycleFacturation[]>({
        queryKey: ['cycles-facturation'],
        queryFn: async () => {
            const res = await apiClient.get<CycleFacturation[]>('/api/platform/cycles-facturation');
            const payload = res.data as any;
            return Array.isArray(payload) ? payload : payload?.data ?? [];
        },
    });
}

// =============================================
// Packs quota disponibles
// =============================================

export function usePacks() {
    return useQuery<PackQuota[]>({
        queryKey: ['packs-quota-disponibles'],
        queryFn: async () => {
            const res = await apiClient.get<PackQuota[]>('/api/billing/packs');
            const payload = res.data as any;
            const liste = Array.isArray(payload) ? payload : payload?.data ?? [];
            return (liste as PackQuota[]).filter((p) => p.actif).sort((a, b) => a.ordre - b.ordre);
        },
    });
}

// =============================================
// Souscription pack
// =============================================

export function useSouscrirePack() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (packId: string) => {
            const res = await apiClient.post(`/api/billing/packs/${packId}/souscrire`);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['packs-quota-disponibles'] });
            queryClient.invalidateQueries({ queryKey: ['mon-abonnement'] });
        },
    });
}

// =============================================
// Vérification code coupon — DÉPRÉCIÉ
// =============================================

/**
 * @deprecated v4.0 — Utiliser `useVerifierCoupon` depuis `use-promotions.ts`.
 * Import : `import { useVerifierCoupon } from '../hooks/use-promotions';`
 */
export function useVerifierCouponLegacy(code: string | null) {
    return useQuery<{ valide: boolean; nom?: string; typeRemise?: string; valeur?: number; message?: string }>({
        queryKey: ['verifier-coupon-legacy', code],
        queryFn: async () => {
            if (!code) return { valide: false, message: 'Aucun code' };
            const res = await apiClient.post<any>(
                `/api/billing/promotions/verifier-coupon`,
                { codeCoupon: code }
            );
            const payload = res.data as any;
            return (payload?.valide !== undefined ? payload : payload?.data) ?? { valide: false, message: 'Code invalide' };
        },
        enabled: !!code,
        retry: false,
    });
}

// =============================================
// Détail abonnement (packs + remises + quotas)
// =============================================

export function useMonAbonnementDetail() {
    return useQuery<MonAbonnement>({
        queryKey: ['mon-abonnement-detail'],
        queryFn: async () => {
            const res = await apiClient.get<MonAbonnement>('/api/billing/mon-abonnement/detail');
            const payload = res.data as any;
            return (payload?.plan ? payload : payload?.data) as MonAbonnement;
        },
    });
}

// =============================================
// Upgrade plan
// =============================================

export function useUpgradePlan() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (nouveauPlanId: string) => {
            const res = await apiClient.patch('/api/billing/abonnement/upgrade', { nouveauPlanId });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mon-abonnement'] });
            queryClient.invalidateQueries({ queryKey: ['plans-catalogue'] });
            queryClient.invalidateQueries({ queryKey: ['mon-abonnement-detail'] });
        },
    });
}
