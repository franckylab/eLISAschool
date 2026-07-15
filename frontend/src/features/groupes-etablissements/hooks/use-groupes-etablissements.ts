/**
 * ==================================
 * eLISAschool - Hooks Groupes d'Établissements
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import type { PaginatedResult } from '@shared/types/api.types';
import type {
    GroupeEtablissement,
    CreerGroupeEtablissementDto,
    ModifierGroupeEtablissementDto,
    GroupeEtablissementFiltres,
} from '../types/groupe-etablissement.types';

const GROUPES_ETABLISSEMENTS_KEYS = {
    all: ['groupes-etablissements'] as const,
    lists: () => [...GROUPES_ETABLISSEMENTS_KEYS.all, 'list'] as const,
    list: (filtres: GroupeEtablissementFiltres) => [...GROUPES_ETABLISSEMENTS_KEYS.lists(), filtres] as const,
    details: () => [...GROUPES_ETABLISSEMENTS_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...GROUPES_ETABLISSEMENTS_KEYS.details(), id] as const,
};

export function useGroupesEtablissements(filtres: GroupeEtablissementFiltres = {}) {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: GROUPES_ETABLISSEMENTS_KEYS.list(filtres),
        queryFn: async () => {
            const params: Record<string, any> = {
                page: filtres.page || 1,
                limit: filtres.limit || 20,
            };

            if (filtres.recherche) params.search = filtres.recherche;
            if (filtres.actif !== undefined) params.actif = filtres.actif;

            const response = await apiClient.get<{
                success: boolean;
                data: GroupeEtablissement[];
                pagination: {
                    page: number;
                    limit: number;
                    total: number;
                    totalPages: number;
                    hasNext: boolean;
                    hasPrev: boolean;
                };
            }>('/api/groupes-etablissements', params);
            
            // RÉALITÉ RUNTIME: apiClient.get retourne DIRECTEMENT {success, data, pagination}
            // PAS un wrapper ApiResponse<T>
            // response = {success: true, data: [...], pagination: {...}}
            // response.data = [...] (tableau des groupes)
            // response.pagination = {...}
            const groupes = (response as any)?.data || [];
            const pagination = (response as any)?.pagination;
            
            return {
                items: groupes,
                meta: {
                    totalItems: pagination?.total || 0,
                    itemCount: groupes.length,
                    itemsPerPage: pagination?.limit || 20,
                    totalPages: pagination?.totalPages || 0,
                    currentPage: pagination?.page || 1,
                },
            } as PaginatedResult<GroupeEtablissement>;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

/**
 * Hook pour récupérer les établissements disponibles (pour sélection)
 * Exclut les établissements déjé assignés à un groupe
 */
export function useEtablissementsDisponibles() {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: ['etablissements', 'disponibles'],
        queryFn: async () => {
            // Backend: res.json({ success: true, data: etablissements[] })
            // apiClient.get retourne ApiResponse<T>, donc response.data = T = etablissements[]
            const response = await apiClient.get<Array<{ id: string; nom: string; code: string }>>(
                '/api/etablissements'
            );
            return response.data || [];
        },
        enabled: isAuthenticated,
        staleTime: 10 * 60 * 1000,
    });
}

/**
 * Hook pour récupérer les IDs des établissements déjé assignés à un groupe
 */
export function useEtablissementsAssignesIds(groupeId: string, enabled: boolean = true) {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: ['groupes-etablissements', 'etablissements-assignes-ids', groupeId],
        queryFn: async () => {
            const response = await apiClient.get<any[]>(
                `/api/groupes-etablissements/${groupeId}/etablissements`
            );
            const etablissements = response.data || [];
            return new Set(etablissements.map((e: any) => e.id));
        },
        enabled: isAuthenticated && !!groupeId && enabled,
        staleTime: 5 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

/**
 * Hook pour récupérer TOUS les IDs d'établissements assignés à N'IMPORTE QUEL groupe
 * Utilisé pour filtrer la liste globale des établissements disponibles
 * 
 * Performance : Charge uniquement les groupes actifs et utilise Promise.allSettled
 */
export function useTousEtablissementsAssignesIds() {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: ['groupes-etablissements', 'tous-etablissements-assignes-ids'],
        queryFn: async () => {
            // Charger uniquement les groupes actifs
            const response = await apiClient.get<any>(
                '/api/groupes-etablissements',
                { page: 1, limit: 1000, actif: true }
            );
            
            // response.data = tableau des groupes
            const groupes = response?.data || [];
            
            console.log('[useTousEtablissementsAssignesIds] Groupes actifs chargés:', groupes.length);
            
            // Charger TOUS les établissements en parallèle (plus performant)
            const results = await Promise.allSettled(
                groupes.map(async (groupe: any) => {
                    const etabResponse = await apiClient.get<any[]>(
                        `/api/groupes-etablissements/${groupe.id}/etablissements`
                    );
                    return {
                        groupeNom: groupe.nom,
                        etablissements: etabResponse?.data || [],
                    };
                })
            );
            
            // Agréger tous les IDs
            const allAssignedIds = new Set<string>();
            
            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    const { groupeNom, etablissements } = result.value;
                    console.log(`[useTousEtablissementsAssignesIds] ${groupeNom}: ${etablissements.length} établissements`);
                    etablissements.forEach((e: any) => allAssignedIds.add(e.id));
                } else {
                    console.warn(`[useTousEtablissementsAssignesIds] Erreur chargement groupe ${index}:`, result.reason);
                }
            });
            
            console.log('[useTousEtablissementsAssignesIds] Total IDs assignés:', allAssignedIds.size);
            
            return allAssignedIds;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000, // 5 min
        retry: 2, // Retry 2 fois en cas d'erreur
    });
}

/**
 * Hook pour récupérer les utilisateurs disponibles (pour admins de groupe)
 */
export function useUtilisateursDisponibles() {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: ['utilisateurs', 'disponibles', 'admins'],
        queryFn: async () => {
            // Backend: res.json({ success: true, data: {items: [...], meta: {...}} })
            // apiClient.get retourne ApiResponse<PaginatedResult<User>>
            // Donc response.data = PaginatedResult<User> = {items: [...], meta: {...}}
            const allUsers: any[] = [];
            let page = 1;
            let hasMore = true;
            
            while (hasMore) {
                const response = await apiClient.get<{
                    items: any[];
                    meta: { totalItems: number; currentPage: number; itemsPerPage: number; totalPages: number };
                }>('/api/utilisateurs', { 
                    limit: 100, 
                    page,
                    role: 'ADMIN,CHEF_ETABLISSEMENT,DIRECTEUR,SUPER_ADMIN' 
                });
                
                // response.data = {items: [...], meta: {...}}
                const paginatedResult = response.data;
                const users = paginatedResult?.items || [];
                const meta = paginatedResult?.meta;
                
                allUsers.push(...users);
                
                hasMore = meta ? meta.currentPage < meta.totalPages : false;
                page++;
                
                if (page > 10) break;
            }
            
            return allUsers;
        },
        enabled: isAuthenticated,
        staleTime: 10 * 60 * 1000,
    });
}

export function useGroupeEtablissementDetail(id: string) {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: GROUPES_ETABLISSEMENTS_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<GroupeEtablissement>(
                `/api/groupes-etablissements/${id}`
            );

            if (!response.data) {
                throw new Error('Groupe d\'établissements non trouvé');
            }

            return response.data;
        },
        enabled: isAuthenticated && !!id,
        staleTime: 10 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

export function useCreerGroupeEtablissement() {
    const queryClient = useQueryClient();
    const { t } = useTranslation('groupes-etablissements');

    return useMutation({
        mutationFn: async (dto: CreerGroupeEtablissementDto) => {
            const response = await apiClient.post<{ success: boolean; data: GroupeEtablissement }>(
                '/api/groupes-etablissements',
                dto
            );
            return response.data?.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: GROUPES_ETABLISSEMENTS_KEYS.lists() });
            // Invalider la liste des établissements assignés
            queryClient.invalidateQueries({ queryKey: ['groupes-etablissements', 'tous-etablissements-assignes-ids'] });
            toast.success(t('messages.creationSucces'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || t('messages.erreurCreation'));
        },
    });
}

export function useModifierGroupeEtablissement() {
    const queryClient = useQueryClient();
    const { t } = useTranslation('groupes-etablissements');

    return useMutation({
        mutationFn: async ({ id, ...dto }: { id: string } & ModifierGroupeEtablissementDto) => {
            const response = await apiClient.patch<{ success: boolean; data: GroupeEtablissement }>(
                `/api/groupes-etablissements/${id}`,
                dto
            );
            return response.data?.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: GROUPES_ETABLISSEMENTS_KEYS.lists() });
            queryClient.invalidateQueries({
                queryKey: GROUPES_ETABLISSEMENTS_KEYS.detail(variables.id),
            });
            toast.success(t('messages.modificationSucces'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || t('messages.erreurModification'));
        },
    });
}

export function useSupprimerGroupeEtablissement() {
    const queryClient = useQueryClient();
    const { t } = useTranslation('groupes-etablissements');

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/groupes-etablissements/${id}`);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: GROUPES_ETABLISSEMENTS_KEYS.lists() });
            // Invalider la liste des établissements assignés
            queryClient.invalidateQueries({ queryKey: ['groupes-etablissements', 'tous-etablissements-assignes-ids'] });
            toast.success(t('messages.suppressionSucces'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || t('messages.erreurSuppression'));
        },
    });
}

export function useAjouterEtablissement() {
    const queryClient = useQueryClient();
    const { t } = useTranslation('groupes-etablissements');

    return useMutation({
        mutationFn: async ({ groupeId, etablissementIds }: { groupeId: string; etablissementIds: string[] }) => {
            const response = await apiClient.post(
                `/api/groupes-etablissements/${groupeId}/etablissements`,
                { etablissementIds }
            );
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: GROUPES_ETABLISSEMENTS_KEYS.detail(variables.groupeId) });
            queryClient.invalidateQueries({ queryKey: GROUPES_ETABLISSEMENTS_KEYS.lists() });
            // Invalider aussi la liste des établissements assignés pour rafraîchir les filtres
            queryClient.invalidateQueries({ queryKey: ['groupes-etablissements', 'tous-etablissements-assignes-ids'] });
            toast.success(t('messages.creationSucces'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || t('messages.erreurCreation'));
        },
    });
}

export function useRetirerEtablissement() {
    const queryClient = useQueryClient();
    const { t } = useTranslation('groupes-etablissements');

    return useMutation({
        mutationFn: async ({ groupeId, etablissementId }: { groupeId: string; etablissementId: string }) => {
            await apiClient.delete(`/api/groupes-etablissements/${groupeId}/etablissements/${etablissementId}`);
            return { groupeId, etablissementId };
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: GROUPES_ETABLISSEMENTS_KEYS.detail(variables.groupeId) });
            queryClient.invalidateQueries({ queryKey: GROUPES_ETABLISSEMENTS_KEYS.lists() });
            // Invalider aussi la liste des établissements assignés pour rafraîchir les filtres
            queryClient.invalidateQueries({ queryKey: ['groupes-etablissements', 'tous-etablissements-assignes-ids'] });
            toast.success(t('messages.suppressionSucces'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || t('messages.erreurSuppression'));
        },
    });
}

/**
 * Hook pour récupérer les établissements d'un groupe
 */
export function useListerEtablissementsGroupe(groupeId: string, enabled: boolean = true) {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: [...GROUPES_ETABLISSEMENTS_KEYS.details(), groupeId, 'etablissements'],
        queryFn: async () => {
            // Backend groupes: res.json({ success: true, data: [...] })
            const response = await apiClient.get<any[]>(
                `/api/groupes-etablissements/${groupeId}/etablissements`
            );
            return response.data || [];
        },
        enabled: isAuthenticated && !!groupeId && enabled,
        staleTime: 5 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

export function useListerAdmins(groupeId: string, enabled: boolean = true) {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: [...GROUPES_ETABLISSEMENTS_KEYS.details(), groupeId, 'admins'],
        queryFn: async () => {
            // Backend groupes: res.json({ success: true, data: [...] })
            const response = await apiClient.get<any[]>(
                `/api/groupes-etablissements/${groupeId}/admins`
            );
            return response.data || [];
        },
        enabled: isAuthenticated && !!groupeId && enabled,
        staleTime: 5 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

export function useAjouterAdmin() {
    const queryClient = useQueryClient();
    const { t } = useTranslation('groupes-etablissements');

    return useMutation({
        mutationFn: async ({ groupeId, utilisateurId }: { groupeId: string; utilisateurId: string }) => {
            await apiClient.post(`/api/groupes-etablissements/${groupeId}/admins`, { utilisateurId });
            return { groupeId, utilisateurId };
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: [...GROUPES_ETABLISSEMENTS_KEYS.details(), variables.groupeId, 'admins'] });
            toast.success(t('messages.adminAjoute'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || t('messages.erreurAjoutAdmin'));
        },
    });
}

export function useRetirerAdmin() {
    const queryClient = useQueryClient();
    const { t } = useTranslation('groupes-etablissements');

    return useMutation({
        mutationFn: async ({ groupeId, utilisateurId }: { groupeId: string; utilisateurId: string }) => {
            await apiClient.delete(`/api/groupes-etablissements/${groupeId}/admins/${utilisateurId}`);
            return { groupeId, utilisateurId };
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: [...GROUPES_ETABLISSEMENTS_KEYS.details(), variables.groupeId, 'admins'] });
            toast.success(t('messages.adminRetire'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || t('messages.erreurRetraitAdmin'));
        },
    });
}
