import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import type { ContratPersonnel, TypeContratPersonnalise, ContratFilters } from '../types/contrat.types';

const CONTRATS_KEYS = {
    all: ['contrats'] as const,
    contrats: {
        all: ['contrats', 'list'] as const,
        liste: (params?: ContratFilters) => [...CONTRATS_KEYS.contrats.all, params] as const,
        detail: (id: string) => ['contrats', 'detail', id] as const,
    },
    typesContrat: {
        all: ['contrats', 'types-contrat'] as const,
        liste: (params?: any) => [...CONTRATS_KEYS.typesContrat.all, params] as const,
    },
};

export function useContrats(params?: ContratFilters) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: CONTRATS_KEYS.contrats.liste(params),
        queryFn: async () => {
            const response = await apiClient.get<ContratPersonnel[]>('/api/personnel/contrats', params as any);
            return (response.data as any)?.items || response.data || [];
        },
        enabled: isAuthenticated,
    });
}

export function useCreerContrat() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (dto: Partial<ContratPersonnel> & { membrePersonnelId: string; typeContrat: string; dateDebut: string; salaireBase: number }) => {
            const response = await apiClient.post<ContratPersonnel>('/api/personnel/contrats', dto);
            return response.data;
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: CONTRATS_KEYS.contrats.all }); toast.success('Contrat créé'); },
        onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || 'Erreur création contrat'),
    });
}

export function useModifierContrat() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...dto }: { id: string } & Record<string, any>) => {
            const response = await apiClient.patch<ContratPersonnel>(`/api/personnel/contrats/${id}`, dto);
            return response.data;
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: CONTRATS_KEYS.contrats.all }); toast.success('Contrat modifié'); },
        onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || 'Erreur modification contrat'),
    });
}

export function useSupprimerContrat() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => { await apiClient.delete(`/api/personnel/contrats/${id}`); },
        onSuccess: () => { qc.invalidateQueries({ queryKey: CONTRATS_KEYS.contrats.all }); toast.success('Contrat supprimé'); },
        onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || 'Erreur suppression contrat'),
    });
}

export function useTypesContrat(params?: any) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: CONTRATS_KEYS.typesContrat.liste(params),
        queryFn: async () => {
            const response = await apiClient.get<TypeContratPersonnalise[]>('/api/personnel/types-contrat', params as any);
            return (response.data as any)?.items || response.data || [];
        },
        enabled: isAuthenticated,
    });
}

export function useCreerTypeContrat() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (dto: {
            code: string; nom: string; description?: string; categorie?: string;
            modeRemuneration?: string; ordre?: number;
            renouvellementAutoDefaut?: boolean; dureeMaxMois?: number;
        }) => {
            const response = await apiClient.post<TypeContratPersonnalise>('/api/personnel/types-contrat', dto);
            return response.data;
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: CONTRATS_KEYS.typesContrat.all }); toast.success('Type contrat créé'); },
        onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || 'Erreur création type contrat'),
    });
}

export function useModifierTypeContrat() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...dto }: { id: string } & Record<string, any>) => {
            const response = await apiClient.patch<TypeContratPersonnalise>(`/api/personnel/types-contrat/${id}`, dto);
            return response.data;
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: CONTRATS_KEYS.typesContrat.all }); toast.success('Type contrat modifié'); },
        onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || 'Erreur modification type contrat'),
    });
}

export function useSupprimerTypeContrat() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => { await apiClient.delete(`/api/personnel/types-contrat/${id}`); },
        onSuccess: () => { qc.invalidateQueries({ queryKey: CONTRATS_KEYS.typesContrat.all }); toast.success('Type contrat supprimé'); },
        onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || 'Erreur suppression type contrat'),
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
        onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || 'Erreur modification statut'),
    });
}
