import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { useHandleError } from '@/hooks/use-handle-error';

export interface HeureCours {
    id: string;
    enseignantId: string;
    classeAnneeId: string;
    matiereId: string;
    periodeId?: string;
    creneauId?: string;
    affectationMatiereId?: string;
    salleId?: string;
    date: string;
    heureDebut: string;
    heureFin: string;
    statutEffectue: 'PLANIFIE' | 'EFFECTUE' | 'ANNULE' | 'REMPLACE';
    typeCreneau: 'COURS' | 'TP' | 'TD' | 'RECREATION' | 'ETUDE' | 'PERMANENCE' | 'AUTRE';
    commentaire?: string;
    remplacantId?: string;
    updatedAt?: string;
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

export interface GenererHeuresCoursResult {
    created: number;
    skipped: number;
    errors: number;
    total: number;
}

export function useGenererHeuresCoursFromEdt() {
    const queryClient = useQueryClient();
    const { t } = useTranslation('personnel');
    const handleError = useHandleError();
    return useMutation({
        mutationFn: async (payload: {
            enseignantId: string;
            classeAnneeId?: string;
            dateDebut: string;
            dateFin: string;
            periodeId?: string;
        }) => {
            const response = await apiClient.post<GenererHeuresCoursResult>('/api/personnel/heures-cours/generer-from-edt', payload);
            return response.data;
        },
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['personnel', 'heures-cours'] });
            queryClient.invalidateQueries({ queryKey: ['emploi-du-temps'] });
            toast.success(t('heuresCours.generationReussie', { created: result?.created ?? 0, skipped: result?.skipped ?? 0 }));
        },
        onError: (err: unknown) => {
            handleError(err, t('heuresCours.erreurGeneration'));
        },
    });
}
