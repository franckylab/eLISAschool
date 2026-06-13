/**
 * ==================================
 * eLISAschool - Hook Toutes Classes
 * ==================================
 * Récupère toutes les classes pour les dropdowns (sans pagination)
 */

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';
import type { Classe } from '../types/classe.types';

const CLASSES_KEYS = {
    all: ['classes'] as const,
    toutes: () => [...CLASSES_KEYS.all, 'toutes'] as const,
};

export function useToutesClasses(etablissementId?: string) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: CLASSES_KEYS.toutes(),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: Classe[] }>('/api/classes/all');
            return response.data?.data || [];
        },
        enabled: isAuthenticated,
        staleTime: 15 * 60 * 1000, // 15 min
    });
}
