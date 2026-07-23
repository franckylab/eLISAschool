import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import type {
    Enseignant, EnseignantFiltres,
    AffectationEnseignant, EdtEnseignant,
    EvaluationEnseignant, ContratEnseignant,
    BulletinPaie, ParcoursComplet,
    AbsenceEnseignant, AssiduiteStats,
    AffectationPayload,
} from '../types/enseignant.types';

const ENSEIGNANTS_KEYS = {
    all: ['enseignants'] as const,
    listes: () => [...ENSEIGNANTS_KEYS.all, 'liste'] as const,
    liste: (filtres: EnseignantFiltres) => [...ENSEIGNANTS_KEYS.listes(), filtres] as const,
    details: () => [...ENSEIGNANTS_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...ENSEIGNANTS_KEYS.details(), id] as const,
    affectationsMatiere: (id: string) => [...ENSEIGNANTS_KEYS.all, 'affectations-matiere', id] as const,
    evaluations: (id: string) => [...ENSEIGNANTS_KEYS.all, 'evaluations', id] as const,
    moyenneEval: (id: string) => [...ENSEIGNANTS_KEYS.all, 'evaluations', id, 'moyenne'] as const,
    heures: (id: string) => [...ENSEIGNANTS_KEYS.all, 'heures', id] as const,
    edt: (id: string, semaine: string) => [...ENSEIGNANTS_KEYS.all, 'edt', id, semaine] as const,
    absences: (id: string) => [...ENSEIGNANTS_KEYS.all, 'absences', id] as const,
    assiduite: (id: string) => [...ENSEIGNANTS_KEYS.all, 'absences', id, 'assiduite'] as const,
    contrats: (id: string) => [...ENSEIGNANTS_KEYS.all, 'contrats', id] as const,
    bulletins: (id: string) => [...ENSEIGNANTS_KEYS.all, 'bulletins', id] as const,
    parcours: (id: string) => [...ENSEIGNANTS_KEYS.all, 'parcours', id] as const,
};

export function useListeEnseignants(filtres: EnseignantFiltres = {}) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ENSEIGNANTS_KEYS.liste(filtres),
        queryFn: async () => {
            const params: Record<string, any> = { page: filtres.page || 1, limit: filtres.limit || 20 };
            if (filtres.recherche) params.recherche = filtres.recherche;
            if (filtres.actif !== undefined) params.actif = filtres.actif;
            const response = await apiClient.getPaginated<Enseignant>('/api/personnel', params);
            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

export function useEnseignant(id: string) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ENSEIGNANTS_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<Enseignant>(`/api/personnel/${id}`);
            return response.data;
        },
        enabled: !!id && isAuthenticated,
        placeholderData: (previousData) => previousData,
    });
}

export function useEnseignantAffectationsMatiere(enseignantId: string) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ENSEIGNANTS_KEYS.affectationsMatiere(enseignantId),
        queryFn: async () => {
            const response = await apiClient.get<AffectationEnseignant[]>(
                `/api/matieres/enseignants/${enseignantId}/affectations`
            );
            return response.data;
        },
        enabled: !!enseignantId && isAuthenticated,
        placeholderData: (previousData) => previousData,
    });
}

export function useEnseignantEdt(enseignantId: string, semaine?: string, periodeId?: string) {
    const { isAuthenticated } = useAuthStore();
    const now = new Date();
    const defaultSemaine = now.toISOString().split('T')[0];
    const s = semaine || defaultSemaine;
    return useQuery({
        queryKey: [...ENSEIGNANTS_KEYS.edt(enseignantId, s), periodeId || '__all__'],
        queryFn: async () => {
            const params = new URLSearchParams({ semaine: s });
            if (periodeId) params.set('periodeId', periodeId);
            const response = await apiClient.get<EdtEnseignant>(
                `/api/personnel/heures-cours/enseignants/${enseignantId}/edt?${params.toString()}`
            );
            return response.data;
        },
        enabled: !!enseignantId && isAuthenticated,
    });
}

export function useEnseignantEvaluations(enseignantId: string) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ENSEIGNANTS_KEYS.evaluations(enseignantId),
        queryFn: async () => {
            const response = await apiClient.get<{ items: EvaluationEnseignant[]; meta: any }>(
                `/api/personnel/evaluations?enseignantId=${enseignantId}&limit=100`
            );
            return response.data?.items ?? [];
        },
        enabled: !!enseignantId && isAuthenticated,
        placeholderData: (previousData) => previousData,
    });
}

function getAnneeScolaireDates(): { dateDebut: string; dateFin: string } {
    const now = new Date();
    const mois = now.getMonth() + 1;
    const anneeCourante = now.getFullYear();
    if (mois >= 9) {
        return {
            dateDebut: `${anneeCourante}-09-01`,
            dateFin: `${anneeCourante + 1}-07-31`,
        };
    }
    return {
        dateDebut: `${anneeCourante - 1}-09-01`,
        dateFin: `${anneeCourante}-07-31`,
    };
}

export function useEnseignantMoyenneEvaluations(enseignantId: string) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ENSEIGNANTS_KEYS.moyenneEval(enseignantId),
        queryFn: async () => {
            const { dateDebut, dateFin } = getAnneeScolaireDates();
            const response = await apiClient.get<any>(
                `/api/personnel/evaluations/enseignants/${enseignantId}/moyenne-evaluations?dateDebut=${dateDebut}&dateFin=${dateFin}`
            );
            return {
                moyenne: parseFloat(response.data?.moyenne) || 0,
                total: response.data?.nombreEvaluations || 0,
            };
        },
        enabled: !!enseignantId && isAuthenticated,
        placeholderData: (previousData) => previousData,
    });
}

export function useEnseignantHeures(enseignantId: string, periodeId?: string) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: [...ENSEIGNANTS_KEYS.heures(enseignantId), periodeId || '__all__'],
        queryFn: async () => {
            const now = new Date();
            const dateDebut = new Date(now.getFullYear(), 8, 1).toISOString().split('T')[0];
            const dateFin = new Date(now.getFullYear() + 1, 6, 31).toISOString().split('T')[0];
            const params = new URLSearchParams({ dateDebut, dateFin });
            if (periodeId) params.set('periodeId', periodeId);
            const response = await apiClient.get<{ totalHeures: number; heuresParSemaine: number; nbSemaines: number }>(
                `/api/personnel/heures-cours/enseignants/${enseignantId}/volume-horaire?${params.toString()}`
            );
            return response.data ?? { totalHeures: 0, heuresParSemaine: 0, nbSemaines: 0 };
        },
        enabled: !!enseignantId && isAuthenticated,
    });
}

export function useEnseignantAssiduite(enseignantId: string) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ENSEIGNANTS_KEYS.assiduite(enseignantId),
        queryFn: async () => {
            const now = new Date();
            const dateDebut = new Date(now.getFullYear(), 8, 1).toISOString().split('T')[0];
            const dateFin = new Date(now.getFullYear() + 1, 6, 31).toISOString().split('T')[0];
            const response = await apiClient.get<any>(
                `/api/personnel/absences/membres/${enseignantId}/assiduite?dateDebut=${dateDebut}&dateFin=${dateFin}`
            );
            const d = response.data;
            return {
                totalAbsences: d.totalAbsences ?? 0,
                justifiees: d.absencesJustifiees ?? 0,
                nonJustifiees: d.absencesNonJustifiees ?? 0,
                tauxAbsenteisme: d.tauxPresence != null ? (100 - d.tauxPresence) / 100 : 0,
                periode: { dateDebut, dateFin },
            } satisfies AssiduiteStats;
        },
        enabled: !!enseignantId && isAuthenticated,
        placeholderData: (previousData) => previousData,
    });
}

export function useEnseignantAbsences(enseignantId: string) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ENSEIGNANTS_KEYS.absences(enseignantId),
        queryFn: async () => {
            const response = await apiClient.get<{ items: AbsenceEnseignant[]; meta: any }>(
                `/api/personnel/absences?membrePersonnelId=${enseignantId}&limit=50`
            );
            return {
                items: response.data?.items ?? [],
                total: response.data?.meta?.totalItems ?? response.data?.items?.length ?? 0,
            };
        },
        enabled: !!enseignantId && isAuthenticated,
        placeholderData: (previousData) => previousData,
    });
}

export function useEnseignantContrats(enseignantId: string) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ENSEIGNANTS_KEYS.contrats(enseignantId),
        queryFn: async () => {
            const response = await apiClient.get<ContratEnseignant[]>(
                `/api/personnel/contrats/membres/${enseignantId}/historique`
            );
            return response.data;
        },
        enabled: !!enseignantId && isAuthenticated,
        placeholderData: (previousData) => previousData,
    });
}

export function useEnseignantBulletins(enseignantId: string) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ENSEIGNANTS_KEYS.bulletins(enseignantId),
        queryFn: async () => {
            const response = await apiClient.get<{ items: BulletinPaie[] }>(
                `/api/paie/bulletins/membres/${enseignantId}`
            );
            return response.data?.items ?? [];
        },
        enabled: !!enseignantId && isAuthenticated,
        placeholderData: (previousData) => previousData,
    });
}

export function useEnseignantParcours(enseignantId: string) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ENSEIGNANTS_KEYS.parcours(enseignantId),
        queryFn: async () => {
            const response = await apiClient.get<ParcoursComplet>(
                `/api/personnel/parcours/membres/${enseignantId}/parcours-complet`
            );
            return response.data;
        },
        enabled: !!enseignantId && isAuthenticated,
        placeholderData: (previousData) => previousData,
    });
}

// ==== AFFECTATIONS CRUD ====

export function useCreerAffectationEnseignant() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (dto: AffectationPayload) => {
            const response = await apiClient.post<AffectationEnseignant>('/api/matieres/affectations', {
                matiereId: dto.matiereId,
                classeAnneeId: dto.classeAnneeId,
                enseignantId: dto.enseignantId,
                dateDebut: dto.dateDebut,
                dateFin: dto.dateFin,
            });
            return response.data;
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ENSEIGNANTS_KEYS.affectationsMatiere(variables.enseignantId) });
            queryClient.invalidateQueries({ queryKey: ENSEIGNANTS_KEYS.heures(variables.enseignantId) });
            toast.success('Matière assignée avec succès');
        },
        onError: (error: any) => toast.error(error?.message || "Erreur lors de l'assignation"),
    });
}

export function useModifierAffectationEnseignant() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...dto }: { id: string; enseignantId: string } & Partial<AffectationPayload>) => {
            const body: Record<string, any> = {};
            if (dto.dateDebut !== undefined) body.dateDebut = dto.dateDebut;
            if (dto.dateFin !== undefined) body.dateFin = dto.dateFin;
            if (dto.actif !== undefined) body.actif = dto.actif;
            if (dto.coefficient !== undefined) body.coefficient = dto.coefficient;
            const response = await apiClient.patch<AffectationEnseignant>(`/api/matieres/affectations/${id}`, body);
            return response.data;
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ENSEIGNANTS_KEYS.affectationsMatiere(variables.enseignantId) });
            queryClient.invalidateQueries({ queryKey: ENSEIGNANTS_KEYS.heures(variables.enseignantId) });
            toast.success('Affectation modifiée');
        },
        onError: (error: any) => toast.error(error?.message || 'Erreur lors de la modification'),
    });
}

export function useSupprimerAffectationEnseignant() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, enseignantId }: { id: string; enseignantId: string }) => {
            await apiClient.delete(`/api/matieres/affectations/${id}`);
            return enseignantId;
        },
        onSuccess: (enseignantId) => {
            queryClient.invalidateQueries({ queryKey: ENSEIGNANTS_KEYS.affectationsMatiere(enseignantId) });
            queryClient.invalidateQueries({ queryKey: ENSEIGNANTS_KEYS.heures(enseignantId) });
            toast.success('Affectation supprimée');
        },
        onError: (error: any) => toast.error(error?.message || 'Erreur lors de la suppression'),
    });
}

export function useToggleActifAffectation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, actif }: { id: string; actif: boolean; enseignantId: string }) => {
            const response = await apiClient.patch<AffectationEnseignant>(`/api/matieres/affectations/${id}`, { actif });
            return response.data;
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ENSEIGNANTS_KEYS.affectationsMatiere(variables.enseignantId) });
            queryClient.invalidateQueries({ queryKey: ENSEIGNANTS_KEYS.heures(variables.enseignantId) });
            toast.success(variables.actif ? 'Affectation activée' : 'Affectation désactivée');
        },
        onError: (error: any) => toast.error(error?.message || 'Erreur lors du changement de statut'),
    });
}

export function useDeplacerAffectation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, cibleClasseAnneeId }: { id: string; cibleClasseAnneeId: string; enseignantId: string }) => {
            const response = await apiClient.patch<AffectationEnseignant>(`/api/matieres/affectations/${id}/move`, { cibleClasseAnneeId });
            return response.data;
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ENSEIGNANTS_KEYS.affectationsMatiere(variables.enseignantId) });
            queryClient.invalidateQueries({ queryKey: ENSEIGNANTS_KEYS.heures(variables.enseignantId) });
            toast.success('Matière déplacée vers une autre classe');
        },
        onError: (error: any) => toast.error(error?.message || 'Erreur lors du déplacement'),
    });
}
