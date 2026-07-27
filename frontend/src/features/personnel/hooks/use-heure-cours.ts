import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface HeureCours {
    id: string;
    enseignantId: string;
    classeAnneeId: string;
    matiereId: string;
    periodeId?: string;
    salleId?: string;
    date: string;
    heureDebut: string;
    heureFin: string;
    statutEffectue: 'PLANIFIE' | 'EFFECTUE' | 'ANNULE' | 'REMPLACE';
    commentaire?: string;
    remplacantId?: string;
    classeAnnee?: { id: string; classe?: { id: string; nom: string }; anneeScolaire?: { id: string; nom: string } };
    matiere?: { id: string; nom: string };
    periode?: { id: string; nom: string };
    salle?: { id: string; nom: string };
    remplacant?: { id: string; nom: string; prenom: string };
}

export interface ResumeMensuelHeures {
    mois: number;
    annee: number;
    heuresEffectuees: number;
    heuresPlanifiees: number;
    heuresAnnulees: number;
    nombreCours: number;
    detailParMatiere?: Array<{ matiereNom: string; heures: number; tarifHoraire: number; montant: number }>;
}

export function useResumeMensuel(enseignantId: string, mois: number, annee: number) {
    return useQuery({
        queryKey: ['personnel', 'heures-cours', 'resume', enseignantId, mois, annee],
        queryFn: async () => {
            const response = await apiClient.get<ResumeMensuelHeures>(`/api/personnel/heures-cours/enseignants/${enseignantId}/resume-mensuel/${annee}/${mois}`);
            return response.data;
        },
        enabled: !!enseignantId,
    });
}

export function useEdtEnseignant(enseignantId: string, semaine?: string) {
    return useQuery({
        queryKey: ['personnel', 'heures-cours', 'edt', enseignantId, semaine],
        queryFn: async () => {
            const response = await apiClient.get<HeureCours[]>(`/api/personnel/heures-cours/enseignants/${enseignantId}/edt?semaine=${semaine}`);
            return response.data;
        },
        enabled: !!enseignantId && !!semaine,
        placeholderData: (previousData) => previousData,
    });
}

export function useVolumeHoraire(enseignantId: string, dateDebut: string, dateFin: string) {
    return useQuery({
        queryKey: ['personnel', 'heures-cours', 'volume', enseignantId, dateDebut, dateFin],
        queryFn: async () => {
            const response = await apiClient.get<{ heuresPrevues: number; heuresRealisees: number; tauxRealisation: number }>(
                `/api/personnel/heures-cours/enseignants/${enseignantId}/volume-horaire?dateDebut=${dateDebut}&dateFin=${dateFin}`
            );
            return response.data;
        },
        enabled: !!enseignantId && !!dateDebut && !!dateFin,
        placeholderData: (previousData) => previousData,
    });
}

export function useHeureCoursList(query?: Record<string, string | number | boolean>) {
    return useQuery({
        queryKey: ['personnel', 'heures-cours', 'list', query],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (query) {
                for (const [k, v] of Object.entries(query)) {
                    if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
                }
            }
            const response = await apiClient.get<{ items: HeureCours[]; total: number }>(`/api/personnel/heures-cours?${params}`);
            return response.data;
        },
        enabled: true,
    });
}

export function useHeureCoursById(id?: string) {
    return useQuery({
        queryKey: ['personnel', 'heures-cours', id],
        queryFn: async () => {
            const response = await apiClient.get<HeureCours>(`/api/personnel/heures-cours/${id}`);
            return response.data;
        },
        enabled: !!id,
    });
}

export function useCreateHeureCours() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: Partial<HeureCours>) => {
            const response = await apiClient.post<HeureCours>('/api/personnel/heures-cours', payload);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['personnel', 'heures-cours'] });
        },
    });
}

export function useUpdateHeureCours() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...payload }: { id: string } & Partial<HeureCours>) => {
            const response = await apiClient.patch<HeureCours>(`/api/personnel/heures-cours/${id}`, payload);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['personnel', 'heures-cours'] });
        },
    });
}

export function useDeleteHeureCours() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/personnel/heures-cours/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['personnel', 'heures-cours'] });
        },
    });
}

export function useGenererHeuresCoursFromEdt() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: {
            enseignantId: string;
            classeAnneeId?: string;
            dateDebut: string;
            dateFin: string;
            periodeId?: string;
        }) => {
            const response = await apiClient.post<{ created: number; skipped: number }>('/api/personnel/heures-cours/generer-from-edt', payload);
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['personnel', 'heures-cours', 'resume', variables.enseignantId] });
            queryClient.invalidateQueries({ queryKey: ['personnel', 'heures-cours', 'edt', variables.enseignantId] });
        },
    });
}
