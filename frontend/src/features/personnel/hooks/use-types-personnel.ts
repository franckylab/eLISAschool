/**
 * ==================================
 * eLISAschool - Hooks Types Personnel
 * ==================================
 * Hooks TanStack Query pour la gestion des types de personnel.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useMemo } from 'react';
import type { TypePersonnel } from '../types/personnel.types';
import type { ApiResponse } from '@shared/types/api.types';

const TYPES_KEY = ['types-personnel'] as const;

export function useTypesPersonnel() {
    return useQuery<TypePersonnel[]>({
        queryKey: TYPES_KEY,
        queryFn: async () => {
            const res = await apiClient.get<TypePersonnel[]>('/api/personnel/types');
            return res.data || [];
        },
        staleTime: 5 * 60 * 1000,
    });
}

export function useTypePersonnelOptions() {
    const { data } = useTypesPersonnel();
    return useMemo(() =>
        (data || []).map((tp: TypePersonnel) => ({
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
        mutationFn: async (dto: Omit<TypePersonnel, 'id' | 'createdAt' | 'updatedAt'>) => {
            const res = await apiClient.post<TypePersonnel>('/api/personnel/types', dto);
            return res.data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: TYPES_KEY }),
    });
}

export function useModifierTypePersonnel() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...dto }: { id: string } & Partial<TypePersonnel>) => {
            const res = await apiClient.patch<TypePersonnel>(`/api/personnel/types/${id}`, dto);
            return res.data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: TYPES_KEY }),
    });
}

export function useSupprimerTypePersonnel() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const res = await apiClient.delete<void>(`/api/personnel/types/${id}`);
            return res.data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: TYPES_KEY }),
    });
}
