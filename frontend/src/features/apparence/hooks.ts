/**
 * ==================================
 * eLISAschool - Hooks TanStack Query pour module Apparence
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
    Fond,
    FondEtablissement,
    ConfigRotation,
    CreateFondEtablissementDto,
    UpdateFondEtablissementDto,
    UploadFondDto,
} from '../types';

// ==================================
// Types de retour
// ==================================

interface CatalogueFondsResult {
    fonds: Fond[];
    total: number;
}

// ==================================
// Queries (GET)
// ==================================

export function useCatalogueFonds() {
    return useQuery({
        queryKey: ['apparence', 'catalogue'],
        queryFn: async () => {
            console.log('[useCatalogueFonds] Appel API: GET /api/apparence/fonds/catalogue');
            // apiClient.get<{ fonds: Fond[]; total: number }>() retourne ApiResponse<{ fonds: Fond[]; total: number }>
            // Donc response.data = { fonds: [...], total: N }
            const response = await apiClient.get<{ fonds: Fond[]; total: number }>('/api/apparence/fonds/catalogue');
            console.log('[useCatalogueFonds] Réponse API complète:', response);
            console.log('[useCatalogueFonds] response.data:', response.data);
            const result = response.data ?? { fonds: [], total: 0 };
            console.log('[useCatalogueFonds] Fonds extraits:', result.fonds.length);
            return result;
        },
    });
}

export function useFondsEtablissement() {
    return useQuery({
        queryKey: ['apparence', 'etablissement', 'fonds'],
        queryFn: async () => {
            console.log('[useFondsEtablissement] Appel API: GET /api/apparence/fonds/etablissement');
            // apiClient.get<FondEtablissement[]>() retourne ApiResponse<FondEtablissement[]>
            // Donc response.data = FondEtablissement[]
            const response = await apiClient.get<FondEtablissement[]>('/api/apparence/fonds/etablissement');
            console.log('[useFondsEtablissement] Réponse API complète:', response);
            const fonds = response.data ?? [];
            console.log('[useFondsEtablissement] Fonds extraits:', fonds.length);
            return fonds;
        },
    });
}

export function useConfigRotation() {
    return useQuery({
        queryKey: ['apparence', 'etablissement', 'config'],
        queryFn: async () => {
            console.log('[useConfigRotation] Appel API: GET /api/apparence/fonds/config');
            // apiClient.get<ConfigRotation>() retourne ApiResponse<ConfigRotation>
            // Donc response.data = ConfigRotation
            const response = await apiClient.get<ConfigRotation>('/api/apparence/fonds/config');
            console.log('[useConfigRotation] Réponse API complète:', response);
            const config = response.data;
            console.log('[useConfigRotation] Config extraite:', config);
            // TanStack Query exige de retourner une valeur non-undefined
            return config ?? { actif: false, delaiRotation: 86400 };
        },
        retry: 1,
        staleTime: 30 * 1000,
        onError: (error) => {
            console.error('[useConfigRotation] Erreur lors de la récupération de la config:', error);
        },
    });
}

export function useFondsRotation() {
    return useQuery({
        queryKey: ['apparence', 'etablissement', 'rotation'],
        queryFn: async () => {
            console.log('[useFondsRotation] Appel API: GET /api/apparence/fonds/rotation');
            // apiClient.get<Fond[]>() retourne ApiResponse<Fond[]>
            // Donc response.data = Fond[]
            const response = await apiClient.get<Fond[]>('/api/apparence/fonds/rotation');
            console.log('[useFondsRotation] Réponse API complète:', response);
            const fonds = response.data ?? [];
            console.log('[useFondsRotation] Fonds extraits:', fonds.length);
            return fonds;
        },
        refetchInterval: 60 * 1000,
        retry: 1,
        staleTime: 30 * 1000,
        onError: (error) => {
            console.error('[useFondsRotation] Erreur lors de la récupération des fonds:', error);
        },
    });
}

// ==================================
// Mutations
// ==================================

export function useAjouterFondEtablissement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreateFondEtablissementDto) => {
            const response = await apiClient.post<FondEtablissement>('/api/apparence/fonds/etablissement', dto);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['apparence', 'etablissement', 'fonds'] });
            queryClient.invalidateQueries({ queryKey: ['apparence', 'etablissement', 'rotation'] });
        },
    });
}

export function useModifierFondEtablissement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...dto }: UpdateFondEtablissementDto & { id: string }) => {
            const response = await apiClient.patch<FondEtablissement>(`/api/apparence/fonds/etablissement/${id}`, dto);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['apparence', 'etablissement', 'fonds'] });
            queryClient.invalidateQueries({ queryKey: ['apparence', 'etablissement', 'rotation'] });
        },
    });
}

export function useSupprimerFondEtablissement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            // Pour les fonds système virtuels, ne pas appeler le backend
            if (id.startsWith('systeme-')) {
                console.log('[useSupprimerFond] Fond système virtuel ignoré:', id);
                return { success: true, message: 'Fond système ignoré' };
            }
            
            const response = await apiClient.delete(`/api/apparence/fonds/etablissement/${id}`);
            return response.data;
        },
        onSuccess: (data, variables) => {
            // Invalider le cache pour recharger la liste
            queryClient.invalidateQueries({ queryKey: ['apparence', 'etablissement', 'fonds'] });
            queryClient.invalidateQueries({ queryKey: ['apparence', 'etablissement', 'rotation'] });
            
            // Pour les fonds système, mettre à jour le cache localement
            if (variables.startsWith('systeme-')) {
                console.log('[useSupprimerFond] Mise à jour locale du cache pour fond système');
                // Le cache sera rechargé automatiquement par l'invalidation
            }
        },
    });
}

export function useUploadFond() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: UploadFondDto) => {
            const response = await apiClient.post<Fond>('/api/apparence/fonds/upload', dto);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['apparence', 'catalogue'] });
            queryClient.invalidateQueries({ queryKey: ['apparence', 'etablissement', 'fonds'] });
        },
    });
}

export function useUpdateConfigRotation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: ConfigRotation) => {
            const response = await apiClient.patch<ConfigRotation>('/api/apparence/fonds/config', dto);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['apparence', 'etablissement', 'config'] });
            queryClient.invalidateQueries({ queryKey: ['apparence', 'etablissement', 'rotation'] });
        },
    });
}
