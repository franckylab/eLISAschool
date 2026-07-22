/**
 * ==================================
 * eLISAschool - Hooks Postes Organisation
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Hooks React Query pour la gestion des postes.
 */

import { useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import type { ModifierPosteDto } from '../types/organisation.types';

function handleError(e: any, msg: string) {
    toast.error(e?.response?.data?.error?.message || msg);
}

export function useCreerPoste() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (dto: { intitule: string; code?: string; categoriePosteCode?: string; niveauResponsabiliteId?: string; description?: string; estSuppleant?: boolean; uniteOrganisationnelleId: string; etablissementId?: string }) => {
            const response = await apiClient.post('/api/organisation/postes', dto);
            return response.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['organisation', 'organigramme'] });
            qc.invalidateQueries({ queryKey: ['organisation', 'unites'] });
            toast.success('Poste créé');
        },
        onError: (e: any) => handleError(e, 'Erreur création poste'),
    });
}

export function useModifierPoste() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...dto }: { id: string } & ModifierPosteDto) => {
            const response = await apiClient.patch(`/api/organisation/postes/${id}`, dto);
            return response.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['organisation', 'organigramme'] });
            qc.invalidateQueries({ queryKey: ['organisation', 'unites'] });
            toast.success('Poste modifié');
        },
        onError: (e: any) => handleError(e, 'Erreur modification poste'),
    });
}

export function useSupprimerPoste() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/organisation/postes/${id}`);
            return id;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['organisation', 'organigramme'] });
            qc.invalidateQueries({ queryKey: ['organisation', 'unites'] });
            toast.success('Poste supprimé');
        },
        onError: (e: any) => handleError(e, 'Erreur suppression poste'),
    });
}
