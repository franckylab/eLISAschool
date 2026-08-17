/**
 * ==================================
 * eLISAschool - Platform Billing Hooks
 * ==================================
 * Hooks TanStack Query centralisés pour la facturation plateforme.
 * Utilisés par : platform.plans, platform.abonnements, platform.factures.
 *
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// =============================================
// Types partagés
// =============================================

export interface Plan {
    id: string;
    nom: string;
    slug: string;
    description?: string;
    prixBase: number;
    devise: string;
    rang?: number;
    estParDefaut?: boolean;
    tarification?: {
        prixBase: number;
        prixParEleve: number;
        elevesInclusGratuits: number;
        paliers?: Array<{ seuilEleves: number; prixParEleve: number }>;
    };
    quotas?: Record<string, number>;
    entitlements?: { modules: string[]; fonctionnalites: string[] };
    cyclesAutorises?: string[];
    essai?: { autorise: boolean; dureeJours?: number };
    statut: string;
    actif: boolean;
    badge?: string;
}

export interface AbonnementPlan {
    id: string;
    nom: string;
    slug: string;
    prixBase: number;
    devise: string;
}

export interface Abonnement {
    id: string;
    etablissementId: string;
    planId: string;
    statut: string;
    montantMensuel: number;
    nombreElevesActuel: number;
    dateDebut: string;
    dateFin: string;
    cycleFacturation: string;
    autoRenouvellement: boolean;
    plan?: AbonnementPlan;
    etablissement?: { id: string; nom: string; code: string };
}

export interface Facture {
    id: string;
    numero: string;
    etablissementId: string;
    montant: number;
    devise: string;
    statut: string;
    dateEmission: string;
    dateEcheance: string;
    etablissement?: { id: string; nom: string; code: string };
}

// =============================================
// Hook usePlans — Liste des plans d'abonnement
// =============================================

export function usePlans() {
    return useQuery<Plan[]>({
        queryKey: ['platform-plans'],
        queryFn: async () => {
            const res = await apiClient.get<Plan[] | { success: boolean; data: Plan[] }>('/api/platform/facturation/plans');
            const payload = res.data as any;
            const liste: Plan[] = Array.isArray(payload) ? payload : payload?.data ?? [];
            return [...liste].sort((a, b) => (a.rang ?? 0) - (b.rang ?? 0));
        },
    });
}

// =============================================
// Hook useAbonnements — Liste des abonnements clients
// =============================================

export function useAbonnements() {
    return useQuery<{ data: Abonnement[]; total: number }>({
        queryKey: ['platform-abonnements'],
        queryFn: async () => {
            const res = await apiClient.get<Abonnement[]>('/api/platform/facturation/abonnements');
            const payload = res.data as any;
            const data: Abonnement[] = Array.isArray(payload) ? payload : payload?.data ?? [];
            return { data, total: payload?.total ?? data.length };
        },
    });
}

// =============================================
// Hook useFactures — Liste des factures
// =============================================

export function useFactures() {
    return useQuery<{ data: Facture[]; total: number }>({
        queryKey: ['platform-factures'],
        queryFn: async () => {
            const res = await apiClient.get<Facture[]>('/api/platform/facturation/factures');
            const payload = res.data as any;
            const data: Facture[] = Array.isArray(payload) ? payload : payload?.data ?? [];
            return { data, total: payload?.total ?? data.length };
        },
    });
}

// =============================================
// Hook useAcknowledgeAlert — Acquitter une alerte monitoring
// =============================================

export function useAcknowledgeAlert() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (alertId: string) => {
            await apiClient.post(`/api/platform/monitoring/alerts/${alertId}/acknowledge`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['monitoring-alerts'] });
        },
    });
}
