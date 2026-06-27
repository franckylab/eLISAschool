/**
 * ==================================
 * eLISAschool - Hooks Emploi-du-Temps
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * Date: 2026-06-14
 * 
 * Hooks TanStack Query pour le module emploi-du-temps
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

// Types
export interface Creneau {
    id: string;
    classeAnneeId: string;
    matiereId: string;
    enseignantId: string;
    salleId?: string;
    jour: string;
    heureDebut: string;
    heureFin: string;
    typeCreneau: string;
    genereAutomatiquement: boolean;
    actif: boolean;
    classeAnnee?: { 
        id: string; 
        classe: { id: string; nom: string; niveau: string };
        anneeScolaire: { id: string; nom: string; anneeDebut: number };
    };
    matiere?: { id: string; nom: string; code?: string };
    enseignant?: { id: string; nom: string; prenom: string };
}

export interface PreferenceEDT {
    id: string;
    etablissementId: string;
    joursTravailles: string[];
    heureDebutCours: string;
    heureFinCours: string;
    dureeCreneauDefaut: number;
}

export interface TemplateEDT {
    id: string;
    nom: string;
    description?: string;
    etablissementId: string;
    configuration: any;
    creneauxTypes: any[];
    actif: boolean;
    estPartage: boolean;
    createdAt: string;
}

// Clés de requête
const EDT_KEYS = {
    creneaux: {
        all: ['emploi-du-temps'] as const,
        classeAnnee: (classeAnneeId: string) => 
            [...EDT_KEYS.creneaux.all, 'classeAnnee', classeAnneeId] as const,
        enseignant: (enseignantId: string, anneeScolaireId: string) => 
            [...EDT_KEYS.creneaux.all, 'enseignant', enseignantId, anneeScolaireId] as const,
    },
    preferences: ['emploi-du-temps', 'preferences'] as const,
    templates: {
        all: ['emploi-du-temps', 'templates'] as const,
        detail: (id: string) => [...EDT_KEYS.templates.all, id] as const,
    },
};

// ==========================================
// CRUD Créneaux
// ==========================================

export function useCreneauxByClasseAnnee(classeAnneeId: string) {
    return useQuery({
        queryKey: EDT_KEYS.creneaux.classeAnnee(classeAnneeId),
        queryFn: async () => {
            const response = await apiClient.get<{ data: Creneau[] }>(
                `/api/emploi-du-temps/classe-annee/${classeAnneeId}`
            );
            return response.data;
        },
        enabled: !!classeAnneeId,
        staleTime: 2 * 60 * 1000, // 2 min
    });
}

export function useCreneauxByEnseignant(enseignantId: string, anneeScolaireId: string) {
    return useQuery({
        queryKey: EDT_KEYS.creneaux.enseignant(enseignantId, anneeScolaireId),
        queryFn: async () => {
            const response = await apiClient.get<{ data: Creneau[] }>(
                `/api/emploi-du-temps/enseignant/${enseignantId}`,
                { anneeScolaireId }
            );
            return response.data;
        },
        enabled: !!enseignantId && !!anneeScolaireId,
    });
}

export function useCreerCreneau() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: any) => {
            const response = await apiClient.post<{ data: Creneau }>(
                '/api/emploi-du-temps',
                dto
            );
            return response.data;
        },
        onSuccess: (data, variables) => {
            // Invalider les requêtes concernées
            queryClient.invalidateQueries({
                queryKey: EDT_KEYS.creneaux.classe(variables.classeId, variables.anneeScolaireId),
            });
            queryClient.invalidateQueries({
                queryKey: EDT_KEYS.creneaux.enseignant(variables.enseignantId, variables.anneeScolaireId),
            });
            toast.success('Créneau créé avec succès');
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.error?.message || 'Erreur lors de la création');
        },
    });
}

export function useSupprimerCreneau() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/emploi-du-temps/${id}`);
        },
        onSuccess: (_, variables) => {
            // Invalider toutes les listes de créneaux
            queryClient.invalidateQueries({ queryKey: EDT_KEYS.creneaux.all });
            toast.success('Créneau supprimé');
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.error?.message || 'Erreur lors de la suppression');
        },
    });
}

// ==========================================
// Génération Automatique
// ==========================================

export function useGenererEDT() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: {
            classeId: string;
            anneeScolaireId: string;
            etablissementId: string;
            options?: { regenerer?: boolean; respecterContraintes?: boolean };
        }) => {
            const response = await apiClient.post<{
                success: boolean;
                message: string;
                data: { nombreCreneaux: number; conflits: string[] };
            }>('/api/emploi-du-temps/generer', dto);
            return response.data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: EDT_KEYS.creneaux.classe(variables.classeId, variables.anneeScolaireId),
            });
            
            if (data?.success) {
                toast.success(data.message);
            } else {
                const conflits = data?.data?.conflits?.length || 0;
                toast.warning(`${data?.message || 'Erreur'}\n${conflits} conflits détectés`);
            }
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.error?.message || 'Erreur lors de la génération');
        },
    });
}

// ==========================================
// Préférences
// ==========================================

export function usePreferencesEDT() {
    return useQuery({
        queryKey: EDT_KEYS.preferences,
        queryFn: async () => {
            const response = await apiClient.get<{ data: PreferenceEDT }>(
                '/api/emploi-du-temps/preferences'
            );
            return response.data;
        },
        staleTime: 5 * 60 * 1000, // 5 min
    });
}

export function useUpdatePreferencesEDT() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: Partial<PreferenceEDT>) => {
            const response = await apiClient.put<{ data: PreferenceEDT }>(
                '/api/emploi-du-temps/preferences',
                dto
            );
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: EDT_KEYS.preferences });
            toast.success('Préférences mises à jour');
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.error?.message || 'Erreur lors de la mise à jour');
        },
    });
}

// ==========================================
// Templates
// ==========================================

export function useTemplatesEDT() {
    return useQuery({
        queryKey: EDT_KEYS.templates.all,
        queryFn: async () => {
            const response = await apiClient.get<{ data: TemplateEDT[] }>(
                '/api/emploi-du-temps/templates'
            );
            return response.data;
        },
        staleTime: 10 * 60 * 1000, // 10 min
    });
}

export function useTemplateEDT(id: string) {
    return useQuery({
        queryKey: EDT_KEYS.templates.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<{ data: TemplateEDT }>(
                `/api/emploi-du-temps/templates/${id}`
            );
            return response.data;
        },
        enabled: !!id,
    });
}

export function useCreerTemplateEDT() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: any) => {
            const response = await apiClient.post<{ data: TemplateEDT }>(
                '/api/emploi-du-temps/templates',
                dto
            );
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: EDT_KEYS.templates.all });
            toast.success('Template créé avec succès');
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.error?.message || 'Erreur lors de la création');
        },
    });
}

export function useSupprimerTemplateEDT() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/emploi-du-temps/templates/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: EDT_KEYS.templates.all });
            toast.success('Template supprimé');
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.error?.message || 'Erreur lors de la suppression');
        },
    });
}

export function useDupliquerTemplateEDT() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, nom }: { id: string; nom?: string }) => {
            const response = await apiClient.post<{ data: TemplateEDT }>(
                `/api/emploi-du-temps/templates/${id}/dupliquer`,
                { nom }
            );
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: EDT_KEYS.templates.all });
            toast.success('Template dupliqué');
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.error?.message || 'Erreur lors de la duplication');
        },
    });
}
