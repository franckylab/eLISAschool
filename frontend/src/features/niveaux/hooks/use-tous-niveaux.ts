/**
 * ==================================
 * eLISAschool - Hook Tous Niveaux (sans pagination)
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';
import type { Niveau } from '../types/niveau.types';

export function useTousNiveaux() {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ['niveaux', 'tous'],
        queryFn: async () => {
            const response = await apiClient.get<Niveau[]>('/api/niveaux/all');
            return (response as any).data || [];
        },
        enabled: isAuthenticated,
        staleTime: 10 * 60 * 1000,
    });
}
