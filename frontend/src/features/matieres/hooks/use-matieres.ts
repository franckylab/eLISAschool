import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';
import type {
    Matiere, CreerMatiereDto, ModifierMatiereDto, MatiereFiltres,
    MatiereNiveau, AffectationMatiere, ConfigurationMatiereClasse,
} from '../types/matiere.types';
import { toast } from 'sonner';

const MATIERES_KEYS = {
    all: ['matieres'] as const,
    listes: () => [...MATIERES_KEYS.all, 'liste'] as const,
    liste: (filtres: MatiereFiltres) => [...MATIERES_KEYS.listes(), filtres] as const,
    details: () => [...MATIERES_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...MATIERES_KEYS.details(), id] as const,
    programme: (id: string) => [...MATIERES_KEYS.all, 'programme', id] as const,
    affectations: (id: string) => [...MATIERES_KEYS.all, 'affectations', id] as const,
    configurations: (id: string) => [...MATIERES_KEYS.all, 'configurations', id] as const,
    configurationEffective: (matiereId: string, classeAnneeId: string) => [...MATIERES_KEYS.all, 'configurations', matiereId, 'effective', classeAnneeId] as const,
    tousNiveaux: () => [...MATIERES_KEYS.all, 'tous-niveaux'] as const,
};

export function useMatieres(filtres: MatiereFiltres = {}) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: MATIERES_KEYS.liste(filtres),
        queryFn: async () => {
            const response = await apiClient.getPaginated<Matiere>('/api/matieres', {
                page: filtres.page || 1,
                limit: filtres.limit || 50,
                ...(filtres.recherche ? { recherche: filtres.recherche } : {}),
                ...(filtres.actif !== undefined ? { actif: String(filtres.actif) } : {}),
            });
            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 10 * 60 * 1000,
    });
}

export function useMatiere(id: string) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: MATIERES_KEYS.detail(id),
        queryFn: async () => {
            try {
                const response = await apiClient.get<Matiere>(`/api/matieres/${id}`);
                return response.data;
            } catch {
                const listResponse = await apiClient.getPaginated<Matiere>('/api/matieres', { page: 1, limit: 100 });
                const items = listResponse.data?.items || [];
                const found = items.find((m: Matiere) => m.id === id);
                if (!found) throw new Error('Matière non trouvée');
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
    });
}

export function useMatiereConfigurations(matiereId: string) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: MATIERES_KEYS.configurations(matiereId),
        queryFn: async () => {
            try {
                const response = await apiClient.get<ConfigurationMatiereClasse[]>(`/api/matieres/${matiereId}/configurations`);
                return response.data;
            } catch {
                return [];
            }
        },
        enabled: isAuthenticated && !!matiereId,
    });
}

export interface ConfigurationEffective {
    config: ConfigurationMatiereClasse | null;
    defaults: { coefficient: number; bareme: number; volumeHoraire: number | null; credits: number | null; obligatoire: boolean; source: string };
    effective: { coefficient: number; bareme: number; volumeHoraireHebdo: number | null; credits: number | null; obligatoire: boolean };
}

export function useConfigurationEffective(matiereId: string, classeAnneeId: string | null) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: MATIERES_KEYS.configurationEffective(matiereId, classeAnneeId ?? ''),
        queryFn: async () => {
            const response = await apiClient.get<ConfigurationEffective>(
                `/api/matieres/${matiereId}/configurations/effective?classeAnneeId=${classeAnneeId}`
            );
            return response.data;
        },
        enabled: isAuthenticated && !!matiereId && !!classeAnneeId,
        staleTime: 5 * 60 * 1000,
    });
}

export function useCreerConfigurationMatiereClasse() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (dto: { matiereId: string; classeAnneeId: string; coefficient?: number; bareme?: number; volumeHoraireHebdo?: number; credits?: number; obligatoire?: boolean; notes?: string }) => {
            const response = await apiClient.post<ConfigurationMatiereClasse>(
                `/api/matieres/${dto.matiereId}/configurations`, dto
            );
            return response.data;
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: MATIERES_KEYS.configurations(variables.matiereId) });
            toast.success('Configuration créée avec succès');
        },
        onError: (error: any) => toast.error(error?.message || 'Erreur lors de la création'),
    });
}

export function useModifierConfigurationMatiereClasse() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ configId, matiereId, ...dto }: { configId: string; matiereId: string; coefficient?: number; bareme?: number; volumeHoraireHebdo?: number; credits?: number; obligatoire?: boolean; notes?: string }) => {
            const response = await apiClient.patch<ConfigurationMatiereClasse>(
                `/api/matieres/${matiereId}/configurations/${configId}`, dto
            );
            return response.data;
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: MATIERES_KEYS.configurations(variables.matiereId) });
            toast.success('Configuration modifiée');
        },
        onError: (error: any) => toast.error(error?.message || 'Erreur lors de la modification'),
    });
}

export function useSupprimerConfigurationMatiereClasse() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ configId, matiereId }: { configId: string; matiereId: string }) => {
            await apiClient.delete(`/api/matieres/${matiereId}/configurations/${configId}`);
            return matiereId;
        },
        onSuccess: (matiereId) => {
            queryClient.invalidateQueries({ queryKey: MATIERES_KEYS.configurations(matiereId) });
            toast.success('Configuration supprimée');
        },
        onError: (error: any) => toast.error(error?.message || 'Erreur lors de la suppression'),
    });
}

export function useCreerMatiere() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (dto: CreerMatiereDto) => {
            const response = await apiClient.post<Matiere>('/api/matieres', dto);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: MATIERES_KEYS.listes() });
            toast.success('Matière créée avec succès');
        },
        onError: (error: any) => toast.error(error?.message || 'Erreur lors de la création'),
    });
}

export function useModifierMatiere() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (dto: ModifierMatiereDto) => {
            const { id, ...data } = dto;
            const response = await apiClient.patch<Matiere>(`/api/matieres/${id}`, data);
            return response.data;
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: MATIERES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: MATIERES_KEYS.detail(variables.id) });
            toast.success('Matière modifiée avec succès');
        },
        onError: (error: any) => toast.error(error?.message || 'Erreur lors de la modification'),
    });
}

export function useSupprimerMatiere() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/matieres/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: MATIERES_KEYS.listes() });
            toast.success('Matière supprimée');
        },
        onError: (error: any) => toast.error(error?.message || 'Erreur lors de la suppression'),
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
    return useMutation({
        mutationFn: async (dto: AffectationPayload) => {
            const response = await apiClient.post<AffectationMatiere>('/api/matieres/affectations', dto);
            return response.data;
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: MATIERES_KEYS.affectations(variables.matiereId) });
            toast.success('Enseignant affecté avec succès');
        },
        onError: (error: any) => toast.error(error?.message || "Erreur lors de l'affectation"),
    });
}

export function useModifierAffectation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...dto }: { id: string; matiereId: string } & Partial<AffectationPayload>) => {
            const response = await apiClient.patch<AffectationMatiere>(`/api/matieres/affectations/${id}`, dto);
            return response.data;
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: MATIERES_KEYS.affectations(variables.matiereId) });
            toast.success('Affectation modifiée');
        },
        onError: (error: any) => toast.error(error?.message || 'Erreur lors de la modification'),
    });
}

export function useSupprimerAffectation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, matiereId }: { id: string; matiereId: string }) => {
            await apiClient.delete(`/api/matieres/affectations/${id}`);
            return matiereId;
        },
        onSuccess: (matiereId) => {
            queryClient.invalidateQueries({ queryKey: MATIERES_KEYS.affectations(matiereId) });
            toast.success('Affectation supprimée');
        },
        onError: (error: any) => toast.error(error?.message || 'Erreur lors de la suppression'),
    });
}
