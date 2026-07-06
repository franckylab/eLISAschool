import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';
import type {
    ProgrammePedagogique,
    CreerProgrammeDto,
    ModifierProgrammeDto,
    ProgrammeFiltres,
    ProgrammeMatiere,
    AddMatiereDto,
} from '../types/programme.types';

const PROGRAMMES_KEYS = {
    all: ['programmes'] as const,
    lists: () => [...PROGRAMMES_KEYS.all, 'list'] as const,
    list: (filtres?: ProgrammeFiltres) => [...PROGRAMMES_KEYS.lists(), filtres] as const,
    details: () => [...PROGRAMMES_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...PROGRAMMES_KEYS.details(), id] as const,
    matieres: (id: string) => [...PROGRAMMES_KEYS.detail(id), 'matieres'] as const,
};

export function useProgrammes(filtres?: ProgrammeFiltres) {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: PROGRAMMES_KEYS.list(filtres),
        queryFn: async () => {
            const params: Record<string, any> = {
                page: filtres?.page || 1,
                limit: filtres?.limit || 20,
                sortBy: filtres?.sortBy || 'nom',
                sortOrder: filtres?.sortOrder || 'ASC',
            };
            if (filtres?.recherche) params.search = filtres.recherche;
            if (filtres?.cycleId) params.cycleId = filtres.cycleId;
            if (filtres?.niveauId) params.niveauId = filtres.niveauId;
            if (filtres?.type) params.type = filtres.type;
            if (filtres?.actif !== undefined) params.actif = filtres.actif;

            const response = await apiClient.get<{
                data: ProgrammePedagogique[];
                meta: {
                    totalItems: number;
                    currentPage: number;
                    totalPages: number;
                    itemsPerPage: number;
                    itemCount: number;
                    hasNextPage: boolean;
                    hasPrevPage: boolean;
                };
            }>('/api/programmes', params);

            if (!response.data) {
                throw new Error('Programmes pédagogiques non disponibles');
            }
            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

export function useProgrammeDetail(id: string) {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: PROGRAMMES_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<{ data: ProgrammePedagogique }>(
                `/api/programmes/${id}`
            );
            if (!response.data) {
                throw new Error('Programme pédagogique non trouvé');
            }
            return response.data;
        },
        enabled: isAuthenticated && !!id,
        staleTime: 10 * 60 * 1000,
    });
}

export function useProgrammeMatieres(id: string) {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: PROGRAMMES_KEYS.matieres(id),
        queryFn: async () => {
            const response = await apiClient.get<{ data: ProgrammeMatiere[] }>(
                `/api/programmes/${id}/matieres`
            );
            return response.data || [];
        },
        enabled: isAuthenticated && !!id,
        staleTime: 5 * 60 * 1000,
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
        mutationFn: async ({ programmeId, pmId }: { programmeId: string; pmId: string }) => {
            await apiClient.delete(`/api/programmes/matieres/${pmId}`);
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: PROGRAMMES_KEYS.detail(variables.programmeId) });
            queryClient.invalidateQueries({ queryKey: PROGRAMMES_KEYS.matieres(variables.programmeId) });
        },
    });
}
