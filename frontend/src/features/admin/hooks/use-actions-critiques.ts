/**
 * ==================================
 * eLISAschool - Hooks Actions Critiques
 * ==================================
 * Hooks TanStack Query pour le workflow d'approbation 2F.
 *
 * Lot F — Refonte SaaS v7
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import type { TFunction } from 'i18next';

// ==========================================
// Types
// ==========================================

export type TypeActionCritique =
    | 'RESILIER'
    | 'SUSPENDRE'
    | 'UPGRADE'
    | 'SUPPRIMER_ETABLISSEMENT'
    | 'ACCORDER_AVOIR'
    | 'RESTAURER_BACKUP'
    | 'REINITIALISER_GLOBAL'
    | 'MODIFIER_TARIFS';

export type StatutActionCritique =
    | 'EN_ATTENTE'
    | 'APPROUVEE'
    | 'REJETEE'
    | 'EXECUTEE'
    | 'EXPIREE'
    | 'ANNULEE';

export interface ActionCritique {
    id: string;
    typeAction: TypeActionCritique;
    statut: StatutActionCritique;
    payload: Record<string, unknown>;
    demandeurId: string;
    approuveurId?: string;
    etablissementId?: string;
    cibleType?: string;
    cibleId?: string;
    resultatExecution?: Record<string, unknown>;
    dateDemande: string;
    dateApprobation?: string;
    dateExecution?: string;
    dateExpiration: string;
    tentativesApprobation: number;
    raison?: string;
    motifRejet?: string;
    demandeur?: { id: string; nom: string; prenom: string; email: string };
    approuveur?: { id: string; nom: string; prenom: string; email: string };
    etablissement?: { id: string; nom: string };
    typeActionLabel?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ActionsCritiquesListeResponse {
    data: ActionCritique[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    stats: {
        enAttente: number;
        approuvees: number;
        rejetees: number;
        executees: number;
        expirees: number;
    };
}

export interface StatistiquesActionsCritiques {
    total: number;
    parStatut: Record<string, number>;
    parType: Record<string, number>;
    delaiMoyenApprobationHeures: number | null;
}

export interface ListerActionsFilters {
    statut?: StatutActionCritique;
    typeAction?: TypeActionCritique;
    demandeurId?: string;
    etablissementId?: string;
    page?: number;
    limit?: number;
}

// ==========================================
// Labels
// ==========================================

type TFn = TFunction;

export function getTypeActionLabels(t: TFn): Record<TypeActionCritique, string> {
    return {
        RESILIER: t('actionsCritiques.types.resilier', { defaultValue: 'Résilier abonnement' }),
        SUSPENDRE: t('actionsCritiques.types.suspendre', { defaultValue: 'Suspendre abonnement' }),
        UPGRADE: t('actionsCritiques.types.upgrade', { defaultValue: 'Changer de plan' }),
        SUPPRIMER_ETABLISSEMENT: t('actionsCritiques.types.supprimerEtablissement', { defaultValue: 'Supprimer établissement' }),
        ACCORDER_AVOIR: t('actionsCritiques.types.accorderAvoir', { defaultValue: 'Accorder avoir' }),
        RESTAURER_BACKUP: t('actionsCritiques.types.restaurerBackup', { defaultValue: 'Restaurer backup' }),
        REINITIALISER_GLOBAL: t('actionsCritiques.types.reinitialiserGlobal', { defaultValue: 'Réinitialiser global' }),
        MODIFIER_TARIFS: t('actionsCritiques.types.modifierTarifs', { defaultValue: 'Modifier tarifs' }),
    };
}

export function getStatutLabels(t: TFn): Record<StatutActionCritique, string> {
    return {
        EN_ATTENTE: t('actionsCritiques.statuts.enAttente', { defaultValue: 'En attente' }),
        APPROUVEE: t('actionsCritiques.statuts.approuvee', { defaultValue: 'Approuvée' }),
        REJETEE: t('actionsCritiques.statuts.rejetee', { defaultValue: 'Rejetée' }),
        EXECUTEE: t('actionsCritiques.statuts.executee', { defaultValue: 'Exécutée' }),
        EXPIREE: t('actionsCritiques.statuts.expiree', { defaultValue: 'Expirée' }),
        ANNULEE: t('actionsCritiques.statuts.annulee', { defaultValue: 'Annulée' }),
    };
}

export const STATUT_VARIANTS: Record<StatutActionCritique, 'default' | 'success' | 'warning' | 'danger' | 'info' | 'secondary'> = {
    EN_ATTENTE: 'warning',
    APPROUVEE: 'success',
    REJETEE: 'danger',
    EXECUTEE: 'info',
    EXPIREE: 'secondary',
    ANNULEE: 'secondary',
};

// ==========================================
// Queries
// ==========================================

const QUERY_KEYS = {
    actionsCritiques: ['platform', 'actions-critiques'] as const,
    statistiques: ['platform', 'actions-critiques', 'statistiques'] as const,
};

export function useListerActionsCritiques(filters?: ListerActionsFilters) {
    return useQuery({
        queryKey: [...QUERY_KEYS.actionsCritiques, filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters?.statut) params.set('statut', filters.statut);
            if (filters?.typeAction) params.set('typeAction', filters.typeAction);
            if (filters?.demandeurId) params.set('demandeurId', filters.demandeurId);
            if (filters?.etablissementId) params.set('etablissementId', filters.etablissementId);
            if (filters?.page) params.set('page', String(filters.page));
            if (filters?.limit) params.set('limit', String(filters.limit));

            const qs = params.toString();
            const url = `/api/platform/facturation/actions-critiques${qs ? `?${qs}` : ''}`;
            const res = await apiClient.get<ActionsCritiquesListeResponse>(url);
            return res.data;
        },
    });
}

export function useGetActionCritique(id: string | undefined) {
    return useQuery({
        queryKey: [...QUERY_KEYS.actionsCritiques, id],
        queryFn: async () => {
            const res = await apiClient.get<{ success: boolean; data: ActionCritique }>(
                `/api/platform/facturation/actions-critiques/${id}`,
            );
            return res.data;
        },
        enabled: !!id,
    });
}

export function useStatistiquesActionsCritiques() {
    return useQuery({
        queryKey: QUERY_KEYS.statistiques,
        queryFn: async () => {
            const res = await apiClient.get<{ success: boolean; data: StatistiquesActionsCritiques }>(
                '/api/platform/facturation/actions-critiques/statistiques',
            );
            return res.data;
        },
    });
}

// ==========================================
// Mutations
// ==========================================

export function useDemanderActionCritique(t: TFn) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: {
            typeAction: TypeActionCritique;
            payload: Record<string, unknown>;
            raison?: string;
            cibleType?: string;
            cibleId?: string;
            etablissementId?: string;
        }) => {
            const res = await apiClient.post<{ success: boolean; data: ActionCritique }>(
                '/api/platform/facturation/actions-critiques',
                data,
            );
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.actionsCritiques });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.statistiques });
            toast.success(t('actionsCritiques.toast.demandee', { defaultValue: 'Action critique demandée' }));
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.error?.message || t('actionsCritiques.toast.erreurDemande', { defaultValue: 'Erreur lors de la demande' }));
        },
    });
}

export function useApprouverActionCritique(t: TFn) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, codeMFA, commentaire }: {
            id: string;
            codeMFA: string;
            commentaire?: string;
        }) => {
            const res = await apiClient.post<{ success: boolean; data: ActionCritique }>(
                `/api/platform/facturation/actions-critiques/${id}/approuver`,
                { codeMFA, commentaire },
            );
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.actionsCritiques });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.statistiques });
            toast.success(t('actionsCritiques.toast.approuvee', { defaultValue: 'Action critique approuvée' }));
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.error?.message || t('actionsCritiques.toast.mfaInvalide', { defaultValue: 'Code MFA invalide' }));
        },
    });
}

export function useRejeterActionCritique(t: TFn) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, motif }: { id: string; motif: string }) => {
            const res = await apiClient.post<{ success: boolean; data: ActionCritique }>(
                `/api/platform/facturation/actions-critiques/${id}/rejeter`,
                { motif },
            );
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.actionsCritiques });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.statistiques });
            toast.success(t('actionsCritiques.toast.rejetee', { defaultValue: 'Action critique rejetée' }));
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.error?.message || t('actionsCritiques.toast.erreurRejet', { defaultValue: 'Erreur lors du rejet' }));
        },
    });
}

export function useAnnulerActionCritique(t: TFn) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const res = await apiClient.post<{ success: boolean; data: ActionCritique }>(
                `/api/platform/facturation/actions-critiques/${id}/annuler`,
                {},
            );
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.actionsCritiques });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.statistiques });
            toast.success(t('actionsCritiques.toast.annulee', { defaultValue: 'Action critique annulée' }));
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.error?.message || t('actionsCritiques.toast.erreurAnnulation', 'Erreur lors de l\'annulation'));
        },
    });
}
