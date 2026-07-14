import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import type { MembrePersonnel } from '../types/personnel.types';

const PERSONNEL_KEYS = {
    detail: (id: string) => ['personnel', 'detail', id],
};

export function useModifierStatut() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, statut }: { id: string; statut: string }) => {
            const response = await apiClient.post<MembrePersonnel>(`/api/personnel/${id}/statut`, { statut });
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['personnel'] });
            if (data) queryClient.setQueryData(PERSONNEL_KEYS.detail(data.id), data);
            toast.success('Statut mis à jour');
        },
        onError: (error: any) => toast.error(error?.message || 'Erreur lors de la mise à jour du statut'),
    });
}

export function useModifierTypePersonnel() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, typePersonnelId }: { id: string; typePersonnelId: string }) => {
            const response = await apiClient.post<MembrePersonnel>(`/api/personnel/${id}/type-personnel`, { typePersonnelId });
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['personnel'] });
            if (data) queryClient.setQueryData(PERSONNEL_KEYS.detail(data.id), data);
            toast.success('Type de personnel mis à jour');
        },
        onError: (error: any) => toast.error(error?.message || 'Erreur lors de la mise à jour du type'),
    });
}

export function useModifierDateEntree() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, dateEmbauche }: { id: string; dateEmbauche: string }) => {
            const response = await apiClient.post<MembrePersonnel>(`/api/personnel/${id}/date-entree`, { dateEmbauche });
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['personnel'] });
            if (data) queryClient.setQueryData(PERSONNEL_KEYS.detail(data.id), data);
            toast.success('Date d\'entrée mise à jour');
        },
        onError: (error: any) => toast.error(error?.message || 'Erreur lors de la mise à jour de la date'),
    });
}

export function useModifierCompetences() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...data }: { id: string; specialites?: string[]; diplomes?: string; specialitePrincipale?: string; competences?: string[]; educationNiveau?: string; anneesExperience?: number }) => {
            const response = await apiClient.post<MembrePersonnel>(`/api/personnel/${id}/competences`, data);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['personnel'] });
            if (data) queryClient.setQueryData(PERSONNEL_KEYS.detail(data.id), data);
            toast.success('Compétences mises à jour');
        },
        onError: (error: any) => toast.error(error?.message || 'Erreur lors de la mise à jour des compétences'),
    });
}