/**
 * ==================================
 * eLISAschool - Hooks Transport
 * ==================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import type { LigneTransport, InscriptionTransport, CreerLigneDto, CreerInscriptionTransportDto, LigneFiltres, InscriptionTransportFiltres } from '../types/transport.types';

const TRANSPORT_KEYS = {
    lignes: {
        all: ['transport', 'lignes'] as const,
        liste: (filtres: LigneFiltres) => [...TRANSPORT_KEYS.lignes.all, filtres] as const,
    },
    inscriptions: {
        all: ['transport', 'inscriptions'] as const,
        liste: (filtres: InscriptionTransportFiltres) => [...TRANSPORT_KEYS.inscriptions.all, filtres] as const,
    },
};

export function useLignesTransport(filtres: LigneFiltres = {}) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: TRANSPORT_KEYS.lignes.liste(filtres),
        queryFn: async () => {
            const response = await apiClient.getPaginated<LigneTransport>('/api/transport/lignes', {
                page: filtres.page || 1,
                limit: filtres.limit || 20,
                ...filtres,
            });
            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 10 * 60 * 1000,
    });
}

export function useInscriptionsTransport(filtres: InscriptionTransportFiltres = {}) {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: TRANSPORT_KEYS.inscriptions.liste(filtres),
        queryFn: async () => {
            const response = await apiClient.getPaginated<InscriptionTransport>('/api/transport/inscriptions', {
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

export function useCreerLigneTransport() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerLigneDto) => {
            const response = await apiClient.post<any>('/api/transport/lignes', dto);
            return response.data?.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TRANSPORT_KEYS.lignes.all });
            toast.success('Ligne de transport créée avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la création');
        },
    });
}

export function useCreerInscriptionTransport() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerInscriptionTransportDto) => {
            const response = await apiClient.post<any>('/api/transport/inscriptions', dto);
            return response.data?.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TRANSPORT_KEYS.inscriptions.all });
            toast.success('Inscription transport créée avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de l\'inscription');
        },
    });
}

export function useSupprimerLigneTransport() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/transport/lignes/${id}`);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TRANSPORT_KEYS.lignes.all });
            toast.success('Ligne supprimée avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la suppression');
        },
    });
}
