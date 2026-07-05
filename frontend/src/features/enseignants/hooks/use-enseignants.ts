import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';
import { usePersonnel } from '@/features/personnel/hooks/use-personnel';
import type {
    Enseignant, EnseignantFiltres,
    AffectationEnseignant, EdtEnseignant,
    EvaluationEnseignant, ContratEnseignant,
    BulletinPaie, ParcoursComplet,
    AbsenceEnseignant, AssiduiteStats,
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
            const params: Record<string, any> = {
                page: filtres.page || 1,
                limit: filtres.limit || 20,
            };
            if (filtres.recherche) params.recherche = filtres.recherche;
            if (filtres.actif !== undefined) params.actif = filtres.actif;
            const response = await apiClient.getPaginated<Enseignant>('/api/personnel', params);
            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
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
    });
}

export function useEnseignantAffectationsMatiere(enseignantId: string) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ENSEIGNANTS_KEYS.affectationsMatiere(enseignantId),
        queryFn: async () => {
            const response = await apiClient.get<{ data: AffectationEnseignant[] }>(
                `/api/matieres/enseignants/${enseignantId}/affectations`
            );
            return response.data;
        },
        enabled: !!enseignantId && isAuthenticated,
    });
}

export function useEnseignantEdt(enseignantId: string, semaine?: string) {
    const { isAuthenticated } = useAuthStore();
    const now = new Date();
    const defaultSemaine = now.toISOString().split('T')[0];
    return useQuery({
        queryKey: ENSEIGNANTS_KEYS.edt(enseignantId, semaine || defaultSemaine),
        queryFn: async () => {
            const s = semaine || defaultSemaine;
            const response = await apiClient.get<{ data: EdtEnseignant }>(
                `/api/personnel/heures-cours/enseignants/${enseignantId}/edt?semaine=${s}`
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
            const response = await apiClient.get<{ data: EvaluationEnseignant[] }>(
                `/api/personnel/evaluations?enseignantId=${enseignantId}`
            );
            return response.data;
        },
        enabled: !!enseignantId && isAuthenticated,
    });
}

export function useEnseignantMoyenneEvaluations(enseignantId: string) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ENSEIGNANTS_KEYS.moyenneEval(enseignantId),
        queryFn: async () => {
            const response = await apiClient.get<{ data: { moyenne: number; total: number } }>(
                `/api/personnel/evaluations/enseignants/${enseignantId}/moyenne-evaluations`
            );
            return response.data;
        },
        enabled: !!enseignantId && isAuthenticated,
    });
}

export function useEnseignantHeures(enseignantId: string) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ENSEIGNANTS_KEYS.heures(enseignantId),
        queryFn: async () => {
            const now = new Date();
            const debutAnnee = new Date(now.getFullYear(), 8, 1).toISOString().split('T')[0];
            const finAnnee = new Date(now.getFullYear() + 1, 6, 31).toISOString().split('T')[0];
            const response = await apiClient.get<{ data: { totalHeures: number; heuresParSemaine: number; nbSemaines: number } }>(
                `/api/personnel/heures-cours/enseignants/${enseignantId}/volume-horaire?dateDebut=${debutAnnee}&dateFin=${finAnnee}`
            );
            return response.data;
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
            const debutAnnee = new Date(now.getFullYear(), 8, 1).toISOString().split('T')[0];
            const finAnnee = new Date(now.getFullYear() + 1, 6, 31).toISOString().split('T')[0];
            const response = await apiClient.get<{ data: AssiduiteStats }>(
                `/api/personnel/absences/membres/${enseignantId}/assiduite?dateDebut=${debutAnnee}&dateFin=${finAnnee}`
            );
            return response.data;
        },
        enabled: !!enseignantId && isAuthenticated,
    });
}

export function useEnseignantAbsences(enseignantId: string) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ENSEIGNANTS_KEYS.absences(enseignantId),
        queryFn: async () => {
            const response = await apiClient.get<{ data: { items: AbsenceEnseignant[]; total: number } }>(
                `/api/personnel/absences?membrePersonnelId=${enseignantId}&limit=50`
            );
            return response.data;
        },
        enabled: !!enseignantId && isAuthenticated,
    });
}

export function useEnseignantContrats(enseignantId: string) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ENSEIGNANTS_KEYS.contrats(enseignantId),
        queryFn: async () => {
            const response = await apiClient.get<{ data: ContratEnseignant[] }>(
                `/api/personnel/contrats/membres/${enseignantId}/historique`
            );
            return response.data;
        },
        enabled: !!enseignantId && isAuthenticated,
    });
}

export function useEnseignantBulletins(enseignantId: string) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ENSEIGNANTS_KEYS.bulletins(enseignantId),
        queryFn: async () => {
            const response = await apiClient.get<{ data: BulletinPaie[] }>(
                `/api/personnel/bulletins/membres/${enseignantId}`
            );
            return response.data;
        },
        enabled: !!enseignantId && isAuthenticated,
    });
}

export function useEnseignantParcours(enseignantId: string) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ENSEIGNANTS_KEYS.parcours(enseignantId),
        queryFn: async () => {
            const response = await apiClient.get<{ data: ParcoursComplet }>(
                `/api/personnel/parcours/membres/${enseignantId}/parcours-complet`
            );
            return response.data;
        },
        enabled: !!enseignantId && isAuthenticated,
    });
}
