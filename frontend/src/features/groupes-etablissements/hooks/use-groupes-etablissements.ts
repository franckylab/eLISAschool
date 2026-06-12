/**
 * ==================================
 * eLISAschool - Hooks Groupes d'Établissements
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';
import type {
    GroupeEtablissement,
    CreerGroupeEtablissementDto,
    ModifierGroupeEtablissementDto,
    GroupeEtablissementFiltres,
} from '../types/groupe-etablissement.types';

const GROUPES_ETABLISSEMENTS_KEYS = {
    all: ['groupes-etablissements'] as const,
    lists: () => [...GROUPES_ETABLISSEMENTS_KEYS.all, 'list'] as const,
    list: (filtres: GroupeEtablissementFiltres) => [...GROUPES_ETABLISSEMENTS_KEYS.lists(), filtres] as const,
    details: () => [...GROUPES_ETABLISSEMENTS_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...GROUPES_ETABLISSEMENTS_KEYS.details(), id] as const,
};

export function useGroupesEtablissements(filtres: GroupeEtablissementFiltres = {}) {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: GROUPES_ETABLISSEMENTS_KEYS.list(filtres),
        queryFn: async () => {
            const response = await apiClient.get<{
                data: GroupeEtablissement[];
                meta: {
                    totalItems: number;
                    currentPage: number;
                    totalPages: number;
                    itemsPerPage: number;
                };
            }>('/api/groupes-etablissements', filtres);

            if (!response.data) {
                throw new Error("Groupes d'établissements non disponibles");
            }

            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

export function useGroupeEtablissementDetail(id: string) {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: GROUPES_ETABLISSEMENTS_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<{ data: GroupeEtablissement }>(
                `/api/groupes-etablissements/${id}`
            );

            if (!response.data) {
                throw new Error('Groupe d\'établissements non trouvé');
            }

            return response.data;
        },
        enabled: isAuthenticated && !!id,
        staleTime: 10 * 60 * 1000,
    });
}

export function useCreerGroupeEtablissement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerGroupeEtablissementDto) => {
            const response = await apiClient.post<GroupeEtablissement>(
                '/api/groupes-etablissements',
                dto
            );
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: GROUPES_ETABLISSEMENTS_KEYS.lists() });
        },
    });
}

export function useModifierGroupeEtablissement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...dto }: { id: string } & ModifierGroupeEtablissementDto) => {
            const response = await apiClient.patch<GroupeEtablissement>(
                `/api/groupes-etablissements/${id}`,
                dto
            );
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: GROUPES_ETABLISSEMENTS_KEYS.lists() });
            queryClient.invalidateQueries({
                queryKey: GROUPES_ETABLISSEMENTS_KEYS.detail(variables.id),
            });
        },
    });
}

export function useSupprimerGroupeEtablissement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/groupes-etablissements/${id}`);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: GROUPES_ETABLISSEMENTS_KEYS.lists() });
        },
    });
}
