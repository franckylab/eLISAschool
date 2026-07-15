/**
 * ==================================
 * eLISAschool - Hooks Responsables Élèves
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';
import type {
    ResponsableEleve,
    CreerResponsableEleveDto,
    ModifierResponsableEleveDto,
    ResponsableEleveFiltres,
} from '../types/responsable-eleve.types';

const RESPONSABLES_ELEVES_KEYS = {
    all: ['responsables-eleves'] as const,
    lists: () => [...RESPONSABLES_ELEVES_KEYS.all, 'list'] as const,
    list: (filtres: ResponsableEleveFiltres) => [...RESPONSABLES_ELEVES_KEYS.lists(), filtres] as const,
    details: () => [...RESPONSABLES_ELEVES_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...RESPONSABLES_ELEVES_KEYS.details(), id] as const,
};

export function useResponsablesEleves(filtres: ResponsableEleveFiltres = {}) {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: RESPONSABLES_ELEVES_KEYS.list(filtres),
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
                data: ResponsableEleve[];
                meta: {
                    totalItems: number;
                    currentPage: number;
                    totalPages: number;
                    itemsPerPage: number;
                };
            }>('/api/responsables-eleves', params);

            if (!response.data) {
                throw new Error("Responsables d'élèves non disponibles");
            }

            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

export function useResponsableEleveDetail(id: string) {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: RESPONSABLES_ELEVES_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<{ data: ResponsableEleve }>(
                `/api/responsables-eleves/${id}`
            );

            if (!response.data) {
                throw new Error('Responsable d\'élève non trouvé');
            }

            return response.data;
        },
        enabled: isAuthenticated && !!id,
        staleTime: 10 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

export function useCreerResponsableEleve() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerResponsableEleveDto) => {
            const response = await apiClient.post<ResponsableEleve>(
                '/api/responsables-eleves',
                dto
            );
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: RESPONSABLES_ELEVES_KEYS.lists() });
        },
    });
}

export function useModifierResponsableEleve() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...dto }: { id: string } & ModifierResponsableEleveDto) => {
            const response = await apiClient.patch<ResponsableEleve>(
                `/api/responsables-eleves/${id}`,
                dto
            );
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: RESPONSABLES_ELEVES_KEYS.lists() });
            queryClient.invalidateQueries({
                queryKey: RESPONSABLES_ELEVES_KEYS.detail(variables.id),
            });
        },
    });
}

export function useSupprimerResponsableEleve() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/responsables-eleves/${id}`);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: RESPONSABLES_ELEVES_KEYS.lists() });
        },
    });
}
