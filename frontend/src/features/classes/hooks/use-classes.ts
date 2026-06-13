/**
 * ==================================
 * eLISAschool - Hook Classes
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import type { PaginatedResult } from '@shared/types/api.types';
import type { Classe, CreerClasseDto, ModifierClasseDto, ClasseFiltres } from '../types/classe.types';

const CLASSES_KEYS = {
    all: ['classes'] as const,
    listes: () => [...CLASSES_KEYS.all, 'liste'] as const,
    liste: (filtres: ClasseFiltres) => [...CLASSES_KEYS.listes(), filtres] as const,
    details: () => [...CLASSES_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...CLASSES_KEYS.details(), id] as const,
    stats: () => [...CLASSES_KEYS.all, 'stats'] as const,
};

// QUERIES
export function useClasses(filtres: ClasseFiltres = {}) {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: CLASSES_KEYS.liste(filtres),
        queryFn: async () => {
            const params: Record<string, any> = {
                page: filtres.page || 1,
                limit: filtres.limit || 20,
                sortBy: filtres.sortBy || 'nom',
                sortOrder: filtres.sortOrder || 'ASC',
            };

            // Ajouter uniquement les filtres non vides
            if (filtres.recherche) params.search = filtres.recherche;
            if (filtres.niveauId) params.niveauId = filtres.niveauId;
            if (filtres.anneeScolaireId) params.anneeScolaireId = filtres.anneeScolaireId;
            if (filtres.actif !== undefined) params.actif = filtres.actif;

            const response = await apiClient.get<PaginatedResult<Classe>>('/api/classes', params);
            
            if (!response.data) {
                throw new Error('Réponse API invalide : données manquantes');
            }
            
            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

export function useClasse(id: string) {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: CLASSES_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<Classe>(`/api/classes/${id}`);
            
            if (!response.data) {
                throw new Error('Classe non trouvée');
            }
            
            return response.data;
        },
        enabled: !!id && isAuthenticated,
        staleTime: 10 * 60 * 1000,
    });
}

export function useClassesStats(etablissementId?: string) {
    return useQuery({
        queryKey: CLASSES_KEYS.stats(),
        queryFn: async () => {
            const response = await apiClient.get<any>('/api/classes/stats');
            
            if (!response.data) {
                throw new Error('Statistiques non disponibles');
            }
            
            return response.data;
        },
        enabled: !!etablissementId,
    });
}

// MUTATIONS
export function useCreerClasse() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerClasseDto) => {
            const response = await apiClient.post<Classe>('/api/classes', dto);
            
            if (!response.data) {
                throw new Error('Erreur lors de la création de la classe');
            }
            
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CLASSES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: CLASSES_KEYS.stats() });
            toast.success('Classe créée avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la création');
        },
    });
}

export function useModifierClasse() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...dto }: ModifierClasseDto) => {
            const response = await apiClient.patch<Classe>(`/api/classes/${id}`, dto);
            
            if (!response.data) {
                throw new Error('Erreur lors de la modification de la classe');
            }
            
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: CLASSES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: CLASSES_KEYS.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: CLASSES_KEYS.stats() });
            toast.success('Classe modifiée avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la modification');
        },
    });
}

export function useSupprimerClasse() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/classes/${id}`);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CLASSES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: CLASSES_KEYS.stats() });
            toast.success('Classe supprimée avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la suppression');
        },
    });
}
