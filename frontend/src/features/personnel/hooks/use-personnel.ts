/**
 * ==================================
 * eLISAschool - Hook Personnel
 * ==================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';
import type { MembrePersonnel, CreerPersonnelDto, ModifierPersonnelDto, PersonnelFiltres, ContratPersonnel, BulletinPaie } from '../types/personnel.types';
import { fromFormToCreateDto } from '../types/personnel.types';
import type { PersonnelFormData } from '../types/personnel.types';
import { toast } from 'sonner';

const enseignantKeys = {
    listes: () => ['enseignants', 'liste'] as const,
    detail: (id: string) => ['enseignants', 'detail', id] as const,
};

const PERSONNEL_KEYS = {
    all: ['personnel'] as const,
    listes: () => [...PERSONNEL_KEYS.all, 'liste'] as const,
    liste: (filtres: PersonnelFiltres) => [...PERSONNEL_KEYS.listes(), filtres] as const,
    details: () => [...PERSONNEL_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...PERSONNEL_KEYS.details(), id] as const,
    stats: () => [...PERSONNEL_KEYS.all, 'stats'] as const,
};

export function usePersonnel(filtres: PersonnelFiltres = {}) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: PERSONNEL_KEYS.liste(filtres),
        queryFn: async () => {
            const params: Record<string, string | number | boolean> = {
                page: filtres.page || 1,
                limit: filtres.limit || 20,
            };

            // Ajouter uniquement les filtres non vides
            if (filtres.recherche) params.search = filtres.recherche;
            if (filtres.categorie) params.categorie = filtres.categorie;
            if (filtres.actif !== undefined) params.actif = filtres.actif;
            if (filtres.statut) params.statut = filtres.statut;

            const response = await apiClient.getPaginated<MembrePersonnel>('/api/personnel', params);
            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

export function useMembrePersonnel(id: string) {
    return useQuery({
        queryKey: PERSONNEL_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<MembrePersonnel>(`/api/personnel/${id}`);
            return response.data;
        },
        enabled: !!id,
        placeholderData: (previousData) => previousData,
    });
}

export function useCreerPersonnel() {
    const queryClient = useQueryClient();
    const { t } = useTranslation('personnel');
    return useMutation({
        mutationFn: async (dto: CreerPersonnelDto | PersonnelFormData) => {
            const payload = ('dateEmbauche' in dto) ? dto : fromFormToCreateDto(dto);
            const response = await apiClient.post<MembrePersonnel>('/api/personnel', payload);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: PERSONNEL_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: PERSONNEL_KEYS.stats() });
            queryClient.invalidateQueries({ queryKey: enseignantKeys.listes() });
            if (data) {
                queryClient.invalidateQueries({ queryKey: enseignantKeys.detail(data.id) });
                const nom = data.utilisateur?.profil?.nom || '';
                const prenom = data.utilisateur?.profil?.prenom || '';
                toast.success(t('toasts.ajoutePersonnel', { prenom, nom }));
            }
        },
        onError: (error: unknown) => toast.error((error as Error)?.message || t('erreurs.creation')),
    });
}

export function useModifierPersonnel() {
    const queryClient = useQueryClient();
    const { t } = useTranslation('personnel');
    return useMutation({
        mutationFn: async (dto: ModifierPersonnelDto) => {
            const { id, ...rest } = dto;
            const cleaned = Object.fromEntries(
                Object.entries(rest).filter(([, v]) => v !== undefined)
            );
            const response = await apiClient.patch<MembrePersonnel>(`/api/personnel/${id}`, cleaned);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: PERSONNEL_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: enseignantKeys.listes() });
            if (data) {
                queryClient.invalidateQueries({ queryKey: PERSONNEL_KEYS.detail(data.id) });
                queryClient.invalidateQueries({ queryKey: enseignantKeys.detail(data.id) });
                const nom = data.utilisateur?.profil?.nom || '';
                const prenom = data.utilisateur?.profil?.prenom || '';
                toast.success(t('toasts.modifiePersonnel', { prenom, nom }));
            }
        },
        onError: (error: unknown) => toast.error((error as Error)?.message || t('erreurs.modification')),
    });
}

// ─── CONTRATS ───

export function usePersonnelContrats(membreId: string) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: [...PERSONNEL_KEYS.all, 'contrats', membreId],
        queryFn: async () => {
            const response = await apiClient.get<ContratPersonnel[]>(`/api/personnel/contrats/membres/${membreId}/historique`);
            return response.data || [];
        },
        enabled: !!membreId && isAuthenticated,
        placeholderData: (previousData) => previousData,
    });
}

export function usePersonnelBulletins(membreId: string) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: [...PERSONNEL_KEYS.all, 'bulletins', membreId],
        queryFn: async () => {
            const response = await apiClient.get<{ items: BulletinPaie[] }>(`/api/paie/bulletins/membres/${membreId}`);
            return response.data?.items ?? [];
        },
        enabled: !!membreId && isAuthenticated,
        placeholderData: (previousData) => previousData,
    });
}

export function usePersonnelDisponibles() {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: [...PERSONNEL_KEYS.all, 'disponibles'],
        queryFn: async () => {
            const response = await apiClient.getPaginated<MembrePersonnel>('/api/personnel', { limit: 100, page: 1, actif: true });
            const items = response.data?.items || [];
            return items.filter(p => !p.utilisateurId);
        },
        enabled: isAuthenticated,
        staleTime: 3 * 60 * 1000,
    });
}

// ─── Link/Unlink Utilisateur ───

export function useLinkPersonnelUtilisateur() {
    const queryClient = useQueryClient();
    const { t } = useTranslation('personnel');
    return useMutation({
        mutationFn: async ({ membreId, utilisateurId }: { membreId: string; utilisateurId: string }) => {
            const response = await apiClient.post<MembrePersonnel>(`/api/personnel/${membreId}/link-user`, { utilisateurId });
            return response.data;
        },
        onSuccess: (data) => {
            if (!data) return;
            queryClient.invalidateQueries({ queryKey: PERSONNEL_KEYS.detail(data.id) });
            queryClient.invalidateQueries({ queryKey: PERSONNEL_KEYS.listes() });
            if (data.utilisateurId) {
                queryClient.invalidateQueries({ queryKey: ['utilisateurs', 'detail', data.utilisateurId] });
            }
            toast.success(t('toasts.utilisateurLie'));
        },
        onError: (error: unknown) => toast.error((error as Error)?.message || t('erreurs.lienUtilisateur')),
    });
}

export function useUnlinkPersonnelUtilisateur() {
    const queryClient = useQueryClient();
    const { t } = useTranslation('personnel');
    return useMutation({
        mutationFn: async (membreId: string) => {
            const response = await apiClient.post<MembrePersonnel>(`/api/personnel/${membreId}/unlink-user`);
            return response.data;
        },
        onSuccess: (data) => {
            if (!data) return;
            queryClient.invalidateQueries({ queryKey: PERSONNEL_KEYS.detail(data.id) });
            queryClient.invalidateQueries({ queryKey: PERSONNEL_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: PERSONNEL_KEYS.stats() });
            toast.success(t('toasts.utilisateurDelie'));
        },
        onError: (error: unknown) => toast.error((error as Error)?.message || t('erreurs.deliementUtilisateur')),
    });
}

export function usePersonnelSansCompte() {
    return useQuery({
        queryKey: [...PERSONNEL_KEYS.stats(), 'sans-compte'],
        queryFn: async () => {
            const response = await apiClient.get<{ count: number; total: number; pourcentage: number }>('/api/personnel/stats/sans-compte');
            return response.data;
        },
        staleTime: 5 * 60 * 1000,
    });
}

export function useSupprimerPersonnel() {
    const queryClient = useQueryClient();
    const { t } = useTranslation('personnel');
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/personnel/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PERSONNEL_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: PERSONNEL_KEYS.stats() });
            queryClient.invalidateQueries({ queryKey: enseignantKeys.listes() });
            toast.success(t('toasts.membreSupprime'));
        },
        onError: (error: unknown) => toast.error((error as Error)?.message || t('erreurs.suppression')),
    });
}
