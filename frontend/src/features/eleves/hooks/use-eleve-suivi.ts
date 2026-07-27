/**
 * ==================================
 * eLISAschool - Hook Suivi d'un Élève
 * ==================================
 */

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';
import type { IncidentEleve } from '../types/eleve.types';

const SUIVI_KEYS = {
    all: ['suivi-eleves'] as const,
    byEleve: (eleveId: string) => [...SUIVI_KEYS.all, 'eleve', eleveId] as const,
};

export function useEleveSuivi(eleveId: string) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: SUIVI_KEYS.byEleve(eleveId),
        queryFn: async () => {
            const response = await apiClient.get<{ data: IncidentEleve[] }>(
                `/api/suivi-eleves`,
                { eleveId }
            );
            return response.data;
        },
        enabled: !!eleveId && isAuthenticated,
        staleTime: 5 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}
