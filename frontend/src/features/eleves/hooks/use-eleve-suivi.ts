/**
 * ==================================
 * eLISAschool - Hook Suivi d'un Élève
 * ==================================
 * Récupère le suivi disciplinaire d'un élève (incidents, sanctions, félicitations)
 */

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';

export interface IncidentEleve {
    id: string;
    eleveId: string;
    date: string;
    type: 'INCIDENT' | 'SANCTION' | 'FELICITATION' | 'OBSERVATION';
    description: string;
    gravite?: 'LEGER' | 'MOYEN' | 'GRAVE';
    sanction?: string;
    auteurId: string;
    auteur?: {
        nom: string;
        prenom: string;
    };
    createdAt: string;
}

const SUIVI_KEYS = {
    all: ['suivi-eleves'] as const,
    byEleve: (eleveId: string) => [...SUIVI_KEYS.all, 'eleve', eleveId] as const,
};

export function useEleveSuivi(eleveId: string) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: SUIVI_KEYS.byEleve(eleveId),
        queryFn: async () => {
            const response = await apiClient.get<{ data: IncidentEleve[] }>(
                `/api/suivi-eleves`,
                { eleveId }
            );
            return response.data;
        },
        enabled: !!eleveId && isAuthenticated,
        staleTime: 5 * 60 * 1000, // 5 min
    });
}
