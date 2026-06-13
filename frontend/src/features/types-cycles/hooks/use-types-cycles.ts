/**
 * ==================================
 * eLISAschool - Hooks Types de Cycles
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';
import type { PaginatedResult } from '@shared/types/api.types';
import type {
    TypeCycle,
    CreerTypeCycleDto,
    ModifierTypeCycleDto,
    TypeCycleFiltres,
} from '../types/type-cycle.types';

const TYPES_CYCLES_KEYS = {
    all: ['types-cycles'] as const,
    lists: () => [...TYPES_CYCLES_KEYS.all, 'list'] as const,
    list: (filtres: TypeCycleFiltres) => [...TYPES_CYCLES_KEYS.lists(), filtres] as const,
    details: () => [...TYPES_CYCLES_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...TYPES_CYCLES_KEYS.details(), id] as const,
};

export function useTypesCycles(filtres: TypeCycleFiltres = {}) {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: TYPES_CYCLES_KEYS.list(filtres),
        queryFn: async () => {
            const response = await apiClient.get<PaginatedResult<TypeCycle>>('/api/types-cycles', {
                page: filtres.page || 1,
                limit: filtres.limit || 20,
                search: filtres.recherche,
                actif: filtres.actif,
                sortBy: 'ordre',
                sortOrder: 'ASC',
            });
            return (response as any).data as PaginatedResult<TypeCycle>;
        },
        enabled: isAuthenticated,
        staleTime: 10 * 60 * 1000,
    });
}

export function useTypeCycleDetail(id: string) {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: TYPES_CYCLES_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<{ data: TypeCycle }>(
                `/api/types-cycles/${id}`
            );

            if (!response.data) {
                throw new Error('Type de cycle non trouvé');
            }

            return response.data;
        },
        enabled: isAuthenticated && !!id,
        staleTime: 10 * 60 * 1000,
    });
}

export function useCreerTypeCycle() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerTypeCycleDto) => {
            const response = await apiClient.post<TypeCycle>(
                '/api/types-cycles',
                dto
            );
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TYPES_CYCLES_KEYS.lists() });
        },
    });
}

export function useModifierTypeCycle() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...dto }: { id: string } & ModifierTypeCycleDto) => {
            const response = await apiClient.patch<TypeCycle>(
                `/api/types-cycles/${id}`,
                dto
            );
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: TYPES_CYCLES_KEYS.lists() });
            queryClient.invalidateQueries({
                queryKey: TYPES_CYCLES_KEYS.detail(variables.id),
            });
        },
    });
}

export function useSupprimerTypeCycle() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/types-cycles/${id}`);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TYPES_CYCLES_KEYS.lists() });
        },
    });
}
