/**
 * ==================================
 * eLISAschool - Hooks TanStack Query — Platform Sessions
 * ==================================
 * Version: 1.0.0
 *
 * Hooks pour la gestion des sessions plateforme.
 * Modèle C — Auth0 Internalisé (Dual-Plane)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface PlatformSession {
    id: string;
    utilisateurPlateformeId: string;
    ip: string | null;
    userAgent: string | null;
    expiresAt: string;
    createdAt: string;
    utilisateurPlateforme?: {
        prenom: string;
        nom: string;
        rolePlateforme: string;
    };
}

export function usePlatformSessions() {
    return useQuery({
        queryKey: ['platform-sessions'],
        queryFn: async () => {
            const { data } = await apiClient.get('/api/platform/sessions');
            return data.data as PlatformSession[];
        },
        refetchInterval: 30000, // Refresh toutes les 30s
    });
}

export function useRevokeSession() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (sessionId: string) => {
            await apiClient.delete(`/api/platform/sessions/${sessionId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['platform-sessions'] });
        },
    });
}

export function useRevokeAllSessions() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            await apiClient.delete('/api/platform/sessions/all');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['platform-sessions'] });
        },
    });
}
