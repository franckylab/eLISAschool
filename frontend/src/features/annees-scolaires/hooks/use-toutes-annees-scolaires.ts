/**
 * ==================================
 * eLISAschool - Hook Toutes Années Scolaires
 * ==================================
 * Récupère toutes les années scolaires pour les dropdowns
 */

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';
import type { AnneeScolaire } from '../types/annee-scolaire.types';

const ANNEES_SCOLAIRES_KEYS = {
    all: ['annees-scolaires'] as const,
    toutes: () => [...ANNEES_SCOLAIRES_KEYS.all, 'toutes'] as const,
};

export function useToutesAnneesScolaires(etablissementId?: string) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ANNEES_SCOLAIRES_KEYS.toutes(),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: AnneeScolaire[] }>('/api/annees-scolaires', {
                limit: 1000,
                page: 1,
            });
            // Extraire le tableau d'années scolaires depuis response.data
            return Array.isArray(response.data) ? response.data : (response.data?.data || []);
        },
        enabled: isAuthenticated,
        staleTime: 15 * 60 * 1000, // 15 min
    });
}
