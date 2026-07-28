import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';
import type { PaginatedResult } from '@shared/types/api.types';
import type {
    ProgrammePedagogique,
    CreerProgrammeDto,
    ModifierProgrammeDto,
    ProgrammeFiltres,
    ProgrammeMatiere,
    AddMatiereDto,
    ProgrammeChapitre,
    CreerChapitreDto,
} from '../types/programme.types';
import { toast } from 'sonner';

const PROGRAMMES_KEYS = {
    all: ['programmes'] as const,
    lists: () => [...PROGRAMMES_KEYS.all, 'list'] as const,
    list: (filtres?: ProgrammeFiltres) => [...PROGRAMMES_KEYS.lists(), filtres] as const,
    details: () => [...PROGRAMMES_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...PROGRAMMES_KEYS.details(), id] as const,
    matieres: (id: string) => [...PROGRAMMES_KEYS.detail(id), 'matieres'] as const,
    chapitres: (id: string) => [...PROGRAMMES_KEYS.detail(id), 'chapitres'] as const,
};

export function useProgrammes(filtres?: ProgrammeFiltres) {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: PROGRAMMES_KEYS.list(filtres),
        queryFn: async () => {
            const params: Record<string, string | number | boolean | undefined> = {
                page: filtres?.page || 1,
                limit: filtres?.limit || 20,
                sortBy: filtres?.sortBy || 'nom',
                sortOrder: filtres?.sortOrder || 'ASC',
            };
            if (filtres?.search) params.search = filtres.search;
            if (filtres?.cycleId) params.cycleId = filtres.cycleId;
            if (filtres?.niveauId) params.niveauId = filtres.niveauId;
            if (filtres?.type) params.type = filtres.type;
            if (filtres?.actif !== undefined) params.actif = filtres.actif;

            const response = await apiClient.get<PaginatedResult<ProgrammePedagogique>>('/api/programmes', params);

            if (!response.data) {
                throw new Error('Programmes pédagogiques non disponibles');
            }
            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

export function useProgrammeDetail(id: string) {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: PROGRAMMES_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<ProgrammePedagogique>(`/api/programmes/${id}`);
            if (!response.data) {
                throw new Error('Programme pédagogique non trouvé');
            }
            return response.data;
        },
        enabled: isAuthenticated && !!id,
        staleTime: 10 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

export function useProgrammeMatieres(id: string) {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: PROGRAMMES_KEYS.matieres(id),
        queryFn: async () => {
            const response = await apiClient.get<ProgrammeMatiere[]>(`/api/programmes/${id}/matieres`);
            return response.data || [];
        },
        enabled: isAuthenticated && !!id,
        staleTime: 5 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

export function useCreerProgramme() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerProgrammeDto) => {
            const response = await apiClient.post<ProgrammePedagogique>('/api/programmes', dto);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PROGRAMMES_KEYS.lists() });
        },
    });
}

export function useModifierProgramme() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...dto }: { id: string } & ModifierProgrammeDto) => {
            const response = await apiClient.patch<ProgrammePedagogique>(`/api/programmes/${id}`, dto);
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: PROGRAMMES_KEYS.lists() });
            queryClient.invalidateQueries({ queryKey: PROGRAMMES_KEYS.detail(variables.id) });
        },
    });
}

export function useSupprimerProgramme() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/programmes/${id}`);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PROGRAMMES_KEYS.lists() });
        },
    });
}

export function useAjouterMatiereProgramme() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ programmeId, dto }: { programmeId: string; dto: AddMatiereDto }) => {
            const response = await apiClient.post<ProgrammeMatiere>(
                `/api/programmes/${programmeId}/matieres`,
                dto
            );
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: PROGRAMMES_KEYS.detail(variables.programmeId) });
            queryClient.invalidateQueries({ queryKey: PROGRAMMES_KEYS.matieres(variables.programmeId) });
        },
    });
}

export function useRetirerMatiereProgramme() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ pmId }: { programmeId: string; pmId: string }) => {
            await apiClient.delete(`/api/programmes/matieres/${pmId}`);
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: PROGRAMMES_KEYS.detail(variables.programmeId) });
            queryClient.invalidateQueries({ queryKey: PROGRAMMES_KEYS.matieres(variables.programmeId) });
        },
    });
}

export function useModifierMatiereProgramme() {
    const queryClient = useQueryClient();
    const { t } = useTranslation('programmes');

    return useMutation({
        mutationFn: async ({ id, ...dto }: { id: string; coefficient?: number; volumeHoraire?: number; obligatoire?: boolean; ordre?: number }) => {
            const response = await apiClient.patch<ProgrammeMatiere>(`/api/programmes/matieres/${id}`, dto);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PROGRAMMES_KEYS.all });
            toast.success(t('programmeMatiereModifie', 'Programme matière modifié'));
        },
    });
}

// ==== CHAPITRES ====

export function useTousChapitres(filtres?: {
    programmeMatiereId?: string;
    programmeId?: string;
    periodeId?: string;
    statut?: string;
    recherche?: string;
    page?: number;
    limit?: number;
}) {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: [...PROGRAMMES_KEYS.all, 'tous-chapitres', filtres],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filtres?.programmeMatiereId) params.set('programmeMatiereId', filtres.programmeMatiereId);
            if (filtres?.programmeId) params.set('programmeId', filtres.programmeId);
            if (filtres?.periodeId) params.set('periodeId', filtres.periodeId);
            if (filtres?.statut) params.set('statut', filtres.statut);
            if (filtres?.page) params.set('page', String(filtres.page));
            if (filtres?.limit) params.set('limit', String(filtres.limit));
            const response = await apiClient.get<ProgrammeChapitre[]>(
                `/api/programmes/chapitres?${params.toString()}`
            );
            const items = response.data || [];
            const pagination = (response as { pagination?: { totalItems: number; totalPages: number; page: number; limit: number } }).pagination;
            return { data: items, pagination };
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

export function useChapitresProgramme(programmeId: string) {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: PROGRAMMES_KEYS.chapitres(programmeId),
        queryFn: async () => {
            const response = await apiClient.get<ProgrammeChapitre[]>(`/api/programmes/${programmeId}/chapitres`);
            return response.data || [];
        },
        enabled: isAuthenticated && !!programmeId,
        staleTime: 5 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

export function useCreerChapitre() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: {
            programmeMatiereId: string;
            titre: string;
            description?: string;
            objectifsPedagogiques?: string;
            ordre?: number;
            dureePrevueHeures?: number;
            statut?: string;
            prerequis?: string[];
            ressourcesPedagogiques?: { type: string; titre: string; url?: string }[];
            competencesAssociees?: string[];
        }) => {
            const response = await apiClient.post<ProgrammeChapitre>('/api/programmes/chapitres', dto);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PROGRAMMES_KEYS.all });
        },
    });
}

export function useModifierChapitre() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...dto }: { id: string } & Omit<Partial<CreerChapitreDto>, 'programmeMatiereId'>) => {
            const response = await apiClient.patch<ProgrammeChapitre>(`/api/programmes/chapitres/${id}`, dto);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PROGRAMMES_KEYS.all });
        },
    });
}

export function useSupprimerChapitre() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/programmes/chapitres/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PROGRAMMES_KEYS.all });
        },
    });
}
