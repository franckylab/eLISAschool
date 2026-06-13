/**
 * ==================================
 * eLISAschool - Hooks Filières
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';
import type { PaginatedResult } from '@shared/types/api.types';
import type {
    Filiere,
    CreerFiliereDto,
    ModifierFiliereDto,
    FiliereFiltres,
} from '../types/filiere.types';

const FILIERES_KEYS = {
    all: ['filieres'] as const,
    lists: () => [...FILIERES_KEYS.all, 'list'] as const,
    list: (filtres: FiliereFiltres) => [...FILIERES_KEYS.lists(), filtres] as const,
    details: () => [...FILIERES_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...FILIERES_KEYS.details(), id] as const,
};

export function useFilieres(filtres: FiliereFiltres = {}) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: FILIERES_KEYS.list(filtres),
        queryFn: async () => {
            const response = await apiClient.get<PaginatedResult<Filiere>>('/api/filieres', {
                page: filtres.page || 1,
                limit: filtres.limit || 20,
                search: filtres.recherche,
                cycleId: filtres.cycleId,
                sousSysteme: filtres.sousSysteme,
                actif: filtres.actif,
                sortBy: 'nom',
                sortOrder: 'ASC',
            });
            return (response as any).data as PaginatedResult<Filiere>;
        },
        enabled: isAuthenticated,
        staleTime: 10 * 60 * 1000,
    });
}

export function useFiliere(id: string) {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: FILIERES_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<{
                success: boolean;
                data: Filiere;
            }>(`/api/filieres/${id}`);

            if (!response.data?.success) {
                throw new Error('Filière non trouvée');
            }

            return response.data?.data;
        },
        enabled: isAuthenticated && !!id,
        staleTime: 5 * 60 * 1000,
    });
}

export function useCreerFiliere() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerFiliereDto) => {
            const response = await apiClient.post<{
                success: boolean;
                data: Filiere;
            }>('/api/filieres', dto);

            if (!response.data?.success) {
                throw new Error('Erreur lors de la création');
            }

            return response.data?.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: FILIERES_KEYS.lists() });
        },
    });
}

export function useModifierFiliere() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...dto }: { id: string } & ModifierFiliereDto) => {
            const response = await apiClient.patch<{
                success: boolean;
                data: Filiere;
            }>(`/api/filieres/${id}`, dto);

            if (!response.data?.success) {
                throw new Error('Erreur lors de la modification');
            }

            return response.data?.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: FILIERES_KEYS.lists() });
            queryClient.invalidateQueries({ queryKey: FILIERES_KEYS.detail(variables.id) });
        },
    });
}

export function useSupprimerFiliere() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await apiClient.delete<{
                success: boolean;
            }>(`/api/filieres/${id}`);

            if (!response.data?.success) {
                throw new Error('Erreur lors de la suppression');
            }

            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: FILIERES_KEYS.lists() });
        },
    });
}
