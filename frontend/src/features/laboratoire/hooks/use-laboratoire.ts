/**
 * ==================================
 * eLISAschool - Hooks Laboratoire
 * ==================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import type { Laboratoire, ReservationLaboratoire, Experience, StatistiquesLaboratoire, FiltresLaboratoire, CreerReservationDto } from '../types/laboratoire.types';

const LABORATOIRE_KEYS = {
    laboratoires: () => ['laboratoire', 'liste'] as const,
    reservations: (filtres?: FiltresLaboratoire) => ['laboratoire', 'reservations', filtres] as const,
    experiences: () => ['laboratoire', 'experiences'] as const,
    stats: () => ['laboratoire', 'stats'] as const,
};

export function useLaboratoires() {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: LABORATOIRE_KEYS.laboratoires(),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: Laboratoire[] }>('/api/laboratoires');
            return response.data.data;
        },
        enabled: isAuthenticated,
        staleTime: 10 * 60 * 1000,
    });
}

export function useReservations(filtres?: FiltresLaboratoire) {
    return useQuery({
        queryKey: LABORATOIRE_KEYS.reservations(filtres),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: ReservationLaboratoire[]; meta: any }>('/api/laboratoires/reservations', { params: filtres });
            return { data: response.data.data, meta: response.data.meta };
        },
        enabled: isAuthenticated,
        staleTime: 3 * 60 * 1000,
    });
}

export function useExperiences() {
    return useQuery({
        queryKey: LABORATOIRE_KEYS.experiences(),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: Experience[] }>('/api/laboratoires/experiences');
            return response.data.data;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

export function useCreerReservation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerReservationDto) => {
            const response = await apiClient.post<{ success: boolean; data: ReservationLaboratoire }>('/api/laboratoires/reservations', dto);
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: LABORATOIRE_KEYS.reservations() });
            queryClient.invalidateQueries({ queryKey: LABORATOIRE_KEYS.stats() });
            toast.success('Réservation créée avec succès');
        },
    });
}

export function useConfirmerReservation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await apiClient.patch<{ success: boolean; data: ReservationLaboratoire }>(`/api/laboratoires/reservations/${id}/confirmer`);
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: LABORATOIRE_KEYS.reservations() });
            toast.success('Réservation confirmée');
        },
    });
}

export function useAnnulerReservation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await apiClient.patch<{ success: boolean; data: ReservationLaboratoire }>(`/api/laboratoires/reservations/${id}/annuler`);
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: LABORATOIRE_KEYS.reservations() });
            toast.success('Réservation annulée');
        },
    });
}

export function useStatistiquesLaboratoire() {
    return useQuery({
        queryKey: LABORATOIRE_KEYS.stats(),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: StatistiquesLaboratoire }>('/api/laboratoires/statistiques');
            return response.data.data;
        },
        enabled: isAuthenticated,
        staleTime: 10 * 60 * 1000,
    });
}
