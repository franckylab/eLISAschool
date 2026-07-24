/**
 * ==================================
 * eLISAschool - Hooks Hiérarchie, Organigramme, Statistiques, Validation
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * Hooks TanStack Query pour hiérarchies CRUD, organigramme, statistiques et validation.
 * Invalidation cache croisée : hierarchie, organigramme, stats.
 */

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { useHandleError } from './use-handle-error';
import type {
    HierarchiePersonnel, CreerHierarchieDto, ModifierHierarchieDto,
    OrganigrammeNode, StatistiquesOrganisation, ValidationArborescence,
} from '../types/organisation.types';

const ORGA_KEYS = {
    hierarchie: {
        all: ['organisation', 'hierarchie'] as const,
        liste: (params?: { personnelId?: string }) => [...ORGA_KEYS.hierarchie.all, params] as const,
        superieurs: (personnelId: string) => [...ORGA_KEYS.hierarchie.all, 'superieurs', personnelId] as const,
        subordonnes: (superieurId: string) => [...ORGA_KEYS.hierarchie.all, 'subordonnes', superieurId] as const,
    },
    organigramme: {
        all: ['organisation', 'organigramme'] as const,
    },
    stats: {
        all: ['organisation', 'statistiques'] as const,
    },
    validation: {
        all: ['organisation', 'validation'] as const,
    },
};

// ─── HIÉRARCHIE ───

export function useHierarchies(params?: { personnelId?: string }) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ORGA_KEYS.hierarchie.liste(params),
        queryFn: async () => {
            const queryParams: Record<string, string> = {};
            if (params?.personnelId) queryParams.personnelId = params.personnelId;
            const response = await apiClient.get<HierarchiePersonnel[]>('/api/organisation/hierarchie', queryParams);
            return response.data || [];
        },
        enabled: isAuthenticated,
    });
}

export function useSuperieurs(personnelId: string) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ORGA_KEYS.hierarchie.superieurs(personnelId),
        queryFn: async () => {
            const response = await apiClient.get<HierarchiePersonnel[]>(`/api/organisation/hierarchie/superieurs/${personnelId}`);
            return response.data || [];
        },
        enabled: !!personnelId && isAuthenticated,
    });
}

export function useSubordonnes(superieurId: string) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ORGA_KEYS.hierarchie.subordonnes(superieurId),
        queryFn: async () => {
            const response = await apiClient.get<HierarchiePersonnel[]>(`/api/organisation/hierarchie/subordonnes/${superieurId}`);
            return response.data || [];
        },
        enabled: !!superieurId && isAuthenticated,
    });
}

export function useCreerHierarchie() {
    const qc = useQueryClient();
    const handleError = useHandleError();
    return useMutation({
        mutationFn: async (dto: CreerHierarchieDto) => {
            const response = await apiClient.post<HierarchiePersonnel>('/api/organisation/hierarchie', dto);
            return response.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ORGA_KEYS.hierarchie.all });
            qc.invalidateQueries({ queryKey: ORGA_KEYS.organigramme.all });
            qc.invalidateQueries({ queryKey: ORGA_KEYS.stats.all });
            toast.success('Relation hiérarchique créée');
        },
        onError: (e: unknown) => handleError(e, 'Erreur création hiérarchie'),
    });
}

export function useModifierHierarchie() {
    const qc = useQueryClient();
    const handleError = useHandleError();
    return useMutation({
        mutationFn: async ({ id, ...dto }: { id: string } & ModifierHierarchieDto) => {
            const response = await apiClient.patch<HierarchiePersonnel>(`/api/organisation/hierarchie/${id}`, dto);
            return response.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ORGA_KEYS.hierarchie.all });
            qc.invalidateQueries({ queryKey: ORGA_KEYS.organigramme.all });
            qc.invalidateQueries({ queryKey: ORGA_KEYS.stats.all });
            toast.success('Relation hiérarchique modifiée');
        },
        onError: (e: unknown) => handleError(e, 'Erreur modification hiérarchie'),
    });
}

export function useSupprimerHierarchie() {
    const qc = useQueryClient();
    const handleError = useHandleError();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/organisation/hierarchie/${id}`);
            return id;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ORGA_KEYS.hierarchie.all });
            qc.invalidateQueries({ queryKey: ORGA_KEYS.organigramme.all });
            qc.invalidateQueries({ queryKey: ORGA_KEYS.stats.all });
            toast.success('Relation hiérarchique supprimée');
        },
        onError: (e: unknown) => handleError(e, 'Erreur suppression hiérarchie'),
    });
}

// ─── ORGANIGRAMME ───

export function useOrganigramme() {
    const { isAuthenticated, etablissementId } = useAuthStore();
    return useQuery({
        queryKey: ORGA_KEYS.organigramme.all,
        queryFn: async () => {
            const response = await apiClient.get<OrganigrammeNode[]>('/api/organisation/organigramme');
            return response.data || [];
        },
        enabled: !!etablissementId && isAuthenticated,
    });
}

// ─── STATISTIQUES ───

export function useStatistiquesOrganisation() {
    const { isAuthenticated, etablissementId } = useAuthStore();
    return useQuery({
        queryKey: ORGA_KEYS.stats.all,
        queryFn: async () => {
            const response = await apiClient.get<StatistiquesOrganisation>('/api/organisation/statistiques');
            return response.data;
        },
        enabled: !!etablissementId && isAuthenticated,
    });
}

// ─── VALIDATION ───

export function useValiderArborescence() {
    const { isAuthenticated, etablissementId } = useAuthStore();
    return useQuery({
        queryKey: ORGA_KEYS.validation.all,
        queryFn: async () => {
            const response = await apiClient.get<ValidationArborescence>('/api/organisation/valider-arborescence');
            return response.data;
        },
        enabled: !!etablissementId && isAuthenticated,
    });
}
