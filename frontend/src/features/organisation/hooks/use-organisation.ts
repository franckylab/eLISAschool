import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import type {
    UniteOrganisationnelle, CreerUniteDto, ModifierUniteDto, UniteFiltres,
    HierarchiePersonnel, CreerHierarchieDto, ModifierHierarchieDto,
    OrganigrammeNode, StatistiquesOrganisation, ParametreConfiguration,
    NiveauOrganisation, UsageUnite, CategoriePoste,
    NiveauResponsabilite, TemplateOrganisation,
    GenererOrganisationDto, ResultatGeneration,
} from '../types/organisation.types';

const ORGA_KEYS = {
    unites: {
        all: ['organisation', 'unites'] as const,
        liste: (filtres: UniteFiltres) => [...ORGA_KEYS.unites.all, filtres] as const,
        detail: (id: string) => [...ORGA_KEYS.unites.all, 'detail', id] as const,
        arborescence: ['organisation', 'unites', 'arborescence'] as const,
        chemin: (uniteId: string) => [...ORGA_KEYS.unites.all, 'chemin', uniteId] as const,
    },
    hierarchie: {
        all: ['organisation', 'hierarchie'] as const,
        liste: (params?: { personnelId?: string }) => [...ORGA_KEYS.hierarchie.all, params] as const,
        superieurs: (personnelId: string) => [...ORGA_KEYS.hierarchie.all, 'superieurs', personnelId] as const,
        subordonnes: (superieurId: string) => [...ORGA_KEYS.hierarchie.all, 'subordonnes', superieurId] as const,
    },
    stats: {
        all: ['organisation', 'statistiques'] as const,
    },
    organigramme: {
        all: ['organisation', 'organigramme'] as const,
    },
    validation: {
        all: ['organisation', 'validation'] as const,
    },
};

// ─── HELPERS ───

function handleError(error: any, message: string) {
    toast.error(error?.response?.data?.error?.message || message);
}

// ─── UNITÉS ORGANISATIONNELLES ───

export function useUnites(filtres: UniteFiltres = {}) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ORGA_KEYS.unites.liste(filtres),
        queryFn: async () => {
            const response = await apiClient.get<UniteOrganisationnelle[]>('/api/organisation/unites', filtres as any);
            return response.data || [];
        },
        enabled: isAuthenticated,
    });
}

export function useUnite(id: string) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ORGA_KEYS.unites.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<UniteOrganisationnelle>(`/api/organisation/unites/${id}`);
            return response.data;
        },
        enabled: !!id && isAuthenticated,
    });
}

export function useCreerUnite() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (dto: CreerUniteDto) => {
            const response = await apiClient.post<UniteOrganisationnelle>('/api/organisation/unites', dto);
            return response.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ORGA_KEYS.unites.all });
            toast.success('Unité créée');
        },
        onError: (e: any) => handleError(e, 'Erreur création unité'),
    });
}

export function useModifierUnite() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...dto }: { id: string } & ModifierUniteDto) => {
            const response = await apiClient.patch<UniteOrganisationnelle>(`/api/organisation/unites/${id}`, dto);
            return response.data;
        },
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: ORGA_KEYS.unites.all });
            qc.invalidateQueries({ queryKey: ORGA_KEYS.unites.detail(vars.id) });
            toast.success('Unité modifiée');
        },
        onError: (e: any) => handleError(e, 'Erreur modification unité'),
    });
}

export function useSupprimerUnite() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/organisation/unites/${id}`);
            return id;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ORGA_KEYS.unites.all });
            toast.success('Unité supprimée');
        },
        onError: (e: any) => handleError(e, 'Erreur suppression unité'),
    });
}

export function useArborescence() {
    const { isAuthenticated, etablissementId } = useAuthStore();
    return useQuery({
        queryKey: ORGA_KEYS.unites.arborescence,
        queryFn: async () => {
            const response = await apiClient.get<any[]>('/api/organisation/arborescence');
            return response.data || [];
        },
        enabled: !!etablissementId && isAuthenticated,
    });
}

// ─── HIÉRARCHIE ───

export function useHierarchies(params?: { personnelId?: string }) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ORGA_KEYS.hierarchie.liste(params),
        queryFn: async () => {
            const queryParams: any = {};
            if (params?.personnelId) queryParams.personnelId = params.personnelId;
            const response = await apiClient.get<HierarchiePersonnel[]>('/api/organisation/hierarchie', queryParams);
            return response.data || [];
        },
        enabled: isAuthenticated,
    });
}

export function useSuperieurs(personnelId: string) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ORGA_KEYS.hierarchie.superieurs(personnelId),
        queryFn: async () => {
            const response = await apiClient.get<HierarchiePersonnel[]>(`/api/organisation/hierarchie/superieurs/${personnelId}`);
            return response.data || [];
        },
        enabled: !!personnelId && isAuthenticated,
    });
}

export function useSubordonnes(superieurId: string) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ORGA_KEYS.hierarchie.subordonnes(superieurId),
        queryFn: async () => {
            const response = await apiClient.get<HierarchiePersonnel[]>(`/api/organisation/hierarchie/subordonnes/${superieurId}`);
            return response.data || [];
        },
        enabled: !!superieurId && isAuthenticated,
    });
}

export function useCreerHierarchie() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (dto: CreerHierarchieDto) => {
            const response = await apiClient.post<HierarchiePersonnel>('/api/organisation/hierarchie', dto);
            return response.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ORGA_KEYS.hierarchie.all });
            toast.success('Relation hiérarchique créée');
        },
        onError: (e: any) => handleError(e, 'Erreur création hiérarchie'),
    });
}

export function useModifierHierarchie() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...dto }: { id: string } & ModifierHierarchieDto) => {
            const response = await apiClient.patch<HierarchiePersonnel>(`/api/organisation/hierarchie/${id}`, dto);
            return response.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ORGA_KEYS.hierarchie.all });
            toast.success('Relation hiérarchique modifiée');
        },
        onError: (e: any) => handleError(e, 'Erreur modification hiérarchie'),
    });
}

export function useSupprimerHierarchie() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/organisation/hierarchie/${id}`);
            return id;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ORGA_KEYS.hierarchie.all });
            toast.success('Relation hiérarchique supprimée');
        },
        onError: (e: any) => handleError(e, 'Erreur suppression hiérarchie'),
    });
}

// ─── ORGANIGRAMME ───

export function useOrganigramme() {
    const { isAuthenticated, etablissementId } = useAuthStore();
    return useQuery({
        queryKey: ORGA_KEYS.organigramme.all,
        queryFn: async () => {
            const response = await apiClient.get<OrganigrammeNode[]>('/api/organisation/organigramme');
            return response.data || [];
        },
        enabled: !!etablissementId && isAuthenticated,
    });
}

// ─── STATISTIQUES ───

export function useStatistiquesOrganisation() {
    const { isAuthenticated, etablissementId } = useAuthStore();
    return useQuery({
        queryKey: ORGA_KEYS.stats.all,
        queryFn: async () => {
            const response = await apiClient.get<StatistiquesOrganisation>('/api/organisation/statistiques');
            return response.data;
        },
        enabled: !!etablissementId && isAuthenticated,
    });
}

// ─── VALIDATION ───

export function useValiderArborescence() {
    const { isAuthenticated, etablissementId } = useAuthStore();
    return useQuery({
        queryKey: ORGA_KEYS.validation.all,
        queryFn: async () => {
            const response = await apiClient.get<any>('/api/organisation/valider-arborescence');
            return response.data;
        },
        enabled: !!etablissementId && isAuthenticated,
    });
}

// ─── CONFIGURATION ───

export function useConfiguration() {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ['organisation', 'configuration'],
        queryFn: async () => {
            const response = await apiClient.get<ParametreConfiguration[]>('/api/organisation/configuration');
            return response.data || [];
        },
        enabled: isAuthenticated,
    });
}

export function useUpdateConfiguration() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ cle, valeur }: { cle: string; valeur: string }) => {
            const response = await apiClient.put<ParametreConfiguration>(`/api/organisation/configuration/${cle}`, { valeur });
            return response.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['organisation', 'configuration'] });
            toast.success('Configuration mise à jour');
        },
        onError: (e: any) => handleError(e, 'Erreur mise à jour configuration'),
    });
}

export function useResetConfiguration() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (cle: string) => {
            const response = await apiClient.post<ParametreConfiguration>(`/api/organisation/configuration/reset/${cle}`);
            return response.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['organisation', 'configuration'] });
            toast.success('Configuration réinitialisée');
        },
        onError: (e: any) => handleError(e, 'Erreur réinitialisation configuration'),
    });
}

// ─── NOMENCLATURES ───

const NOM_KEYS = {
    niveaux: ['organisation', 'niveaux-organisation'] as const,
    usages: ['organisation', 'usages-unite'] as const,
    categories: ['organisation', 'categories-poste'] as const,
    niveauxResp: ['organisation', 'niveaux-responsabilite'] as const,
    templates: ['organisation', 'templates'] as const,
};

function useNomenclatureList<T>(key: readonly string[], url: string) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: key,
        queryFn: async () => {
            const response = await apiClient.get<T[]>(url);
            return response.data || [];
        },
        enabled: isAuthenticated,
    });
}

function useCreerNomenclature<T>(key: readonly string[], url: string, msg: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (dto: any) => {
            const response = await apiClient.post<T>(url, dto);
            return response.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: key });
            toast.success(msg);
        },
        onError: (e: any) => handleError(e, `Erreur création ${msg}`),
    });
}

function useModifierNomenclature<T>(key: readonly string[], url: string, msg: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...dto }: { id: string } & any) => {
            const response = await apiClient.patch<T>(`${url}/${id}`, dto);
            return response.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: key });
            toast.success(msg);
        },
        onError: (e: any) => handleError(e, `Erreur modification ${msg}`),
    });
}

function useSupprimerNomenclature(key: readonly string[], url: string, msg: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`${url}/${id}`);
            return id;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: key });
            toast.success(msg);
        },
        onError: (e: any) => handleError(e, `Erreur suppression ${msg}`),
    });
}

export function useNiveauxOrganisation() {
    return useNomenclatureList<NiveauOrganisation>(NOM_KEYS.niveaux, '/api/organisation/niveaux-organisation');
}

export function useCreerNiveauOrganisation() {
    return useCreerNomenclature<NiveauOrganisation>(NOM_KEYS.niveaux, '/api/organisation/niveaux-organisation', 'Niveau créé');
}

export function useModifierNiveauOrganisation() {
    return useModifierNomenclature<NiveauOrganisation>(NOM_KEYS.niveaux, '/api/organisation/niveaux-organisation', 'Niveau modifié');
}

export function useSupprimerNiveauOrganisation() {
    return useSupprimerNomenclature(NOM_KEYS.niveaux, '/api/organisation/niveaux-organisation', 'Niveau supprimé');
}

export function useUsagesUnite() {
    return useNomenclatureList<UsageUnite>(NOM_KEYS.usages, '/api/organisation/usages-unite');
}

export function useCreerUsageUnite() {
    return useCreerNomenclature<UsageUnite>(NOM_KEYS.usages, '/api/organisation/usages-unite', 'Usage créé');
}

export function useModifierUsageUnite() {
    return useModifierNomenclature<UsageUnite>(NOM_KEYS.usages, '/api/organisation/usages-unite', 'Usage modifié');
}

export function useSupprimerUsageUnite() {
    return useSupprimerNomenclature(NOM_KEYS.usages, '/api/organisation/usages-unite', 'Usage supprimé');
}

export function useCategoriesPoste() {
    return useNomenclatureList<CategoriePoste>(NOM_KEYS.categories, '/api/organisation/categories-poste');
}

export function useCreerCategoriePoste() {
    return useCreerNomenclature<CategoriePoste>(NOM_KEYS.categories, '/api/organisation/categories-poste', 'Catégorie créée');
}

export function useModifierCategoriePoste() {
    return useModifierNomenclature<CategoriePoste>(NOM_KEYS.categories, '/api/organisation/categories-poste', 'Catégorie modifiée');
}

export function useSupprimerCategoriePoste() {
    return useSupprimerNomenclature(NOM_KEYS.categories, '/api/organisation/categories-poste', 'Catégorie supprimée');
}

export function useNiveauxResponsabilite() {
    return useNomenclatureList<NiveauResponsabilite>(NOM_KEYS.niveauxResp, '/api/organisation/niveaux-responsabilite');
}

export function useCreerNiveauResponsabilite() {
    return useCreerNomenclature<NiveauResponsabilite>(NOM_KEYS.niveauxResp, '/api/organisation/niveaux-responsabilite', 'Niveau créé');
}

export function useModifierNiveauResponsabilite() {
    return useModifierNomenclature<NiveauResponsabilite>(NOM_KEYS.niveauxResp, '/api/organisation/niveaux-responsabilite', 'Niveau modifié');
}

export function useSupprimerNiveauResponsabilite() {
    return useSupprimerNomenclature(NOM_KEYS.niveauxResp, '/api/organisation/niveaux-responsabilite', 'Niveau supprimé');
}

export function useTemplatesOrganisation() {
    return useNomenclatureList<TemplateOrganisation>(NOM_KEYS.templates, '/api/organisation/templates');
}

export function useCreerTemplateOrganisation() {
    return useCreerNomenclature<TemplateOrganisation>(NOM_KEYS.templates, '/api/organisation/templates', 'Template créé');
}

export function useModifierTemplateOrganisation() {
    return useModifierNomenclature<TemplateOrganisation>(NOM_KEYS.templates, '/api/organisation/templates', 'Template modifié');
}

export function useSupprimerTemplateOrganisation() {
    return useSupprimerNomenclature(NOM_KEYS.templates, '/api/organisation/templates', 'Template supprimé');
}

// ─── GÉNÉRATION ───

export function useGenererOrganisation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (dto: GenererOrganisationDto) => {
            const response = await apiClient.post<ResultatGeneration>('/api/organisation/generer', dto);
            return response.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['organisation', 'unites'] });
            qc.invalidateQueries({ queryKey: ['organisation', 'hierarchie'] });
            toast.success('Organisation générée avec succès');
        },
        onError: (e: any) => handleError(e, 'Erreur génération organisation'),
    });
}
