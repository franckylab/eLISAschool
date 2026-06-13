/**
 * ==================================
 * eLISAschool - Hooks Messagerie
 * ==================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import type { Message, CreerMessageDto, MessageFiltres, StatistiquesMessagerie } from '../types/messagerie.types';

const MESSAGERIE_KEYS = {
    messages: {
        all: ['messagerie', 'messages'] as const,
        liste: (filtres: MessageFiltres) => [...MESSAGERIE_KEYS.messages.all, filtres] as const,
        detail: (id: string) => [...MESSAGERIE_KEYS.messages.all, 'detail', id] as const,
        nonLus: () => [...MESSAGERIE_KEYS.messages.all, 'non-lus'] as const,
    },
    stats: () => ['messagerie', 'stats'] as const,
};

export function useMessages(filtres: MessageFiltres = {}) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: MESSAGERIE_KEYS.messages.liste(filtres),
        queryFn: async () => {
            const response = await apiClient.getPaginated<Message>('/api/messagerie/messages', {
                page: filtres.page || 1,
                limit: filtres.limit || 20,
                ...filtres,
            });
            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 2 * 60 * 1000,
    });
}

export function useMessage(id: string) {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: MESSAGERIE_KEYS.messages.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: Message }>(`/api/messagerie/messages/${id}`);
            return response.data?.data;
        },
        enabled: !!id,
        enabled: isAuthenticated,
        staleTime: 2 * 60 * 1000,
    });
}

export function useMessagesNonLus() {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: MESSAGERIE_KEYS.messages.nonLus(),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: { count: number } }>('/api/messagerie/messages/non-lus/count');
            return response.data?.data.count;
        },
        enabled: isAuthenticated,
        staleTime: 1 * 60 * 1000,
    });
}

export function useStatistiquesMessagerie() {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: MESSAGERIE_KEYS.stats(),
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: StatistiquesMessagerie }>('/api/messagerie/statistiques');
            return response.data?.data;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

export function useEnvoyerMessage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerMessageDto) => {
            const response = await apiClient.post<{ success: boolean; data: Message }>('/api/messagerie/messages', dto);
            return response.data?.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: MESSAGERIE_KEYS.messages.all });
            queryClient.invalidateQueries({ queryKey: MESSAGERIE_KEYS.stats() });
            toast.success('Message envoyé avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de l\'envoi');
        },
    });
}

export function useMarquerCommeLu() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await apiClient.patch<any>(`/api/messagerie/messages/${id}/lu`);
            return response.data?.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: MESSAGERIE_KEYS.messages.all });
            queryClient.invalidateQueries({ queryKey: MESSAGERIE_KEYS.messages.nonLus() });
            queryClient.invalidateQueries({ queryKey: MESSAGERIE_KEYS.stats() });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors du marquage');
        },
    });
}

export function useSupprimerMessage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/messagerie/messages/${id}`);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: MESSAGERIE_KEYS.messages.all });
            queryClient.invalidateQueries({ queryKey: MESSAGERIE_KEYS.stats() });
            toast.success('Message supprimé avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la suppression');
        },
    });
}
