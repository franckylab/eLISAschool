/**
 * ==================================
 * eLISAschool - Hook Tous Cycles (sans pagination)
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';
import type { Cycle } from '../types/cycle.types';

export function useTousCycles() {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ['cycles', 'tous'],
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: Cycle[] }>('/api/cycles', {
                params: { limit: 100, page: 1 },
            });
            return response.data?.data || [];
        },
        enabled: isAuthenticated,
        staleTime: 10 * 60 * 1000,
    });
}
