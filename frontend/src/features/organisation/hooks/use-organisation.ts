/**
 * ==================================
 * eLISAschool - Hooks Organisation
 * ==================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import type { GroupeEtablissement, CreerGroupeDto, GroupeFiltres } from '../types/organisation.types';

const ORGANISATION_KEYS = {
    groupes: {
        all: ['organisation', 'groupes'] as const,
        liste: (filtres: GroupeFiltres) => [...ORGANISATION_KEYS.groupes.all, filtres] as const,
        detail: (id: string) => [...ORGANISATION_KEYS.groupes.all, 'detail', id] as const,
    },
};

export function useGroupes(filtres: GroupeFiltres = {}) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ORGANISATION_KEYS.groupes.liste(filtres),
        queryFn: async () => {
            const response = await apiClient.getPaginated<GroupeEtablissement>('/api/organisation/groupes', {
                page: filtres.page || 1,
                limit: filtres.limit || 20,
                ...filtres,
            });
            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 10 * 60 * 1000,
    });
}

export function useGroupe(id: string) {
    return useQuery({
        queryKey: ORGANISATION_KEYS.groupes.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: GroupeEtablissement }>(`/api/organisation/groupes/${id}`);
            return response.data.data;
        },
        enabled: !!id && isAuthenticated,
        staleTime: 10 * 60 * 1000,
    });
}

export function useCreerGroupe() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerGroupeDto) => {
            const response = await apiClient.post<{ success: boolean; data: GroupeEtablissement }>('/api/organisation/groupes', dto);
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ORGANISATION_KEYS.groupes.all });
            toast.success('Groupe créé avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la création');
        },
    });
}

export function useModifierGroupe() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...dto }: any) => {
            const response = await apiClient.patch<{ success: boolean; data: GroupeEtablissement }>(`/api/organisation/groupes/${id}`, dto);
            return response.data.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ORGANISATION_KEYS.groupes.all });
            queryClient.invalidateQueries({ queryKey: ORGANISATION_KEYS.groupes.detail(variables.id) });
            toast.success('Groupe modifié avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la modification');
        },
    });
}

export function useSupprimerGroupe() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/organisation/groupes/${id}`);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ORGANISATION_KEYS.groupes.all });
            toast.success('Groupe supprimé avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la suppression');
        },
    });
}
