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
    enseignant?: { id: string; matricule?: string; utilisateur?: { profil?: { nom: string; prenom: string } } };
    classeAnnee?: { id: string; classe?: { id: string; nom: string; code?: string }; anneeScolaire?: { id: string; nom: string; libelle?: string } };
    matiere?: { id: string; nom: string; code?: string; couleur?: string };
    periode?: { id: string; nom: string };
    salle?: { id: string; nom: string; code?: string; capacite?: number; typeSalle?: string };
    remplacant?: { id: string; utilisateur?: { profil?: { nom: string; prenom: string } } };
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
            const response = await apiClient.get<ResumeMensuelHeures>(`/api/emploi-du-temps/heures-cours/enseignants/${enseignantId}/resume-mensuel/${annee}/${mois}`);
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
            const response = await apiClient.get<{
                items: HeureCours[];
                meta: { totalItems: number; itemCount: number; itemsPerPage: number; totalPages: number; currentPage: number };
            }>(`/api/emploi-du-temps/heures-cours?${params}`);
            return response.data;
        },
        enabled: true,
    });
}

export function useCreateHeureCours() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: Partial<HeureCours>) => {
            const response = await apiClient.post<HeureCours>('/api/emploi-du-temps/heures-cours', payload);
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
            const response = await apiClient.patch<HeureCours>(`/api/emploi-du-temps/heures-cours/${id}`, payload);
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
            await apiClient.delete(`/api/emploi-du-temps/heures-cours/${id}`);
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
    detailParMatiere: Array<{
        matiereId: string;
        matiereNom: string;
        creees: number;
        ignorees: number;
    }>;
}

// ─── Preview Heures de Cours ─────────────────────────────

export interface CreneauPreviewHC {
    creneauId: string;
    jour: string;
    heureDebut: string;
    heureFin: string;
    matiereId: string;
    matiereNom: string;
    matiereCouleur: string | null;
    classeAnneeId: string;
    classeNom: string;
    enseignantId: string;
    enseignantNom: string;
    salleNom: string | null;
    volumeMinutes: number;
}

export interface DetailMatierePreview {
    matiereId: string;
    matiereNom: string;
    matiereCouleur: string | null;
    classeNom: string;
    creneaux: number;
    heures: number;
}

export interface DetailJourPreview {
    date: string;
    jour: string;
    creneaux: number;
    heures: number;
}

export interface PreviewHeuresCoursResult {
    creneaux: CreneauPreviewHC[];
    stats: {
        totalCreneaux: number;
        totalHeures: number;
        joursCouverts: number;
        matieresCouvertes: number;
        detailParMatiere: DetailMatierePreview[];
        detailParJour: DetailJourPreview[];
    };
}

export function usePrevisualiserHeuresCours() {
    const handleError = useHandleError();
    return useMutation({
        mutationFn: async (payload: {
            affectationMatiereIds?: string[];
            enseignantId?: string;
            classeAnneeId?: string;
            dateDebut: string;
            dateFin: string;
            periodeId?: string;
        }) => {
            const response = await apiClient.post<PreviewHeuresCoursResult>('/api/emploi-du-temps/heures-cours/previsualiser', payload);
            return response.data;
        },
        onError: (err: unknown) => {
            handleError(err, 'Erreur de prévisualisation');
        },
    });
}

export function useGenererHeuresCoursFromEdt() {
    const queryClient = useQueryClient();
    const { t } = useTranslation('personnel');
    const handleError = useHandleError();
    return useMutation({
        mutationFn: async (payload: {
            affectationMatiereIds?: string[];
            enseignantId?: string;
            classeAnneeId?: string;
            dateDebut: string;
            dateFin: string;
            periodeId?: string;
        }) => {
            const response = await apiClient.post<GenererHeuresCoursResult>('/api/emploi-du-temps/heures-cours/generer-from-edt', payload);
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

// ─── Statistiques globales (page Heures de cours) ─────────────

export interface StatistiquesGlobalesHeures {
    totalHeures: number;
    heuresEffectuees: number;
    heuresAnnulees: number;
    heuresRemplacees: number;
    heuresPlanifiees: number;
    tauxEffectuation: number;
    tauxAnnulation: number;
    tauxRemplacement: number;
    volumeSemaine: number;
    volumeMois: number;
}

export function useStatistiquesGlobales(filtres?: Record<string, string | undefined>) {
    return useQuery({
        queryKey: ['personnel', 'heures-cours', 'statistiques-globales', filtres],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filtres) {
                for (const [k, v] of Object.entries(filtres)) {
                    if (v !== undefined && v !== '') params.set(k, v);
                }
            }
            const response = await apiClient.get<StatistiquesGlobalesHeures>(
                `/api/emploi-du-temps/heures-cours/statistiques-globales?${params}`,
            );
            return response.data;
        },
        staleTime: 5 * 60 * 1000, // 5 min
    });
}

// ─── Export CSV ─────────────────────────────────────────────────

export function useExportHeuresCoursCSV() {
    const { t } = useTranslation('emplois');
    const handleError = useHandleError();

    return useMutation({
        mutationFn: async (query?: Record<string, string | undefined>) => {
            const params = new URLSearchParams();
            if (query) {
                for (const [k, v] of Object.entries(query)) {
                    if (v !== undefined && v !== '') params.set(k, v);
                }
            }
            const response = await apiClient.get<Blob>(
                `/api/emploi-du-temps/heures-cours/export/csv?${params}`,
                { responseType: 'blob' },
            );
            return response.data;
        },
        onSuccess: (blob) => {
            if (!blob) return;
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `heures-cours-${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            toast.success(t('export.csvSucces'));
        },
        onError: (err: unknown) => {
            handleError(err, t('export.csvErreur'));
        },
    });
}

export function useExportHeuresCoursHTML() {
    const { t } = useTranslation('emplois');
    const handleError = useHandleError();

    return useMutation({
        mutationFn: async (query?: Record<string, string | undefined>) => {
            const params = new URLSearchParams();
            if (query) {
                for (const [k, v] of Object.entries(query)) {
                    if (v !== undefined && v !== '') params.set(k, v);
                }
            }
            const response = await apiClient.get<string>(
                `/api/emploi-du-temps/heures-cours/export/html?${params}`,
                { responseType: 'text' as any },
            );
            return response.data;
        },
        onSuccess: (html) => {
            if (!html) return;
            const blob = new Blob([html], { type: 'text/html' });
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
            setTimeout(() => window.URL.revokeObjectURL(url), 5000);
            toast.success(t('export.htmlSucces', { defaultValue: 'Export HTML ouvert dans un nouvel onglet' }));
        },
        onError: (err: unknown) => {
            handleError(err, t('export.htmlErreur', { defaultValue: 'Erreur lors de l\'export HTML' }));
        },
    });
}
