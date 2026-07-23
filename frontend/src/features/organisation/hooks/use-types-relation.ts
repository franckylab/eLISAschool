import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';

export interface TypeRelationHierarchique {
    id: string;
    code: string;
    label: string;
    description?: string;
    estSysteme?: boolean;
}

const KEYS = { all: ['organisation', 'types-relation'] as const };

function handleError(e: unknown, msg: string) {
    const err = e as { response?: { data?: { error?: { message?: string } } } };
    toast.error(err?.response?.data?.error?.message || msg);
}

export function useTypesRelation() {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: KEYS.all,
        queryFn: async () => {
            const res = await apiClient.get<TypeRelationHierarchique[]>('/api/organisation/types-relation');
            return res.data || [];
        },
        enabled: isAuthenticated,
    });
}

export function useCreerTypeRelation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (dto: Partial<TypeRelationHierarchique>) => {
            const res = await apiClient.post<TypeRelationHierarchique>('/api/organisation/types-relation', dto);
            return res.data!;
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.all }); toast.success('Type de relation créé'); },
        onError: (e: unknown) => handleError(e, 'Erreur création type de relation'),
    });
}

export function useModifierTypeRelation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...data }: { id: string } & Partial<TypeRelationHierarchique>) => {
            const res = await apiClient.patch<TypeRelationHierarchique>(`/api/organisation/types-relation/${id}`, data);
            return res.data!;
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.all }); toast.success('Type de relation modifié'); },
        onError: (e: unknown) => handleError(e, 'Erreur modification type de relation'),
    });
}

export function useSupprimerTypeRelation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => { await apiClient.delete(`/api/organisation/types-relation/${id}`); },
        onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.all }); toast.success('Type de relation supprimé'); },
        onError: (e: unknown) => handleError(e, 'Erreur suppression type de relation'),
    });
}
