/**
 * ==================================
 * eLISAschool - Hook Classes
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';
import type { Classe, CreerClasseDto, ModifierClasseDto, ClasseFiltres } from '../types/classe.types';
import { toast } from 'sonner';

const CLASSES_KEYS = {
    all: ['classes'] as const,
    listes: () => [...CLASSES_KEYS.all, 'liste'] as const,
    liste: (filtres: ClasseFiltres) => [...CLASSES_KEYS.listes(), filtres] as const,
    details: () => [...CLASSES_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...CLASSES_KEYS.details(), id] as const,
    stats: () => [...CLASSES_KEYS.all, 'stats'] as const,
};

// QUERIES
export function useClasses(filtres: ClasseFiltres = {}) {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: CLASSES_KEYS.liste(filtres),
        queryFn: async () => {
            const response = await apiClient.getPaginated<Classe>('/api/classes', {
                page: filtres.page || 1,
                limit: filtres.limit || 20,
                sortBy: filtres.sortBy,
                sortOrder: filtres.sortOrder,
                ...filtres,
            });
            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

export function useClasse(id: string) {
    return useQuery({
        queryKey: CLASSES_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<{ data: Classe }>(`/api/classes/${id}`);
            return response.data;
        },
        enabled: !!id,
        staleTime: 10 * 60 * 1000,
    });
}

export function useClassesStats(etablissementId?: string) {
    return useQuery({
        queryKey: CLASSES_KEYS.stats(),
        queryFn: async () => {
            const response = await apiClient.get<{ data: any }>('/api/classes/stats');
            return response.data;
        },
        enabled: !!etablissementId,
    });
}

// MUTATIONS
export function useCreerClasse() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (dto: CreerClasseDto) => {
            const response = await apiClient.post<{ data: Classe }>('/api/classes', dto);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: CLASSES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: CLASSES_KEYS.stats() });
            toast.success(`Classe ${data?.data?.nom} créée avec succès`);
        },
        onError: (error: any) => toast.error(error?.message || 'Erreur lors de la création'),
    });
}

export function useModifierClasse() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (dto: ModifierClasseDto) => {
            const { id, ...data } = dto;
            const response = await apiClient.patch<{ data: Classe }>(`/api/classes/${id}`, data);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: CLASSES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: CLASSES_KEYS.detail(data?.data?.id) });
            queryClient.invalidateQueries({ queryKey: CLASSES_KEYS.stats() });
            toast.success(`Classe ${data?.data?.nom} modifiée avec succès`);
        },
        onError: (error: any) => toast.error(error?.message || 'Erreur lors de la modification'),
    });
}

export function useSupprimerClasse() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/classes/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CLASSES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: CLASSES_KEYS.stats() });
            toast.success('Classe supprimée avec succès');
        },
        onError: (error: any) => toast.error(error?.message || 'Erreur lors de la suppression'),
    });
}
