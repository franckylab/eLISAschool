/**
 * ==================================
 * eLISAschool - Hooks Notes
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * Hooks TanStack Query du module Notes.
 * Endpoints backend : /api/notes, /api/notes/bulk, /api/notes/statistiques.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';
import { useHandleError } from './use-handle-error';
import type {
    Note,
    CreerNoteDto,
    CreerNotesEnMasseDto,
    ModifierNoteDto,
    NoteFiltres,
    StatistiquesNotes,
    StatistiquesNotesFiltres,
} from '../types/note.types';

export const NOTES_KEYS = {
    all: ['notes'] as const,
    listes: () => [...NOTES_KEYS.all, 'liste'] as const,
    liste: (filtres: NoteFiltres) => [...NOTES_KEYS.listes(), filtres] as const,
    details: () => [...NOTES_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...NOTES_KEYS.details(), id] as const,
    stats: () => [...NOTES_KEYS.all, 'stats'] as const,
    statistiques: (filtres: StatistiquesNotesFiltres) => [...NOTES_KEYS.stats(), filtres] as const,
};

/**
 * Ne conserve que les paramètres non vides (le backend valide strictement les query params).
 */
function nettoyerParams(source: Record<string, string | number | undefined>): Record<string, string | number> {
    const params: Record<string, string | number> = {};
    for (const [cle, valeur] of Object.entries(source)) {
        if (valeur !== undefined && valeur !== '') {
            params[cle] = valeur;
        }
    }
    return params;
}

export function useNotes(filtres: NoteFiltres = {}) {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: NOTES_KEYS.liste(filtres),
        queryFn: async () => {
            const response = await apiClient.getPaginated<Note>('/api/notes', {
                page: filtres.page || 1,
                limit: filtres.limit || 20,
                ...nettoyerParams({
                    recherche: filtres.recherche,
                    eleveId: filtres.eleveId,
                    matiereId: filtres.matiereId,
                    classeAnneeId: filtres.classeAnneeId,
                    periodeId: filtres.periodeId,
                    typeEvaluation: filtres.typeEvaluation,
                    statut: filtres.statut,
                    sortBy: filtres.sortBy,
                    sortOrder: filtres.sortOrder,
                }),
            });
            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

export function useNote(id: string) {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: NOTES_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<Note>(`/api/notes/${id}`);
            return response.data;
        },
        enabled: !!id && isAuthenticated,
        staleTime: 5 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

/**
 * Statistiques de notes — GET /api/notes/statistiques?periodeId&classeAnneeId&matiereId&eleveId.
 */
export function useStatistiquesNotes(filtres: StatistiquesNotesFiltres = {}, enabled: boolean = true) {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: NOTES_KEYS.statistiques(filtres),
        queryFn: async () => {
            const response = await apiClient.get<StatistiquesNotes>(
                '/api/notes/statistiques',
                nettoyerParams({
                    periodeId: filtres.periodeId,
                    classeAnneeId: filtres.classeAnneeId,
                    matiereId: filtres.matiereId,
                    eleveId: filtres.eleveId,
                })
            );
            return response.data;
        },
        enabled: isAuthenticated && enabled,
        staleTime: 10 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

export function useCreerNote() {
    const queryClient = useQueryClient();
    const { t } = useTranslation('notes');
    const handleError = useHandleError();

    return useMutation({
        mutationFn: async (dto: CreerNoteDto) => {
            const response = await apiClient.post<Note>('/api/notes', dto);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: NOTES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: NOTES_KEYS.stats() });
            toast.success(t('toastNoteCreee'));
        },
        onError: (e: unknown) => handleError(e, t('erreurCreation')),
    });
}

/**
 * Saisie en masse — POST /api/notes/bulk.
 */
export function useCreerNotesEnMasse() {
    const queryClient = useQueryClient();
    const { t } = useTranslation('notes');
    const handleError = useHandleError();

    return useMutation({
        mutationFn: async (dto: CreerNotesEnMasseDto) => {
            const response = await apiClient.post<Note[]>('/api/notes/bulk', dto);
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: NOTES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: NOTES_KEYS.stats() });
            toast.success(t('toastNotesEnMasse', { count: variables.notes.length }));
        },
        onError: (e: unknown) => handleError(e, t('erreurCreationMasse')),
    });
}

export function useModifierNote() {
    const queryClient = useQueryClient();
    const { t } = useTranslation('notes');
    const handleError = useHandleError();

    return useMutation({
        mutationFn: async ({ id, ...dto }: ModifierNoteDto) => {
            const response = await apiClient.patch<Note>(`/api/notes/${id}`, dto);
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: NOTES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: NOTES_KEYS.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: NOTES_KEYS.stats() });
            toast.success(t('toastNoteModifiee'));
        },
        onError: (e: unknown) => handleError(e, t('erreurModification')),
    });
}

export function useSupprimerNote() {
    const queryClient = useQueryClient();
    const { t } = useTranslation('notes');
    const handleError = useHandleError();

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/notes/${id}`);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: NOTES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: NOTES_KEYS.stats() });
            toast.success(t('toastNoteSupprimee'));
        },
        onError: (e: unknown) => handleError(e, t('erreurSuppression')),
    });
}
