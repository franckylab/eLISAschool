/**
 * ==================================
 * eLISAschool - Hook Détail Établissement (Plateforme)
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Hook agrégé pour la page détail établissement (Control Plane).
 * Combine : données de base, stats, santé, config + mutations statut.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import type {
    Etablissement,
    EtablissementDetailStats,
    EtablissementConfig,
    ConfigCompleteResult,
    ActiviteEtablissementResult,
    UtilisateursResumeResult,
    FactureEtablissement,
    HistoriqueConnexionsResult,
    AuditLogResponse,
    HistoriqueScoreSante,
    EvolutionPaiementMois,
} from '@/features/etablissements/types/etablissement.types';
import type {
    SanteEtablissementResult,
} from '@/features/admin/components/sante-etablissement';

// =============================================
// Helper — Extraction sûre de la donnée API
// =============================================

/**
 * Extrait `data` d'une réponse API et lève une erreur si absente.
 * Garantit que queryFn retourne T (et non T | undefined),
 * ce qui permet à TanStack Query de correctement inférer les types.
 */
function unwrap<T>(res: { data?: T; success?: boolean }, endpoint: string): T {
    if (res.data === undefined || res.data === null) {
        throw new Error(`Réponse API vide pour ${endpoint}`);
    }
    return res.data;
}

// =============================================
// Query Keys
// =============================================

const ETABLISSEMENT_DETAIL_KEYS = {
    all: ['platform-etablissement-detail'] as const,
    base: (id: string) => [...ETABLISSEMENT_DETAIL_KEYS.all, 'base', id] as const,
    stats: (id: string) => [...ETABLISSEMENT_DETAIL_KEYS.all, 'stats', id] as const,
    sante: (id: string) => [...ETABLISSEMENT_DETAIL_KEYS.all, 'sante', id] as const,
    config: (id: string) => [...ETABLISSEMENT_DETAIL_KEYS.all, 'config', id] as const,
    configComplete: (id: string) => [...ETABLISSEMENT_DETAIL_KEYS.all, 'config-complete', id] as const,
    activite: (id: string) => [...ETABLISSEMENT_DETAIL_KEYS.all, 'activite', id] as const,
    utilisateurs: (id: string) => [...ETABLISSEMENT_DETAIL_KEYS.all, 'utilisateurs', id] as const,
    factures: (id: string) => [...ETABLISSEMENT_DETAIL_KEYS.all, 'factures', id] as const,
    connexions: (id: string) => [...ETABLISSEMENT_DETAIL_KEYS.all, 'connexions', id] as const,
    audit: (id: string) => [...ETABLISSEMENT_DETAIL_KEYS.all, 'audit', id] as const,
    historiqueSante: (id: string) => [...ETABLISSEMENT_DETAIL_KEYS.all, 'historique-sante', id] as const,
    evolutionPaiements: (id: string) => [...ETABLISSEMENT_DETAIL_KEYS.all, 'evolution-paiements', id] as const,
};

// =============================================
// Hook principal — agrège toutes les données
// =============================================

export function useEtablissementDetail(id: string) {
    const queryBase = useQuery<Etablissement>({
        queryKey: ETABLISSEMENT_DETAIL_KEYS.base(id),
        queryFn: async () => {
            const res = await apiClient.get<Etablissement>(`/api/platform/etablissements/${id}`);
            return unwrap(res, `etablissement/${id}`);
        },
        enabled: !!id,
        staleTime: 2 * 60_000,
        placeholderData: (prev) => prev,
    });

    const queryStats = useQuery<EtablissementDetailStats>({
        queryKey: ETABLISSEMENT_DETAIL_KEYS.stats(id),
        queryFn: async () => {
            const res = await apiClient.get<EtablissementDetailStats>(`/api/platform/etablissements/${id}/stats`);
            return unwrap(res, `etablissement/${id}/stats`);
        },
        enabled: !!id,
        staleTime: 60_000,
        retry: 2,
    });

    const querySante = useQuery<SanteEtablissementResult>({
        queryKey: ETABLISSEMENT_DETAIL_KEYS.sante(id),
        queryFn: async () => {
            const res = await apiClient.get<SanteEtablissementResult>(`/api/platform/etablissements/${id}/sante`);
            return unwrap(res, `etablissement/${id}/sante`);
        },
        enabled: !!id,
        staleTime: 5 * 60_000,
        retry: 2,
    });

    const queryConfig = useQuery<EtablissementConfig>({
        queryKey: ETABLISSEMENT_DETAIL_KEYS.config(id),
        queryFn: async () => {
            const res = await apiClient.get<EtablissementConfig>(`/api/platform/etablissements/${id}/config`);
            return unwrap(res, `etablissement/${id}/config`);
        },
        enabled: !!id,
        staleTime: 2 * 60_000,
        retry: 2,
    });

    const queryConfigComplete = useQuery<ConfigCompleteResult>({
        queryKey: ETABLISSEMENT_DETAIL_KEYS.configComplete(id),
        queryFn: async () => {
            const res = await apiClient.get<ConfigCompleteResult>(`/api/platform/etablissements/${id}/config-complete`);
            return unwrap(res, `etablissement/${id}/config-complete`);
        },
        enabled: !!id,
        staleTime: 2 * 60_000,
        retry: 2,
    });

    const queryActivite = useQuery<ActiviteEtablissementResult>({
        queryKey: ETABLISSEMENT_DETAIL_KEYS.activite(id),
        queryFn: async () => {
            const res = await apiClient.get<ActiviteEtablissementResult>(`/api/platform/etablissements/${id}/activite`);
            return unwrap(res, `etablissement/${id}/activite`);
        },
        enabled: !!id,
        staleTime: 60_000,
        retry: 2,
    });

    const queryUtilisateurs = useQuery<UtilisateursResumeResult>({
        queryKey: ETABLISSEMENT_DETAIL_KEYS.utilisateurs(id),
        queryFn: async () => {
            const res = await apiClient.get<UtilisateursResumeResult>(`/api/platform/etablissements/${id}/utilisateurs`);
            return unwrap(res, `etablissement/${id}/utilisateurs`);
        },
        enabled: !!id,
        staleTime: 2 * 60_000,
        retry: 2,
    });

    const queryFactures = useQuery<FactureEtablissement[]>({
        queryKey: ETABLISSEMENT_DETAIL_KEYS.factures(id),
        queryFn: async () => {
            const res = await apiClient.get<{ data: FactureEtablissement[]; total: number }>(
                '/api/platform/facturation/factures',
                { etablissementId: id }
            );
            return unwrap(res, 'facturation/factures').data || [];
        },
        enabled: !!id,
        staleTime: 2 * 60_000,
        retry: 2,
    });

    const queryConnexions = useQuery<HistoriqueConnexionsResult>({
        queryKey: ETABLISSEMENT_DETAIL_KEYS.connexions(id),
        queryFn: async () => {
            const res = await apiClient.get<HistoriqueConnexionsResult>(`/api/platform/etablissements/${id}/connexions`);
            return unwrap(res, `etablissement/${id}/connexions`);
        },
        enabled: !!id,
        staleTime: 5 * 60_000,
        retry: 2,
    });

    const queryAudit = useQuery<AuditLogResponse>({
        queryKey: ETABLISSEMENT_DETAIL_KEYS.audit(id),
        queryFn: async () => {
            const res = await apiClient.get<AuditLogResponse>(`/api/platform/etablissements/${id}/audit`, {
                page: '1',
                limit: '50',
            });
            return unwrap(res, `etablissement/${id}/audit`);
        },
        enabled: !!id,
        staleTime: 2 * 60_000,
        retry: 2,
    });

    // Historique scores santé (sparkline)
    const queryHistoriqueSante = useQuery<HistoriqueScoreSante[]>({
        queryKey: ETABLISSEMENT_DETAIL_KEYS.historiqueSante(id),
        queryFn: async () => {
            const res = await apiClient.get<{ data: HistoriqueScoreSante[] }>(`/api/platform/etablissements/${id}/sante/historique`);
            return unwrap(res, `etablissement/${id}/sante/historique`).data;
        },
        enabled: !!id,
        staleTime: 5 * 60_000,
        retry: 1,
    });

    // Évolution mensuelle des paiements
    const queryEvolutionPaiements = useQuery<EvolutionPaiementMois[]>({
        queryKey: ETABLISSEMENT_DETAIL_KEYS.evolutionPaiements(id),
        queryFn: async () => {
            const res = await apiClient.get<{ data: EvolutionPaiementMois[] }>(`/api/platform/etablissements/${id}/finances/evolution`);
            return unwrap(res, `etablissement/${id}/finances/evolution`).data;
        },
        enabled: !!id,
        staleTime: 5 * 60_000,
        retry: 1,
    });

    return {
        // Données
        etablissement: queryBase.data,
        stats: queryStats.data,
        sante: querySante.data,
        config: queryConfig.data,
        configComplete: queryConfigComplete.data,
        activite: queryActivite.data,
        utilisateurs: queryUtilisateurs.data,
        factures: queryFactures.data,
        connexions: queryConnexions.data,
        audit: queryAudit.data,
        historiqueSante: queryHistoriqueSante.data,
        evolutionPaiements: queryEvolutionPaiements.data,

        // États de chargement
        isLoading: queryBase.isLoading,
        isLoadingStats: queryStats.isLoading,
        isLoadingSante: querySante.isLoading,
        isLoadingConfig: queryConfig.isLoading,
        isLoadingConfigComplete: queryConfigComplete.isLoading,
        isLoadingActivite: queryActivite.isLoading,
        isLoadingUtilisateurs: queryUtilisateurs.isLoading,
        isLoadingFactures: queryFactures.isLoading,
        isLoadingConnexions: queryConnexions.isLoading,
        isLoadingAudit: queryAudit.isLoading,
        isFetching: queryBase.isFetching,

        // États d'erreur
        error: queryBase.error,
        errorStats: queryStats.error,
        errorSante: querySante.error,
        errorConfig: queryConfig.error,
        errorConfigComplete: queryConfigComplete.error,
        errorActivite: queryActivite.error,
        errorUtilisateurs: queryUtilisateurs.error,
        errorFactures: queryFactures.error,
        errorConnexions: queryConnexions.error,
        errorAudit: queryAudit.error,

        // Rafraîchissement
        refetchAll: () => {
            queryBase.refetch();
            queryStats.refetch();
            querySante.refetch();
            queryConfig.refetch();
            queryConfigComplete.refetch();
            queryActivite.refetch();
            queryUtilisateurs.refetch();
            queryFactures.refetch();
            queryConnexions.refetch();
            queryAudit.refetch();
            queryHistoriqueSante.refetch();
            queryEvolutionPaiements.refetch();
        },
        refetch: queryBase.refetch,
        refetchStats: queryStats.refetch,
        refetchSante: querySante.refetch,
        refetchConfig: queryConfig.refetch,
        refetchConfigComplete: queryConfigComplete.refetch,
        refetchActivite: queryActivite.refetch,
        refetchUtilisateurs: queryUtilisateurs.refetch,
        refetchFactures: queryFactures.refetch,
        refetchConnexions: queryConnexions.refetch,
        refetchAudit: queryAudit.refetch,
        refetchHistoriqueSante: queryHistoriqueSante.refetch,
        refetchEvolutionPaiements: queryEvolutionPaiements.refetch,
    };
}

// =============================================
// Mutations — Actions statut
// =============================================

export function useDesactiverEtablissement() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const res = await apiClient.patch<Etablissement>(`/api/platform/etablissements/${id}/desactiver`);
            return res.data;
        },
        onSuccess: (_, id) => {
            toast.success('Établissement désactivé');
            queryClient.invalidateQueries({ queryKey: ETABLISSEMENT_DETAIL_KEYS.base(id) });
            queryClient.invalidateQueries({ queryKey: ['platform-etablissements-liste'] });
            queryClient.invalidateQueries({ queryKey: ['platform-etablissements-stats'] });
        },
        onError: () => {
            toast.error('Erreur lors de la désactivation');
        },
    });
}

export function useActiverEtablissement() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const res = await apiClient.patch<Etablissement>(`/api/platform/etablissements/${id}/activer`);
            return res.data;
        },
        onSuccess: (_, id) => {
            toast.success('Établissement réactivé');
            queryClient.invalidateQueries({ queryKey: ETABLISSEMENT_DETAIL_KEYS.base(id) });
            queryClient.invalidateQueries({ queryKey: ['platform-etablissements-liste'] });
            queryClient.invalidateQueries({ queryKey: ['platform-etablissements-stats'] });
        },
        onError: () => {
            toast.error('Erreur lors de la réactivation');
        },
    });
}

// =============================================
// Mutation — Upload logo
// =============================================

export function useUploadLogo() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, logoBase64 }: { id: string; logoBase64: string }) => {
            const res = await apiClient.post<Etablissement>(`/api/platform/etablissements/${id}/logo`, { logoBase64 });
            return res.data;
        },
        onSuccess: (_, vars) => {
            toast.success('Logo uploadé avec succès');
            queryClient.invalidateQueries({ queryKey: ETABLISSEMENT_DETAIL_KEYS.base(vars.id) });
            queryClient.invalidateQueries({ queryKey: ['platform-etablissements-liste'] });
        },
        onError: () => {
            toast.error('Erreur lors de l\'upload du logo');
        },
    });
}

// =============================================
// Mutation — Supprimer logo
// =============================================

export function useSupprimerLogo() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/platform/etablissements/${id}/logo`);
        },
        onSuccess: (_, id) => {
            toast.success('Logo supprimé');
            queryClient.invalidateQueries({ queryKey: ETABLISSEMENT_DETAIL_KEYS.base(id) });
            queryClient.invalidateQueries({ queryKey: ['platform-etablissements-liste'] });
        },
        onError: () => {
            toast.error('Erreur lors de la suppression du logo');
        },
    });
}

// =============================================
// Mutation — Changer de plan d'abonnement
// =============================================

export function useChangerPlan() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, plan }: { id: string; plan: 'gratuit' | 'standard' | 'premium' | 'entreprise' }) => {
            const res = await apiClient.patch<EtablissementConfig>(`/api/platform/etablissements/${id}/plan`, { plan });
            return res.data;
        },
        onSuccess: (_, vars) => {
            toast.success('Plan d\'abonnement mis à jour');
            queryClient.invalidateQueries({ queryKey: ETABLISSEMENT_DETAIL_KEYS.base(vars.id) });
            queryClient.invalidateQueries({ queryKey: ETABLISSEMENT_DETAIL_KEYS.config(vars.id) });
            queryClient.invalidateQueries({ queryKey: ['platform-etablissements-liste'] });
            queryClient.invalidateQueries({ queryKey: ['platform-etablissements-stats'] });
        },
        onError: () => {
            toast.error('Erreur lors du changement de plan');
        },
    });
}

// =============================================
// Mutation — Recalculer score de santé
// =============================================

export function useRecalculerSante() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const res = await apiClient.post(`/api/platform/etablissements/${id}/sante/recalculer`);
            return res.data;
        },
        onSuccess: (_, id) => {
            toast.success('Score de santé recalculé');
            queryClient.invalidateQueries({ queryKey: ETABLISSEMENT_DETAIL_KEYS.sante(id) });
            queryClient.invalidateQueries({ queryKey: ETABLISSEMENT_DETAIL_KEYS.historiqueSante(id) });
            queryClient.invalidateQueries({ queryKey: ['platform-etablissements-sante'] });
            queryClient.invalidateQueries({ queryKey: ['platform-etablissements-tendances'] });
            queryClient.invalidateQueries({ queryKey: ['platform-etablissements-liste'] });
        },
        onError: () => {
            toast.error('Erreur lors du recalcul du score de santé');
        },
    });
}

// =============================================
// Mutation — Recalculer tous les scores de santé (batch)
// =============================================

export function useRecalculerTousSante() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const res = await apiClient.post('/api/platform/etablissements/sante/recalculer-tous');
            return res.data;
        },
        onSuccess: () => {
            toast.success('Scores de santé recalculés pour tous les établissements');
            queryClient.invalidateQueries({ queryKey: ['platform-etablissements-sante'] });
            queryClient.invalidateQueries({ queryKey: ['platform-etablissements-tendances'] });
            queryClient.invalidateQueries({ queryKey: ['platform-etablissements-liste'] });
            queryClient.invalidateQueries({ queryKey: ['platform-etablissements-stats'] });
            queryClient.invalidateQueries({ queryKey: ['platform-etablissements-navigation-ids'] });
        },
        onError: () => {
            toast.error('Erreur lors du recalcul batch des scores de santé');
        },
    });
}

// =============================================
// Hook — Résumé agrégé (optimisation performance)
// =============================================

interface EtablissementResume {
    etablissement: Etablissement;
    stats: EtablissementDetailStats;
    sante: {
        score: number;
        categorie: string;
        details: Record<string, unknown>;
        tendance: 'hausse' | 'baisse' | 'stable' | null;
        dernierCalcul: string | null;
    } | null;
    config: EtablissementConfig;
}

export function useEtablissementResume(id: string) {
    return useQuery<EtablissementResume>({
        queryKey: [...ETABLISSEMENT_DETAIL_KEYS.all, 'resume', id] as const,
        queryFn: async () => {
            const res = await apiClient.get<{ data: EtablissementResume }>(`/api/platform/etablissements/${id}/resume`);
            return unwrap(res, `etablissement/${id}/resume`).data;
        },
        enabled: !!id,
        staleTime: 2 * 60_000,
        retry: 2,
    });
}
