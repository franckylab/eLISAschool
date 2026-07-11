import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import type { AffectationPoste, CreerAffectationDto } from '../types/affectation.types';

const AFFECTATION_KEYS = {
    all: ['affectations'] as const,
    historique: (id: string) => [...AFFECTATION_KEYS.all, 'historique', id] as const,
    actif: (id: string) => [...AFFECTATION_KEYS.all, 'actif', id] as const,
};

export function useAffectationsMembre(membreId: string) {
    return useQuery({
        queryKey: AFFECTATION_KEYS.historique(membreId),
        queryFn: async () => {
            const response = await apiClient.get<AffectationPoste[]>(`/api/personnel/affectations/membres/${membreId}/historique`);
            return response.data || [];
        },
        enabled: !!membreId,
    });
}

export function useAffectationActiveMembre(membreId: string) {
    return useQuery({
        queryKey: AFFECTATION_KEYS.actif(membreId),
        queryFn: async () => {
            const response = await apiClient.get<AffectationPoste>(`/api/personnel/affectations/membres/${membreId}/actif`);
            return response.data;
        },
        enabled: !!membreId,
    });
}

export function useCreerAffectation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (dto: CreerAffectationDto) => {
            const response = await apiClient.post<AffectationPoste>('/api/personnel/affectations', dto);
            return response.data;
        },
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: AFFECTATION_KEYS.all });
            qc.invalidateQueries({ queryKey: ['personnel', 'detail'] });
            toast.success('Affectation créée avec succès');
        },
        onError: (e: any) => {
            toast.error(e?.response?.data?.message || e?.message || 'Erreur lors de la création');
        },
    });
}

export function useTerminerAffectation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (affectationId: string) => {
            const response = await apiClient.post<AffectationPoste>(`/api/personnel/affectations/${affectationId}/terminer`);
            return response.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: AFFECTATION_KEYS.all });
            qc.invalidateQueries({ queryKey: ['personnel', 'detail'] });
            toast.success('Affectation terminée');
        },
        onError: (e: any) => {
            toast.error(e?.response?.data?.message || e?.message || 'Erreur lors de la terminaison');
        },
    });
}
