import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import type { NiveauOrganisation } from '../types/organisation.types';

const KEYS = {
    all: ['organisation', 'niveaux-organisation'] as const,
};

function handleError(e: unknown, msg: string) {
    const err = e as { response?: { data?: { error?: { message?: string } } } };
    toast.error(err?.response?.data?.error?.message || msg);
}

export function useNiveauxOrganisation() {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: KEYS.all,
        queryFn: async () => {
            const res = await apiClient.get<NiveauOrganisation[]>('/api/organisation/niveaux-organisation');
            return res.data || [];
        },
        enabled: isAuthenticated,
    });
}

export function useCreerNiveauOrganisation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (dto: Partial<NiveauOrganisation>) => {
            const res = await apiClient.post<NiveauOrganisation>('/api/organisation/niveaux-organisation', dto);
            return res.data!;
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.all }); toast.success('Niveau créé'); },
        onError: (e: unknown) => handleError(e, 'Erreur création niveau'),
    });
}

export function useModifierNiveauOrganisation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...data }: { id: string } & Partial<NiveauOrganisation>) => {
            const res = await apiClient.patch<NiveauOrganisation>(`/api/organisation/niveaux-organisation/${id}`, data);
            return res.data!;
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.all }); toast.success('Niveau modifié'); },
        onError: (e: unknown) => handleError(e, 'Erreur modification niveau'),
    });
}

export function useSupprimerNiveauOrganisation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => { await apiClient.delete(`/api/organisation/niveaux-organisation/${id}`); },
        onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.all }); toast.success('Niveau supprimé'); },
        onError: (e: unknown) => handleError(e, 'Erreur suppression niveau'),
    });
}
