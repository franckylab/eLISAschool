/**
 * ==================================
 * eLISAschool - Hook Toutes Classes
 * ==================================
 * Récupère toutes les classes pour les dropdowns (sans pagination)
 */

import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';
import type { Classe } from '../types/classe.types';

const CLASSES_KEYS = {
    all: ['classes'] as const,
    toutes: () => [...CLASSES_KEYS.all, 'toutes'] as const,
};

export function useToutesClasses(_etablissementId?: string) {
    const { isAuthenticated } = useAuthStore();
    const { t } = useTranslation('classes');
    return useQuery({
        queryKey: CLASSES_KEYS.toutes(),
        queryFn: async () => {
            const response = await apiClient.get<Classe[]>('/api/classes/all');
            
            if (!response.data) {
                throw new Error(t('hooks.aucuneClasse'));
            }
            
            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 15 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}
