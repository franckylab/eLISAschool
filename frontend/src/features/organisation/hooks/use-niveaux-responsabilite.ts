import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import type { NiveauResponsabilite } from '../types/organisation.types';

const KEYS = { all: ['organisation', 'niveaux-responsabilite'] as const };

function handleError(e: any, msg: string) {
    toast.error(e?.response?.data?.error?.message || msg);
}

export function useNiveauxResponsabilite() {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: KEYS.all,
        queryFn: async () => { const res = await apiClient.get<NiveauResponsabilite[]>('/api/organisation/niveaux-responsabilite'); return res.data || []; },
        enabled: isAuthenticated,
    });
}

export function useCreerNiveauResponsabilite() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (dto: Partial<NiveauResponsabilite>) => { const res = await apiClient.post<NiveauResponsabilite>('/api/organisation/niveaux-responsabilite', dto); return res.data!; },
        onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.all }); toast.success('Niveau créé'); },
        onError: (e: any) => handleError(e, 'Erreur création niveau'),
    });
}

export function useModifierNiveauResponsabilite() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...data }: { id: string } & Partial<NiveauResponsabilite>) => { const res = await apiClient.patch<NiveauResponsabilite>(`/api/organisation/niveaux-responsabilite/${id}`, data); return res.data!; },
        onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.all }); toast.success('Niveau modifié'); },
        onError: (e: any) => handleError(e, 'Erreur modification niveau'),
    });
}

export function useSupprimerNiveauResponsabilite() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => { await apiClient.delete(`/api/organisation/niveaux-responsabilite/${id}`); },
        onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.all }); toast.success('Niveau supprimé'); },
        onError: (e: any) => handleError(e, 'Erreur suppression niveau'),
    });
}
