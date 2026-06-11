/**
 * ==================================
 * eLISAschool - Hook Matières
 * ==================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';
import type { Matiere, CreerMatiereDto, ModifierMatiereDto, MatiereFiltres } from '../types/matiere.types';
import { toast } from 'sonner';

const MATIERES_KEYS = {
    all: ['matieres'] as const,
    listes: () => [...MATIERES_KEYS.all, 'liste'] as const,
    liste: (filtres: MatiereFiltres) => [...MATIERES_KEYS.listes(), filtres] as const,
    details: () => [...MATIERES_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...MATIERES_KEYS.details(), id] as const,
};

export function useMatieres(filtres: MatiereFiltres = {}) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: MATIERES_KEYS.liste(filtres),
        queryFn: async () => {
            const response = await apiClient.getPaginated<Matiere>('/api/matieres', {
                page: filtres.page || 1,
                limit: filtres.limit || 50,
                ...filtres,
            });
            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 10 * 60 * 1000,
    });
}

export function useMatiere(id: string) {
    return useQuery({
        queryKey: MATIERES_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<{ data: Matiere }>(`/api/matieres/${id}`);
            return response.data;
        },
        enabled: !!id,
    });
}

export function useCreerMatiere() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (dto: CreerMatiereDto) => {
            const response = await apiClient.post<{ data: Matiere }>('/api/matieres', dto);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: MATIERES_KEYS.listes() });
            toast.success('Matière créée avec succès');
        },
        onError: (error: any) => toast.error(error?.message || 'Erreur lors de la création'),
    });
}

export function useModifierMatiere() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (dto: ModifierMatiereDto) => {
            const { id, ...data } = dto;
            const response = await apiClient.patch<{ data: Matiere }>(`/api/matieres/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: MATIERES_KEYS.listes() });
            toast.success('Matière modifiée avec succès');
        },
        onError: (error: any) => toast.error(error?.message || 'Erreur lors de la modification'),
    });
}

export function useSupprimerMatiere() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/matieres/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: MATIERES_KEYS.listes() });
            toast.success('Matière supprimée');
        },
        onError: (error: any) => toast.error(error?.message || 'Erreur lors de la suppression'),
    });
}
