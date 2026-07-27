/**
 * ==================================
 * eLISAschool - Hook Responsables d'un Élève
 * ==================================
 */

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';
import type { ResponsableEleve } from '../types/eleve.types';

const RESPONSABLES_KEYS = {
    all: ['responsables'] as const,
    byEleve: (eleveId: string) => [...RESPONSABLES_KEYS.all, 'eleve', eleveId] as const,
};

export function useEleveResponsables(eleveId: string) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: RESPONSABLES_KEYS.byEleve(eleveId),
        queryFn: async () => {
            const response = await apiClient.get<{ data: ResponsableEleve[] }>(
                `/api/responsables-eleves`,
                { enfantId: eleveId }
            );
            return response.data;
        },
        enabled: !!eleveId && isAuthenticated,
        staleTime: 5 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}
