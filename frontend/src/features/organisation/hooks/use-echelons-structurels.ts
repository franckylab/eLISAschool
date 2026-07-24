import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { useHandleError } from './use-handle-error';
import type { EchelonStructurel } from '../types/organisation.types';

const KEYS = {
    all: ['organisation', 'echelons-structurels'] as const,
};

export function useEchelonsStructurels() {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: KEYS.all,
        queryFn: async () => {
            const res = await apiClient.get<EchelonStructurel[]>('/api/organisation/echelons-structurels');
            return res.data || [];
        },
        enabled: isAuthenticated,
    });
}

export function useCreerEchelonStructurel() {
    const qc = useQueryClient();
    const handleError = useHandleError();
    return useMutation({
        mutationFn: async (dto: Partial<EchelonStructurel>) => {
            const res = await apiClient.post<EchelonStructurel>('/api/organisation/echelons-structurels', dto);
            return res.data!;
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.all }); toast.success('Échelon créé'); },
        onError: (e: unknown) => handleError(e, 'Erreur création échelon'),
    });
}

export function useModifierEchelonStructurel() {
    const qc = useQueryClient();
    const handleError = useHandleError();
    return useMutation({
        mutationFn: async ({ id, ...data }: { id: string } & Partial<EchelonStructurel>) => {
            const res = await apiClient.patch<EchelonStructurel>(`/api/organisation/echelons-structurels/${id}`, data);
            return res.data!;
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.all }); toast.success('Échelon modifié'); },
        onError: (e: unknown) => handleError(e, 'Erreur modification échelon'),
    });
}

export function useSupprimerEchelonStructurel() {
    const qc = useQueryClient();
    const handleError = useHandleError();
    return useMutation({
        mutationFn: async (id: string) => { await apiClient.delete(`/api/organisation/echelons-structurels/${id}`); },
        onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.all }); toast.success('Échelon supprimé'); },
        onError: (e: unknown) => handleError(e, 'Erreur suppression échelon'),
    });
}
