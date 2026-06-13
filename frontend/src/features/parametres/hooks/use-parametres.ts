/**
 * ==================================
 * eLISAschool - Hooks Paramètres Système
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';
import type {
    ParametreSysteme,
    CreateParametreDto,
    UpdateParametreDto,
    ParametreFiltres,
} from '../types/parametres.types';

// ============================================
// CLÉS DE CACHE
// ============================================

const PARAMETRES_KEYS = {
    all: ['parametres'] as const,
    liste: (filtres: ParametreFiltres) => [...PARAMETRES_KEYS.all, 'liste', filtres] as const,
    parCategorie: (categorie: string) => [...PARAMETRES_KEYS.all, 'categorie', categorie] as const,
    parModule: (module: string) => [...PARAMETRES_KEYS.all, 'module', module] as const,
    detail: (cle: string) => [...PARAMETRES_KEYS.all, 'detail', cle] as const,
    categories: () => [...PARAMETRES_KEYS.all, 'categories'] as const,
};

// ============================================
// LISTE DES PARAMÈTRES
// ============================================

/**
 * Récupérer la liste des paramètres avec filtres
 */
export function useParametres(filtres: ParametreFiltres = {}) {return useQuery({
        queryKey: PARAMETRES_KEYS.liste(filtres),
        queryFn: async () => {
            // Construire les params sans les boolean (URLSearchParams les convertit en string)
            const paramsFiltres: Record<string, string | number> = {};
            
            Object.entries(filtres).forEach(([key, value]) => {
                if (value !== undefined && value !== '' && value !== null) {
                    // Exclure les boolean car URLSearchParams les convertit en string
                    // Le backend utilisera les valeurs par défaut du schema Zod
                    if (typeof value === 'boolean') {
                        // Ne pas envoyer visible/modifiableRuntime
                        // Le backend filtre visible=true par défaut
                        return;
                    }
                    paramsFiltres[key] = String(value);
                }
            });

            const response = await apiClient.get<ParametreSysteme[]>('/api/configuration/parametres', paramsFiltres);

            // Debug: voir la structure réelle de response
            console.log('[useParametres] response:', response);
            console.log('[useParametres] response.data:', response.data);
            console.log('[useParametres] response.success:', response.success);

            // Le backend retourne { success: true, data: [...], total: N }
            // apiClient.get le parse et le retourne tel quel
            // Donc response = { success, data, total } directement
            const backendResponse = response as unknown as {
                success: boolean;
                data: ParametreSysteme[];
                total: number;
            };

            if (!backendResponse || !backendResponse.data) {
                console.error('[useParametres] Structure invalide:', backendResponse);
                throw new Error('Paramètres non disponibles');
            }

            // Retourner l'objet complet { success, data, total } du backend
            return backendResponse;
        },
        enabled: isAuthenticated,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
}

/**
 * Récupérer les paramètres par catégorie
 */
export function useParametresByCategorie(categorie: string) {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: PARAMETRES_KEYS.parCategorie(categorie),
        queryFn: async () => {
            const response = await apiClient.get<{
                success: boolean;
                data: ParametreSysteme[];
            }>(`/api/configuration/parametres/categorie/${categorie}`);

            if (!response.data) {
                throw new Error('Paramètres non disponibles');
            }

            return response.data;
        },
        enabled: isAuthenticated && !!categorie,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/**
 * Récupérer les paramètres par module
 */
export function useParametresByModule(module: string) {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: PARAMETRES_KEYS.parModule(module),
        queryFn: async () => {
            const response = await apiClient.get<{
                success: boolean;
                data: ParametreSysteme[];
            }>(`/api/configuration/parametres/module/${module}`);

            if (!response.data) {
                throw new Error('Paramètres non disponibles');
            }

            return response.data;
        },
        enabled: isAuthenticated && !!module,
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Récupérer un paramètre par sa clé
 */
export function useParametreByCle(cle: string) {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: PARAMETRES_KEYS.detail(cle),
        queryFn: async () => {
            const response = await apiClient.get<{
                success: boolean;
                data: {
                    cle: string;
                    valeur: any;
                    etablissementId: string | null;
                    metadata?: {
                        description: string;
                        typeValeur: string;
                        categorie: string;
                    };
                };
            }>(`/api/configuration/parametres/${cle}`);

            if (!response.data) {
                throw new Error('Paramètre non trouvé');
            }

            return response.data;
        },
        enabled: isAuthenticated && !!cle,
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Récupérer les catégories disponibles
 */
export function useCategoriesParametres() {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: PARAMETRES_KEYS.categories(),
        queryFn: async () => {
            const response = await apiClient.get<{
                success: boolean;
                data: string[];
            }>('/api/configuration/parametres/categories');

            if (!response.data) {
                throw new Error('Catégories non disponibles');
            }

            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
}

// ============================================
// MUTATIONS CRUD
// ============================================

/**
 * Créer un nouveau paramètre
 */
export function useCreerParametre() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreateParametreDto) => {
            const response = await apiClient.post<ParametreSysteme>(
                '/api/configuration/parametres',
                dto
            );
            return response.data;
        },
        onSuccess: () => {
            // Invalider toutes les listes de paramètres
            queryClient.invalidateQueries({ queryKey: PARAMETRES_KEYS.all });
        },
    });
}

/**
 * Modifier un paramètre existant
 */
export function useModifierParametre() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ cle, dto }: { cle: string; dto: UpdateParametreDto }) => {
            const response = await apiClient.patch<ParametreSysteme>(
                `/api/configuration/parametres/${cle}`,
                dto
            );
            return response.data;
        },
        onSuccess: (_, variables) => {
            // Invalider la liste et le détail
            queryClient.invalidateQueries({ queryKey: PARAMETRES_KEYS.all });
            queryClient.invalidateQueries({ queryKey: PARAMETRES_KEYS.detail(variables.cle) });
        },
    });
}

/**
 * Supprimer un paramètre
 */
export function useSupprimerParametre() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (cle: string) => {
            const response = await apiClient.delete(
                `/api/configuration/parametres/${cle}`
            );
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PARAMETRES_KEYS.all });
        },
    });
}

/**
 * Réinitialiser un paramètre à sa valeur par défaut
 */
export function useReinitialiserParametre() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (cle: string) => {
            const response = await apiClient.post<ParametreSysteme>(
                `/api/configuration/parametres/${cle}/reset`
            );
            return response.data;
        },
        onSuccess: (_, cle) => {
            queryClient.invalidateQueries({ queryKey: PARAMETRES_KEYS.all });
            queryClient.invalidateQueries({ queryKey: PARAMETRES_KEYS.detail(cle) });
        },
    });
}

/**
 * Réinitialiser tous les paramètres
 */
export function useReinitialiserTousParametres() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const response = await apiClient.post<{
                success: boolean;
                data: { resetCount: number; skippedCount: number; total: number };
            }>('/api/configuration/parametres/reset-all');
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PARAMETRES_KEYS.all });
        },
    });
}

/**
 * Mise à jour en masse de paramètres
 */
export function useUpdateParametresBulk() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (parametres: Array<{ cle: string; valeur: any; etablissementId?: string }>) => {
            const response = await apiClient.put<{
                success: boolean;
                data: { updated: number };
            }>('/api/configuration/parametres/bulk', { parametres });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PARAMETRES_KEYS.all });
        },
    });
}
