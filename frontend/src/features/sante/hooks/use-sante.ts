/**
 * ==================================
 * eLISAschool - Hooks Santé
 * ==================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import type { VisiteInfirmerie, CreerVisiteDto, VisitesFiltres, StatistiquesSante, DossierMedical } from '../types/sante.types';

const SANTE_KEYS = {
    visites: {
        all: ['sante', 'visites'] as const,
        liste: (filtres: VisitesFiltres) => [...SANTE_KEYS.visites.all, filtres] as const,
        detail: (id: string) => [...SANTE_KEYS.visites.all, 'detail', id] as const,
    },
    dossiers: {
        all: ['sante', 'dossiers'] as const,
        detail: (eleveId: string) => [...SANTE_KEYS.dossiers.all, eleveId] as const,
    },
    stats: () => ['sante', 'stats'] as const,
};

export function useVisitesInfirmerie(filtres: VisitesFiltres = {}) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: SANTE_KEYS.visites.liste(filtres),
        queryFn: async () => {
            const response = await apiClient.getPaginated<VisiteInfirmerie>('/api/sante/visites', {
                page: filtres.page || 1,
                limit: filtres.limit || 20,
                ...filtres,
            });
            return response;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

export function useVisiteInfirmerie(id: string) {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: SANTE_KEYS.visites.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: VisiteInfirmerie }>(`/api/sante/visites/${id}`);
            return response.data?.data;
        },
        enabled: !!id && isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

export function useCreerVisite() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerVisiteDto) => {
            const response = await apiClient.post<{ success: boolean; data: VisiteInfirmerie }>('/api/sante/visites', dto);
            return response.data?.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: SANTE_KEYS.visites.all });
            queryClient.invalidateQueries({ queryKey: SANTE_KEYS.stats() });
            toast.success('Visite enregistrée avec succès');
        },
    });
}

export function useDossierMedical(eleveId: string) {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: SANTE_KEYS.dossiers.detail(eleveId),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: DossierMedical }>(`/api/sante/dossiers-medicaux/${eleveId}`);
            return response.data?.data;
        },
        enabled: !!eleveId && isAuthenticated,
        staleTime: 10 * 60 * 1000,
    });
}

export function useStatistiquesSante() {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: SANTE_KEYS.stats(),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: StatistiquesSante }>('/api/sante/statistiques');
            return response.data?.data;
        },
        enabled: isAuthenticated,
        staleTime: 10 * 60 * 1000,
    });
}
