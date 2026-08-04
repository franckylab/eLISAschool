/**
 * ==================================
 * eLISAschool - Hook Classes
 * ==================================
 * Version: 3.0.0
 * Auteur: franck arlos chendjou
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/auth.store';
import { useHandleError } from '@/hooks/use-handle-error';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import type { PaginatedResult } from '@shared/types/api.types';
import type {
    Classe,
    CreerClasseDto,
    CreerClasseCompletDto,
    ModifierClasseDto,
    ClasseFiltres,
    AffecterEleveDto,
    TransfererEleveDto,
    ElevesClasseResult,
    ClassesStats,
} from '../types/classe.types';

const CLASSES_KEYS = {
    all: ['classes'] as const,
    listes: () => [...CLASSES_KEYS.all, 'liste'] as const,
    liste: (filtres: ClasseFiltres) => [...CLASSES_KEYS.listes(), filtres] as const,
    details: () => [...CLASSES_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...CLASSES_KEYS.details(), id] as const,
    stats: () => [...CLASSES_KEYS.all, 'stats'] as const,
};

// ========== QUERIES ==========

export function useClasses(filtres: ClasseFiltres = {}) {
    const { isAuthenticated } = useAuthStore();
    const { t } = useTranslation('classes');

    return useQuery<PaginatedResult<Classe>>({
        queryKey: CLASSES_KEYS.liste(filtres),
        queryFn: async () => {
            const params: Record<string, string | number> = {
                page: filtres.page || 1,
                limit: filtres.limit || 20,
                sortBy: filtres.sortBy || 'nom',
                sortOrder: filtres.sortOrder || 'ASC',
            };

            if (filtres.recherche) params.search = filtres.recherche;
            if (filtres.niveauId) params.niveauId = filtres.niveauId;
            if (filtres.anneeScolaireId) params.anneeId = filtres.anneeScolaireId;
            if (filtres.actif !== undefined) params.actif = String(filtres.actif);

            const response = await apiClient.get<PaginatedResult<Classe>>('/api/classes', params);

            if (!response.data) {
                throw new Error(t('hooks.reponseInvalide'));
            }

            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

export function useClasse(id: string) {
    const { isAuthenticated } = useAuthStore();
    const { t } = useTranslation('classes');

    return useQuery({
        queryKey: CLASSES_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<Classe>(`/api/classes/${id}`);

            if (!response.data) {
                throw new Error(t('hooks.classeNonTrouvee'));
            }

            return response.data;
        },
        enabled: !!id && isAuthenticated,
        staleTime: 10 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

export function useElevesClasse(classeId: string, page: number = 1, limit: number = 20, search?: string) {
    const { isAuthenticated } = useAuthStore();
    const { t } = useTranslation('classes');

    return useQuery({
        queryKey: [...CLASSES_KEYS.detail(classeId), 'eleves', { page, limit, search }],
        queryFn: async () => {
            const params: Record<string, string | number> = { page, limit };
            if (search) params.search = search;

            const response = await apiClient.get<ElevesClasseResult>(
                `/api/classes/${classeId}/eleves`,
                params
            );

            if (!response.data) {
                throw new Error(t('hooks.reponseInvalide'));
            }

            return response.data;
        },
        enabled: !!classeId && isAuthenticated,
        staleTime: 2 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

export function useClassesStats(etablissementId?: string) {
    const { t } = useTranslation('classes');

    return useQuery({
        queryKey: CLASSES_KEYS.stats(),
        queryFn: async () => {
            const response = await apiClient.get<ClassesStats>('/api/classes/stats');

            if (!response.data) {
                throw new Error(t('hooks.statsNonDisponibles'));
            }

            return response.data;
        },
        enabled: !!etablissementId,
        placeholderData: (previousData) => previousData,
    });
}

// ========== MUTATIONS ==========

export function useCreerClasse() {
    const queryClient = useQueryClient();
    const { t } = useTranslation('classes');
    const handleError = useHandleError();

    return useMutation({
        mutationFn: async (dto: CreerClasseDto | CreerClasseCompletDto) => {
            const response = await apiClient.post<Classe>('/api/classes', dto);

            if (!response.data) {
                throw new Error(t('hooks.erreurCreation'));
            }

            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CLASSES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: CLASSES_KEYS.stats() });
            toast.success(t('hooks.succesCreation'));
        },
        onError: (error: unknown) => {
            handleError(error, t('hooks.erreurCreation'));
        },
    });
}

export function useModifierClasse() {
    const queryClient = useQueryClient();
    const { t } = useTranslation('classes');
    const handleError = useHandleError();

    return useMutation({
        mutationFn: async ({ id, ...dto }: ModifierClasseDto) => {
            const response = await apiClient.patch<Classe>(`/api/classes/${id}`, dto);

            if (!response.data) {
                throw new Error(t('hooks.erreurModification'));
            }

            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: CLASSES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: CLASSES_KEYS.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: CLASSES_KEYS.stats() });
            toast.success(t('hooks.succesModification'));
        },
        onError: (error: unknown) => {
            handleError(error, t('hooks.erreurModification'));
        },
    });
}

export function useSupprimerClasse() {
    const queryClient = useQueryClient();
    const { t } = useTranslation('classes');
    const handleError = useHandleError();

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/classes/${id}`);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CLASSES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: CLASSES_KEYS.stats() });
            toast.success(t('hooks.succesSuppression'));
        },
        onError: (error: unknown) => {
            handleError(error, t('hooks.erreurSuppression'));
        },
    });
}

export function useAffecterEleve() {
    const queryClient = useQueryClient();
    const { t } = useTranslation('classes');
    const handleError = useHandleError();

    return useMutation({
        mutationFn: async (dto: AffecterEleveDto) => {
            const response = await apiClient.post<Classe>('/api/classes/affectations', dto);
            if (!response.data) {
                throw new Error(t('hooks.erreurAffectation'));
            }
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CLASSES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: CLASSES_KEYS.details() });
            queryClient.invalidateQueries({ queryKey: ['eleves'] });
            toast.success(t('hooks.succesAffectation'));
        },
        onError: (error: unknown) => {
            handleError(error, t('hooks.erreurAffectation'));
        },
    });
}

export function useTransfererEleve() {
    const queryClient = useQueryClient();
    const { t } = useTranslation('classes');
    const handleError = useHandleError();

    return useMutation({
        mutationFn: async (dto: TransfererEleveDto) => {
            const response = await apiClient.post<Classe>('/api/classes/affectations/transferer', dto);
            if (!response.data) {
                throw new Error(t('hooks.erreurTransfert'));
            }
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CLASSES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: CLASSES_KEYS.details() });
            queryClient.invalidateQueries({ queryKey: ['eleves'] });
            toast.success(t('hooks.succesTransfert'));
        },
        onError: (error: unknown) => {
            handleError(error, t('hooks.erreurTransfert'));
        },
    });
}

export function useReconcilierEffectif(classeId: string) {
    const queryClient = useQueryClient();
    const { t } = useTranslation('classes');
    const handleError = useHandleError();

    return useMutation({
        mutationFn: async () => {
            const response = await apiClient.post<{ ancien: number; nouveau: number; effectifReel: number }>(
                `/api/classes/${classeId}/reconcilier-effectif`
            );
            if (!response.data) {
                throw new Error(t('hooks.erreurReconciliation'));
            }
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: CLASSES_KEYS.detail(classeId) });
            queryClient.invalidateQueries({ queryKey: [...CLASSES_KEYS.detail(classeId), 'eleves'] });
            queryClient.invalidateQueries({ queryKey: CLASSES_KEYS.listes() });

            if (data.ancien !== data.nouveau) {
                toast.success(t('hooks.succesReconciliation', { ancien: data.ancien, nouveau: data.nouveau }));
            } else {
                toast.success(t('hooks.effectifDejaCoherent'));
            }
        },
        onError: (error: unknown) => {
            handleError(error, t('hooks.erreurReconciliation'));
        },
    });
}

export function useToggleActifClasse() {
    const queryClient = useQueryClient();
    const { t } = useTranslation('classes');
    const handleError = useHandleError();

    return useMutation({
        mutationFn: async ({ id, actif }: { id: string; actif: boolean }) => {
            const response = await apiClient.post<Classe>(`/api/classes/${id}/activer`, { actif });
            if (!response.data) {
                throw new Error(t('hooks.erreurChangementStatut'));
            }
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: CLASSES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: CLASSES_KEYS.detail(variables.id) });
            toast.success(
                variables.actif ? t('hooks.succesActivation') : t('hooks.succesDesactivation')
            );
        },
        onError: (error: unknown) => {
            handleError(error, t('hooks.erreurChangementStatut'));
        },
    });
}
