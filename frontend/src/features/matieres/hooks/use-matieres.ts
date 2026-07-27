/**
 * ==================================
 * eLISAschool - Hook Matières
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';
import { useHandleError } from '@/hooks/use-handle-error';
import { toast } from 'sonner';
import type {
    Matiere, CreerMatiereDto, ModifierMatiereDto, MatiereFiltres,
    MatiereNiveau, AffectationMatiere,
} from '../types/matiere.types';
import type { ProgrammeMatiere } from '@/features/programmes/types/programme.types';

const MATIERES_KEYS = {
    all: ['matieres'] as const,
    listes: () => [...MATIERES_KEYS.all, 'liste'] as const,
    liste: (filtres: MatiereFiltres) => [...MATIERES_KEYS.listes(), filtres] as const,
    details: () => [...MATIERES_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...MATIERES_KEYS.details(), id] as const,
    programme: (id: string) => [...MATIERES_KEYS.all, 'programme', id] as const,
    programmesPedagogiques: (id: string) => [...MATIERES_KEYS.all, 'programmes-pedagogiques', id] as const,
    affectations: (id: string) => [...MATIERES_KEYS.all, 'affectations', id] as const,
    tousNiveaux: () => [...MATIERES_KEYS.all, 'tous-niveaux'] as const,
};

export function useMatieres(filtres: MatiereFiltres = {}) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: MATIERES_KEYS.liste(filtres),
        queryFn: async () => {
            const params: Record<string, string | number> = {
                page: filtres.page || 1,
                limit: filtres.limit || 50,
                ...(filtres.recherche ? { recherche: filtres.recherche } : {}),
                ...(filtres.actif !== undefined ? { actif: String(filtres.actif) } : {}),
                ...(filtres.sousSysteme ? { sousSysteme: filtres.sousSysteme } : {}),
            };
            const response = await apiClient.getPaginated<Matiere>('/api/matieres', params);
            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 10 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

export function useMatiere(id: string) {
    const { isAuthenticated } = useAuthStore();
    const { t } = useTranslation('matieres');
    return useQuery({
        queryKey: MATIERES_KEYS.detail(id),
        queryFn: async () => {
            try {
                const response = await apiClient.get<Matiere>(`/api/matieres/${id}`);
                return response.data;
            } catch {
                const listResponse = await apiClient.getPaginated<Matiere>('/api/matieres', { page: 1, limit: 100 });
                const items = listResponse.data?.items || [];
                const found = items.find((m) => m.id === id);
                if (!found) throw new Error(t('matiereNonTrouvee'));
                return found;
            }
        },
        enabled: isAuthenticated && !!id,
    });
}

export function useMatiereProgramme(matiereId: string) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: MATIERES_KEYS.programme(matiereId),
        queryFn: async () => {
            try {
                const response = await apiClient.get<MatiereNiveau[]>(`/api/matieres/${matiereId}/programme`);
                return response.data;
            } catch {
                return [];
            }
        },
        enabled: isAuthenticated && !!matiereId,
        placeholderData: (previousData) => previousData,
    });
}

export function useMatiereProgrammesPedagogiques(matiereId: string) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: MATIERES_KEYS.programmesPedagogiques(matiereId),
        queryFn: async () => {
            try {
                const response = await apiClient.get<ProgrammeMatiere[]>(
                    `/api/matieres/${matiereId}/programmes-pedagogiques`
                );
                return response.data;
            } catch {
                return [];
            }
        },
        enabled: isAuthenticated && !!matiereId,
        placeholderData: (previousData) => previousData,
    });
}

export function useTousMatieresNiveaux() {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: MATIERES_KEYS.tousNiveaux(),
        queryFn: async () => {
            const response = await apiClient.get<MatiereNiveau[]>(`/api/matieres/programme`);
            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 10 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

export function useMatiereAffectations(matiereId: string) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: MATIERES_KEYS.affectations(matiereId),
        queryFn: async () => {
            try {
                const response = await apiClient.get<AffectationMatiere[]>(`/api/matieres/${matiereId}/affectations`);
                return response.data;
            } catch {
                return [];
            }
        },
        enabled: isAuthenticated && !!matiereId,
        placeholderData: (previousData) => previousData,
    });
}

export function useCreerMatiere() {
    const queryClient = useQueryClient();
    const { t } = useTranslation('matieres');
    const handleError = useHandleError();
    return useMutation({
        mutationFn: async (dto: CreerMatiereDto) => {
            const response = await apiClient.post<Matiere>('/api/matieres', dto);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: MATIERES_KEYS.listes() });
            toast.success(t('succesCreation'));
        },
        onError: (error: unknown) => handleError(error, t('erreurCreation')),
    });
}

export function useModifierMatiere() {
    const queryClient = useQueryClient();
    const { t } = useTranslation('matieres');
    const handleError = useHandleError();
    return useMutation({
        mutationFn: async (dto: ModifierMatiereDto) => {
            const { id, ...data } = dto;
            const response = await apiClient.patch<Matiere>(`/api/matieres/${id}`, data);
            return response.data;
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: MATIERES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: MATIERES_KEYS.detail(variables.id) });
            toast.success(t('succesModification'));
        },
        onError: (error: unknown) => handleError(error, t('erreurModification')),
    });
}

export function useSupprimerMatiere() {
    const queryClient = useQueryClient();
    const { t } = useTranslation('matieres');
    const handleError = useHandleError();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/matieres/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: MATIERES_KEYS.listes() });
            toast.success(t('succesSuppression'));
        },
        onError: (error: unknown) => handleError(error, t('erreurSuppression')),
    });
}

// ==== MATIERE NIVEAU CRUD ====

export function useAjouterMatiereNiveau() {
    const queryClient = useQueryClient();
    const { t } = useTranslation('matieres');
    const handleError = useHandleError();
    return useMutation({
        mutationFn: async (dto: { matiereId: string; niveauId: string; coefficient?: number; bareme?: number; credits?: number; volumeHoraire?: number; obligatoire?: boolean; filiereId?: string }) => {
            const response = await apiClient.post<MatiereNiveau>('/api/matieres/programme', dto);
            return response.data;
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: MATIERES_KEYS.programme(variables.matiereId) });
            queryClient.invalidateQueries({ queryKey: MATIERES_KEYS.tousNiveaux() });
            toast.success(t('succesAjout'));
        },
        onError: (error: unknown) => handleError(error, t('erreurAjout')),
    });
}

export function useModifierMatiereNiveau() {
    const queryClient = useQueryClient();
    const { t } = useTranslation('matieres');
    const handleError = useHandleError();
    return useMutation({
        mutationFn: async (params: { id: string; matiereId: string; coefficient?: number; bareme?: number; credits?: number; volumeHoraire?: number; obligatoire?: boolean }) => {
            const { id, matiereId, ...dto } = params;
            const response = await apiClient.patch<MatiereNiveau>(`/api/matieres/programme/${id}`, dto);
            return response.data;
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: MATIERES_KEYS.programme(variables.matiereId) });
            queryClient.invalidateQueries({ queryKey: MATIERES_KEYS.tousNiveaux() });
            toast.success(t('succesModificationProgramme'));
        },
        onError: (error: unknown) => handleError(error, t('erreurModification')),
    });
}

export function useSupprimerMatiereNiveau() {
    const queryClient = useQueryClient();
    const { t } = useTranslation('matieres');
    const handleError = useHandleError();
    return useMutation({
        mutationFn: async (params: { id: string; matiereId: string }) => {
            await apiClient.delete(`/api/matieres/programme/${params.id}`);
            return params.matiereId;
        },
        onSuccess: (matiereId) => {
            queryClient.invalidateQueries({ queryKey: MATIERES_KEYS.programme(matiereId) });
            queryClient.invalidateQueries({ queryKey: MATIERES_KEYS.tousNiveaux() });
            toast.success(t('succesRetrait'));
        },
        onError: (error: unknown) => handleError(error, t('erreurRetrait')),
    });
}

// ==== AFFECTATIONS ====

export interface AffectationPayload {
    matiereId: string;
    classeAnneeId: string;
    enseignantId: string;
    dateDebut?: string;
    dateFin?: string;
}

export function useCreerAffectation() {
    const queryClient = useQueryClient();
    const { t } = useTranslation('matieres');
    const handleError = useHandleError();
    return useMutation({
        mutationFn: async (dto: AffectationPayload) => {
            const response = await apiClient.post<AffectationMatiere>('/api/matieres/affectations', dto);
            return response.data;
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: MATIERES_KEYS.affectations(variables.matiereId) });
            toast.success(t('succesAffectation'));
        },
        onError: (error: unknown) => handleError(error, t('erreurAffectation')),
    });
}

export function useModifierAffectation() {
    const queryClient = useQueryClient();
    const { t } = useTranslation('matieres');
    const handleError = useHandleError();
    return useMutation({
        mutationFn: async ({ id, ...dto }: { id: string; matiereId: string } & Partial<AffectationPayload>) => {
            const response = await apiClient.patch<AffectationMatiere>(`/api/matieres/affectations/${id}`, dto);
            return response.data;
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: MATIERES_KEYS.affectations(variables.matiereId) });
            toast.success(t('succesModificationAffectation'));
        },
        onError: (error: unknown) => handleError(error, t('erreurModification')),
    });
}

export function useSupprimerAffectation() {
    const queryClient = useQueryClient();
    const { t } = useTranslation('matieres');
    const handleError = useHandleError();
    return useMutation({
        mutationFn: async ({ id, matiereId }: { id: string; matiereId: string }) => {
            await apiClient.delete(`/api/matieres/affectations/${id}`);
            return matiereId;
        },
        onSuccess: (matiereId) => {
            queryClient.invalidateQueries({ queryKey: MATIERES_KEYS.affectations(matiereId) });
            toast.success(t('succesSuppressionAffectation'));
        },
        onError: (error: unknown) => handleError(error, t('erreurSuppression')),
    });
}

// ==== PROGRAMMES PEDAGOGIQUES (via ProgrammeMatiere) ====

export function useAjouterMatiereProgramme() {
    const queryClient = useQueryClient();
    const { t } = useTranslation('matieres');
    const handleError = useHandleError();
    return useMutation({
        mutationFn: async (dto: { programmeId: string; matiereNiveauId: string; coefficient?: number; obligatoire?: boolean; ordre?: number }) => {
            const response = await apiClient.post<ProgrammeMatiere>('/api/programmes/matieres', dto);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: MATIERES_KEYS.all });
            toast.success(t('succesProgramme'));
        },
        onError: (error: unknown) => handleError(error, t('erreurAjout')),
    });
}

export function useRetirerMatiereProgramme() {
    const queryClient = useQueryClient();
    const { t } = useTranslation('matieres');
    const handleError = useHandleError();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/programmes/matieres/${id}`);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: MATIERES_KEYS.all });
            toast.success(t('succesRetraitProgramme'));
        },
        onError: (error: unknown) => handleError(error, t('erreurRetrait')),
    });
}

export function useModifierMatiereProgramme() {
    const queryClient = useQueryClient();
    const { t } = useTranslation('matieres');
    const handleError = useHandleError();
    return useMutation({
        mutationFn: async ({ id, ...dto }: { id: string; coefficient?: number; obligatoire?: boolean; ordre?: number }) => {
            const response = await apiClient.patch<ProgrammeMatiere>(`/api/programmes/matieres/${id}`, dto);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: MATIERES_KEYS.all });
            toast.success(t('succesModificationProgramme'));
        },
        onError: (error: unknown) => handleError(error, t('erreurModification')),
    });
}
