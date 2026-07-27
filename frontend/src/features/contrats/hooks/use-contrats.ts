/**
 * ==================================
 * eLISAschool - Hooks Contrats & Types de contrat
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import type {
    ContratPersonnel,
    TypeContratPersonnalise,
    ContratFilters,
    CreerContratDto,
    PaginatedContrats,
} from '../types/contrat.types';

const CONTRATS_KEYS = {
    all: ['contrats'] as const,
    contrats: {
        all: ['contrats', 'list'] as const,
        liste: (params?: ContratFilters) => [...CONTRATS_KEYS.contrats.all, params] as const,
        detail: (id: string) => ['contrats', 'detail', id] as const,
    },
    typesContrat: {
        all: ['contrats', 'types-contrat'] as const,
        liste: (params?: Record<string, string | number | boolean>) => [...CONTRATS_KEYS.typesContrat.all, params] as const,
    },
};

function messageErreur(e: unknown, fallback: string): string {
    if (e && typeof e === 'object') {
        const err = e as { response?: { data?: { message?: string } }; message?: string };
        return err.response?.data?.message || err.message || fallback;
    }
    return fallback;
}

export function useContrats(params?: ContratFilters) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: CONTRATS_KEYS.contrats.liste(params),
        queryFn: async () => {
            const response = await apiClient.get<PaginatedContrats>('/api/personnel/contrats', params as Record<string, string | number>);
            const data = response.data;
            if (data && Array.isArray((data as unknown as { items?: unknown }).items)) {
                return data;
            }
            const items = (Array.isArray(data) ? data : []) as ContratPersonnel[];
            return {
                items,
                meta: { totalItems: items.length, currentPage: 1, itemsPerPage: items.length || 1, totalPages: 1 },
            } satisfies PaginatedContrats;
        },
        enabled: isAuthenticated,
        placeholderData: (previous) => previous,
    });
}

export function useCreerContrat() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (dto: CreerContratDto) => {
            const response = await apiClient.post<ContratPersonnel>('/api/personnel/contrats', dto);
            return response.data;
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: CONTRATS_KEYS.all }); toast.success('Contrat créé'); },
        onError: (e: unknown) => toast.error(messageErreur(e, 'Erreur création contrat')),
    });
}

export function useModifierContrat() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...dto }: { id: string } & Partial<CreerContratDto>) => {
            const response = await apiClient.patch<ContratPersonnel>(`/api/personnel/contrats/${id}`, dto);
            return response.data;
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: CONTRATS_KEYS.all }); toast.success('Contrat modifié'); },
        onError: (e: unknown) => toast.error(messageErreur(e, 'Erreur modification contrat')),
    });
}

export function useSupprimerContrat() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => { await apiClient.delete(`/api/personnel/contrats/${id}`); },
        onSuccess: () => { qc.invalidateQueries({ queryKey: CONTRATS_KEYS.all }); toast.success('Contrat supprimé'); },
        onError: (e: unknown) => toast.error(messageErreur(e, 'Erreur suppression contrat')),
    });
}

export function useTypesContrat(params?: Record<string, string | number | boolean>) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: CONTRATS_KEYS.typesContrat.liste(params),
        queryFn: async () => {
            const response = await apiClient.get<TypeContratPersonnalise[] | { items: TypeContratPersonnalise[] }>('/api/personnel/types-contrat', params as Record<string, string | number>);
            const data = response.data;
            if (data && !Array.isArray(data) && Array.isArray(data.items)) return data.items;
            return (Array.isArray(data) ? data : []) as TypeContratPersonnalise[];
        },
        enabled: isAuthenticated,
        staleTime: 60_000,
    });
}

export function useCreerTypeContrat() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (dto: {
            code: string; nom: string; description?: string; categorie?: string;
            modeRemunerationId?: string; ordre?: number;
            renouvellementAutoDefaut?: boolean; dureeMaxMois?: number;
        }) => {
            const response = await apiClient.post<TypeContratPersonnalise>('/api/personnel/types-contrat', dto);
            return response.data;
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: CONTRATS_KEYS.typesContrat.all }); toast.success('Type contrat créé'); },
        onError: (e: unknown) => toast.error(messageErreur(e, 'Erreur création type contrat')),
    });
}

export function useModifierTypeContrat() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...dto }: { id: string } & Partial<TypeContratPersonnalise>) => {
            const response = await apiClient.patch<TypeContratPersonnalise>(`/api/personnel/types-contrat/${id}`, dto);
            return response.data;
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: CONTRATS_KEYS.typesContrat.all }); toast.success('Type contrat modifié'); },
        onError: (e: unknown) => toast.error(messageErreur(e, 'Erreur modification type contrat')),
    });
}

export function useSupprimerTypeContrat() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => { await apiClient.delete(`/api/personnel/types-contrat/${id}`); },
        onSuccess: () => { qc.invalidateQueries({ queryKey: CONTRATS_KEYS.typesContrat.all }); toast.success('Type contrat supprimé'); },
        onError: (e: unknown) => toast.error(messageErreur(e, 'Erreur suppression type contrat')),
    });
}

export function useToggleTypeContrat() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await apiClient.post<TypeContratPersonnalise>(`/api/personnel/types-contrat/${id}/toggle`);
            return response.data;
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: CONTRATS_KEYS.typesContrat.all }); toast.success('Statut modifié'); },
        onError: (e: unknown) => toast.error(messageErreur(e, 'Erreur modification statut')),
    });
}
