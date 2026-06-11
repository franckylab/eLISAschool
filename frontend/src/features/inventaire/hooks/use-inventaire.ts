/**
 * ==================================
 * eLISAschool - Hooks Inventaire
 * ==================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import type { Materiel, CreerMaterielDto, MouvementStock, StatistiquesInventaire, InventaireFiltres } from '../types/inventaire.types';

const INVENTAIRE_KEYS = {
    materiels: (filtres?: InventaireFiltres) => ['inventaire', 'materiels', filtres] as const,
    materiel: (id: string) => ['inventaire', 'materiel', id] as const,
    mouvements: (materielId?: string) => ['inventaire', 'mouvements', materielId] as const,
    stats: () => ['inventaire', 'stats'] as const,
};

export function useMateriels(filtres?: InventaireFiltres) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: INVENTAIRE_KEYS.materiels(filtres),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: Materiel[]; meta: any }>('/api/inventaire/materiels', { params: filtres });
            return { data: response.data.data, meta: response.data.meta };
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

export function useMateriel(id: string) {
    return useQuery({
        queryKey: INVENTAIRE_KEYS.materiel(id),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: Materiel }>(`/api/inventaire/materiels/${id}`);
            return response.data.data;
        },
        enabled: !!id,
    });
}

export function useCreerMateriel() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerMaterielDto) => {
            const response = await apiClient.post<{ success: boolean; data: Materiel }>('/api/inventaire/materiels', dto);
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: INVENTAIRE_KEYS.materiels() });
            queryClient.invalidateQueries({ queryKey: INVENTAIRE_KEYS.stats() });
            toast.success('Matériel ajouté avec succès');
        },
    });
}

export function useModifierMateriel(id: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: Partial<CreerMaterielDto>) => {
            const response = await apiClient.patch<{ success: boolean; data: Materiel }>(`/api/inventaire/materiels/${id}`, dto);
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: INVENTAIRE_KEYS.materiels() });
            toast.success('Matériel modifié avec succès');
        },
    });
}

export function useSupprimerMateriel() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/inventaire/materiels/${id}`);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: INVENTAIRE_KEYS.materiels() });
            queryClient.invalidateQueries({ queryKey: INVENTAIRE_KEYS.stats() });
            toast.success('Matériel supprimé avec succès');
        },
    });
}

export function useMouvementsStock(materielId?: string) {
    return useQuery({
        queryKey: INVENTAIRE_KEYS.mouvements(materielId),
        queryFn: async () => {
            const url = materielId ? `/api/inventaire/mouvements?materielId=${materielId}` : '/api/inventaire/mouvements';
            const response = await apiClient.get<{ success: boolean; data: MouvementStock[] }>(url);
            return response.data.data;
        },
        enabled: isAuthenticated,
        staleTime: 3 * 60 * 1000,
    });
}

export function useEnregistrerMouvement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { materielId: string; type: string; quantite: number; motif: string }) => {
            const response = await apiClient.post<{ success: boolean; data: MouvementStock }>('/api/inventaire/mouvements', data);
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: INVENTAIRE_KEYS.mouvements() });
            queryClient.invalidateQueries({ queryKey: INVENTAIRE_KEYS.materiels() });
            toast.success('Mouvement enregistré avec succès');
        },
    });
}

export function useReformerMateriel() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { materielId: string; motif: string }) => {
            const response = await apiClient.post<{ success: boolean; data: Materiel }>(`/api/inventaire/materiels/${data.materielId}/reformer`, {
                motif: data.motif,
            });
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: INVENTAIRE_KEYS.materiels() });
            queryClient.invalidateQueries({ queryKey: INVENTAIRE_KEYS.stats() });
            toast.success('Matériel réformé avec succès');
        },
    });
}

export function useStatistiquesInventaire() {
    return useQuery({
        queryKey: INVENTAIRE_KEYS.stats(),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: StatistiquesInventaire }>('/api/inventaire/statistiques');
            return response.data.data;
        },
        enabled: isAuthenticated,
        staleTime: 10 * 60 * 1000,
    });
}
