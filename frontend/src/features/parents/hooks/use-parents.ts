/**
 * ==================================
 * eLISAschool - Hooks Parents (Module Parents)
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';
import type {
    Parent,
    CreerParentDto,
    ModifierParentDto,
    ParentFiltres,
} from '../types/parent.types';

const PARENTS_KEYS = {
    all: ['parents'] as const,
    lists: () => [...PARENTS_KEYS.all, 'list'] as const,
    list: (filtres: ParentFiltres) => [...PARENTS_KEYS.lists(), filtres] as const,
    details: () => [...PARENTS_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...PARENTS_KEYS.details(), id] as const,
};

export function useParents(filtres: ParentFiltres = {}) {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: PARENTS_KEYS.list(filtres),
        queryFn: async () => {
            const params: Record<string, any> = {
                page: filtres.page || 1,
                limit: filtres.limit || 20,
            };

            // Ajouter uniquement les filtres non vides
            if (filtres.recherche) params.search = filtres.recherche;
            if (filtres.eleveId) params.eleveId = filtres.eleveId;
            if (filtres.utilisateurId) params.utilisateurId = filtres.utilisateurId;

            const response = await apiClient.get<{
                data: Parent[];
                meta: {
                    totalItems: number;
                    currentPage: number;
                    totalPages: number;
                    itemsPerPage: number;
                };
            }>('/api/parents', params);

            if (!response.data) {
                throw new Error("Parents non disponibles");
            }

            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

export function useParentDetail(id: string) {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: PARENTS_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<{ data: Parent }>(
                `/api/parents/${id}`
            );

            if (!response.data) {
                throw new Error('Parent non trouvé');
            }

            return response.data;
        },
        enabled: isAuthenticated && !!id,
        staleTime: 10 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

export function useCreerParent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerParentDto) => {
            const response = await apiClient.post<Parent>(
                '/api/parents',
                dto
            );
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PARENTS_KEYS.lists() });
        },
    });
}

export function useModifierParent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...dto }: { id: string } & ModifierParentDto) => {
            const response = await apiClient.patch<Parent>(
                `/api/parents/${id}`,
                dto
            );
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: PARENTS_KEYS.lists() });
            queryClient.invalidateQueries({
                queryKey: PARENTS_KEYS.detail(variables.id),
            });
        },
    });
}

export function useSupprimerParent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/parents/${id}`);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PARENTS_KEYS.lists() });
        },
    });
}
