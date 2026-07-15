/**
 * ==================================
 * eLISAschool - Hooks Parking
 * ==================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import type { PlaceParking, Vehicule, AbonnementParking, StatistiquesParking, FiltresParking, CreerAbonnementDto } from '../types/parking.types';

const PARKING_KEYS = {
    places: (filtres?: FiltresParking) => ['parking', 'places', filtres] as const,
    vehicules: () => ['parking', 'vehicules'] as const,
    abonnements: () => ['parking', 'abonnements'] as const,
    stats: () => ['parking', 'stats'] as const,
};

export function usePlaces(filtres?: FiltresParking) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: PARKING_KEYS.places(filtres),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: PlaceParking[] }>('/api/parking/places', { params: filtres as any });
            return response.data?.data;
        },
        enabled: isAuthenticated,
        staleTime: 3 * 60 * 1000,
    });
}

export function useVehicules() {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: PARKING_KEYS.vehicules(),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: Vehicule[] }>('/api/parking/vehicules');
            return response.data?.data;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

export function useAbonnements() {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: PARKING_KEYS.abonnements(),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: AbonnementParking[] }>('/api/parking/abonnements');
            return response.data?.data;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

export function useCreerAbonnement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerAbonnementDto) => {
            const response = await apiClient.post<{ success: boolean; data: AbonnementParking }>('/api/parking/abonnements', dto);
            return response.data?.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PARKING_KEYS.abonnements() });
            queryClient.invalidateQueries({ queryKey: PARKING_KEYS.stats() });
            toast.success('Abonnement créé avec succès');
        },
    });
}

export function useStatistiquesParking() {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: PARKING_KEYS.stats(),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: StatistiquesParking }>('/api/parking/statistiques');
            return response.data?.data;
        },
        enabled: isAuthenticated,
        staleTime: 10 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}
