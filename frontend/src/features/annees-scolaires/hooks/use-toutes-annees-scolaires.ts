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
    toutes: (etablissementId: string) => [...ANNEES_SCOLAIRES_KEYS.all, 'toutes', etablissementId] as const,
};

export function useToutesAnneesScolaires() {
    const { isAuthenticated, etablissementId } = useAuthStore();
    return useQuery({
        queryKey: ANNEES_SCOLAIRES_KEYS.toutes(etablissementId || ''),
        queryFn: async () => {
            const params = { limit: 100, page: 1 };
            const response = await apiClient.get<AnneeScolaire[]>('/api/annees-scolaires', params);
            // Réponse paginée serveur (items + meta) ou tableau brut (rétrocompatibilité)
            const data = response.data as any;
            if (data && Array.isArray(data.items)) {
                return data.items as AnneeScolaire[];
            }
            return (data as AnneeScolaire[]) || [];
        },
        enabled: isAuthenticated && !!etablissementId,
        staleTime: 15 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}
