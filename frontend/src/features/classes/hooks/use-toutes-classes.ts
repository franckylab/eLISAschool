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
            // apiClient.get<T> retourne ApiResponse<T> = { success: boolean, data?: T }
            const response = await apiClient.get<Classe[]>('/api/classes/all');
            
            if (!response.data) {
                throw new Error('Aucune classe disponible');
            }
            
            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 15 * 60 * 1000, // 15 min
    });
}
