/**
 * ==================================
 * eLISAschool - Hook Classes
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
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
    ElevesClasseResult,
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

/**
 * Récupérer la liste paginée des classes avec filtres optionnels
 */
export function useClasses(filtres: ClasseFiltres = {}) {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: CLASSES_KEYS.liste(filtres),
        queryFn: async () => {
            const params: Record<string, any> = {
                page: filtres.page || 1,
                limit: filtres.limit || 20,
                sortBy: filtres.sortBy || 'nom',
                sortOrder: filtres.sortOrder || 'ASC',
            };

            // Ajouter uniquement les filtres non vides
            if (filtres.recherche) params.search = filtres.recherche;
            if (filtres.niveauId) params.niveauId = filtres.niveauId;
            if (filtres.anneeScolaireId) params.anneeId = filtres.anneeScolaireId;
            if (filtres.actif !== undefined) params.actif = filtres.actif;

            const response = await apiClient.get<PaginatedResult<Classe>>('/api/classes', params);

            if (!response.data) {
                throw new Error('Réponse API invalide : données manquantes');
            }

            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Récupérer le détail d'une classe par ID
 */
export function useClasse(id: string) {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: CLASSES_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<Classe>(`/api/classes/${id}`);

            if (!response.data) {
                throw new Error('Classe non trouvée');
            }

            return response.data;
        },
        enabled: !!id && isAuthenticated,
        staleTime: 10 * 60 * 1000,
    });
}

/**
 * Récupérer les élèves d'une classe avec pagination et statistiques
 * Appelle l'endpoint dédié GET /api/classes/:id/eleves
 */
export function useElevesClasse(classeId: string, page: number = 1, limit: number = 20, search?: string) {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: [...CLASSES_KEYS.detail(classeId), 'eleves', { page, limit, search }],
        queryFn: async () => {
            const params: Record<string, any> = { page, limit };
            if (search) params.search = search;

            const response = await apiClient.get<ElevesClasseResult>(
                `/api/classes/${classeId}/eleves`,
                params
            );

            if (!response.data) {
                throw new Error('Réponse API invalide');
            }

            return response.data;
        },
        enabled: !!classeId && isAuthenticated,
        staleTime: 2 * 60 * 1000,
    });
}

/**
 * Récupérer les statistiques globales des classes
 */
export function useClassesStats(etablissementId?: string) {
    return useQuery({
        queryKey: CLASSES_KEYS.stats(),
        queryFn: async () => {
            const response = await apiClient.get<any>('/api/classes/stats');

            if (!response.data) {
                throw new Error('Statistiques non disponibles');
            }

            return response.data;
        },
        enabled: !!etablissementId,
    });
}

// ========== MUTATIONS ==========

/**
 * Créer une classe (modèle permanent + instance annuelle optionnelle)
 */
export function useCreerClasse() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerClasseDto | CreerClasseCompletDto) => {
            const response = await apiClient.post<Classe>('/api/classes', dto);

            if (!response.data) {
                throw new Error('Erreur lors de la création de la classe');
            }

            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CLASSES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: CLASSES_KEYS.stats() });
            toast.success('Classe créée avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la création');
        },
    });
}

/**
 * Modifier une classe existante
 */
export function useModifierClasse() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...dto }: ModifierClasseDto) => {
            const response = await apiClient.patch<Classe>(`/api/classes/${id}`, dto);

            if (!response.data) {
                throw new Error('Erreur lors de la modification de la classe');
            }

            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: CLASSES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: CLASSES_KEYS.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: CLASSES_KEYS.stats() });
            toast.success('Classe modifiée avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la modification');
        },
    });
}

/**
 * Supprimer une classe
 */
export function useSupprimerClasse() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/classes/${id}`);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CLASSES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: CLASSES_KEYS.stats() });
            toast.success('Classe supprimée avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la suppression');
        },
    });
}

/**
 * Affecter un élève à une classe
 */
export function useAffecterEleve() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: AffecterEleveDto) => {
            const response = await apiClient.post<any>('/api/classes/affectations', dto);
            if (!response.data) {
                throw new Error("Erreur lors de l'affectation de l'élève");
            }
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CLASSES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: CLASSES_KEYS.details() });
            queryClient.invalidateQueries({ queryKey: ['eleves'] });
            toast.success('Élève affecté avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || "Erreur lors de l'affectation");
        },
    });
}

/**
 * Réconcilier l'effectif d'une classe (compteur stocké vs COUNT réel)
 */
export function useReconcilierEffectif(classeId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const response = await apiClient.post<{ ancien: number; nouveau: number; effectifReel: number }>(
                `/api/classes/${classeId}/reconcilier-effectif`
            );
            if (!response.data) {
                throw new Error('Erreur lors de la réconciliation');
            }
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: CLASSES_KEYS.detail(classeId) });
            queryClient.invalidateQueries({ queryKey: [...CLASSES_KEYS.detail(classeId), 'eleves'] });
            queryClient.invalidateQueries({ queryKey: CLASSES_KEYS.listes() });

            if (data.ancien !== data.nouveau) {
                toast.success(`Effectif réconcilié : ${data.ancien} → ${data.nouveau}`);
            } else {
                toast.success('Effectif déjà cohérent');
            }
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la réconciliation');
        },
    });
}

/**
 * Basculer le statut actif/inactif d'une classe
 */
export function useToggleActifClasse() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, actif }: { id: string; actif: boolean }) => {
            const response = await apiClient.post<Classe>(`/api/classes/${id}/activer`, { actif });
            if (!response.data) {
                throw new Error('Erreur lors du changement de statut');
            }
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: CLASSES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: CLASSES_KEYS.detail(variables.id) });
            toast.success(
                variables.actif ? 'Classe activée avec succès' : 'Classe désactivée avec succès'
            );
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors du changement de statut');
        },
    });
}
