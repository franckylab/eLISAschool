import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import type { MembrePersonnel } from '../types/personnel.types';

const PERSONNEL_KEYS = {
    detail: (id: string) => ['personnel', 'detail', id],
};

export function useModifierStatut() {
    const queryClient = useQueryClient();
    const { t } = useTranslation('personnel');
    return useMutation({
        mutationFn: async ({ id, statut }: { id: string; statut: string }) => {
            const response = await apiClient.post<MembrePersonnel>(`/api/personnel/${id}/statut`, { statut });
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['personnel'] });
            if (data) queryClient.setQueryData(PERSONNEL_KEYS.detail(data.id), data);
            toast.success(t('toasts.statutMisAJour'));
        },
        onError: (error: unknown) => toast.error((error as Error)?.message || t('erreurs.miseAJourStatut')),
    });
}

export function useModifierDateEntree() {
    const queryClient = useQueryClient();
    const { t } = useTranslation('personnel');
    return useMutation({
        mutationFn: async ({ id, dateEmbauche }: { id: string; dateEmbauche: string }) => {
            const response = await apiClient.post<MembrePersonnel>(`/api/personnel/${id}/date-entree`, { dateEmbauche });
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['personnel'] });
            if (data) queryClient.setQueryData(PERSONNEL_KEYS.detail(data.id), data);
            toast.success(t('toasts.dateEntreeMiseAJour'));
        },
        onError: (error: unknown) => toast.error((error as Error)?.message || t('erreurs.miseAJourDate')),
    });
}

export function useModifierCompetences() {
    const queryClient = useQueryClient();
    const { t } = useTranslation('personnel');
    return useMutation({
        mutationFn: async ({ id, ...data }: { id: string; specialites?: string[]; diplomes?: string; specialitePrincipale?: string; competences?: string[]; educationNiveau?: string; anneesExperience?: number }) => {
            const response = await apiClient.post<MembrePersonnel>(`/api/personnel/${id}/competences`, data);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['personnel'] });
            if (data) queryClient.setQueryData(PERSONNEL_KEYS.detail(data.id), data);
            toast.success(t('toasts.competencesMisesAJour'));
        },
        onError: (error: unknown) => toast.error((error as Error)?.message || t('erreurs.miseAJourCompetences')),
    });
}