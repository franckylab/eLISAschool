/**
 * ==================================
 * eLISAschool - Hooks Périodes (v5.0 — Niveaux configurables)
 * ==================================
 * Version: 5.0.0
 * Auteur: franck arlos chendjou
 *
 * Hooks TanStack Query alignés sur l'API backend v5.0 :
 * - CRUD périodes (avec niveauId)
 * - Compositions (hiérarchie)
 * - Templates (génération automatique)
 * - Clôture / Réouverture
 * - Niveaux de périodicité (CRUD + reorder + configInitiale)
 * - Usages de niveau (CRUD)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import type {
    Periode,
    PeriodeArbre,
    PeriodeComposition,
    CreerPeriodeDto,
    ModifierPeriodeDto,
    CreerCompositionDto,
    ModifierCompositionDto,
    GenererTemplateDto,
    CloturerPeriodeDto,
    ReouvrirPeriodeDto,
    ImpactsCloture,
    PeriodeFiltres,
    RemplacerCompositionsDto,
    TemplatePeriodeEntity,
    CreerTemplatePeriodeDto,
    ModifierTemplatePeriodeDto,
    NoeudTemplatePeriode,
    NiveauPeriode,
    UsageNiveau,
    CreerNiveauPeriodeDto,
    ModifierNiveauPeriodeDto,
    ReorderNiveauxDto,
    ConfigInitialeNiveauxDto,
    CreerUsageNiveauDto,
    ModifierUsageNiveauDto,
} from '../types/periode.types';

const PERIODES_KEYS = {
    all: ['periodes'] as const,
    listes: () => [...PERIODES_KEYS.all, 'liste'] as const,
    liste: (anneeId: string) => [...PERIODES_KEYS.listes(), anneeId] as const,
    arbres: () => [...PERIODES_KEYS.all, 'arbre'] as const,
    arbre: (anneeId: string) => [...PERIODES_KEYS.arbres(), anneeId] as const,
    details: () => [...PERIODES_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...PERIODES_KEYS.details(), id] as const,
    compositions: (id: string) => [...PERIODES_KEYS.all, 'compositions', id] as const,
    enfantsDisponibles: (id: string) => [...PERIODES_KEYS.all, 'enfants-disponibles', id] as const,
    impacts: (id: string) => [...PERIODES_KEYS.all, 'impacts', id] as const,
    progressionEnfants: (id: string) => [...PERIODES_KEYS.all, 'progression-enfants', id] as const,
    templates: {
        all: ['periodes-templates'] as const,
        listes: () => [...['periodes-templates'], 'liste'] as const,
        detail: (id: string) => [...['periodes-templates'], 'detail', id] as const,
        defaults: () => [...['periodes-templates'], 'defaults'] as const,
    },
    niveaux: {
        all: ['niveaux-periode'] as const,
        listes: () => [...['niveaux-periode'], 'liste'] as const,
        detail: (id: string) => [...['niveaux-periode'], 'detail', id] as const,
        inferieurs: (id: string) => [...['niveaux-periode'], 'inferieurs', id] as const,
    },
    usages: {
        all: ['usages-niveau'] as const,
        listes: () => [...['usages-niveau'], 'liste'] as const,
        detail: (id: string) => [...['usages-niveau'], 'detail', id] as const,
    },
};

// ================================================================
// QUERIES — PÉRIODES
// ================================================================

/**
 * Liste plate des périodes pour une année scolaire
 */
export function usePeriodes(filtres: PeriodeFiltres = {}) {
    const { isAuthenticated } = useAuthStore();
    const anneeId = filtres.anneeId;

    return useQuery({
        queryKey: PERIODES_KEYS.liste(anneeId || ''),
        queryFn: async () => {
            const response = await apiClient.get<Periode[]>('/api/periodes', {
                anneeId: anneeId || '',
            });
            return response.data;
        },
        enabled: isAuthenticated && !!anneeId,
        staleTime: 10 * 60 * 1000,
    });
}

/**
 * Structure arborescente des périodes pour une année scolaire
 */
export function usePeriodesArbre(filtres: PeriodeFiltres = {}) {
    const { isAuthenticated } = useAuthStore();
    const anneeId = filtres.anneeId;

    return useQuery({
        queryKey: PERIODES_KEYS.arbre(anneeId || ''),
        queryFn: async () => {
            const response = await apiClient.get<PeriodeArbre[]>('/api/periodes', {
                anneeId: anneeId || '',
                format: 'arbre',
            });
            return response.data;
        },
        enabled: isAuthenticated && !!anneeId,
        staleTime: 10 * 60 * 1000,
    });
}

/**
 * Détail d'une période (avec compositions enfants)
 */
export function usePeriode(id: string) {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: PERIODES_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<Periode>(`/api/periodes/${id}`);
            return response.data;
        },
        enabled: !!id && isAuthenticated,
        staleTime: 10 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

/**
 * Compositions (enfants) d'une période
 */
export function useCompositions(periodeId: string) {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: PERIODES_KEYS.compositions(periodeId),
        queryFn: async () => {
            const response = await apiClient.get<PeriodeComposition[]>(`/api/periodes/${periodeId}/compositions`);
            return response.data;
        },
        enabled: !!periodeId && isAuthenticated,
        staleTime: 5 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

/**
 * Enfants disponibles pour composer une période
 */
export function useEnfantsDisponibles(periodeId: string) {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: PERIODES_KEYS.enfantsDisponibles(periodeId),
        queryFn: async () => {
            const response = await apiClient.get<Periode[]>(`/api/periodes/${periodeId}/enfants-disponibles`);
            return response.data;
        },
        enabled: !!periodeId && isAuthenticated,
        staleTime: 2 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

/**
 * Vérifier les impacts avant clôture
 */
export function useVerifierImpacts(periodeId: string) {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: PERIODES_KEYS.impacts(periodeId),
        queryFn: async () => {
            const response = await apiClient.get<ImpactsCloture>(`/api/periodes/${periodeId}/impacts`);
            return response.data;
        },
        enabled: !!periodeId && isAuthenticated,
        staleTime: 1 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

/**
 * Progression (notes saisies) pour chaque enfant d'une période parent
 */
export function useProgressionEnfants(periodeId: string) {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: PERIODES_KEYS.progressionEnfants(periodeId),
        queryFn: async () => {
            const response = await apiClient.get<{ id: string; noteCount: number }[]>(`/api/periodes/${periodeId}/progression-enfants`);
            return response.data;
        },
        enabled: !!periodeId && isAuthenticated,
        staleTime: 2 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

// ================================================================
// MUTATIONS — PÉRIODES
// ================================================================

/**
 * Créer une période
 */
export function useCreerPeriode() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerPeriodeDto) => {
            const response = await apiClient.post<Periode>('/api/periodes', dto);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PERIODES_KEYS.all, exact: false });
            toast.success('Période créée avec succès');
        },
        onError: (error: any) => {
            toast.error(error.message || error.response?.data?.error?.message || 'Erreur lors de la création');
        },
    });
}

/**
 * Modifier une période
 */
export function useModifierPeriode() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...dto }: { id: string } & ModifierPeriodeDto) => {
            const response = await apiClient.patch<Periode>(`/api/periodes/${id}`, dto);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PERIODES_KEYS.all, exact: false });
            toast.success('Période modifiée avec succès');
        },
        onError: (error: any) => {
            toast.error(error.message || error.response?.data?.error?.message || 'Erreur lors de la modification');
        },
    });
}

/**
 * Supprimer une période
 */
export function useSupprimerPeriode() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/periodes/${id}`);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PERIODES_KEYS.all, exact: false });
            toast.success('Période supprimée avec succès');
        },
        onError: (error: any) => {
            toast.error(error.message || error.response?.data?.error?.message || 'Erreur lors de la suppression');
        },
    });
}

/**
 * Ajouter une composition (lier un enfant à un parent)
 */
export function useAjouterComposition() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerCompositionDto) => {
            const response = await apiClient.post<PeriodeComposition>(
                `/api/periodes/${dto.periodeParentId}/compositions`,
                dto,
            );
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: PERIODES_KEYS.all, exact: false });
            queryClient.invalidateQueries({ queryKey: PERIODES_KEYS.compositions(variables.periodeParentId) });
            toast.success('Composition ajoutée');
        },
        onError: (error: any) => {
            toast.error(error.message || error.response?.data?.error?.message || 'Erreur lors de l\'ajout');
        },
    });
}

/**
 * Modifier une composition (ordre, poids)
 */
export function useModifierComposition() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...dto }: { id: string } & ModifierCompositionDto) => {
            const response = await apiClient.patch<PeriodeComposition>(
                `/api/periodes/compositions/${id}`,
                dto,
            );
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PERIODES_KEYS.all, exact: false });
            toast.success('Composition modifiée');
        },
        onError: (error: any) => {
            toast.error(error.message || error.response?.data?.error?.message || 'Erreur lors de la modification');
        },
    });
}

/**
 * Supprimer une composition
 */
export function useSupprimerComposition() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/periodes/compositions/${id}`);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PERIODES_KEYS.all, exact: false });
            toast.success('Composition supprimée');
        },
        onError: (error: any) => {
            toast.error(error.message || error.response?.data?.error?.message || 'Erreur lors de la suppression');
        },
    });
}

/**
 * Générer une hiérarchie depuis un template (v5.0)
 */
export function useGenererTemplate() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: GenererTemplateDto) => {
            const response = await apiClient.post<Periode[]>(
                `/api/periodes-templates/${dto.templateId}/generer`,
                { anneeScolaireId: dto.anneeScolaireId, dateDebut: dto.dateDebut, dateFin: dto.dateFin },
            );
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PERIODES_KEYS.all, exact: false });
            toast.success('Hiérarchie générée avec succès');
        },
        onError: (error: any) => {
            toast.error(error.message || error.response?.data?.error?.message || 'Erreur lors de la génération');
        },
    });
}

/**
 * Clôturer une période
 */
export function useCloturerPeriode() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...dto }: { id: string } & CloturerPeriodeDto) => {
            const response = await apiClient.post<Periode>(`/api/periodes/${id}/cloturer`, dto);
            return response.data;
        },
        onSuccess: (periode) => {
            queryClient.invalidateQueries({ queryKey: PERIODES_KEYS.all, exact: false });
            if (periode) {
                queryClient.invalidateQueries({ queryKey: PERIODES_KEYS.detail(periode.id) });
            }
            toast.success('Période clôturée avec succès');
        },
        onError: (error: any) => {
            toast.error(error.message || error.response?.data?.error?.message || 'Erreur lors de la clôture');
        },
    });
}

/**
 * Réouvrir une période clôturée
 */
export function useReouvrirPeriode() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...dto }: { id: string } & ReouvrirPeriodeDto) => {
            const response = await apiClient.post<Periode>(`/api/periodes/${id}/reouvrir`, dto);
            return response.data;
        },
        onSuccess: (periode) => {
            queryClient.invalidateQueries({ queryKey: PERIODES_KEYS.all, exact: false });
            if (periode) {
                queryClient.invalidateQueries({ queryKey: PERIODES_KEYS.detail(periode.id) });
            }
            toast.success('Période réouverte avec succès');
        },
        onError: (error: any) => {
            toast.error(error.message || error.response?.data?.error?.message || 'Erreur lors de la réouverture');
        },
    });
}

/**
 * Remplacer toutes les compositions d'une période (sauvegarde batch)
 */
export function useRemplacerCompositions() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ periodeId, dto }: { periodeId: string; dto: RemplacerCompositionsDto }) => {
            const response = await apiClient.put<Periode>(`/api/periodes/${periodeId}/compositions`, dto);
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: PERIODES_KEYS.all, exact: false });
            queryClient.invalidateQueries({ queryKey: PERIODES_KEYS.compositions(variables.periodeId) });
            queryClient.invalidateQueries({ queryKey: PERIODES_KEYS.enfantsDisponibles(variables.periodeId) });
            toast.success('Compositions enregistrées avec succès');
        },
        onError: (error: any) => {
            toast.error(error.message || error.response?.data?.error?.message || 'Erreur lors de l\'enregistrement des compositions');
        },
    });
}

// ================================================================
// TEMPLATES — CRUD (v5.0)
// ================================================================

/**
 * Lister les templates de hiérarchie disponibles
 */
export function useTemplatesPeriode() {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: PERIODES_KEYS.templates.listes(),
        queryFn: async () => {
            const response = await apiClient.get<TemplatePeriodeEntity[]>('/api/periodes-templates');
            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 10 * 60 * 1000,
    });
}

/**
 * Lister les templates par défaut (modèles prédéfinis non persistés)
 */
export function useTemplatesParDefaut() {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: PERIODES_KEYS.templates.defaults(),
        queryFn: async () => {
            const response = await apiClient.get<Array<{ nom: string; description: string; structure: NoeudTemplatePeriode }>>('/api/periodes-templates/defaults');
            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 60 * 60 * 1000, // 1h — données statiques
    });
}

/**
 * Détail d'un template
 */
export function useTemplatePeriode(id: string | null) {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: PERIODES_KEYS.templates.detail(id || ''),
        queryFn: async () => {
            const response = await apiClient.get<TemplatePeriodeEntity>(`/api/periodes-templates/${id}`);
            return response.data;
        },
        enabled: !!id && isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Créer un template personnalisé
 */
export function useCreerTemplatePeriode() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerTemplatePeriodeDto) => {
            const response = await apiClient.post<TemplatePeriodeEntity>('/api/periodes-templates', dto);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PERIODES_KEYS.templates.all, exact: false });
            toast.success('Template créé avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la création');
        },
    });
}

/**
 * Modifier un template personnalisé
 */
export function useModifierTemplatePeriode() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...dto }: { id: string } & ModifierTemplatePeriodeDto) => {
            const response = await apiClient.patch<TemplatePeriodeEntity>(`/api/periodes-templates/${id}`, dto);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PERIODES_KEYS.templates.all, exact: false });
            toast.success('Template modifié avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la modification');
        },
    });
}

/**
 * Supprimer (soft) un template
 */
export function useSupprimerTemplatePeriode() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/periodes-templates/${id}`);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PERIODES_KEYS.templates.all, exact: false });
            toast.success('Template supprimé');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la suppression');
        },
    });
}

// ================================================================
// NIVEAUX DE PÉRIODICITÉ — CRUD (v5.0)
// ================================================================

/**
 * Lister les niveaux de périodicité de l'établissement
 */
export function useNiveauxPeriode() {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: PERIODES_KEYS.niveaux.listes(),
        queryFn: async () => {
            const response = await apiClient.get<NiveauPeriode[]>('/api/niveaux-periode');
            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 10 * 60 * 1000,
    });
}

/**
 * Détail d'un niveau de périodicité
 */
export function useNiveauPeriode(id: string | null) {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: PERIODES_KEYS.niveaux.detail(id || ''),
        queryFn: async () => {
            const response = await apiClient.get<NiveauPeriode>(`/api/niveaux-periode/${id}`);
            return response.data;
        },
        enabled: !!id && isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Niveaux inférieurs d'un niveau donné (pour composition)
 */
export function useNiveauxInferieurs(niveauId: string | null) {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: PERIODES_KEYS.niveaux.inferieurs(niveauId || ''),
        queryFn: async () => {
            const response = await apiClient.get<NiveauPeriode[]>(`/api/niveaux-periode/${niveauId}/niveaux-inferieurs`);
            return response.data;
        },
        enabled: !!niveauId && isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Créer un niveau de périodicité
 */
export function useCreerNiveauPeriode() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerNiveauPeriodeDto) => {
            const response = await apiClient.post<NiveauPeriode>('/api/niveaux-periode', dto);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PERIODES_KEYS.niveaux.all, exact: false });
            toast.success('Niveau créé avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la création');
        },
    });
}

/**
 * Modifier un niveau de périodicité
 */
export function useModifierNiveauPeriode() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...dto }: { id: string } & ModifierNiveauPeriodeDto) => {
            const response = await apiClient.patch<NiveauPeriode>(`/api/niveaux-periode/${id}`, dto);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PERIODES_KEYS.niveaux.all, exact: false });
            toast.success('Niveau modifié avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la modification');
        },
    });
}

/**
 * Supprimer un niveau de périodicité
 */
export function useSupprimerNiveauPeriode() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/niveaux-periode/${id}`);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PERIODES_KEYS.niveaux.all, exact: false });
            toast.success('Niveau supprimé');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la suppression');
        },
    });
}

/**
 * Réordonner les niveaux (drag & drop)
 */
export function useReorderNiveaux() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: ReorderNiveauxDto) => {
            await apiClient.patch('/api/niveaux-periode/reorder', dto);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PERIODES_KEYS.niveaux.all, exact: false });
            toast.success('Ordre mis à jour');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors du réordonnancement');
        },
    });
}

/**
 * Configuration initiale des niveaux (wizard)
 */
export function useConfigInitialeNiveaux() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: ConfigInitialeNiveauxDto) => {
            const response = await apiClient.post<NiveauPeriode[]>('/api/niveaux-periode/config-initiale', dto);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PERIODES_KEYS.niveaux.all, exact: false });
            toast.success('Configuration initiale enregistrée');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la configuration');
        },
    });
}

// ================================================================
// USAGES DE NIVEAU — CRUD (v5.0)
// ================================================================

/**
 * Lister les usages de niveau (système + établissement)
 */
export function useUsagesNiveau() {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: PERIODES_KEYS.usages.listes(),
        queryFn: async () => {
            const response = await apiClient.get<UsageNiveau[]>('/api/usages-niveau');
            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 30 * 60 * 1000,
    });
}

/**
 * Détail d'un usage de niveau
 */
export function useUsageNiveau(id: string | null) {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: PERIODES_KEYS.usages.detail(id || ''),
        queryFn: async () => {
            const response = await apiClient.get<UsageNiveau>(`/api/usages-niveau/${id}`);
            return response.data;
        },
        enabled: !!id && isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Créer un usage personnalisé
 */
export function useCreerUsageNiveau() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerUsageNiveauDto) => {
            const response = await apiClient.post<UsageNiveau>('/api/usages-niveau', dto);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PERIODES_KEYS.usages.all, exact: false });
            toast.success('Usage créé avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la création');
        },
    });
}

/**
 * Modifier un usage personnalisé
 */
export function useModifierUsageNiveau() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...dto }: { id: string } & ModifierUsageNiveauDto) => {
            const response = await apiClient.patch<UsageNiveau>(`/api/usages-niveau/${id}`, dto);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PERIODES_KEYS.usages.all, exact: false });
            toast.success('Usage modifié avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la modification');
        },
    });
}

/**
 * Supprimer un usage personnalisé
 */
export function useSupprimerUsageNiveau() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/usages-niveau/${id}`);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PERIODES_KEYS.usages.all, exact: false });
            toast.success('Usage supprimé');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la suppression');
        },
    });
}

// ================================================================
// QUERY — Période active (période en cours)
// ================================================================

const PERIODE_ACTIVE_KEY = ['periodes', 'active'] as const;

/**
 * Hook pour récupérer la période en cours.
 * Appelle GET /api/periodes/active qui détermine la période courante
 * à partir de l'année active, du niveau configuré et de la date du jour.
 */
export function usePeriodeActive() {
    const { isAuthenticated, etablissementId } = useAuthStore();

    return useQuery({
        queryKey: [...PERIODE_ACTIVE_KEY, etablissementId],
        queryFn: async () => {
            const response = await apiClient.get<Periode | null>('/api/periodes/active');
            return response.data ?? null;
        },
        enabled: isAuthenticated && !!etablissementId,
        staleTime: 5 * 60 * 1000,
        placeholderData: (previousData) => previousData,
        retry: false,
    });
}

// ================================================================
// HELPER — Résolution dynamique des labels (v5.0)
// ================================================================

/**
 * Hook pour résoudre les labels des niveaux de période.
 * Utilise les niveaux chargés pour résoudre le label depuis le niveauId.
 */
export function useLabelNiveauPeriode() {
    const { data: niveaux = [] } = useNiveauxPeriode();

    const getLabel = (niveauId: string): string => {
        const niveau = niveaux.find(n => n.id === niveauId);
        return niveau?.label || niveauId?.substring(0, 8) || '—';
    };

    const getLabelByNiveau = (niveauValue: number): string => {
        const niveau = niveaux.find(n => n.niveau === niveauValue);
        return niveau?.label || `Niveau ${niveauValue}`;
    };

    return { getLabel, getLabelByNiveau, niveaux };
}
