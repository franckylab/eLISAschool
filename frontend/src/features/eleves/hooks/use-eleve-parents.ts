/**
 * ==================================
 * eLISAschool - Hook Parents d'un Élève (Module Parents)
 * ==================================
 */

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';
import type { Parent } from '@/features/parents/types/parent.types';

const PARENTS_KEYS = {
    all: ['parents'] as const,
    byEleve: (eleveId: string) => [...PARENTS_KEYS.all, 'eleve', eleveId] as const,
};

export function useEleveParents(eleveId: string) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: PARENTS_KEYS.byEleve(eleveId),
        queryFn: async () => {
            const response = await apiClient.get<{ data: Parent[] }>(
                `/api/parents`,
                { enfantId: eleveId }
            );
            return response.data;
        },
        enabled: !!eleveId && isAuthenticated,
        staleTime: 5 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}
