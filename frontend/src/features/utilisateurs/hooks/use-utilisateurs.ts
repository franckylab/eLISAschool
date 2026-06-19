/**
 * ==================================
 * eLISAschool - Hooks Utilisateurs
 * ==================================
 * Version: 2.1.0
 * Auteur: franck arlos chendjou
 * 
 * Hooks complets pour la gestion des utilisateurs avec:
 * - CRUD complet
 * - Gestion multi-établissements
 * - Cache optimisé et invalidation intelligente
 * - Gestion d'erreurs avancée
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import type { Utilisateur, CreerUtilisateurDto, ModifierUtilisateurDto, UtilisateurFiltres, Role } from '../types/utilisateur.types';

const UTILISATEURS_KEYS = {
    all: ['utilisateurs'] as const,
    listes: () => [...UTILISATEURS_KEYS.all, 'liste'] as const,
    liste: (filtres: UtilisateurFiltres) => [...UTILISATEURS_KEYS.listes(), filtres] as const,
    details: () => [...UTILISATEURS_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...UTILISATEURS_KEYS.details(), id] as const,
    roles: () => [...UTILISATEURS_KEYS.all, 'roles'] as const,
    parEtablissement: (etablissementId: string) => [...UTILISATEURS_KEYS.all, 'etablissement', etablissementId] as const,
    disponibles: (etablissementId?: string) => [...UTILISATEURS_KEYS.all, 'disponibles', etablissementId || 'all'] as const,
};

export function useUtilisateurs(filtres: UtilisateurFiltres = {}) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: UTILISATEURS_KEYS.liste(filtres),
        queryFn: async () => {
            const params: Record<string, any> = {
                page: filtres.page || 1,
                limit: filtres.limit || 20,
            };

            // Ajouter uniquement les filtres non vides
            if (filtres.recherche) params.search = filtres.recherche;
            if (filtres.role) params.role = filtres.role;
            if (filtres.actif !== undefined) params.actif = filtres.actif;
            if (filtres.etablissementId) params.etablissementId = filtres.etablissementId;
            if (filtres.sortBy) params.sortBy = filtres.sortBy;
            if (filtres.sortOrder) params.sortOrder = filtres.sortOrder;

            const response = await apiClient.getPaginated<Utilisateur>('/api/utilisateurs', params);
            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 2,
        refetchOnWindowFocus: false,
    });
}

export function useUtilisateur(id: string) {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: UTILISATEURS_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: Utilisateur }>(`/api/utilisateurs/${id}`);
            return response.data?.data;
        },
        enabled: isAuthenticated && !!id,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 1,
    });
}

/**
 * Hook pour lister les utilisateurs disponibles pour assignation
 */
export function useUtilisateursDisponibles(etablissementId?: string) {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: UTILISATEURS_KEYS.disponibles(etablissementId),
        queryFn: async () => {
            const params: Record<string, any> = {
                limit: 100,
                page: 1,
                actif: true,
            };
            
            // Si etablissementId fourni, exclure les utilisateurs déjà assignés
            if (etablissementId) {
                params.exclureEtablissement = etablissementId;
            }
            
            const response = await apiClient.getPaginated<Utilisateur>('/api/utilisateurs', params);
            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 3 * 60 * 1000,
        gcTime: 5 * 60 * 1000,
    });
}

export function useRoles() {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: UTILISATEURS_KEYS.roles(),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: Role[] }>('/api/roles');
            return response.data?.data;
        },
        enabled: isAuthenticated,
        staleTime: 30 * 60 * 1000,
    });
}

export function useCreerUtilisateur() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerUtilisateurDto) => {
            const response = await apiClient.post<{ success: boolean; data: Utilisateur }>('/api/utilisateurs', dto);
            return response.data?.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: UTILISATEURS_KEYS.listes() });
            toast.success('Utilisateur créé avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la création');
        },
    });
}

export function useModifierUtilisateur() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...dto }: ModifierUtilisateurDto) => {
            const response = await apiClient.patch<{ success: boolean; data: Utilisateur }>(`/api/utilisateurs/${id}`, dto);
            return response.data?.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: UTILISATEURS_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: UTILISATEURS_KEYS.detail(variables.id) });
            toast.success('Utilisateur modifié avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la modification');
        },
    });
}

export function useSupprimerUtilisateur() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/utilisateurs/${id}`);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: UTILISATEURS_KEYS.listes() });
            toast.success('Utilisateur supprimé avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la suppression');
        },
    });
}

/**
 * Hook pour assigner un utilisateur à un établissement
 */
export interface AffecterUtilisateurDto {
    etablissementId: string;
    role: string;
    etablissementPrincipal?: boolean;
    dateDebut?: string;
    dateFin?: string;
    motif?: string;
}

export function useAffecterUtilisateurEtablissement(etablissementId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ utilisateurId, ...dto }: AffecterUtilisateurDto & { utilisateurId: string }) => {
            const response = await apiClient.post(
                `/api/utilisateurs/${utilisateurId}/etablissements`,
                dto
            );
            return response.data;
        },
        onSuccess: () => {
            // Invalidation ciblée pour optimiser les performances
            queryClient.invalidateQueries({ queryKey: UTILISATEURS_KEYS.parEtablissement(etablissementId) });
            queryClient.invalidateQueries({ queryKey: UTILISATEURS_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: UTILISATEURS_KEYS.disponibles(etablissementId) });
            toast.success('Utilisateur assigné avec succès');
        },
        onError: (error: any) => {
            const message = error.response?.data?.error?.message || 'Erreur lors de l\'assignation';
            const code = error.response?.data?.error?.code;
            
            // Messages d'erreur spécifiques selon le code
            if (code === 'ALREADY_ASSIGNED') {
                toast.error('Cet utilisateur est déjà assigné à cet établissement');
            } else if (code === 'ELEVE_MULTI_ETABLISSEMENT_NOT_ALLOWED') {
                toast.error('Un élève ne peut être affecté qu\'à un seul établissement');
            } else if (code === 'MAX_ETABLISSEMENTS_REACHED') {
                toast.error('Le nombre maximum d\'établissements est atteint pour ce rôle');
            } else {
                toast.error(message);
            }
        },
    });
}

/**
 * Hook pour retirer un utilisateur d'un établissement
 * 
 * Supporte maintenant:
 * - Motif de retrait (optionnel)
 * - Meilleure gestion d'erreurs
 */
export function useRetirerUtilisateurEtablissement(etablissementId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ utilisateurId, motif }: { utilisateurId: string; motif?: string }) => {
            // Utiliser les query parameters au lieu du body pour DELETE (meilleure compatibilité)
            const url = motif
                ? `/api/utilisateurs/${utilisateurId}/etablissements/${etablissementId}?motif=${encodeURIComponent(motif)}`
                : `/api/utilisateurs/${utilisateurId}/etablissements/${etablissementId}`;
            
            await apiClient.delete(url);
            return utilisateurId;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: UTILISATEURS_KEYS.parEtablissement(etablissementId) });
            queryClient.invalidateQueries({ queryKey: UTILISATEURS_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: UTILISATEURS_KEYS.disponibles(etablissementId) });
            toast.success('Utilisateur retiré avec succès');
        },
        onError: (error: any) => {
            const code = error.response?.data?.error?.code;
            const message = error.response?.data?.error?.message;
            
            // Messages spécifiques selon le code d'erreur
            if (code === 'LAST_ETABLISSEMENT') {
                toast.error('Impossible de retirer le dernier établissement. Supprimez le compte utilisateur à la place.');
            } else if (code === 'AFFECTATION_NOT_FOUND') {
                // Ce cas ne devrait plus arriver avec l'idempotence backend
                toast.info('Cet utilisateur n\'est pas assigné à cet établissement');
            } else {
                toast.error(message || 'Erreur lors du retrait');
            }
        },
    });
}

/**
 * Hook pour changer le rôle d'un utilisateur dans un établissement
 */
export interface ChangerRoleDto {
    utilisateurId: string;
    etablissementId: string;
    nouveauRole: string;
}

export function useChangerRoleEtablissement(etablissementId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ utilisateurId, nouveauRole }: ChangerRoleDto) => {
            const response = await apiClient.patch(
                `/api/utilisateurs/${utilisateurId}/etablissements/${etablissementId}/role`,
                { role: nouveauRole }
            );
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: UTILISATEURS_KEYS.parEtablissement(etablissementId) });
            queryClient.invalidateQueries({ queryKey: UTILISATEURS_KEYS.listes() });
            toast.success('Rôle modifié avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors du changement de rôle');
        },
    });
}

/**
 * Hook pour définir l'établissement principal d'un utilisateur
 */
export interface DefinirEtablissementPrincipalDto {
    utilisateurId: string;
    etablissementId: string;
}

export function useDefinirEtablissementPrincipal() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ utilisateurId, etablissementId }: DefinirEtablissementPrincipalDto) => {
            const response = await apiClient.post(
                `/api/utilisateurs/${utilisateurId}/etablissements/${etablissementId}/principal`,
                {}
            );
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: UTILISATEURS_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: UTILISATEURS_KEYS.details() });
            toast.success('Établissement principal défini avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la définition de l\'établissement principal');
        },
    });
}
