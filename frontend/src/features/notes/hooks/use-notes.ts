/**
 * ==================================
 * eLISAschool - Hooks Notes
 * ==================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import type { Note, CreerNoteDto, CreerNoteEnMasseDto, ModifierNoteDto, NoteFiltres, StatistiquesNotes } from '../types/note.types';

const NOTES_KEYS = {
    all: ['notes'] as const,
    listes: () => [...NOTES_KEYS.all, 'liste'] as const,
    liste: (filtres: NoteFiltres) => [...NOTES_KEYS.listes(), filtres] as const,
    details: () => [...NOTES_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...NOTES_KEYS.details(), id] as const,
    stats: () => [...NOTES_KEYS.all, 'stats'] as const,
    statsPeriode: (periodeId: string) => [...NOTES_KEYS.stats(), periodeId] as const,
};

export function useNotes(filtres: NoteFiltres = {}) {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: NOTES_KEYS.liste(filtres),
        queryFn: async () => {
            const response = await apiClient.getPaginated<Note>('/api/notes', {
                page: filtres.page || 1,
                limit: filtres.limit || 20,
                ...filtres,
            });
            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

export function useNote(id: string) {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: NOTES_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: Note }>(`/api/notes/${id}`);
            return response.data?.data;
        },
        enabled: !!id && isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

export function useStatistiquesNotes(periodeId: string) {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: NOTES_KEYS.statsPeriode(periodeId),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: StatistiquesNotes }>(`/api/notes/statistiques/${periodeId}`);
            return response.data?.data;
        },
        enabled: !!periodeId && isAuthenticated,
        staleTime: 10 * 60 * 1000,
    });
}

export function useCreerNote() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerNoteDto) => {
            const response = await apiClient.post<{ success: boolean; data: Note }>('/api/notes', dto);
            return response.data?.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: NOTES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: NOTES_KEYS.stats() });
            toast.success('Note ajoutée avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de l\'ajout');
        },
    });
}

export function useCreerNotesEnMasse() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerNoteEnMasseDto) => {
            const response = await apiClient.post<{ success: boolean; data: Note[] }>('/api/notes/en-masse', dto);
            return response.data?.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: NOTES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: NOTES_KEYS.stats() });
            toast.success(`${variables.notes.length} notes ajoutées avec succès`);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de l\'ajout en masse');
        },
    });
}

export function useModifierNote() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...dto }: ModifierNoteDto) => {
            const response = await apiClient.patch<{ success: boolean; data: Note }>(`/api/notes/${id}`, dto);
            return response.data?.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: NOTES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: NOTES_KEYS.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: NOTES_KEYS.stats() });
            toast.success('Note modifiée avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la modification');
        },
    });
}

export function useSupprimerNote() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/notes/${id}`);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: NOTES_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: NOTES_KEYS.stats() });
            toast.success('Note supprimée avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la suppression');
        },
    });
}
