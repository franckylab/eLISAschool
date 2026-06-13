/**
 * ==================================
 * eLISAschool - Hooks Cantine
 * ==================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import type { InscriptionCantine, MenuCantine, CreerInscriptionCantineDto, CreerMenuDto, InscriptionCantineFiltres, MenuFiltres } from '../types/cantine.types';

const CANTINE_KEYS = {
    inscriptions: {
        all: ['cantine', 'inscriptions'] as const,
        liste: (filtres: InscriptionCantineFiltres) => [...CANTINE_KEYS.inscriptions.all, filtres] as const,
    },
    menus: {
        all: ['cantine', 'menus'] as const,
        liste: (filtres: MenuFiltres) => [...CANTINE_KEYS.menus.all, filtres] as const,
    },
};

export function useInscriptionsCantine(filtres: InscriptionCantineFiltres = {}) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: CANTINE_KEYS.inscriptions.liste(filtres),
        queryFn: async () => {
            const response = await apiClient.getPaginated<InscriptionCantine>('/api/cantine/inscriptions', {
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

export function useMenusCantine(filtres: MenuFiltres = {}) {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: CANTINE_KEYS.menus.liste(filtres),
        queryFn: async () => {
            const response = await apiClient.getPaginated<MenuCantine>('/api/cantine/menus', {
                page: filtres.page || 1,
                limit: filtres.limit || 20,
                ...filtres,
            });
            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 10 * 60 * 1000,
    });
}

export function useCreerInscriptionCantine() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerInscriptionCantineDto) => {
            const response = await apiClient.post<any>('/api/cantine/inscriptions', dto);
            return response.data?.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CANTINE_KEYS.inscriptions.all });
            toast.success('Inscription cantine créée avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de l\'inscription');
        },
    });
}

export function useCreerMenu() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerMenuDto) => {
            const response = await apiClient.post<any>('/api/cantine/menus', dto);
            return response.data?.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CANTINE_KEYS.menus.all });
            toast.success('Menu créé avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la création du menu');
        },
    });
}

export function useSupprimerInscriptionCantine() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/cantine/inscriptions/${id}`);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CANTINE_KEYS.inscriptions.all });
            toast.success('Inscription supprimée avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la suppression');
        },
    });
}
