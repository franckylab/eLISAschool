import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { PaginatedResult } from '@shared/types/api.types';
import type { Fonction, CreerFonctionDto, ModifierFonctionDto, FonctionFiltres } from '../types/fonction.types';

// ---- Queries ----

export function useFonctions(filtres?: FonctionFiltres) {
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
            const res = await apiClient.get(`/api/organisation/fonctions?${params}`);
            return (res as any).data as PaginatedResult<Fonction>;
        },
    });
}

export function useFonctionMembres(id: string) {
    return useQuery({
        queryKey: ['fonctions', 'membres', id],
        queryFn: async () => {
            const res = await apiClient.get(`/api/organisation/fonctions/${id}/membres`);
            return (res as any).data as any[];
        },
        enabled: !!id,
    });
}

export function useArbreFonctions() {
    return useQuery({
        queryKey: ['fonctions', 'arbre'],
        queryFn: async () => {
            const res = await apiClient.get('/api/organisation/fonctions/arbre');
            return (res as any).data as Fonction[];
        },
    });
}

export function useToutesFonctions() {
    return useQuery({
        queryKey: ['fonctions', 'toutes'],
        queryFn: async () => {
            const res = await apiClient.get('/api/organisation/fonctions/all');
            return (res as any).data as Fonction[];
        },
    });
}

export function useFonction(id: string) {
    return useQuery({
        queryKey: ['fonctions', 'detail', id],
        queryFn: async () => {
            const res = await apiClient.get(`/api/organisation/fonctions/${id}`);
            return (res as any).data as Fonction;
        },
        enabled: !!id,
        placeholderData: (previousData) => previousData,
    });
}

// ---- Mutations ----

export function useCreerFonction() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (dto: CreerFonctionDto) => {
            const res = await apiClient.post('/api/organisation/fonctions', dto);
            return (res as any).data as Fonction;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['fonctions', 'list'] });
            queryClient.invalidateQueries({ queryKey: ['fonctions', 'arbre'] });
            queryClient.invalidateQueries({ queryKey: ['fonctions', 'toutes'] });
        },
    });
}

export function useModifierFonction() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, dto }: { id: string; dto: ModifierFonctionDto }) => {
            const res = await apiClient.patch(`/api/organisation/fonctions/${id}`, dto);
            return (res as any).data as Fonction;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['fonctions', 'list'] });
            queryClient.invalidateQueries({ queryKey: ['fonctions', 'arbre'] });
            queryClient.invalidateQueries({ queryKey: ['fonctions', 'toutes'] });
            queryClient.invalidateQueries({ queryKey: ['fonctions', 'detail', data.id] });
        },
    });
}

export function useSupprimerFonction() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/organisation/fonctions/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['fonctions', 'list'] });
            queryClient.invalidateQueries({ queryKey: ['fonctions', 'arbre'] });
            queryClient.invalidateQueries({ queryKey: ['fonctions', 'toutes'] });
        },
    });
}
