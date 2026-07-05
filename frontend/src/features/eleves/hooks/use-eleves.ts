/**
 * ==================================
 * eLISAschool - Hook Élèves
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Intégration API avec TanStack Query pour le module Élèves
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';
import type { Eleve, CreerEleveDto, ModifierEleveDto, EleveFiltres } from '../types/eleve.types';
import { toast } from 'sonner';

// Clés de requête
const ELEVES_KEYS = {
    all: ['eleves'] as const,
    listes: () => [...ELEVES_KEYS.all, 'liste'] as const,
    liste: (filtres: EleveFiltres) => [...ELEVES_KEYS.listes(), filtres] as const,
    details: () => [...ELEVES_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...ELEVES_KEYS.details(), id] as const,
    stats: () => [...ELEVES_KEYS.all, 'stats'] as const,
};

// ─── QUERIES ─────────────────────────────────────────

// Lister les élèves (paginé)
export function useEleves(filtres: EleveFiltres = {}) {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: ELEVES_KEYS.liste(filtres),
        queryFn: async () => {
            const response = await apiClient.getPaginated<Eleve>('/api/eleves', {
                page: filtres.page || 1,
                limit: filtres.limit || 20,
                sortBy: filtres.sortBy,
                sortOrder: filtres.sortOrder,
                ...filtres,
            });
            return response.data;
        },
        enabled: isAuthenticated, // Ne pas appeler si non authentifié
        staleTime: 5 * 60 * 1000, // 5 min
    });
}

// Détail d'un élève
export function useEleve(id: string) {
    return useQuery({
        queryKey: ELEVES_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<Eleve>(`/api/eleves/${id}`);
            return response.data;
        },
        enabled: !!id,
        staleTime: 10 * 60 * 1000, // 10 min
    });
}

// Statistiques élèves
export function useElevesStats(etablissementId?: string) {
    return useQuery({
        queryKey: ELEVES_KEYS.stats(),
        queryFn: async () => {
            const response = await apiClient.get<{ data: any }>('/api/eleves/stats');
            return response.data;
        },
        enabled: !!etablissementId,
        staleTime: 15 * 60 * 1000, // 15 min
    });
}

// ─── MUTATIONS ───────────────────────────────────────

// Créer un élève
export function useCreerEleve() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerEleveDto) => {
            const response = await apiClient.post<{ data: Eleve }>('/api/eleves', dto);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ELEVES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: ELEVES_KEYS.stats() });
            toast.success(`Élève ${data?.data?.prenom} ${data?.data?.nom} créé avec succès`);
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Erreur lors de la création');
        },
    });
}

// Modifier un élève
export function useModifierEleve() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: ModifierEleveDto) => {
            const { id, ...data } = dto;
            const response = await apiClient.patch<{ data: Eleve }>(`/api/eleves/${id}`, data);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ELEVES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: ELEVES_KEYS.detail(data?.data?.id) });
            queryClient.invalidateQueries({ queryKey: ELEVES_KEYS.stats() });
            toast.success(`Élève ${data?.data?.prenom} ${data?.data?.nom} modifié avec succès`);
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Erreur lors de la modification');
        },
    });
}

// Supprimer un élève
export function useSupprimerEleve() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/eleves/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ELEVES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: ELEVES_KEYS.stats() });
            toast.success('Élève supprimé avec succès');
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Erreur lors de la suppression');
        },
    });
}

// Importer des élèves (CSV/Excel)
export function useImporterEleves() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (formData: FormData) => {
            const response = await apiClient.upload<{ data: { importe: number; erreurs: number } }>(
                '/api/eleves/import',
                formData
            );
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ELEVES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: ELEVES_KEYS.stats() });
            toast.success(`${data?.data?.importe} élèves importés avec succès`);
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Erreur lors de l\'import');
        },
    });
}

// Exporter les élèves
export function useExporterEleves() {
    return useMutation({
        mutationFn: async (filtres?: EleveFiltres) => {
            const response = await apiClient.get<Blob>('/api/eleves/export', {
                format: 'csv',
                ...filtres,
            });
            return response;
        },
        onSuccess: (data) => {
            // Créer un lien de téléchargement
            const url = window.URL.createObjectURL(new Blob([data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `eleves_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Export réussi');
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Erreur lors de l\'export');
        },
    });
}
