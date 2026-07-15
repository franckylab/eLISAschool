/**
 * ==================================
 * eLISAschool - Hooks React Query Spécialités
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Hooks pour la gestion CRUD des spécialités par filière technique
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import type { PaginatedResult } from '@shared/types/api.types';

// Types
export interface Specialite {
    id: string;
    nom: string;
    code: string;
    description?: string;
    filiereId: string;
    filiere?: { id: string; nom: string; code: string };
    ordre: number;
    actif: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreerSpecialiteDto {
    nom: string;
    code: string;
    description?: string;
    filiereId: string;
    ordre?: number;
    actif?: boolean;
}

export interface ModifierSpecialiteDto {
    id: string;
    nom?: string;
    code?: string;
    description?: string;
    filiereId?: string;
    ordre?: number;
    actif?: boolean;
}

export interface SpecialiteFiltres {
    page?: number;
    limit?: number;
    recherche?: string;
    filiereId?: string;
    actif?: boolean;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}

// Clés de cache
const SPECIALITES_KEYS = {
    all: ['specialites'] as const,
    listes: () => [...SPECIALITES_KEYS.all, 'liste'] as const,
    liste: (filtres: SpecialiteFiltres) => [...SPECIALITES_KEYS.listes(), filtres] as const,
    details: () => [...SPECIALITES_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...SPECIALITES_KEYS.details(), id] as const,
    parFiliere: (filiereId: string) => [...SPECIALITES_KEYS.all, 'filiere', filiereId] as const,
};

// Hook: Lister les spécialités
export function useSpecialites(filtres: SpecialiteFiltres = {}) {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: SPECIALITES_KEYS.liste(filtres),
        queryFn: async () => {
            const params: Record<string, any> = {
                page: filtres.page || 1,
                limit: filtres.limit || 20,
                sortBy: filtres.sortBy || 'ordre',
                sortOrder: filtres.sortOrder || 'ASC',
            };

            // Ajouter uniquement les filtres non vides
            if (filtres.recherche) params.search = filtres.recherche;
            if (filtres.filiereId) params.filiereId = filtres.filiereId;
            if (filtres.actif !== undefined) params.actif = filtres.actif;

            const response = await apiClient.get<PaginatedResult<Specialite>>('/api/specialites', params);
            return (response as any).data as PaginatedResult<Specialite>;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

// Hook: Obtenir une spécialité par ID
export function useSpecialite(id: string) {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: SPECIALITES_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<Specialite>(`/api/specialites/${id}`);
            return (response as any).data;
        },
        enabled: !!id && isAuthenticated,
        staleTime: 5 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

// Hook: Lister les spécialités par filière
export function useSpecialitesParFiliere(filiereId: string) {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: SPECIALITES_KEYS.parFiliere(filiereId),
        queryFn: async () => {
            const response = await apiClient.get<Specialite[]>(`/api/specialites/filiere/${filiereId}`);
            return (response as any).data as Specialite[];
        },
        enabled: !!filiereId && isAuthenticated,
        staleTime: 5 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

// Hook: Créer une spécialité
export function useCreerSpecialite() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerSpecialiteDto) => {
            const response = await apiClient.post<Specialite>('/api/specialites', dto);
            return (response as any).data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: SPECIALITES_KEYS.listes() });
            toast.success('Spécialité créée avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la création');
        },
    });
}

// Hook: Modifier une spécialité
export function useModifierSpecialite() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...dto }: ModifierSpecialiteDto) => {
            const response = await apiClient.patch<Specialite>(`/api/specialites/${id}`, dto);
            return (response as any).data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: SPECIALITES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: SPECIALITES_KEYS.detail(variables.id) });
            toast.success('Spécialité modifiée avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la modification');
        },
    });
}

// Hook: Supprimer une spécialité
export function useSupprimerSpecialite() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/specialites/${id}`);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: SPECIALITES_KEYS.listes() });
            toast.success('Spécialité supprimée avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la suppression');
        },
    });
}
