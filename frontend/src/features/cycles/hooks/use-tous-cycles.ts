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
            const response = await apiClient.get<Cycle[]>('/api/cycles/all');
            return (response as any).data || [];
        },
        enabled: isAuthenticated,
        staleTime: 10 * 60 * 1000,
    });
}
