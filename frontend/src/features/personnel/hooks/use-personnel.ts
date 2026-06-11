/**
 * ==================================
 * eLISAschool - Hook Personnel
 * ==================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';
import type { MembrePersonnel, CreerPersonnelDto, ModifierPersonnelDto, PersonnelFiltres } from '../types/personnel.types';
import { toast } from 'sonner';

const PERSONNEL_KEYS = {
    all: ['personnel'] as const,
    listes: () => [...PERSONNEL_KEYS.all, 'liste'] as const,
    liste: (filtres: PersonnelFiltres) => [...PERSONNEL_KEYS.listes(), filtres] as const,
    details: () => [...PERSONNEL_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...PERSONNEL_KEYS.details(), id] as const,
    stats: () => [...PERSONNEL_KEYS.all, 'stats'] as const,
};

export function usePersonnel(filtres: PersonnelFiltres = {}) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: PERSONNEL_KEYS.liste(filtres),
        queryFn: async () => {
            const response = await apiClient.getPaginated<MembrePersonnel>('/api/personnel', {
                page: filtres.page || 1,
                limit: filtres.limit || 20,
                ...filtres,
            });
            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

export function useMembrePersonnel(id: string) {
    return useQuery({
        queryKey: PERSONNEL_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<{ data: MembrePersonnel }>(`/api/personnel/${id}`);
            return response.data;
        },
        enabled: !!id,
    });
}

export function useCreerPersonnel() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (dto: CreerPersonnelDto) => {
            const response = await apiClient.post<{ data: MembrePersonnel }>('/api/personnel', dto);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: PERSONNEL_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: PERSONNEL_KEYS.stats() });
            toast.success(`${data.prenom} ${data.nom} ajouté(e) au personnel`);
        },
        onError: (error: any) => toast.error(error?.message || 'Erreur lors de la création'),
    });
}

export function useModifierPersonnel() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (dto: ModifierPersonnelDto) => {
            const { id, ...data } = dto;
            const response = await apiClient.patch<{ data: MembrePersonnel }>(`/api/personnel/${id}`, data);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: PERSONNEL_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: PERSONNEL_KEYS.detail(data.id) });
            toast.success(`${data.prenom} ${data.nom} modifié(e) avec succès`);
        },
        onError: (error: any) => toast.error(error?.message || 'Erreur lors de la modification'),
    });
}

export function useSupprimerPersonnel() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/personnel/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PERSONNEL_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: PERSONNEL_KEYS.stats() });
            toast.success('Membre du personnel supprimé');
        },
        onError: (error: any) => toast.error(error?.message || 'Erreur lors de la suppression'),
    });
}
