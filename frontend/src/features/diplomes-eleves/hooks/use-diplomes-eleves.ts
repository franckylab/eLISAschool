/**
 * ==================================
 * eLISAschool - Hooks Diplômes Élèves
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';
import type { PaginatedResult } from '@shared/types/api.types';
import type {
    DiplomeEleve,
    CreerDiplomeEleveDto,
    ModifierDiplomeEleveDto,
    DiplomeEleveFiltres,
} from '../types/diplome-eleve.types';

const DIPLOMES_KEYS = {
    all: ['diplomes-eleves'] as const,
    lists: () => [...DIPLOMES_KEYS.all, 'list'] as const,
    list: (filtres: DiplomeEleveFiltres) => [...DIPLOMES_KEYS.lists(), filtres] as const,
    details: () => [...DIPLOMES_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...DIPLOMES_KEYS.details(), id] as const,
    byEleve: (eleveId: string) => [...DIPLOMES_KEYS.all, 'eleve', eleveId] as const,
};

export function useDiplomesEleves(filtres: DiplomeEleveFiltres = {}) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: DIPLOMES_KEYS.list(filtres),
        queryFn: async () => {
            const response = await apiClient.get<PaginatedResult<DiplomeEleve>>('/api/diplomes-eleves', {
                page: filtres.page || 1,
                limit: filtres.limit || 20,
                search: filtres.recherche,
                eleveId: filtres.eleveId,
                examenNationalId: filtres.examenNationalId,
                resultat: filtres.resultat,
                anneeObtention: filtres.anneeObtention,
                sortBy: 'dateObtention',
                sortOrder: 'DESC',
            });
            return (response as any).data as PaginatedResult<DiplomeEleve>;
        },
        enabled: isAuthenticated,
        staleTime: 10 * 60 * 1000,
    });
}

export function useDiplomesEleve(eleveId: string) {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: DIPLOMES_KEYS.byEleve(eleveId),
        queryFn: async () => {
            const response = await apiClient.get<{
                success: boolean;
                data: DiplomeEleve[];
            }>(`/api/diplomes-eleves/eleve/${eleveId}`);

            if (!response.data?.success) {
                throw new Error('Diplômes de l\'élève non disponibles');
            }

            return response.data?.data;
        },
        enabled: isAuthenticated && !!eleveId,
        staleTime: 5 * 60 * 1000,
    });
}

export function useDiplomeEleve(id: string) {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: DIPLOMES_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<{
                success: boolean;
                data: DiplomeEleve;
            }>(`/api/diplomes-eleves/${id}`);

            if (!response.data?.success) {
                throw new Error('Diplôme non trouvé');
            }

            return response.data?.data;
        },
        enabled: isAuthenticated && !!id,
        staleTime: 5 * 60 * 1000,
    });
}

export function useCreerDiplomeEleve() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerDiplomeEleveDto) => {
            const response = await apiClient.post<{
                success: boolean;
                data: DiplomeEleve;
            }>('/api/diplomes-eleves', dto);

            if (!response.data?.success) {
                throw new Error('Erreur lors de l\'enregistrement du diplôme');
            }

            return response.data?.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: DIPLOMES_KEYS.lists() });
            if (variables.eleveId) {
                queryClient.invalidateQueries({ queryKey: DIPLOMES_KEYS.byEleve(variables.eleveId) });
            }
        },
    });
}

export function useModifierDiplomeEleve() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...dto }: { id: string } & ModifierDiplomeEleveDto) => {
            const response = await apiClient.patch<{
                success: boolean;
                data: DiplomeEleve;
            }>(`/api/diplomes-eleves/${id}`, dto);

            if (!response.data?.success) {
                throw new Error('Erreur lors de la modification');
            }

            return response.data?.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: DIPLOMES_KEYS.lists() });
            if (data.eleveId) {
                queryClient.invalidateQueries({ queryKey: DIPLOMES_KEYS.byEleve(data.eleveId) });
            }
            queryClient.invalidateQueries({ queryKey: DIPLOMES_KEYS.detail(data.id) });
        },
    });
}

export function useSupprimerDiplomeEleve() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await apiClient.delete<{
                success: boolean;
            }>(`/api/diplomes-eleves/${id}`);

            if (!response.data?.success) {
                throw new Error('Erreur lors de la suppression');
            }

            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: DIPLOMES_KEYS.lists() });
        },
    });
}
