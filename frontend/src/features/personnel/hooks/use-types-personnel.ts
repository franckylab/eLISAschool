import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useMemo } from 'react';

const TYPES_KEY = ['types-personnel'] as const;

export function useTypesPersonnel() {
    return useQuery({
        queryKey: TYPES_KEY,
        queryFn: async () => {
            const res = await apiClient.get('/api/personnel/types');
            return (res as any).data || [];
        },
        staleTime: 5 * 60 * 1000,
    });
}

export function useTypePersonnelOptions() {
    const { data } = useTypesPersonnel();
    return useMemo(() =>
        (data || []).map((tp: any) => ({
            value: tp.id,
            label: `${tp.nom} (${tp.code})`,
            code: tp.code,
            estSysteme: tp.estSysteme,
            actif: tp.actif,
        })),
        [data],
    );
}

export function useCreerTypePersonnel() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (dto: any) => {
            const res = await apiClient.post('/api/personnel/types', dto);
            return (res as any).data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: TYPES_KEY }),
    });
}

export function useModifierTypePersonnel() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...dto }: any) => {
            const res = await apiClient.patch(`/api/personnel/types/${id}`, dto);
            return (res as any).data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: TYPES_KEY }),
    });
}

export function useSupprimerTypePersonnel() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const res = await apiClient.delete(`/api/personnel/types/${id}`);
            return (res as any).data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: TYPES_KEY }),
    });
}
