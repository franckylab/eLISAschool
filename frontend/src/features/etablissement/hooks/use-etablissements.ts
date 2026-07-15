/**
 * ==================================
 * eLISAschool - Hooks Etablissement
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import type {
    Etablissement,
    EtablissementConfig,
    EtablissementStats,
    EtablissementDetailStats,
    CreerEtablissementDto,
    ModifierEtablissementDto,
    ModifierConfigDto,
    EtablissementFiltres,
} from '../types/etablissement.types';

const ETABLISSEMENTS_KEYS = {
    all: ['etablissements'] as const,
    listes: () => [...ETABLISSEMENTS_KEYS.all, 'liste'] as const,
    liste: (filtres: EtablissementFiltres) => [...ETABLISSEMENTS_KEYS.listes(), filtres] as const,
    details: () => [...ETABLISSEMENTS_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...ETABLISSEMENTS_KEYS.details(), id] as const,
    configs: () => [...ETABLISSEMENTS_KEYS.all, 'config'] as const,
    config: (id: string) => [...ETABLISSEMENTS_KEYS.configs(), id] as const,
    stats: () => [...ETABLISSEMENTS_KEYS.all, 'stats'] as const,
    stat: (id: string) => [...ETABLISSEMENTS_KEYS.stats(), id] as const,
    // Logo établissement (v3.0)
    logos: () => [...ETABLISSEMENTS_KEYS.all, 'logo'] as const,
    logo: (id: string) => [...ETABLISSEMENTS_KEYS.logos(), id] as const,
};

// =============================================
// QUERIES
// =============================================

export function useEtablissements(filtres: EtablissementFiltres = {}) {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: ETABLISSEMENTS_KEYS.liste(filtres),
        queryFn: async () => {
            const response = await apiClient.get<Etablissement[]>('/api/etablissements');
            
            if (!response.data) {
                throw new Error('Établissements non disponibles');
            }
            
            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

export function useEtablissement(id: string) {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: ETABLISSEMENTS_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<Etablissement>(`/api/etablissements/${id}`);
            
            if (!response.data) {
                throw new Error('Établissement non trouvé');
            }
            
            return response.data;
        },
        enabled: !!id && isAuthenticated,
        staleTime: 5 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

export function useEtablissementConfig(etablissementId: string) {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: ETABLISSEMENTS_KEYS.config(etablissementId),
        queryFn: async () => {
            const response = await apiClient.get<EtablissementConfig>(
                `/api/etablissements/${etablissementId}/config`
            );
            
            if (!response.data) {
                throw new Error('Configuration non disponible');
            }
            
            return response.data;
        },
        enabled: !!etablissementId && isAuthenticated,
        staleTime: 5 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

export function useEtablissementStats() {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: ETABLISSEMENTS_KEYS.stats(),
        queryFn: async () => {
            const response = await apiClient.get<EtablissementStats>('/api/etablissements/stats');
            
            if (!response.data) {
                throw new Error('Statistiques non disponibles');
            }
            
            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 2 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

export function useEtablissementDetailStats(etablissementId: string) {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: ETABLISSEMENTS_KEYS.stat(etablissementId),
        queryFn: async () => {
            const response = await apiClient.get<EtablissementDetailStats>(
                `/api/etablissements/${etablissementId}/stats`
            );
            
            if (!response.data) {
                throw new Error('Statistiques détaillées non disponibles');
            }
            
            return response.data;
        },
        enabled: !!etablissementId && isAuthenticated,
        staleTime: 2 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

// =============================================
// MUTATIONS
// =============================================

export function useCreerEtablissement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerEtablissementDto) => {
            const response = await apiClient.post<Etablissement>('/api/etablissements', dto);
            
            if (!response.data) {
                throw new Error('Erreur lors de la création de l\'établissement');
            }
            
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ETABLISSEMENTS_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: ETABLISSEMENTS_KEYS.stats() });
            toast.success('Établissement créé avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la création');
        },
    });
}

export function useModifierEtablissement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...dto }: ModifierEtablissementDto) => {
            const response = await apiClient.patch<Etablissement>(
                `/api/etablissements/${id}`,
                dto
            );
            
            if (!response.data) {
                throw new Error('Erreur lors de la modification de l\'établissement');
            }
            
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ETABLISSEMENTS_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: ETABLISSEMENTS_KEYS.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: ETABLISSEMENTS_KEYS.stats() });
            toast.success('Établissement modifié avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la modification');
        },
    });
}

export function useModifierConfig() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ etablissementId, ...dto }: { etablissementId: string } & ModifierConfigDto) => {
            const response = await apiClient.patch<EtablissementConfig>(
                `/api/etablissements/${etablissementId}/config`,
                dto
            );
            
            if (!response.data) {
                throw new Error('Erreur lors de la modification de la configuration');
            }
            
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ETABLISSEMENTS_KEYS.config(variables.etablissementId) });
            toast.success('Configuration modifiée avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la modification');
        },
    });
}

export function useActiverEtablissement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await apiClient.patch<Etablissement>(
                `/api/etablissements/${id}/activer`
            );
            
            if (!response.data) {
                throw new Error('Erreur lors de l\'activation de l\'établissement');
            }
            
            return response.data;
        },
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ETABLISSEMENTS_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: ETABLISSEMENTS_KEYS.detail(id) });
            queryClient.invalidateQueries({ queryKey: ETABLISSEMENTS_KEYS.stats() });
            toast.success('Établissement activé avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de l\'activation');
        },
    });
}

export function useDesactiverEtablissement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await apiClient.patch<Etablissement>(
                `/api/etablissements/${id}/desactiver`
            );
            
            if (!response.data) {
                throw new Error('Erreur lors de la désactivation de l\'établissement');
            }
            
            return response.data;
        },
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ETABLISSEMENTS_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: ETABLISSEMENTS_KEYS.detail(id) });
            queryClient.invalidateQueries({ queryKey: ETABLISSEMENTS_KEYS.stats() });
            toast.success('Établissement désactivé avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la désactivation');
        },
    });
}

// =============================================
// MUTATIONS - Logo (v3.0)
// =============================================

export interface UploadLogoResponse {
    logoType?: string;
    logoTaille?: number;
    // Note: Le backend ne retourne pas logoBase64 (select: false)
    // Le frontend doit gérer le preview localement
}

export function useUploadLogo() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ etablissementId, logoBase64 }: { etablissementId: string; logoBase64: string }) => {
            const response = await apiClient.post<UploadLogoResponse>(
                `/api/etablissements/${etablissementId}/logo`,
                { logoBase64 }
            );
            
            if (!response.data) {
                throw new Error('Erreur lors de l\'upload du logo');
            }
            
            return response.data;
        },
        onSuccess: (_, variables) => {
            // Invalider le détail pour récupérer les métadonnées du logo
            queryClient.invalidateQueries({ queryKey: ETABLISSEMENTS_KEYS.detail(variables.etablissementId) });
            toast.success('Logo uploadé avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de l\'upload du logo');
        },
    });
}

export function useSupprimerLogo() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (etablissementId: string) => {
            const response = await apiClient.delete(`/api/etablissements/${etablissementId}/logo`);
            
            if (!response.success) {
                throw new Error('Erreur lors de la suppression du logo');
            }
            
            return response;
        },
        onSuccess: (_, etablissementId) => {
            queryClient.invalidateQueries({ queryKey: ETABLISSEMENTS_KEYS.detail(etablissementId) });
            queryClient.invalidateQueries({ queryKey: ETABLISSEMENTS_KEYS.logo(etablissementId) });
            toast.success('Logo supprimé avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la suppression du logo');
        },
    });
}

export function useGetLogo(etablissementId: string) {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: ETABLISSEMENTS_KEYS.logo(etablissementId),
        queryFn: async () => {
            const response = await apiClient.get<{
                base64: string;
                type: string;
                taille: number;
            }>(`/api/etablissements/${etablissementId}/logo`);
            
            if (!response.data) {
                return null;
            }
            
            return response.data;
        },
        enabled: !!etablissementId && isAuthenticated,
        staleTime: 10 * 60 * 1000, // 10 minutes
        placeholderData: (previousData) => previousData,
    });
}
