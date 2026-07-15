/**
 * ==================================
 * eLISAschool - Hooks Établissements
 * ==================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';
import type {
    Etablissement,
    CreerEtablissementDto,
    ModifierEtablissementDto,
    EtablissementFiltres,
} from '../types/etablissement.types';

const ETABLISSEMENTS_KEYS = {
    all: ['etablissements'] as const,
    lists: () => [...ETABLISSEMENTS_KEYS.all, 'list'] as const,
    list: (filtres: EtablissementFiltres) => [...ETABLISSEMENTS_KEYS.lists(), filtres] as const,
    details: () => [...ETABLISSEMENTS_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...ETABLISSEMENTS_KEYS.details(), id] as const,
};

export function useEtablissements(filtres: EtablissementFiltres = {}) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ETABLISSEMENTS_KEYS.list(filtres),
        queryFn: async () => {
            const response = await apiClient.get<{
                data: Etablissement[];
                meta: {
                    totalItems: number;
                    currentPage: number;
                    totalPages: number;
                    itemsPerPage: number;
                };
            }>('/api/etablissements', { params: filtres as any });

            if (!response.data) {
                throw new Error('Établissements non disponibles');
            }

            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

export function useEtablissement(id: string) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ETABLISSEMENTS_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<Etablissement>(`/api/etablissements/${id}`);

            if (!response.data) {
                throw new Error('Établissement non trouvé');
            }

            return response.data;
        },
        enabled: !!id && isAuthenticated,
        staleTime: 10 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

export function useCreerEtablissement() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (dto: CreerEtablissementDto) => {
            const response = await apiClient.post<Etablissement>('/api/etablissements', dto);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ETABLISSEMENTS_KEYS.lists() });
        },
    });
}

export function useModifierEtablissement() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...dto }: ModifierEtablissementDto) => {
            const response = await apiClient.patch<Etablissement>(`/api/etablissements/${id}`, dto);
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ETABLISSEMENTS_KEYS.lists() });
            queryClient.invalidateQueries({ queryKey: ETABLISSEMENTS_KEYS.detail(variables.id) });
        },
    });
}

export function useSupprimerEtablissement() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/etablissements/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ETABLISSEMENTS_KEYS.lists() });
        },
    });
}
