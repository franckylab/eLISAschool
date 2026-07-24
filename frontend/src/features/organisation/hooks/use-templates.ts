/**
 * ==================================
 * eLISAschool - Hooks Templates Organisation
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { useHandleError } from './use-handle-error';
import type { TemplateOrganisation, GenererOrganisationDto, ResultatGeneration } from '../types/organisation.types';

const KEYS = { all: ['organisation', 'templates'] as const };

/** Clés de cache pour invalidation croisée après génération */
const ORGA_KEYS = {
    unites: { all: ['organisation', 'unites'] as const },
    organigramme: { all: ['organisation', 'organigramme'] as const },
    stats: { all: ['organisation', 'statistiques'] as const },
};

export function useTemplatesOrganisation() {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: KEYS.all,
        queryFn: async () => { const res = await apiClient.get<TemplateOrganisation[]>('/api/organisation/templates'); return res.data || []; },
        enabled: isAuthenticated,
    });
}

export function useCreerTemplateOrganisation() {
    const qc = useQueryClient();
    const handleError = useHandleError();
    return useMutation({
        mutationFn: async (dto: Partial<TemplateOrganisation>) => { const res = await apiClient.post<TemplateOrganisation>('/api/organisation/templates', dto); return res.data!; },
        onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.all }); toast.success('Template créé'); },
        onError: (e: unknown) => handleError(e, 'Erreur création template'),
    });
}

export function useModifierTemplateOrganisation() {
    const qc = useQueryClient();
    const handleError = useHandleError();
    return useMutation({
        mutationFn: async ({ id, ...data }: { id: string } & Partial<TemplateOrganisation>) => { const res = await apiClient.patch<TemplateOrganisation>(`/api/organisation/templates/${id}`, data); return res.data!; },
        onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.all }); toast.success('Template modifié'); },
        onError: (e: unknown) => handleError(e, 'Erreur modification template'),
    });
}

export function useSupprimerTemplateOrganisation() {
    const qc = useQueryClient();
    const handleError = useHandleError();
    return useMutation({
        mutationFn: async (id: string) => { await apiClient.delete(`/api/organisation/templates/${id}`); },
        onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.all }); toast.success('Template supprimé'); },
        onError: (e: unknown) => handleError(e, 'Erreur suppression template'),
    });
}

export function useGenererOrganisation() {
    const qc = useQueryClient();
    const handleError = useHandleError();
    return useMutation({
        mutationFn: async (dto: GenererOrganisationDto) => { const res = await apiClient.post<ResultatGeneration>('/api/organisation/generer', dto); return res.data!; },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ORGA_KEYS.unites.all });
            qc.invalidateQueries({ queryKey: ORGA_KEYS.organigramme.all });
            qc.invalidateQueries({ queryKey: ORGA_KEYS.stats.all });
            toast.success('Organisation générée avec succès');
        },
        onError: (e: unknown) => handleError(e, 'Erreur génération organisation'),
    });
}
