/**
 * ==================================
 * eLISAschool - Hooks Niveaux
 * ==================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import type { PaginatedResult } from '@shared/types/api.types';
import type { Niveau, CreerNiveauDto, ModifierNiveauDto, NiveauFiltres } from '../types/niveau.types';

const NIVEAUX_KEYS = {
    all: ['niveaux'] as const,
    listes: () => [...NIVEAUX_KEYS.all, 'liste'] as const,
    liste: (filtres: NiveauFiltres) => [...NIVEAUX_KEYS.listes(), filtres] as const,
    details: () => [...NIVEAUX_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...NIVEAUX_KEYS.details(), id] as const,
};

export function useNiveaux(filtres: NiveauFiltres = {}) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: NIVEAUX_KEYS.liste(filtres),
        queryFn: async () => {
            const response = await apiClient.get<PaginatedResult<Niveau>>('/api/niveaux', {
                page: filtres.page || 1,
                limit: filtres.limit || 20,
                search: filtres.recherche,
                cycleId: filtres.cycleId,
                sousSysteme: filtres.sousSysteme,
                actif: filtres.actif,
                estClasseExamen: filtres.estClasseExamen,
                sortBy: filtres.sortBy || 'ordre',
                sortOrder: filtres.sortOrder || 'ASC',
            });
            return (response as any).data as PaginatedResult<Niveau>;
        },
        enabled: isAuthenticated,
        staleTime: 10 * 60 * 1000,
    });
}

export function useNiveau(id: string) {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: NIVEAUX_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: Niveau }>(`/api/niveaux/${id}`);
            return response.data?.data;
        },
        enabled: !!id && isAuthenticated,
        staleTime: 10 * 60 * 1000,
    });
}

export function useCreerNiveau() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerNiveauDto) => {
            const response = await apiClient.post<{ success: boolean; data: Niveau }>('/api/niveaux', dto);
            return response.data?.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: NIVEAUX_KEYS.listes() });
            toast.success('Niveau créé avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la création');
        },
    });
}

export function useModifierNiveau() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...dto }: ModifierNiveauDto) => {
            const response = await apiClient.patch<{ success: boolean; data: Niveau }>(`/api/niveaux/${id}`, dto);
            return response.data?.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: NIVEAUX_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: NIVEAUX_KEYS.detail(variables.id) });
            toast.success('Niveau modifié avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la modification');
        },
    });
}

export function useSupprimerNiveau() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/niveaux/${id}`);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: NIVEAUX_KEYS.listes() });
            toast.success('Niveau supprimé avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la suppression');
        },
    });
}
