/**
 * ==================================
 * eLISAschool - Hooks Programmes Pédagogiques
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';
import type {
    ProgrammePedagogique,
    CreerProgrammeDto,
    ModifierProgrammeDto,
    ProgrammeFiltres,
} from '../types/programme.types';

const PROGRAMMES_KEYS = {
    all: ['programmes'] as const,
    lists: () => [...PROGRAMMES_KEYS.all, 'list'] as const,
    list: (filtres: ProgrammeFiltres) => [...PROGRAMMES_KEYS.lists(), filtres] as const,
    details: () => [...PROGRAMMES_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...PROGRAMMES_KEYS.details(), id] as const,
};

export function useProgrammes(filtres: ProgrammeFiltres = {}) {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: PROGRAMMES_KEYS.list(filtres),
        queryFn: async () => {
            const response = await apiClient.get<{
                data: ProgrammePedagogique[];
                meta: {
                    totalItems: number;
                    currentPage: number;
                    totalPages: number;
                    itemsPerPage: number;
                };
            }>('/api/programmes', { params: filtres });

            if (!response.data) {
                throw new Error('Programmes pédagogiques non disponibles');
            }

            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

export function useProgrammeDetail(id: string) {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: PROGRAMMES_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<{ data: ProgrammePedagogique }>(
                `/api/programmes/${id}`
            );

            if (!response.data) {
                throw new Error('Programme pédagogique non trouvé');
            }

            return response.data;
        },
        enabled: isAuthenticated && !!id,
        staleTime: 10 * 60 * 1000,
    });
}

export function useCreerProgramme() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerProgrammeDto) => {
            const response = await apiClient.post<ProgrammePedagogique>(
                '/api/programmes',
                dto
            );
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PROGRAMMES_KEYS.lists() });
        },
    });
}

export function useModifierProgramme() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...dto }: { id: string } & ModifierProgrammeDto) => {
            const response = await apiClient.patch<ProgrammePedagogique>(
                `/api/programmes/${id}`,
                dto
            );
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: PROGRAMMES_KEYS.lists() });
            queryClient.invalidateQueries({
                queryKey: PROGRAMMES_KEYS.detail(variables.id),
            });
        },
    });
}

export function useSupprimerProgramme() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/programmes/${id}`);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PROGRAMMES_KEYS.lists() });
        },
    });
}
