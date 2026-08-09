/**
 * ==================================
 * eLISAschool - Hook Multi-Tenant Optimisé
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Hook générique pour les requêtes multi-tenant avec :
 * - Cache optimisé par établissement
 * - Gestion d'erreurs centralisée
 * - Retry intelligent
 * - Optimisations de performance
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import type { PaginatedResult } from '@shared/types/api.types';

/**
 * Hook générique pour les listes paginées multi-tenant
 * 
 * @param key - Clé de cache unique
 * @param endpoint - Endpoint API
 * @param filtres - Filtres de la requête
 * @param options - Options React Query
 * 
 * @example
 * const { data, isLoading } = useMultiTenantList<Filiere>(
 *   'filieres',
 *   '/api/filieres',
 *   { page: 1, limit: 20, cycleId: 'xxx' }
 * );
 */
export function useMultiTenantList<T>(
    key: string,
    endpoint: string,
    filtres: Record<string, any> = {},
    options?: Partial<UseQueryOptions<PaginatedResult<T>, Error>>
) {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: [key, 'list', filtres],
        queryFn: async () => {
            const params: Record<string, any> = {
                page: filtres.page || 1,
                limit: filtres.limit || 20,
                sortBy: filtres.sortBy || 'createdAt',
                sortOrder: filtres.sortOrder || 'DESC',
            };

            // Ajouter uniquement les filtres non vides (optimisation)
            Object.keys(filtres).forEach(key => {
                if (key !== 'page' && key !== 'limit' && key !== 'sortBy' && key !== 'sortOrder') {
                    const value = filtres[key];
                    if (value !== undefined && value !== null && value !== '') {
                        params[key] = value;
                    }
                }
            });

            const response = await apiClient.get<PaginatedResult<T>>(endpoint, params);
            return (response as any).data as PaginatedResult<T>;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000,   // 10 minutes (anciennement cacheTime)
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        retry: 1,
        retryDelay: 1000,
        ...options,
    });
}

/**
 * Hook générique pour le détail d'une entité
 * 
 * @param key - Clé de cache unique
 * @param endpoint - Endpoint API avec ID
 * @param id - ID de l'entité
 * @param options - Options React Query
 * 
 * @example
 * const { data: filiere } = useMultiTenantDetail<Filiere>(
 *   'filiere',
 *   `/api/filieres/${id}`,
 *   id
 * );
 */
export function useMultiTenantDetail<T>(
    key: string,
    endpoint: string,
    id: string | undefined,
    options?: Partial<UseQueryOptions<T, Error>>
) {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: [key, 'detail', id],
        queryFn: async () => {
            const response = await apiClient.get<T>(endpoint);
            
            if (!response.data) {
                throw new Error('Entité non trouvée');
            }

            return response.data;
        },
        enabled: isAuthenticated && !!id,
        staleTime: 3 * 60 * 1000, // 3 minutes
        gcTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        retry: 1,
        retryDelay: 500,
        ...options,
    });
}

/**
 * Hook générique pour créer une entité
 * 
 * @param key - Clé de cache pour l'invalidation
 * @param endpoint - Endpoint API
 * @param onSuccess - Callback de succès
 * 
 * @example
 * const mutation = useMultiTenantCreate<Filiere, CreerFiliereDto>(
 *   'filieres',
 *   '/api/filieres'
 * );
 * mutation.mutate(dto);
 */
export function useMultiTenantCreate<TRequest, TResponse>(
    key: string,
    endpoint: string,
    onSuccess?: (data: TResponse) => void
) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: TRequest) => {
            const response = await apiClient.post<TResponse>(endpoint, dto);
            
            if (!response.success || response.data === undefined) {
                throw new Error('Erreur lors de la création');
            }

            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: [key, 'list'] });
            toast.success('Créé avec succès');
            onSuccess?.(data);
        },
        onError: (error: any) => {
            const message = error.response?.data?.error?.message || 'Erreur lors de la création';
            toast.error(message);
        },
        retry: 0,
    });
}

/**
 * Hook générique pour modifier une entité
 * 
 * @param key - Clé de cache pour l'invalidation
 * @param endpoint - Endpoint API (avec placeholder {id})
 * @param onSuccess - Callback de succès
 * 
 * @example
 * const mutation = useMultiTenantUpdate<Filiere, ModifierFiliereDto>(
 *   'filieres',
 *   '/api/filieres'
 * );
 * mutation.mutate({ id: 'xxx', nom: 'Nouveau nom' });
 */
export function useMultiTenantUpdate<TRequest extends { id: string }, TResponse>(
    key: string,
    endpoint: string,
    onSuccess?: (data: TResponse) => void
) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...dto }: TRequest) => {
            const response = await apiClient.patch<TResponse>(
                `${endpoint}/${id}`,
                dto
            );
            
            if (!response.success || response.data === undefined) {
                throw new Error('Erreur lors de la modification');
            }

            return response.data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: [key, 'list'] });
            queryClient.invalidateQueries({ queryKey: [key, 'detail', variables.id] });
            toast.success('Modifié avec succès');
            onSuccess?.(data);
        },
        onError: (error: any) => {
            const message = error.response?.data?.error?.message || 'Erreur lors de la modification';
            toast.error(message);
        },
        retry: 0,
    });
}

/**
 * Hook générique pour supprimer une entité
 * 
 * @param key - Clé de cache pour l'invalidation
 * @param endpoint - Endpoint API (avec placeholder {id})
 * @param onSuccess - Callback de succès
 * 
 * @example
 * const mutation = useMultiTenantDelete(
 *   'filieres',
 *   '/api/filieres'
 * );
 * mutation.mutate('xxx');
 */
export function useMultiTenantDelete(
    key: string,
    endpoint: string,
    onSuccess?: () => void
) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await apiClient.delete<{ success: boolean }>(`${endpoint}/${id}`);
            
            if (!response.data?.success) {
                throw new Error('Erreur lors de la suppression');
            }

            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [key, 'list'] });
            toast.success('Supprimé avec succès');
            onSuccess?.();
        },
        onError: (error: any) => {
            const message = error.response?.data?.error?.message || 'Erreur lors de la suppression';
            toast.error(message);
        },
        retry: 0,
    });
}
