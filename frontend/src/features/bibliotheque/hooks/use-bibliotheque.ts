/**
 * ==================================
 * eLISAschool - Hooks Bibliothèque
 * ==================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import type { Ouvrage, CreerOuvrageDto, Pret, CreerPretDto, StatistiquesBibliotheque, BibliothequeFiltres } from '../types/bibliotheque.types';

const BIBLIOTHEQUE_KEYS = {
    ouvrages: (filtres?: BibliothequeFiltres) => ['bibliotheque', 'ouvrages', filtres] as const,
    ouvrage: (id: string) => ['bibliotheque', 'ouvrage', id] as const,
    prets: () => ['bibliotheque', 'prets'] as const,
    stats: () => ['bibliotheque', 'stats'] as const,
};

export function useOuvrages(filtres?: BibliothequeFiltres) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: BIBLIOTHEQUE_KEYS.ouvrages(filtres),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: Ouvrage[]; meta: any }>('/api/bibliotheque/ouvrages', { params: filtres });
            return { data: response.data.data, meta: response.data.meta };
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

export function useOuvrage(id: string) {
    return useQuery({
        queryKey: BIBLIOTHEQUE_KEYS.ouvrage(id),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: Ouvrage }>(`/api/bibliotheque/ouvrages/${id}`);
            return response.data.data;
        },
        enabled: !!id,
    });
}

export function useCreerOuvrage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerOuvrageDto) => {
            const response = await apiClient.post<{ success: boolean; data: Ouvrage }>('/api/bibliotheque/ouvrages', dto);
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: BIBLIOTHEQUE_KEYS.ouvrages() });
            queryClient.invalidateQueries({ queryKey: BIBLIOTHEQUE_KEYS.stats() });
            toast.success('Ouvrage ajouté avec succès');
        },
    });
}

export function useModifierOuvrage(id: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: Partial<CreerOuvrageDto>) => {
            const response = await apiClient.patch<{ success: boolean; data: Ouvrage }>(`/api/bibliotheque/ouvrages/${id}`, dto);
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: BIBLIOTHEQUE_KEYS.ouvrages() });
            toast.success('Ouvrage modifié avec succès');
        },
    });
}

export function useSupprimerOuvrage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/bibliotheque/ouvrages/${id}`);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: BIBLIOTHEQUE_KEYS.ouvrages() });
            queryClient.invalidateQueries({ queryKey: BIBLIOTHEQUE_KEYS.stats() });
            toast.success('Ouvrage supprimé avec succès');
        },
    });
}

export function usePrets() {
    return useQuery({
        queryKey: BIBLIOTHEQUE_KEYS.prets(),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: Pret[] }>('/api/bibliotheque/prets');
            return response.data.data;
        },
        enabled: isAuthenticated,
        staleTime: 3 * 60 * 1000,
    });
}

export function useCreerPret() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerPretDto) => {
            const response = await apiClient.post<{ success: boolean; data: Pret }>('/api/bibliotheque/prets', dto);
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: BIBLIOTHEQUE_KEYS.prets() });
            queryClient.invalidateQueries({ queryKey: BIBLIOTHEQUE_KEYS.ouvrages() });
            queryClient.invalidateQueries({ queryKey: BIBLIOTHEQUE_KEYS.stats() });
            toast.success('Prêt enregistré avec succès');
        },
    });
}

export function useRetournerOuvrage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (pretId: string) => {
            const response = await apiClient.post<{ success: boolean; data: Pret }>(`/api/bibliotheque/prets/${pretId}/retour`);
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: BIBLIOTHEQUE_KEYS.prets() });
            queryClient.invalidateQueries({ queryKey: BIBLIOTHEQUE_KEYS.ouvrages() });
            toast.success('Ouvrage retourné avec succès');
        },
    });
}

export function useProlongerPret() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { pretId: string; nouvelleDate: string }) => {
            const response = await apiClient.patch<{ success: boolean; data: Pret }>(
                `/api/bibliotheque/prets/${data.pretId}/prolonger`,
                { dateRetourPrevue: data.nouvelleDate }
            );
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: BIBLIOTHEQUE_KEYS.prets() });
            toast.success('Prêt prolongé avec succès');
        },
    });
}

export function useStatistiquesBibliotheque() {
    return useQuery({
        queryKey: BIBLIOTHEQUE_KEYS.stats(),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: StatistiquesBibliotheque }>('/api/bibliotheque/statistiques');
            return response.data.data;
        },
        enabled: isAuthenticated,
        staleTime: 10 * 60 * 1000,
    });
}
