/**
 * ==================================
 * eLISAschool - Hooks Unités Organisationnelles
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * Hooks TanStack Query pour les unités : CRUD, arborescence, impact, réordonnancement.
 * Invalidation cache croisée : unites, organigramme, stats.
 */

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { useHandleError } from './use-handle-error';
import type {
    UniteOrganisationnelle, CreerUniteDto, ModifierUniteDto, UniteFiltres,
} from '../types/organisation.types';

const ORGA_KEYS = {
    unites: {
        all: ['organisation', 'unites'] as const,
        liste: (filtres: UniteFiltres) => [...ORGA_KEYS.unites.all, filtres] as const,
        detail: (id: string) => [...ORGA_KEYS.unites.all, 'detail', id] as const,
        arborescence: ['organisation', 'unites', 'arborescence'] as const,
        chemin: (uniteId: string) => [...ORGA_KEYS.unites.all, 'chemin', uniteId] as const,
    },
    organigramme: {
        all: ['organisation', 'organigramme'] as const,
    },
    stats: {
        all: ['organisation', 'statistiques'] as const,
    },
};

// ─── UNITÉS ORGANISATIONNELLES ───

export function useUnites(filtres: UniteFiltres = {}) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ORGA_KEYS.unites.liste(filtres),
        queryFn: async () => {
            const response = await apiClient.get<UniteOrganisationnelle[]>('/api/organisation/unites', filtres as unknown as Record<string, string | number | boolean | undefined>);
            return response.data || [];
        },
        enabled: isAuthenticated,
        staleTime: 30_000,
    });
}

export function useUnite(id: string) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ORGA_KEYS.unites.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<UniteOrganisationnelle>(`/api/organisation/unites/${id}`);
            return response.data;
        },
        enabled: !!id && isAuthenticated,
    });
}

export function useCreerUnite() {
    const qc = useQueryClient();
    const handleError = useHandleError();
    return useMutation({
        mutationFn: async (dto: CreerUniteDto) => {
            const response = await apiClient.post<UniteOrganisationnelle>('/api/organisation/unites', dto);
            return response.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ORGA_KEYS.unites.all });
            qc.invalidateQueries({ queryKey: ORGA_KEYS.organigramme.all });
            qc.invalidateQueries({ queryKey: ORGA_KEYS.stats.all });
            toast.success('Unité créée');
        },
        onError: (e: unknown) => handleError(e, 'Erreur création unité'),
    });
}

export function useModifierUnite() {
    const qc = useQueryClient();
    const handleError = useHandleError();
    return useMutation({
        mutationFn: async ({ id, ...dto }: { id: string } & ModifierUniteDto) => {
            const response = await apiClient.patch<UniteOrganisationnelle>(`/api/organisation/unites/${id}`, dto);
            return response.data;
        },
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: ORGA_KEYS.unites.all });
            qc.invalidateQueries({ queryKey: ORGA_KEYS.unites.detail(vars.id) });
            qc.invalidateQueries({ queryKey: ORGA_KEYS.organigramme.all });
            qc.invalidateQueries({ queryKey: ORGA_KEYS.stats.all });
            toast.success('Unité modifiée');
        },
        onError: (e: unknown) => handleError(e, 'Erreur modification unité'),
    });
}

export function useSupprimerUnite() {
    const qc = useQueryClient();
    const handleError = useHandleError();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/organisation/unites/${id}`);
            return id;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ORGA_KEYS.unites.all });
            qc.invalidateQueries({ queryKey: ORGA_KEYS.organigramme.all });
            qc.invalidateQueries({ queryKey: ORGA_KEYS.stats.all });
            toast.success('Unité supprimée');
        },
        onError: (e: unknown) => handleError(e, 'Erreur suppression unité'),
    });
}

export function useArborescence() {
    const { isAuthenticated, etablissementId } = useAuthStore();
    return useQuery({
        queryKey: ORGA_KEYS.unites.arborescence,
        queryFn: async () => {
            const response = await apiClient.get<UniteOrganisationnelle[]>('/api/organisation/arborescence');
            return response.data || [];
        },
        enabled: !!etablissementId && isAuthenticated,
        staleTime: 30_000,
    });
}

/** Récupérer l'impact de suppression d'une unité */
export function useGetImpactUnite() {
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await apiClient.get<{
                enfants: number;
                descendants: number;
                postes: number;
                postesOccupes: number;
                membresDirect: number;
                membresTotal: number;
                hierarchies: number;
            }>(`/api/organisation/unites/${id}/impact`);
            return response.data;
        },
    });
}

/** Créer une unité avec ses postes en une seule transaction */
export function useCreerUniteAvecPostes() {
    const qc = useQueryClient();
    const handleError = useHandleError();
    return useMutation({
        mutationFn: async (data: CreerUniteDto & { postes?: Array<{ intitule: string; code?: string; description?: string; estSuppleant?: boolean }> }) => {
            const response = await apiClient.post<UniteOrganisationnelle>('/api/organisation/unites/avec-postes', data);
            return response.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ORGA_KEYS.unites.all });
            qc.invalidateQueries({ queryKey: ORGA_KEYS.organigramme.all });
            qc.invalidateQueries({ queryKey: ORGA_KEYS.stats.all });
            toast.success('Unité créée avec ses postes');
        },
        onError: (e: unknown) => handleError(e, 'Erreur création unité'),
    });
}

/** Réordonner une unité après une autre (même parent) */
export function useReordonnerUnite() {
    const qc = useQueryClient();
    const handleError = useHandleError();
    return useMutation({
        mutationFn: async ({ uniteId, apresId }: { uniteId: string; apresId: string | null }) => {
            await apiClient.patch(`/api/organisation/unites/${uniteId}/reordonner`, { apresId });
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ORGA_KEYS.organigramme.all });
            qc.invalidateQueries({ queryKey: ORGA_KEYS.unites.all });
            qc.invalidateQueries({ queryKey: ORGA_KEYS.stats.all });
            toast.success('Ordre mis à jour');
        },
        onError: (e: unknown) => handleError(e, 'Erreur réordonnancement'),
    });
}
