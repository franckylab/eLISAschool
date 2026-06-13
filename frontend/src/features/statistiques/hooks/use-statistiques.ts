/**
 * ==================================
 * eLISAschool - Hooks Statistiques
 * ==================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import type { StatistiquesGlobales, StatistiquesPeriodiques, FiltresStatistiques } from '../types/statistiques.types';

const STATISTIQUES_KEYS = {
    globales: (filtres?: FiltresStatistiques) => ['statistiques', 'globales', filtres] as const,
    periodiques: (periode: string) => ['statistiques', 'periodiques', periode] as const,
    parModule: (module: string, filtres?: FiltresStatistiques) => ['statistiques', module, filtres] as const,
};

export function useStatistiquesGlobales(filtres?: FiltresStatistiques) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: STATISTIQUES_KEYS.globales(filtres),
        queryFn: async () => {
            const params: Record<string, any> = {};
            if (filtres?.dateDebut) params.dateDebut = filtres.dateDebut;
            if (filtres?.dateFin) params.dateFin = filtres.dateFin;

            const response = await apiClient.get<{ success: boolean; data: StatistiquesGlobales }>('/api/statistiques/globales', params);
            return response.data?.data;
        },
        enabled: isAuthenticated,
        staleTime: 10 * 60 * 1000,
    });
}

export function useStatistiquesPeriodiques(periode: string) {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: STATISTIQUES_KEYS.periodiques(periode),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: StatistiquesPeriodiques }>(`/api/statistiques/periodiques/${periode}`);
            return response.data?.data;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

export function useStatistiquesEleves(filtres?: FiltresStatistiques) {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: STATISTIQUES_KEYS.parModule('eleves', filtres),
        queryFn: async () => {
            const params: Record<string, any> = {};
            if (filtres?.classeId) params.classeId = filtres.classeId;
            if (filtres?.dateDebut) params.dateDebut = filtres.dateDebut;
            if (filtres?.dateFin) params.dateFin = filtres.dateFin;

            const response = await apiClient.get<{ success: boolean; data: any }>('/api/statistiques/eleves', params);
            return response.data?.data;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

export function useStatistiquesPersonnel(filtres?: FiltresStatistiques) {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: STATISTIQUES_KEYS.parModule('personnel', filtres),
        queryFn: async () => {
            const params: Record<string, any> = {};
            if (filtres?.typePersonnelId) params.typePersonnelId = filtres.typePersonnelId;
            if (filtres?.dateDebut) params.dateDebut = filtres.dateDebut;
            if (filtres?.dateFin) params.dateFin = filtres.dateFin;

            const response = await apiClient.get<{ success: boolean; data: any }>('/api/statistiques/personnel', params);
            return response.data?.data;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

export function useStatistiquesFinances(filtres?: FiltresStatistiques) {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: STATISTIQUES_KEYS.parModule('finances', filtres),
        queryFn: async () => {
            const params: Record<string, any> = {};
            if (filtres?.dateDebut) params.dateDebut = filtres.dateDebut;
            if (filtres?.dateFin) params.dateFin = filtres.dateFin;
            if (filtres?.typePaiement) params.typePaiement = filtres.typePaiement;

            const response = await apiClient.get<{ success: boolean; data: any }>('/api/statistiques/finances', params);
            return response.data?.data;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

export function useStatistiquesPedagogique(filtres?: FiltresStatistiques) {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: STATISTIQUES_KEYS.parModule('pedagogique', filtres),
        queryFn: async () => {
            const params: Record<string, any> = {};
            if (filtres?.classeId) params.classeId = filtres.classeId;
            if (filtres?.matiereId) params.matiereId = filtres.matiereId;
            if (filtres?.periode) params.periode = filtres.periode;

            const response = await apiClient.get<{ success: boolean; data: any }>('/api/statistiques/pedagogique', params);
            return response.data?.data;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

export function useStatistiquesVieScolaire(filtres?: FiltresStatistiques) {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: STATISTIQUES_KEYS.parModule('vie-scolaire', filtres),
        queryFn: async () => {
            const params: Record<string, any> = {};
            if (filtres?.type) params.type = filtres.type;
            if (filtres?.dateDebut) params.dateDebut = filtres.dateDebut;
            if (filtres?.dateFin) params.dateFin = filtres.dateFin;

            const response = await apiClient.get<{ success: boolean; data: any }>('/api/statistiques/vie-scolaire', params);
            return response.data?.data;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

export function useGenererRapport() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { type: string; format: string; parametres?: any }) => {
            const response = await apiClient.post<{ success: boolean; data: any }>('/api/statistiques/generer', data);
            return response.data?.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: STATISTIQUES_KEYS.globales() });
            toast.success('Rapport généré avec succès');
        },
    });
}

export function useExporterStatistiques() {
    return useMutation({
        mutationFn: async (data: { format: 'pdf' | 'excel' | 'csv'; type: string; filtres?: any }) => {
            const response = await apiClient.post('/api/statistiques/export', data);
            return response.data;
        },
        onSuccess: (data) => {
            const url = window.URL.createObjectURL(new Blob([data as BlobPart]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `statistiques-${Date.now()}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Export téléchargé');
        },
    });
}
