/**
 * ==================================
 * eLISAschool - Hook Responsables d'un Élève
 * ==================================
 * Récupère les responsables liés à un élève
 */

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';

export interface ResponsableEleve {
    id: string;
    utilisateurId: string;
    enfantId: string;
    lienParente: string;
    responsablePrincipal: boolean;
    utilisateur?: {
        id: string;
        nom: string;
        prenom: string;
        email: string;
        telephone?: string;
    };
}

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
        staleTime: 5 * 60 * 1000, // 5 min
        placeholderData: (previousData) => previousData,
    });
}
