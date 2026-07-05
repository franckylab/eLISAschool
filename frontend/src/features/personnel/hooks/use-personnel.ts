/**
 * ==================================
 * eLISAschool - Hook Personnel
 * ==================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';
import type { MembrePersonnel, CreerPersonnelDto, ModifierPersonnelDto, PersonnelFiltres } from '../types/personnel.types';
import { fromFormToCreateDto } from '../types/personnel.types';
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
            const params: Record<string, any> = {
                page: filtres.page || 1,
                limit: filtres.limit || 20,
            };

            // Ajouter uniquement les filtres non vides
            if (filtres.recherche) params.search = filtres.recherche;
            if (filtres.typePersonnelId) params.typePersonnelId = filtres.typePersonnelId;
            if (filtres.actif !== undefined) params.actif = filtres.actif;

            const response = await apiClient.getPaginated<MembrePersonnel>('/api/personnel', params);
            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
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
    });
}

export function useCreerPersonnel() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (dto: CreerPersonnelDto | Record<string, any>) => {
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
                const nom = (data as any).nom || data.utilisateur?.profil?.nom || '';
                const prenom = (data as any).prenom || data.utilisateur?.profil?.prenom || '';
                toast.success(`${prenom} ${nom} ajouté(e) au personnel`);
            }
        },
        onError: (error: any) => toast.error(error?.message || 'Erreur lors de la création'),
    });
}

export function useModifierPersonnel() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (dto: ModifierPersonnelDto | Record<string, any>) => {
            const { id, ...rest } = dto;
            const payload: Record<string, any> = ('dateEmbauche' in rest || 'matricule' in rest)
                ? rest
                : {
                    dateEmbauche: rest.dateEntree || rest.dateEmbauche,
                    statut: rest.statut?.toUpperCase(),
                    specialites: rest.specialite ? [rest.specialite] : rest.specialites,
                    diplomes: rest.diplomes || rest.qualification,
                    nom: rest.nom,
                    prenom: rest.prenom,
                    dateNaissance: rest.dateNaissance,
                    sexe: rest.sexe,
                    email: rest.email,
                    telephone: rest.telephone,
                    adresse: rest.adresse,
                    poste: rest.poste,
                    departement: rest.departement,
                    typeContrat: rest.typeContrat,
                    posteExact: rest.posteExact,
                    service: rest.service,
                    specialitePrincipale: rest.specialitePrincipale,
                    educationNiveau: rest.educationNiveau,
                    typePersonnelId: rest.typePersonnelId,
                };
            // Remove undefined to avoid overwriting existing values with nothing
            Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);
            const response = await apiClient.patch<MembrePersonnel>(`/api/personnel/${id}`, payload);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: PERSONNEL_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: enseignantKeys.listes() });
            if (data) {
                queryClient.invalidateQueries({ queryKey: PERSONNEL_KEYS.detail(data.id) });
                queryClient.invalidateQueries({ queryKey: enseignantKeys.detail(data.id) });
                const nom = (data as any).nom || data.utilisateur?.profil?.nom || '';
                const prenom = (data as any).prenom || data.utilisateur?.profil?.prenom || '';
                toast.success(`${prenom} ${nom} modifié(e) avec succès`);
            }
        },
        onError: (error: any) => toast.error(error?.message || 'Erreur lors de la modification'),
    });
}

export function useSupprimerPersonnel() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/personnel/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PERSONNEL_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: PERSONNEL_KEYS.stats() });
            queryClient.invalidateQueries({ queryKey: enseignantKeys.listes() });
            toast.success('Membre du personnel supprimé');
        },
        onError: (error: any) => toast.error(error?.message || 'Erreur lors de la suppression'),
    });
}
