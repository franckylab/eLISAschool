/**
 * ==================================
 * eLISAschool - Hooks RemplacementHeureCours
 * ==================================
 * Hooks TanStack Query pour la gestion des remplacements d'enseignants.
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { useHandleError } from '@/hooks/use-handle-error';

// ─── Types ─────────────────────────────────────────────────────

export interface RemplacementHeureCours {
    id: string;
    heureCoursId: string;
    demandeurId: string;
    remplacantId?: string | null;
    motif: string;
    statut: 'EN_ATTENTE' | 'VALIDEE' | 'REJETEE' | 'EXECUTEE' | 'ANNULEE';
    dateDemande: string;
    dateValidation?: string | null;
    dateExecution?: string | null;
    valideParId?: string | null;
    commentaires?: string | null;
    heureCours?: {
        id: string;
        date: string;
        heureDebut: string;
        heureFin: string;
        matiere?: { id: string; nom: string };
        classeAnnee?: { id: string; classe?: { id: string; nom: string } };
        salle?: { id: string; nom: string };
        enseignant?: { id: string; nom: string; prenom: string };
    };
    demandeur?: { id: string; nom: string; prenom: string };
    remplacant?: { id: string; nom: string; prenom: string };
    validePar?: { id: string; nom: string; prenom: string };
}

export interface StatistiquesRemplacements {
    total: number;
    enAttente: number;
    validees: number;
    rejetees: number;
    executees: number;
    annulees: number;
    tauxExecution: number;
}

// ─── Queries ───────────────────────────────────────────────────

export function useRemplacements(query?: Record<string, string | number | boolean | undefined>) {
    return useQuery({
        queryKey: ['personnel', 'remplacements-heure-cours', 'list', query],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (query) {
                for (const [k, v] of Object.entries(query)) {
                    if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
                }
            }
            const response = await apiClient.get<{ items: RemplacementHeureCours[]; total: number }>(
                `/api/emploi-du-temps/heures-cours/remplacements?${params}`,
            );
            return response.data;
        },
    });
}

export function useStatistiquesRemplacements() {
    return useQuery({
        queryKey: ['personnel', 'remplacements-heure-cours', 'statistiques'],
        queryFn: async () => {
            const response = await apiClient.get<StatistiquesRemplacements>(
                '/api/emploi-du-temps/heures-cours/remplacements/statistiques',
            );
            return response.data;
        },
        staleTime: 5 * 60 * 1000, // 5 min — les stats changent rarement
    });
}

// ─── Mutations ─────────────────────────────────────────────────

export function useCreerRemplacement() {
    const queryClient = useQueryClient();
    const { t } = useTranslation('emplois');
    const handleError = useHandleError();

    return useMutation({
        mutationFn: async (payload: { heureCoursId: string; motif: string; remplacantId?: string | null }) => {
            const response = await apiClient.post<RemplacementHeureCours>(
                '/api/emploi-du-temps/heures-cours/remplacements',
                payload,
            );
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['personnel', 'remplacements-heure-cours'] });
            toast.success(t('remplacements.demandeCreee'));
        },
        onError: (err: unknown) => {
            handleError(err, t('remplacements.erreurCreation'));
        },
    });
}

export function useValiderRemplacement() {
    const queryClient = useQueryClient();
    const { t } = useTranslation('emplois');
    const handleError = useHandleError();

    return useMutation({
        mutationFn: async ({ id, remplacantId, commentaires }: {
            id: string;
            remplacantId: string;
            commentaires?: string;
        }) => {
            const response = await apiClient.patch<RemplacementHeureCours>(
                `/api/emploi-du-temps/heures-cours/remplacements/${id}/valider`,
                { remplacantId, commentaires },
            );
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['personnel', 'remplacements-heure-cours'] });
            toast.success(t('remplacements.valide'));
        },
        onError: (err: unknown) => {
            handleError(err, t('remplacements.erreurValidation'));
        },
    });
}

export function useExecuterRemplacement() {
    const queryClient = useQueryClient();
    const { t } = useTranslation('emplois');
    const handleError = useHandleError();

    return useMutation({
        mutationFn: async ({ id, commentaires }: {
            id: string;
            commentaires?: string;
        }) => {
            const response = await apiClient.patch<RemplacementHeureCours>(
                `/api/emploi-du-temps/heures-cours/remplacements/${id}/executer`,
                { commentaires },
            );
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['personnel', 'remplacements-heure-cours'] });
            queryClient.invalidateQueries({ queryKey: ['personnel', 'heures-cours'] });
            toast.success(t('remplacements.execute'));
        },
        onError: (err: unknown) => {
            handleError(err, t('remplacements.erreurExecution'));
        },
    });
}

export function useRejeterRemplacement() {
    const queryClient = useQueryClient();
    const { t } = useTranslation('emplois');
    const handleError = useHandleError();

    return useMutation({
        mutationFn: async ({ id, motif }: { id: string; motif: string }) => {
            const response = await apiClient.patch<RemplacementHeureCours>(
                `/api/emploi-du-temps/heures-cours/remplacements/${id}/rejeter`,
                { motif },
            );
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['personnel', 'remplacements-heure-cours'] });
            toast.success(t('remplacements.rejete'));
        },
        onError: (err: unknown) => {
            handleError(err, t('remplacements.erreurRejet'));
        },
    });
}

export function useAnnulerRemplacement() {
    const queryClient = useQueryClient();
    const { t } = useTranslation('emplois');
    const handleError = useHandleError();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await apiClient.patch<RemplacementHeureCours>(
                `/api/emploi-du-temps/heures-cours/remplacements/${id}/annuler`,
            );
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['personnel', 'remplacements-heure-cours'] });
            toast.success(t('remplacements.annulee'));
        },
        onError: (err: unknown) => {
            handleError(err, t('remplacements.erreurAnnulation'));
        },
    });
}
