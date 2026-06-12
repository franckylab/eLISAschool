/**
 * ==================================
 * eLISAschool - Hooks Utilisateurs
 * ==================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import type { Utilisateur, CreerUtilisateurDto, ModifierUtilisateurDto, UtilisateurFiltres, Role } from '../types/utilisateur.types';

const UTILISATEURS_KEYS = {
    all: ['utilisateurs'] as const,
    listes: () => [...UTILISATEURS_KEYS.all, 'liste'] as const,
    liste: (filtres: UtilisateurFiltres) => [...UTILISATEURS_KEYS.listes(), filtres] as const,
    details: () => [...UTILISATEURS_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...UTILISATEURS_KEYS.details(), id] as const,
    roles: () => [...UTILISATEURS_KEYS.all, 'roles'] as const,
};

export function useUtilisateurs(filtres: UtilisateurFiltres = {}) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: UTILISATEURS_KEYS.liste(filtres),
        queryFn: async () => {
            const response = await apiClient.getPaginated<Utilisateur>('/api/utilisateurs', {
                page: filtres.page || 1,
                limit: filtres.limit || 20,
                ...filtres,
            });
            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

export function useUtilisateur(id: string) {
    return useQuery({
        queryKey: UTILISATEURS_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: Utilisateur }>(`/api/utilisateurs/${id}`);
            return response.data.data;
        },
        enabled: isAuthenticated && !!id,
        staleTime: 5 * 60 * 1000,
    });
}

export function useRoles() {
    return useQuery({
        queryKey: UTILISATEURS_KEYS.roles(),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: Role[] }>('/api/roles');
            return response.data.data;
        },
        enabled: isAuthenticated,
        staleTime: 30 * 60 * 1000,
    });
}

export function useCreerUtilisateur() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerUtilisateurDto) => {
            const response = await apiClient.post<{ success: boolean; data: Utilisateur }>('/api/utilisateurs', dto);
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: UTILISATEURS_KEYS.listes() });
            toast.success('Utilisateur créé avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la création');
        },
    });
}

export function useModifierUtilisateur() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...dto }: ModifierUtilisateurDto) => {
            const response = await apiClient.patch<{ success: boolean; data: Utilisateur }>(`/api/utilisateurs/${id}`, dto);
            return response.data.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: UTILISATEURS_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: UTILISATEURS_KEYS.detail(variables.id) });
            toast.success('Utilisateur modifié avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la modification');
        },
    });
}

export function useSupprimerUtilisateur() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/utilisateurs/${id}`);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: UTILISATEURS_KEYS.listes() });
            toast.success('Utilisateur supprimé avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la suppression');
        },
    });
}
