import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import type { CategoriePoste } from '../types/organisation.types';

const KEYS = { all: ['organisation', 'categories-poste'] as const };

function handleError(e: any, msg: string) {
    toast.error(e?.response?.data?.error?.message || msg);
}

export function useCategoriesPoste() {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: KEYS.all,
        queryFn: async () => { const res = await apiClient.get<CategoriePoste[]>('/api/organisation/categories-poste'); return res.data || []; },
        enabled: isAuthenticated,
    });
}

export function useCreerCategoriePoste() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (dto: Partial<CategoriePoste>) => { const res = await apiClient.post<CategoriePoste>('/api/organisation/categories-poste', dto); return res.data!; },
        onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.all }); toast.success('Catégorie créée'); },
        onError: (e: any) => handleError(e, 'Erreur création catégorie'),
    });
}

export function useModifierCategoriePoste() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...data }: { id: string } & Partial<CategoriePoste>) => { const res = await apiClient.patch<CategoriePoste>(`/api/organisation/categories-poste/${id}`, data); return res.data!; },
        onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.all }); toast.success('Catégorie modifiée'); },
        onError: (e: any) => handleError(e, 'Erreur modification catégorie'),
    });
}

export function useSupprimerCategoriePoste() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => { await apiClient.delete(`/api/organisation/categories-poste/${id}`); },
        onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.all }); toast.success('Catégorie supprimée'); },
        onError: (e: any) => handleError(e, 'Erreur suppression catégorie'),
    });
}
