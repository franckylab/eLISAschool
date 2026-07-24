/**
 * ==================================
 * eLISAschool - Hooks Fonctions
 * ==================================
 * Hooks TanStack Query pour la gestion des fonctions organisationnelles.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth.store';
import { useHandleError } from '@/features/organisation/hooks/use-handle-error';
import type { PaginatedResult } from '@shared/types/api.types';
import type { Fonction, CreerFonctionDto, ModifierFonctionDto, FonctionFiltres } from '../types/fonction.types';

// ---- Queries ----

export function useFonctions(filtres?: FonctionFiltres) {
    const { isAuthenticated } = useAuthStore();
    const params = new URLSearchParams();
    if (filtres?.recherche) params.set('search', filtres.recherche);
    if (filtres?.parentId !== undefined) {
        if (filtres.parentId === null) params.set('parentId', '');
        else params.set('parentId', filtres.parentId);
    }
    if (filtres?.actif !== undefined) params.set('actif', String(filtres.actif));
    if (filtres?.page) params.set('page', String(filtres.page));
    if (filtres?.limit) params.set('limit', String(filtres.limit));

    return useQuery({
        queryKey: ['fonctions', 'list', filtres],
        queryFn: async () => {
            const res = await apiClient.get<PaginatedResult<Fonction>>(`/api/organisation/fonctions?${params}`);
            return res.data;
        },
        enabled: isAuthenticated,
    });
}

export function useFonctionMembres(id: string) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ['fonctions', 'membres', id],
        queryFn: async () => {
            const res = await apiClient.get<Fonction[]>(`/api/organisation/fonctions/${id}/membres`);
            return res.data ?? [];
        },
        enabled: !!id && isAuthenticated,
    });
}

export function useArbreFonctions() {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ['fonctions', 'arbre'],
        queryFn: async () => {
            const res = await apiClient.get<Fonction[]>('/api/organisation/fonctions/arbre');
            return res.data ?? [];
        },
        enabled: isAuthenticated,
    });
}

export function useToutesFonctions() {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ['fonctions', 'toutes'],
        queryFn: async () => {
            const res = await apiClient.get<Fonction[]>('/api/organisation/fonctions/all');
            return res.data ?? [];
        },
        enabled: isAuthenticated,
    });
}

export function useFonction(id: string) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ['fonctions', 'detail', id],
        queryFn: async () => {
            const res = await apiClient.get<Fonction>(`/api/organisation/fonctions/${id}`);
            return res.data;
        },
        enabled: !!id && isAuthenticated,
        placeholderData: (previousData) => previousData,
    });
}

// ---- Mutations ----

export function useCreerFonction() {
    const queryClient = useQueryClient();
    const handleError = useHandleError();
    return useMutation({
        mutationFn: async (dto: CreerFonctionDto) => {
            const res = await apiClient.post<Fonction>('/api/organisation/fonctions', dto);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['fonctions'] });
            queryClient.invalidateQueries({ queryKey: ['organisation', 'organigramme'] });
            queryClient.invalidateQueries({ queryKey: ['organisation', 'statistiques'] });
            toast.success('Fonction créée avec succès');
        },
        onError: (e) => handleError(e, 'Erreur lors de la création de la fonction'),
    });
}

export function useModifierFonction() {
    const queryClient = useQueryClient();
    const handleError = useHandleError();
    return useMutation({
        mutationFn: async ({ id, dto }: { id: string; dto: ModifierFonctionDto }) => {
            const res = await apiClient.patch<Fonction>(`/api/organisation/fonctions/${id}`, dto);
            return res.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['fonctions'] });
            queryClient.invalidateQueries({ queryKey: ['organisation', 'organigramme'] });
            queryClient.invalidateQueries({ queryKey: ['organisation', 'statistiques'] });
            toast.success('Fonction modifiée avec succès');
        },
        onError: (e) => handleError(e, 'Erreur lors de la modification de la fonction'),
    });
}

export function useSupprimerFonction() {
    const queryClient = useQueryClient();
    const handleError = useHandleError();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/organisation/fonctions/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['fonctions'] });
            queryClient.invalidateQueries({ queryKey: ['organisation', 'organigramme'] });
            queryClient.invalidateQueries({ queryKey: ['organisation', 'statistiques'] });
            toast.success('Fonction supprimée');
        },
        onError: (e) => handleError(e, 'Erreur lors de la suppression de la fonction'),
    });
}
