/**
 * ==================================
 * eLISAschool - Hooks Finances
 * ==================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import type { FraisScolaire, Paiement, CreerFraisDto, CreerPaiementDto, FraisFiltres, PaiementFiltres, StatistiquesFinancieres } from '../types/finance.types';

const FINANCES_KEYS = {
    frais: {
        all: ['finances', 'frais'] as const,
        liste: (filtres: FraisFiltres) => [...FINANCES_KEYS.frais.all, filtres] as const,
    },
    paiements: {
        all: ['finances', 'paiements'] as const,
        liste: (filtres: PaiementFiltres) => [...FINANCES_KEYS.paiements.all, filtres] as const,
        detail: (id: string) => [...FINANCES_KEYS.paiements.all, 'detail', id] as const,
    },
    stats: () => ['finances', 'stats'] as const,
};

export function useFraisScolaires(filtres: FraisFiltres = {}) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: FINANCES_KEYS.frais.liste(filtres),
        queryFn: async () => {
            const response = await apiClient.getPaginated<FraisScolaire>('/api/finances/frais', {
                page: filtres.page || 1,
                limit: filtres.limit || 20,
                ...filtres,
            });
            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 10 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

export function usePaiements(filtres: PaiementFiltres = {}) {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: FINANCES_KEYS.paiements.liste(filtres),
        queryFn: async () => {
            const response = await apiClient.getPaginated<Paiement>('/api/finances/paiements', {
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

export function useStatistiquesFinancieres() {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: FINANCES_KEYS.stats(),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: StatistiquesFinancieres }>('/api/finances/statistiques');
            return response.data?.data;
        },
        enabled: isAuthenticated,
        staleTime: 10 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

export function useCreerFrais() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerFraisDto) => {
            const response = await apiClient.post<{ success: boolean; data: FraisScolaire }>('/api/finances/frais', dto);
            return response.data?.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: FINANCES_KEYS.frais.all });
            queryClient.invalidateQueries({ queryKey: FINANCES_KEYS.stats() });
            toast.success('Frais créé avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la création');
        },
    });
}

export function useCreerPaiement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerPaiementDto) => {
            const response = await apiClient.post<{ success: boolean; data: Paiement }>('/api/finances/paiements', dto);
            return response.data?.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: FINANCES_KEYS.paiements.all });
            queryClient.invalidateQueries({ queryKey: FINANCES_KEYS.stats() });
            toast.success('Paiement enregistré avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de l\'enregistrement');
        },
    });
}

export function useExporterRecu() {
    return useMutation({
        mutationFn: async (paiementId: string) => {
            const response = await apiClient.get(`/api/finances/paiements/${paiementId}/recu`, {
                responseType: 'blob',
            });
            return response.data;
        },
        onSuccess: (data) => {
            const url = window.URL.createObjectURL(new Blob([data as BlobPart]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `recu.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Reçu téléchargé');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de l\'export');
        },
    });
}

export function useSupprimerFrais() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/finances/frais/${id}`);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: FINANCES_KEYS.frais.all });
            queryClient.invalidateQueries({ queryKey: FINANCES_KEYS.stats() });
            toast.success('Frais supprimé avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la suppression');
        },
    });
}
