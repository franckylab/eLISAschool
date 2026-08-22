/**
 * ==================================
 * eLISAschool - Hook Années Scolaires
 * ==================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';
import type { AnneeScolaire, CreerAnneeScolaireDto, ModifierAnneeScolaireDto, AnneeScolaireFiltres } from '../types/annee-scolaire.types';
import type { PaginatedResult } from '@shared/types/api.types';
import { toast } from 'sonner';

const ANNEES_KEYS = {
    all: ['annees-scolaires'] as const,
    listes: () => [...ANNEES_KEYS.all, 'liste'] as const,
    liste: (filtres: AnneeScolaireFiltres, etablissementId: string) => [...ANNEES_KEYS.listes(), etablissementId, filtres] as const,
    details: () => [...ANNEES_KEYS.all, 'detail'] as const,
    detail: (id: string, etablissementId: string) => [...ANNEES_KEYS.details(), etablissementId, id] as const,
    actives: () => [...ANNEES_KEYS.all, 'active'] as const,
    active: (etablissementId: string) => [...ANNEES_KEYS.actives(), etablissementId] as const,
};

export function useAnneesScolaires(filtres: AnneeScolaireFiltres = {}) {
    const { isAuthenticated, etablissementId } = useAuthStore();
    return useQuery({
        queryKey: ANNEES_KEYS.liste(filtres, etablissementId || ''),
        queryFn: async () => {
            const response = await apiClient.get<AnneeScolaire[]>('/api/annees-scolaires', {
                page: filtres.page || 1,
                limit: filtres.limit || 20,
                sortBy: filtres.sortBy,
                sortOrder: filtres.sortOrder,
                statut: filtres.statut,
                recherche: filtres.recherche,
            });

            // Réponse paginée serveur (items + meta)
            if (response.data && Array.isArray((response.data as any).items)) {
                const paginated = response.data as unknown as { items: AnneeScolaire[]; meta: PaginatedResult<AnneeScolaire>['meta'] };
                return paginated as PaginatedResult<AnneeScolaire>;
            }

            // Fallback rétrocompatibilité : réponse en tableau brut
            const rawItems = (response.data as AnneeScolaire[]) || [];
            const page = filtres.page || 1;
            const limit = filtres.limit || 20;
            return {
                items: rawItems,
                meta: {
                    totalItems: rawItems.length,
                    itemCount: rawItems.length,
                    itemsPerPage: limit,
                    totalPages: Math.ceil(rawItems.length / limit) || 1,
                    currentPage: page,
                },
            } satisfies PaginatedResult<AnneeScolaire>;
        },
        enabled: isAuthenticated && !!etablissementId,
        staleTime: 15 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

export function useAnneeScolaire(id: string) {
    const { etablissementId } = useAuthStore();
    return useQuery({
        queryKey: ANNEES_KEYS.detail(id, etablissementId || ''),
        queryFn: async () => {
            const response = await apiClient.get<AnneeScolaire>(`/api/annees-scolaires/${id}`);
            return response.data || undefined;
        },
        enabled: !!id && !!etablissementId,
        placeholderData: (previousData) => previousData,
    });
}

export function useAnneeScolaireActive() {
    const { isAuthenticated, etablissementId } = useAuthStore();
    
    return useQuery({
        queryKey: ANNEES_KEYS.active(etablissementId || ''),
        queryFn: async () => {
            const response = await apiClient.get<AnneeScolaire>('/api/annees-scolaires/active');
            return response.data || undefined;
        },
        enabled: isAuthenticated && !!etablissementId,
        staleTime: 30 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

export function useCreerAnneeScolaire() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (dto: CreerAnneeScolaireDto) => {
            const response = await apiClient.post<AnneeScolaire>('/api/annees-scolaires', dto);
            return response.data || undefined;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ANNEES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: ANNEES_KEYS.actives() });
            toast.success('Année scolaire créée avec succès');
        },
        onError: (error: Error) => toast.error(error?.message || 'Erreur lors de la création'),
    });
}

export function useModifierAnneeScolaire() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (dto: ModifierAnneeScolaireDto) => {
            const { id, ...data } = dto;
            const response = await apiClient.patch<AnneeScolaire>(`/api/annees-scolaires/${id}`, data);
            return response.data || undefined;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ANNEES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: ANNEES_KEYS.actives() });
            toast.success('Année scolaire modifiée avec succès');
        },
        onError: (error: Error) => toast.error(error?.message || 'Erreur lors de la modification'),
    });
}

export function useActiverAnneeScolaire() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await apiClient.post<AnneeScolaire>(`/api/annees-scolaires/${id}/activer`, {});
            return response.data || undefined;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ANNEES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: ANNEES_KEYS.actives() });
            toast.success('Année scolaire activée');
        },
        onError: (error: Error) => toast.error(error?.message || 'Erreur lors de l\'activation'),
    });
}

export function useCloturerAnneeScolaire() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await apiClient.post<AnneeScolaire>(`/api/annees-scolaires/${id}/cloturer`, {});
            return response.data || undefined;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ANNEES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: ANNEES_KEYS.actives() });
            toast.success('Année scolaire clôturée avec succès');
        },
        onError: (error: Error) => toast.error(error?.message || 'Erreur lors de la clôture'),
    });
}

export function useReouvrirAnneeScolaire() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await apiClient.post<AnneeScolaire>(`/api/annees-scolaires/${id}/reouvrir`, {});
            return response.data || undefined;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ANNEES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: ANNEES_KEYS.actives() });
            toast.success('Année scolaire réouverte avec succès');
        },
        onError: (error: Error) => toast.error(error?.message || 'Erreur lors de la réouverture'),
    });
}

export function useSupprimerAnneeScolaire() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/annees-scolaires/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ANNEES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: ANNEES_KEYS.actives() });
            toast.success('Année scolaire supprimée avec succès');
        },
        onError: (error: Error) => toast.error(error?.message || 'Erreur lors de la suppression'),
    });
}
