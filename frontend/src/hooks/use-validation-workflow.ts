/**
 * ==================================
 * eLISAschool - Hook Validation Workflow
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Hook TanStack Query pour le workflow de validation multi-niveau.
 * Wraps les 4 endpoints clés de /api/validation-workflows.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useHandleError } from './use-handle-error';

// ─── Types miroir backend ───

export type StatutWorkflow = 'EN_COURS' | 'COMPLETEE' | 'REJETEE' | 'ANNULEE';
export type DecisionValidation = 'APPROUVE' | 'REJETE';

export interface ValidationNiveau {
    niveau: number;
    validateurId: string;
    validateurNom?: string;
    roleRequis: string;
    decision: DecisionValidation;
    commentaire?: string;
    dateValidation: string;
}

export interface WorkflowValidation {
    id: string;
    module: string;
    entiteId: string;
    entiteType: string;
    niveauxRequis: number;
    niveauActuel: number;
    statut: StatutWorkflow;
    configRoles?: Record<string, string>;
    historique?: ValidationNiveau[];
    dernierValidateurId?: string;
    dateCompletion?: string;
    commentaire?: string;
    etablissementId: string;
    createdAt: string;
    updatedAt: string;
}

interface TraiterValidationDto {
    decision: DecisionValidation;
    commentaire?: string;
}

// ─── Query keys ───

const QK = {
    check: (module: string, entiteId: string) =>
        ['validation-workflow', 'check', module, entiteId] as const,
    detail: (id: string) =>
        ['validation-workflow', 'detail', id] as const,
};

// ─── Hooks ───

/**
 * Vérifie si une entité est validée pour un module donné.
 */
export function useCheckValidation(module: string, entiteId: string) {
    return useQuery({
        queryKey: QK.check(module, entiteId),
        queryFn: async () => {
            const res = await apiClient.get<{ isValide: boolean }>(
                `/api/validation-workflows/check/${module}/${entiteId}`,
            );
            return res.data;
        },
        enabled: !!module && !!entiteId,
        staleTime: 30_000,
    });
}

/**
 * Récupère le détail d'un workflow (historique complet).
 */
export function useWorkflowDetail(workflowId: string | undefined) {
    return useQuery({
        queryKey: QK.detail(workflowId ?? ''),
        queryFn: async () => {
            const res = await apiClient.get<WorkflowValidation>(
                `/api/validation-workflows/${workflowId}`,
            );
            return res.data;
        },
        enabled: !!workflowId,
        staleTime: 15_000,
    });
}

/**
 * Traite une validation (approuver ou rejeter un niveau).
 */
export function useTraiterValidation() {
    const queryClient = useQueryClient();
    const handleError = useHandleError();

    return useMutation({
        mutationFn: async ({
            workflowId,
            dto,
        }: {
            workflowId: string;
            dto: TraiterValidationDto;
        }) => {
            const res = await apiClient.post<WorkflowValidation>(
                `/api/validation-workflows/${workflowId}/valider`,
                dto,
            );
            return res.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['validation-workflow'] });
            queryClient.invalidateQueries({ queryKey: [data?.module] });
        },
        onError: (e: unknown) => handleError(e, 'Erreur lors de la validation'),
    });
}

/**
 * Annule un workflow en cours.
 */
export function useAnnulerWorkflow() {
    const queryClient = useQueryClient();
    const handleError = useHandleError();

    return useMutation({
        mutationFn: async (workflowId: string) => {
            const res = await apiClient.post<WorkflowValidation>(
                `/api/validation-workflows/${workflowId}/annuler`,
            );
            return res.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['validation-workflow'] });
            queryClient.invalidateQueries({ queryKey: [data?.module] });
        },
        onError: (e: unknown) => handleError(e, 'Erreur lors de l\'annulation'),
    });
}
