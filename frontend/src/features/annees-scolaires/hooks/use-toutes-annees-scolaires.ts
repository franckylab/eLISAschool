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

export function useToutesAnneesScolaires(_etablissementId?: string) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ANNEES_SCOLAIRES_KEYS.toutes(),
        queryFn: async () => {
            const params = { limit: 100, page: 1 };
            const response = await apiClient.get<AnneeScolaire[]>('/api/annees-scolaires', params);
            return response.data || [];
        },
        enabled: isAuthenticated,
        staleTime: 15 * 60 * 1000, // 15 min
    });
}
