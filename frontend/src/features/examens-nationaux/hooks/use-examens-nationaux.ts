/**
 * ==================================
 * eLISAschool - Hooks Examens Nationaux
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';
import type { PaginatedResult } from '@shared/types/api.types';
import type {
    ExamenNational,
    CreerExamenNationalDto,
    ModifierExamenNationalDto,
    ExamenNationalFiltres,
} from '../types/examen-national.types';

const EXAMENS_KEYS = {
    all: ['examens-nationaux'] as const,
    lists: () => [...EXAMENS_KEYS.all, 'list'] as const,
    list: (filtres: ExamenNationalFiltres) => [...EXAMENS_KEYS.lists(), filtres] as const,
    details: () => [...EXAMENS_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...EXAMENS_KEYS.details(), id] as const,
};

export function useExamensNationaux(filtres: ExamenNationalFiltres = {}) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: EXAMENS_KEYS.list(filtres),
        queryFn: async () => {
            const response = await apiClient.get<PaginatedResult<ExamenNational>>('/api/examens-nationaux', {
                page: filtres.page || 1,
                limit: filtres.limit || 20,
                search: filtres.recherche,
                niveauId: filtres.niveauId,
                type: filtres.type,
                sousSysteme: filtres.sousSysteme,
                actif: filtres.actif,
                sortBy: 'nom',
                sortOrder: 'ASC',
            });
            return (response as any).data as PaginatedResult<ExamenNational>;
        },
        enabled: isAuthenticated,
        staleTime: 10 * 60 * 1000,
    });
}

export function useExamenNational(id: string) {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: EXAMENS_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<{
                success: boolean;
                data: ExamenNational;
            }>(`/api/examens-nationaux/${id}`);

            if (!response.data?.success) {
                throw new Error('Examen national non trouvé');
            }

            return response.data?.data;
        },
        enabled: isAuthenticated && !!id,
        staleTime: 5 * 60 * 1000,
    });
}

export function useCreerExamenNational() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerExamenNationalDto) => {
            const response = await apiClient.post<{
                success: boolean;
                data: ExamenNational;
            }>('/api/examens-nationaux', dto);

            if (!response.data?.success) {
                throw new Error('Erreur lors de la création');
            }

            return response.data?.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: EXAMENS_KEYS.lists() });
        },
    });
}

export function useModifierExamenNational() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...dto }: { id: string } & ModifierExamenNationalDto) => {
            const response = await apiClient.patch<{
                success: boolean;
                data: ExamenNational;
            }>(`/api/examens-nationaux/${id}`, dto);

            if (!response.data?.success) {
                throw new Error('Erreur lors de la modification');
            }

            return response.data?.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: EXAMENS_KEYS.lists() });
            queryClient.invalidateQueries({ queryKey: EXAMENS_KEYS.detail(variables.id) });
        },
    });
}

export function useSupprimerExamenNational() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await apiClient.delete<{
                success: boolean;
            }>(`/api/examens-nationaux/${id}`);

            if (!response.data?.success) {
                throw new Error('Erreur lors de la suppression');
            }

            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: EXAMENS_KEYS.lists() });
        },
    });
}
