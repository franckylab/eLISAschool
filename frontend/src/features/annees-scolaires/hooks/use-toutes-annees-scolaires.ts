/**
 * ==================================
 * eLISAschool - Hook Toutes Années Scolaires
 * ==================================
 * Récupère toutes les années scolaires pour les dropdowns
 */

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';
import type { AnneeScolaire } from '../types/annee-scolaire.types';

interface AnneeScolaireBackend {
    id: string;
    libelle: string;
    code: string;
    dateDebut: string;
    dateFin: string;
    enCours: boolean;
    statut: 'OUVERTE' | 'EN_COURS' | 'EN_ATTENTE_CLOTURE' | 'CLOTUREE';
    etablissementId: string;
    createdAt: string;
    updatedAt: string;
}

function mapperAnneeScolaire(raw: AnneeScolaireBackend): AnneeScolaire {
    let statutFrontend: AnneeScolaire['statut'];
    if (raw.statut === 'CLOTUREE') {
        statutFrontend = 'archivee';
    } else if (raw.enCours || raw.statut === 'EN_COURS') {
        statutFrontend = 'active';
    } else if (raw.statut === 'EN_ATTENTE_CLOTURE') {
        statutFrontend = 'inactive';
    } else {
        const debut = new Date(raw.dateDebut);
        statutFrontend = debut > new Date() ? 'future' : 'active';
    }
    return { ...raw, estActuelle: raw.enCours, statut: statutFrontend };
}

const ANNEES_SCOLAIRES_KEYS = {
    all: ['annees-scolaires'] as const,
    toutes: (etablissementId: string) => [...ANNEES_SCOLAIRES_KEYS.all, 'toutes', etablissementId] as const,
};

export function useToutesAnneesScolaires() {
    const { isAuthenticated, etablissementId } = useAuthStore();
    return useQuery({
        queryKey: ANNEES_SCOLAIRES_KEYS.toutes(etablissementId || ''),
        queryFn: async () => {
            const params = { limit: 100, page: 1 };
            const response = await apiClient.get<AnneeScolaireBackend[]>('/api/annees-scolaires', params);
            const items = response.data || [];
            return items.map(mapperAnneeScolaire);
        },
        enabled: isAuthenticated && !!etablissementId,
        staleTime: 15 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}
