import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import type { UsageUnite } from '../types/organisation.types';

const KEYS = { all: ['organisation', 'usages-unite'] as const };

function handleError(e: any, msg: string) {
    toast.error(e?.response?.data?.error?.message || msg);
}

export function useUsagesUnite() {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: KEYS.all,
        queryFn: async () => { const res = await apiClient.get<UsageUnite[]>('/api/organisation/usages-unite'); return res.data || []; },
        enabled: isAuthenticated,
    });
}

export function useCreerUsageUnite() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (dto: Partial<UsageUnite>) => { const res = await apiClient.post<UsageUnite>('/api/organisation/usages-unite', dto); return res.data!; },
        onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.all }); toast.success('Usage créé'); },
        onError: (e: any) => handleError(e, 'Erreur création usage'),
    });
}

export function useModifierUsageUnite() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...data }: { id: string } & Partial<UsageUnite>) => { const res = await apiClient.patch<UsageUnite>(`/api/organisation/usages-unite/${id}`, data); return res.data!; },
        onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.all }); toast.success('Usage modifié'); },
        onError: (e: any) => handleError(e, 'Erreur modification usage'),
    });
}

export function useSupprimerUsageUnite() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => { await apiClient.delete(`/api/organisation/usages-unite/${id}`); },
        onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.all }); toast.success('Usage supprimé'); },
        onError: (e: any) => handleError(e, 'Erreur suppression usage'),
    });
}
