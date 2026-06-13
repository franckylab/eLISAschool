/**
 * ==================================
 * eLISAschool - Hooks React Query Compétences
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Hooks pour la gestion CRUD des compétences (Approche Par Compétences - APC)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import type { PaginatedResult } from '@shared/types/api.types';

// Types
export interface Competence {
    id: string;
    code: string;
    libelle: string;
    description?: string;
    domaine: string;
    niveauId: string;
    niveau?: { id: string; nom: string; code: string };
    matiereId?: string;
    matiere?: { id: string; nom: string; code: string };
    ordre: number;
    actif: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreerCompetenceDto {
    code: string;
    libelle: string;
    description?: string;
    domaine: string;
    niveauId: string;
    matiereId?: string;
    ordre?: number;
    actif?: boolean;
}

export interface ModifierCompetenceDto {
    id: string;
    code?: string;
    libelle?: string;
    description?: string;
    domaine?: string;
    niveauId?: string;
    matiereId?: string;
    ordre?: number;
    actif?: boolean;
}

export interface CompetenceFiltres {
    page?: number;
    limit?: number;
    recherche?: string;
    niveauId?: string;
    matiereId?: string;
    domaine?: string;
    actif?: boolean;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}

// Clés de cache
const COMPETENCES_KEYS = {
    all: ['competences'] as const,
    listes: () => [...COMPETENCES_KEYS.all, 'liste'] as const,
    liste: (filtres: CompetenceFiltres) => [...COMPETENCES_KEYS.listes(), filtres] as const,
    details: () => [...COMPETENCES_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...COMPETENCES_KEYS.details(), id] as const,
    parNiveau: (niveauId: string) => [...COMPETENCES_KEYS.all, 'niveau', niveauId] as const,
    parMatiere: (matiereId: string) => [...COMPETENCES_KEYS.all, 'matiere', matiereId] as const,
    parDomaine: (domaine: string) => [...COMPETENCES_KEYS.all, 'domaine', domaine] as const,
};

// Hook: Lister les compétences
export function useCompetences(filtres: CompetenceFiltres = {}) {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: COMPETENCES_KEYS.liste(filtres),
        queryFn: async () => {
            const params: Record<string, any> = {
                page: filtres.page || 1,
                limit: filtres.limit || 20,
                sortBy: filtres.sortBy || 'ordre',
                sortOrder: filtres.sortOrder || 'ASC',
            };

            // Ajouter uniquement les filtres non vides
            if (filtres.recherche) params.search = filtres.recherche;
            if (filtres.niveauId) params.niveauId = filtres.niveauId;
            if (filtres.matiereId) params.matiereId = filtres.matiereId;
            if (filtres.domaine) params.domaine = filtres.domaine;
            if (filtres.actif !== undefined) params.actif = filtres.actif;

            const response = await apiClient.get<PaginatedResult<Competence>>('/api/competences', params);
            return (response as any).data as PaginatedResult<Competence>;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

// Hook: Obtenir une compétence par ID
export function useCompetence(id: string) {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: COMPETENCES_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<Competence>(`/api/competences/${id}`);
            return (response as any).data;
        },
        enabled: !!id && isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

// Hook: Lister les compétences par niveau
export function useCompetencesParNiveau(niveauId: string) {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: COMPETENCES_KEYS.parNiveau(niveauId),
        queryFn: async () => {
            const response = await apiClient.get<Competence[]>(`/api/competences/niveau/${niveauId}`);
            return (response as any).data as Competence[];
        },
        enabled: !!niveauId && isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

// Hook: Lister les compétences par matière
export function useCompetencesParMatiere(matiereId: string) {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: COMPETENCES_KEYS.parMatiere(matiereId),
        queryFn: async () => {
            const response = await apiClient.get<Competence[]>(`/api/competences/matiere/${matiereId}`);
            return (response as any).data as Competence[];
        },
        enabled: !!matiereId && isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

// Hook: Lister les compétences par domaine
export function useCompetencesParDomaine(domaine: string) {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: COMPETENCES_KEYS.parDomaine(domaine),
        queryFn: async () => {
            const response = await apiClient.get<Competence[]>(`/api/competences/domaine/${domaine}`);
            return (response as any).data as Competence[];
        },
        enabled: !!domaine && isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

// Hook: Créer une compétence
export function useCreerCompetence() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerCompetenceDto) => {
            const response = await apiClient.post<Competence>('/api/competences', dto);
            return (response as any).data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: COMPETENCES_KEYS.listes() });
            toast.success('Compétence créée avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la création');
        },
    });
}

// Hook: Modifier une compétence
export function useModifierCompetence() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...dto }: ModifierCompetenceDto) => {
            const response = await apiClient.patch<Competence>(`/api/competences/${id}`, dto);
            return (response as any).data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: COMPETENCES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: COMPETENCES_KEYS.detail(variables.id) });
            toast.success('Compétence modifiée avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la modification');
        },
    });
}

// Hook: Supprimer une compétence
export function useSupprimerCompetence() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/competences/${id}`);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: COMPETENCES_KEYS.listes() });
            toast.success('Compétence supprimée avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la suppression');
        },
    });
}
