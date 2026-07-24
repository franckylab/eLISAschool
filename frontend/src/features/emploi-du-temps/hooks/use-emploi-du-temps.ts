import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

// ─── Enums ────────────────────────────────────────────

export type JourSemaine = 'LUNDI' | 'MARDI' | 'MERCREDI' | 'JEUDI' | 'VENDREDI' | 'SAMEDI' | 'DIMANCHE';
export type TypeCreneau = 'COURS' | 'TD' | 'TP' | 'RECREATION' | 'PAUSE' | 'PERMANENCE' | 'AUTRE';
export type StatutCreneau = 'PLANIFIE' | 'VALIDE';

// ─── Interfaces ───────────────────────────────────────

export interface CreneauHoraire {
    id: string;
    affectationMatiereId: string;
    jour: JourSemaine;
    heureDebut: string;
    heureFin: string;
    typeCreneau: TypeCreneau;
    statut: StatutCreneau;
    salleId?: string;
    periodeId: string;
    anneeScolaireId: string;
    etablissementId: string;
    couleur?: string;
    notes?: string;
    genereAutomatiquement: boolean;
    createdAt: string;
    updatedAt: string;
    // Getters dérivés (retournés par le backend)
    dureeMinutes?: number;
    dureeHeures?: number;
    plageHoraire?: string;
    classeAnneeId?: string;
    matiereId?: string;
    enseignantId?: string;
    affectationMatiere?: {
        id: string;
        matiereId: string;
        classeAnneeId: string;
        enseignantId: string;
        coefficient: number | null;
        obligatoire: boolean;
        statutValidation: string;
        matiere?: { id: string; nom: string; code?: string; couleur?: string };
        enseignant?: { id: string; nom: string; prenom: string };
        classeAnnee?: {
            id: string;
            classe: { id: string; nom: string; niveau?: string };
            anneeScolaire: { id: string; nom?: string; anneeDebut?: number };
        };
    };
    salle?: { id: string; nom: string; code?: string };
}

/** @deprecated Utiliser CreneauHoraire */
export type Creneau = CreneauHoraire;

export interface PaginatedResponse<T> {
    items: T[];
    meta: {
        currentPage: number;
        itemsPerPage: number;
        totalItems: number;
        totalPages: number;
        itemCount: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}

export interface CreneauFilters {
    classeAnneeId?: string;
    enseignantId?: string;
    salleId?: string;
    affectationMatiereId?: string;
    jour?: JourSemaine;
    typeCreneau?: TypeCreneau;
    statut?: StatutCreneau;
    anneeScolaireId?: string;
    periodeId?: string;
    genereAutomatiquement?: boolean;
    inclureHeuresCours?: boolean;
    typeSource?: 'creneau' | 'heure_cours';
    page?: number;
    limit?: number;
    orderBy?: string;
    orderDir?: 'ASC' | 'DESC';
}

export interface PreferenceEDT {
    id: string;
    etablissementId: string;
    heureDebutCours: string;
    heureFinCours: string;
    dureeCreneauStandard: number;
    dureeRecreation: number;
    joursOuvrables: string[];
    maxCreneauxParJour: number;
    maxCreneauxMatiereParJour: number;
    maxCreneauxConsecutifs: number;
    pauseDebut?: string | null;
    pauseFin?: string | null;
    pauseMatineeDebut?: string | null;
    pauseMatineeFin?: string | null;
    pauseApresMidiDebut?: string | null;
    pauseApresMidiFin?: string | null;
    creneauxImposables?: CreneauImposable[];
    repartitionEquilibree: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreneauImposable {
    jour: JourSemaine;
    heureDebut: string;
    heureFin: string;
    motif?: string;
}

// ─── Conflits ───────────────────────────────────────

export type TypeConflit = 'CONFLIT_CLASSE' | 'CONFLIT_ENSEIGNANT' | 'CONFLIT_SALLE' | 'DEPASSEMENT_VOLUME_HORAIRE' | 'CRENEAU_IMPOSABLE';
export type SeveriteConflit = 'BLOQUANT' | 'AVERTISSEMENT';

export interface Conflit {
    type: TypeConflit;
    severite: SeveriteConflit;
    message: string;
    details: Record<string, unknown>;
}

export interface DonneesVerification {
    affectationMatiereId?: string;
    jour: JourSemaine;
    heureDebut: string;
    heureFin: string;
    salleId?: string;
    excludeCreneauId?: string;
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

const EDT_KEYS = {
    all: ['emploi-du-temps'] as const,
    list: (filters: Record<string, any>) => ['emploi-du-temps', 'list', filters] as const,
    detail: (id: string) => ['emploi-du-temps', id] as const,
    preferences: ['emploi-du-temps', 'preferences'] as const,
    templates: {
        all: ['emploi-du-temps', 'templates'] as const,
        detail: (id: string) => ['emploi-du-temps', 'templates', id] as const,
    },
};

export function useCreneaux(filters: CreneauFilters = {}) {
    return useQuery({
        queryKey: EDT_KEYS.list(filters),
        queryFn: async () => {
            const params: Record<string, any> = {};
            Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== '') params[k] = v; });
            const response = await apiClient.get<{ data: PaginatedResponse<CreneauHoraire> }>('/api/emploi-du-temps', params);
            return response.data;
        },
        staleTime: 2 * 60 * 1000,
    });
}

export function useCreneau(id: string) {
    return useQuery({
        queryKey: EDT_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<{ data: CreneauHoraire }>(`/api/emploi-du-temps/${id}`);
            return response.data;
        },
        enabled: !!id,
        placeholderData: (previousData) => previousData,
    });
}

export function useCreerCreneau() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (dto: Partial<CreneauHoraire>) => {
            const res = await apiClient.post<{ data: CreneauHoraire }>('/api/emploi-du-temps', dto);
            return res.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: EDT_KEYS.all });
            toast.success('Créneau créé avec succès');
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.error?.message || 'Erreur lors de la création');
        },
    });
}

export function useUpdateCreneau() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...dto }: Partial<CreneauHoraire> & { id: string }) => {
            const res = await apiClient.patch<{ data: CreneauHoraire }>(`/api/emploi-du-temps/${id}`, dto);
            return res.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: EDT_KEYS.all });
            toast.success('Créneau modifié');
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.error?.message || 'Erreur lors de la modification');
        },
    });
}

export function useSupprimerCreneau() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => { await apiClient.delete(`/api/emploi-du-temps/${id}`); },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: EDT_KEYS.all });
            toast.success('Créneau supprimé');
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.error?.message || 'Erreur lors de la suppression');
        },
    });
}

export function useGenererEDT() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (dto: { classeAnneeId: string; options?: { regenerer?: boolean; respecterContraintes?: boolean } }) => {
            const res = await apiClient.post<{ success: boolean; message: string; data: { nombreCreneaux: number; conflits: string[] } }>('/api/emploi-du-temps/generer', dto);
            return res.data;
        },
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: EDT_KEYS.all });
            if (data?.success) toast.success(data.message);
            else toast.warning(`${data?.message || 'Erreur'} — ${data?.data?.conflits?.length || 0} conflit(s)`);
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.error?.message || 'Erreur lors de la génération');
        },
    });
}

export function usePreferencesEDT() {
    return useQuery({
        queryKey: EDT_KEYS.preferences,
        queryFn: async () => {
            const res = await apiClient.get<{ data: PreferenceEDT }>('/api/emploi-du-temps/preferences');
            return res.data;
        },
        staleTime: 5 * 60 * 1000,
    });
}

export function useUpdatePreferencesEDT() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (dto: Partial<PreferenceEDT>) => {
            const res = await apiClient.put<{ data: PreferenceEDT }>('/api/emploi-du-temps/preferences', dto);
            return res.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: EDT_KEYS.preferences });
            toast.success('Préférences mises à jour');
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.error?.message || 'Erreur');
        },
    });
}

export function useTemplatesEDT() {
    return useQuery({
        queryKey: EDT_KEYS.templates.all,
        queryFn: async () => {
            const res = await apiClient.get<{ data: TemplateEDT[] }>('/api/emploi-du-temps/templates');
            return res.data;
        },
        staleTime: 10 * 60 * 1000,
    });
}

export function useTemplateEDT(id: string) {
    return useQuery({
        queryKey: EDT_KEYS.templates.detail(id),
        queryFn: async () => {
            const res = await apiClient.get<{ data: TemplateEDT }>(`/api/emploi-du-temps/templates/${id}`);
            return res.data;
        },
        enabled: !!id,
    });
}

export function useCreerTemplateEDT() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (dto: any) => {
            const res = await apiClient.post<{ data: TemplateEDT }>('/api/emploi-du-temps/templates', dto);
            return res.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: EDT_KEYS.templates.all });
            toast.success('Template créé');
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.error?.message || 'Erreur');
        },
    });
}

export function useSupprimerTemplateEDT() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => { await apiClient.delete(`/api/emploi-du-temps/templates/${id}`); },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: EDT_KEYS.templates.all });
            toast.success('Template supprimé');
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.error?.message || 'Erreur');
        },
    });
}

export function useDupliquerTemplateEDT() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, nom }: { id: string; nom?: string }) => {
            const res = await apiClient.post<{ data: TemplateEDT }>(`/api/emploi-du-temps/templates/${id}/dupliquer`, { nom });
            return res.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: EDT_KEYS.templates.all });
            toast.success('Template dupliqué');
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.error?.message || 'Erreur');
        },
    });
}

// ─── Vérification conflits ─────────────────────────

export function useVerifierConflits() {
    return useMutation({
        mutationFn: async (donnees: DonneesVerification) => {
            const res = await apiClient.post<{ data: Conflit[] }>('/api/emploi-du-temps/verifier-conflits', donnees);
            return res.data;
        },
    });
}
