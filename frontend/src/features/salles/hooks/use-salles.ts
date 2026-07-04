/**
 * ==================================
 * eLISAschool - Hooks Salles
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Hooks React Query pour la gestion des salles
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import type {
    Salle,
    CreerSalleDto,
    ModifierSalleDto,
    FiltresSalles,
    StatistiquesSalles,
    PaginationResponse,
} from '../types/salle.types';

const SALLES_KEYS = {
    all: (filtres?: FiltresSalles) => ['salles', filtres] as const,
    detail: (id: string) => ['salles', id] as const,
    disponibles: () => ['salles', 'disponibles'] as const,
    stats: () => ['salles', 'stats'] as const,
};

// ==================================
// Hooks de lecture
// ==================================

export function useSalles(filtres?: FiltresSalles) {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: SALLES_KEYS.all(filtres),
        queryFn: async () => {
            const params: any = {};
            if (filtres) {
                if (filtres.page) params.page = filtres.page;
                if (filtres.limit) params.limit = filtres.limit;
                if (filtres.typeSalle) params.typeSalle = filtres.typeSalle;
                if (filtres.disponible !== undefined) params.disponible = filtres.disponible;
                if (filtres.statut) params.statut = filtres.statut;
                if (filtres.capaciteMin) params.capaciteMin = filtres.capaciteMin;
                if (filtres.capaciteMax) params.capaciteMax = filtres.capaciteMax;
                if (filtres.search) params.search = filtres.search;
            }
            
            const response = await apiClient.get<Salle[]>('/api/salles', { params });
            return {
                data: response.data || [],
                pagination: (response as any).pagination as PaginationResponse | undefined,
            };
        },
        enabled: isAuthenticated,
        staleTime: 3 * 60 * 1000, // 3 minutes
    });
}

export function useSalle(id: string) {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: SALLES_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<Salle>(`/api/salles/${id}`);
            const data = response.data;
            if (!data) throw new Error('Salle non trouvée');
            return data;
        },
        enabled: isAuthenticated && !!id,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

export function useSallesDisponibles(capaciteMin?: number, typeSalle?: string) {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: SALLES_KEYS.disponibles(),
        queryFn: async () => {
            const params: any = {};
            if (capaciteMin) params.capaciteMin = capaciteMin;
            if (typeSalle) params.typeSalle = typeSalle;
            
            const response = await apiClient.get<Salle[]>('/api/salles/disponibles', { params });
            return response.data || [];
        },
        enabled: isAuthenticated,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
}

export function useStatistiquesSalles() {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: SALLES_KEYS.stats(),
        queryFn: async () => {
            const response = await apiClient.get<StatistiquesSalles>('/api/salles/statistiques');
            const data = response.data;
            if (!data) return {} as StatistiquesSalles;
            return data;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

// ==================================
// Hooks de mutation
// ==================================

export function useCreerSalle() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async (dto: CreerSalleDto) => {
            const response = await apiClient.post<Salle>('/api/salles', dto);
            const data = response.data;
            if (!data) throw new Error('Impossible de créer la salle');
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['salles'] });
            toast.success('Salle créée avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la création');
        },
    });
}

export function useModifierSalle() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async ({ id, dto }: { id: string; dto: ModifierSalleDto }) => {
            const response = await apiClient.patch<Salle>(`/api/salles/${id}`, dto);
            const data = response.data;
            if (!data) throw new Error('Impossible de modifier la salle');
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['salles'] });
            queryClient.invalidateQueries({ queryKey: SALLES_KEYS.detail(variables.id) });
            toast.success('Salle modifiée avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la modification');
        },
    });
}

export function useSupprimerSalle() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/salles/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['salles'] });
            toast.success('Salle supprimée avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la suppression');
        },
    });
}
