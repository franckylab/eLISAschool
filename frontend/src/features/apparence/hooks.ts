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
// Queries (GET)
// ==================================

export function useCatalogueFonds() {
    return useQuery({
        queryKey: ['apparence', 'catalogue'],
        queryFn: async () => {
            console.log('[useCatalogueFonds] Appel API: GET /api/apparence/catalogue');
            const response = await apiClient.get<{ data: Fond[] }>('/api/apparence/catalogue');
            console.log('[useCatalogueFonds] Réponse API complète:', response);
            console.log('[useCatalogueFonds] response.data:', response.data);
            // response.data est { data: Fond[] }, donc on retourne response.data.data
            const fonds = response.data?.data ?? [];
            console.log('[useCatalogueFonds] Fonds extraits:', fonds.length);
            return fonds;
        },
    });
}

export function useFondsEtablissement() {
    return useQuery({
        queryKey: ['apparence', 'etablissement', 'fonds'],
        queryFn: async () => {
            console.log('[useFondsEtablissement] Appel API: GET /api/apparence/etablissement');
            const response = await apiClient.get<{ data: FondEtablissement[] }>('/api/apparence/etablissement');
            console.log('[useFondsEtablissement] Réponse API complète:', response);
            // response.data est { data: FondEtablissement[] }, donc on retourne response.data.data
            const fonds = response.data?.data ?? [];
            console.log('[useFondsEtablissement] Fonds extraits:', fonds.length);
            return fonds;
        },
    });
}

export function useConfigRotation() {
    return useQuery({
        queryKey: ['apparence', 'etablissement', 'config'],
        queryFn: async () => {
            console.log('[useConfigRotation] Appel API: GET /api/apparence/config');
            const response = await apiClient.get<{ data: ConfigRotation }>('/api/apparence/config');
            console.log('[useConfigRotation] Réponse API complète:', response);
            // response.data est { data: ConfigRotation }, donc on retourne response.data.data
            const config = response.data?.data;
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
            console.log('[useFondsRotation] Appel API: GET /api/apparence/rotation');
            const response = await apiClient.get<{ data: Fond[] }>('/api/apparence/rotation');
            console.log('[useFondsRotation] Réponse API complète:', response);
            // response.data est { data: Fond[] }, donc on retourne response.data.data
            const fonds = response.data?.data ?? [];
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
            const response = await apiClient.post<{ data: FondEtablissement }>('/api/apparence/etablissement', dto);
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
            const response = await apiClient.patch<{ data: FondEtablissement }>(`/api/apparence/etablissement/${id}`, dto);
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
            const response = await apiClient.delete(`/api/apparence/etablissement/${id}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['apparence', 'etablissement', 'fonds'] });
            queryClient.invalidateQueries({ queryKey: ['apparence', 'etablissement', 'rotation'] });
        },
    });
}

export function useUploadFond() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: UploadFondDto) => {
            const response = await apiClient.post<{ data: Fond }>('/api/apparence/upload', dto);
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
            const response = await apiClient.patch<{ data: ConfigRotation }>('/api/apparence/config', dto);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['apparence', 'etablissement', 'config'] });
            queryClient.invalidateQueries({ queryKey: ['apparence', 'etablissement', 'rotation'] });
        },
    });
}
