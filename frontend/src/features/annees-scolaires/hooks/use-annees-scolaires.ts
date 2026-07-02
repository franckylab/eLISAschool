/**
 * ==================================
 * eLISAschool - Hook Années Scolaires
 * ==================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';
import type { AnneeScolaire, CreerAnneeScolaireDto, ModifierAnneeScolaireDto, AnneeScolaireFiltres } from '../types/annee-scolaire.types';
import type { NiveauPeriode } from '@/features/periodes/types/periode.types';
import type { PaginatedResult } from '@shared/types/api.types';
import { toast } from 'sonner';

/**
 * Mapping de l'entité backend vers le type frontend.
 * Backend: enCours, cloturee, statut (OUVERTE|EN_COURS|EN_ATTENTE_CLOTURE|CLOTUREE)
 * Frontend: estActuelle, statut (active|inactive|future|archivee)
 */
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
    periodes?: Array<{
        id: string;
        nom: string;
        niveauId: string;
        niveau?: NiveauPeriode;
        dateDebut: string;
        dateFin: string;
        statut: 'OUVERTE' | 'EN_ATTENTE_CLOTURE' | 'CLOTUREE';
    }>;
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
        // OUVERTE → vérifier si dateDebut dans le futur
        const debut = new Date(raw.dateDebut);
        statutFrontend = debut > new Date() ? 'future' : 'active';
    }
    return {
        ...raw,
        estActuelle: raw.enCours,
        statut: statutFrontend,
    };
}

const ANNEES_KEYS = {
    all: ['annees-scolaires'] as const,
    listes: () => [...ANNEES_KEYS.all, 'liste'] as const,
    liste: (filtres: AnneeScolaireFiltres, etablissementId: string) => [...ANNEES_KEYS.listes(), etablissementId, filtres] as const,
    details: () => [...ANNEES_KEYS.all, 'detail'] as const,
    detail: (id: string, etablissementId: string) => [...ANNEES_KEYS.details(), etablissementId, id] as const,
    actives: () => [...ANNEES_KEYS.all, 'active'] as const,
    active: (etablissementId: string) => [...ANNEES_KEYS.actives(), etablissementId] as const,
};

export function useAnneesScolaires(filtres: AnneeScolaireFiltres = {}) {
    const { isAuthenticated, etablissementId } = useAuthStore();
    return useQuery({
        queryKey: ANNEES_KEYS.liste(filtres, etablissementId || ''),
        queryFn: async () => {
            // Le backend GET /api/annees-scolaires retourne un tableau simple (AnneeScolaire[])
            // et non un PaginatedResult. On adapte la réponse pour le DataTable.
            const response = await apiClient.get<AnneeScolaireBackend[]>('/api/annees-scolaires', {
                page: filtres.page || 1,
                limit: filtres.limit || 20,
                sortBy: filtres.sortBy,
                sortOrder: filtres.sortOrder,
            });

            const rawItems = response.data || [];
            // Mapper les entités backend vers le format frontend
            const items = rawItems.map(mapperAnneeScolaire);
            const page = filtres.page || 1;
            const limit = filtres.limit || 20;

            // Construire un PaginatedResult compatible avec le DataTable
            const paginatedResult: PaginatedResult<AnneeScolaire> = {
                items,
                meta: {
                    totalItems: items.length,
                    itemCount: items.length,
                    itemsPerPage: limit,
                    totalPages: Math.ceil(items.length / limit) || 1,
                    currentPage: page,
                },
            };
            return paginatedResult;
        },
        enabled: isAuthenticated && !!etablissementId,
        staleTime: 15 * 60 * 1000,
    });
}

export function useAnneeScolaire(id: string) {
    const { etablissementId } = useAuthStore();
    return useQuery({
        queryKey: ANNEES_KEYS.detail(id, etablissementId || ''),
        queryFn: async () => {
            const response = await apiClient.get<AnneeScolaireBackend>(`/api/annees-scolaires/${id}`);
            return response.data ? mapperAnneeScolaire(response.data) : undefined;
        },
        enabled: !!id && !!etablissementId,
    });
}

export function useAnneeScolaireActive() {
    const { isAuthenticated, etablissementId } = useAuthStore();
    
    return useQuery({
        queryKey: ANNEES_KEYS.active(etablissementId || ''),
        queryFn: async () => {
            const response = await apiClient.get<AnneeScolaireBackend>('/api/annees-scolaires/active');
            return response.data ? mapperAnneeScolaire(response.data) : undefined;
        },
        enabled: isAuthenticated && !!etablissementId,
        staleTime: 30 * 60 * 1000,
    });
}

export function useCreerAnneeScolaire() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (dto: CreerAnneeScolaireDto) => {
            const response = await apiClient.post<AnneeScolaireBackend>('/api/annees-scolaires', dto);
            return response.data ? mapperAnneeScolaire(response.data) : undefined;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ANNEES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: ANNEES_KEYS.actives() });
            toast.success('Année scolaire créée avec succès');
        },
        onError: (error: Error) => toast.error(error?.message || 'Erreur lors de la création'),
    });
}

export function useModifierAnneeScolaire() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (dto: ModifierAnneeScolaireDto) => {
            const { id, ...data } = dto;
            const response = await apiClient.patch<AnneeScolaireBackend>(`/api/annees-scolaires/${id}`, data);
            return response.data ? mapperAnneeScolaire(response.data) : undefined;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ANNEES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: ANNEES_KEYS.actives() });
            toast.success('Année scolaire modifiée avec succès');
        },
        onError: (error: Error) => toast.error(error?.message || 'Erreur lors de la modification'),
    });
}

export function useActiverAnneeScolaire() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await apiClient.post<AnneeScolaireBackend>(`/api/annees-scolaires/${id}/activer`, {});
            return response.data ? mapperAnneeScolaire(response.data) : undefined;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ANNEES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: ANNEES_KEYS.actives() });
            toast.success('Année scolaire activée');
        },
        onError: (error: Error) => toast.error(error?.message || 'Erreur lors de l\'activation'),
    });
}

export function useCloturerAnneeScolaire() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await apiClient.post<AnneeScolaireBackend>(`/api/annees-scolaires/${id}/cloturer`, {});
            return response.data ? mapperAnneeScolaire(response.data) : undefined;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ANNEES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: ANNEES_KEYS.actives() });
            toast.success('Année scolaire clôturée avec succès');
        },
        onError: (error: Error) => toast.error(error?.message || 'Erreur lors de la clôture'),
    });
}

export function useReouvrirAnneeScolaire() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await apiClient.post<AnneeScolaireBackend>(`/api/annees-scolaires/${id}/reouvrir`, {});
            return response.data ? mapperAnneeScolaire(response.data) : undefined;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ANNEES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: ANNEES_KEYS.actives() });
            toast.success('Année scolaire réouverte avec succès');
        },
        onError: (error: Error) => toast.error(error?.message || 'Erreur lors de la réouverture'),
    });
}

export function useSupprimerAnneeScolaire() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/annees-scolaires/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ANNEES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: ANNEES_KEYS.actives() });
            toast.success('Année scolaire supprimée avec succès');
        },
        onError: (error: Error) => toast.error(error?.message || 'Erreur lors de la suppression'),
    });
}
