import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import type { Poste, CreatePosteDto, UpdatePosteDto, PosteFiltres } from '../types/poste.types';

const POSTES_KEYS = {
    all: ['postes'] as const,
    list: (filtres?: PosteFiltres) => [...POSTES_KEYS.all, 'list', filtres] as const,
    detail: (id: string) => [...POSTES_KEYS.all, 'detail', id] as const,
    vacants: () => [...POSTES_KEYS.all, 'vacants'] as const,
    parFonction: (fonctionId: string) => [...POSTES_KEYS.all, 'fonction', fonctionId] as const,
    statistiques: () => [...POSTES_KEYS.all, 'statistiques'] as const,
};

export function usePostes(filtres?: PosteFiltres) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: POSTES_KEYS.list(filtres),
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filtres?.page) params.set('page', String(filtres.page));
            if (filtres?.limit) params.set('limit', String(filtres.limit));
            if (filtres?.search) params.set('search', filtres.search);
            if (filtres?.type) params.set('type', filtres.type);
            if (filtres?.statut) params.set('statut', filtres.statut);
            if (filtres?.fonctionId) params.set('fonctionId', filtres.fonctionId);
            if (filtres?.uniteOrganisationnelleId) params.set('uniteOrganisationnelleId', filtres.uniteOrganisationnelleId);
            if (filtres?.vacant !== undefined) params.set('vacant', String(filtres.vacant));
            if (filtres?.sortBy) params.set('sortBy', filtres.sortBy);
            if (filtres?.sortOrder) params.set('sortOrder', filtres.sortOrder);
            const res = await apiClient.get(`/api/postes?${params}`);
            const d = res as any;
            return { data: d.data as Poste[], total: d.total || 0, page: d.page || 1, limit: d.limit || 20 };
        },
        enabled: isAuthenticated,
    });
}

export function useTousPostes() {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: [...POSTES_KEYS.all, 'all'],
        queryFn: async () => {
            const res = await apiClient.get('/api/postes/all');
            return (res as any).data as Poste[];
        },
        staleTime: 5 * 60 * 1000,
        enabled: isAuthenticated,
    });
}

export function usePostesVacants() {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: POSTES_KEYS.vacants(),
        queryFn: async () => {
            const res = await apiClient.get('/api/postes/vacants');
            return (res as any).data as Poste[];
        },
        staleTime: 2 * 60 * 1000,
        enabled: isAuthenticated,
    });
}

export function usePostesParFonction(fonctionId: string) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: POSTES_KEYS.parFonction(fonctionId),
        queryFn: async () => {
            const res = await apiClient.get(`/api/postes/fonction/${fonctionId}`);
            return (res as any).data as Poste[];
        },
        enabled: !!fonctionId && isAuthenticated,
    });
}

export function usePoste(id: string) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: POSTES_KEYS.detail(id),
        queryFn: async () => {
            const res = await apiClient.get(`/api/postes/${id}`);
            return (res as any).data as Poste;
        },
        enabled: !!id && isAuthenticated,
    });
}

export function useCreerPoste() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (dto: CreatePosteDto) => {
            const res = await apiClient.post('/api/postes', dto);
            return (res as any).data as Poste;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: POSTES_KEYS.all });
            toast.success('Poste créé avec succès');
        },
        onError: (e: any) => {
            toast.error(e?.response?.data?.message || e?.message || 'Erreur lors de la création');
        },
    });
}

export function useModifierPoste() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, dto }: { id: string; dto: UpdatePosteDto }) => {
            const res = await apiClient.patch(`/api/postes/${id}`, dto);
            return (res as any).data as Poste;
        },
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: POSTES_KEYS.all });
            qc.invalidateQueries({ queryKey: POSTES_KEYS.detail(data.id) });
            toast.success('Poste modifié avec succès');
        },
        onError: (e: any) => {
            toast.error(e?.response?.data?.message || e?.message || 'Erreur lors de la modification');
        },
    });
}

export function useSupprimerPoste() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/postes/${id}`);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: POSTES_KEYS.all });
            toast.success('Poste supprimé');
        },
        onError: (e: any) => {
            toast.error(e?.response?.data?.message || e?.message || 'Erreur lors de la suppression');
        },
    });
}


