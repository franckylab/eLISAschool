import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import type {
    Organisation, CreerOrganisationDto, ModifierOrganisationDto, OrganisationFiltres,
    UniteOrganisationnelle, CreerUniteDto, ModifierUniteDto, UniteFiltres,
    Poste, CreerPosteDto, ModifierPosteDto, PosteFiltres,
    HierarchiePersonnel, CreerHierarchieDto, ModifierHierarchieDto,
    OrganigrammeNode, StatistiquesOrganisation, ParametreConfiguration,
} from '../types/organisation.types';

const ORGA_KEYS = {
    organisations: {
        all: ['organisation', 'organisations'] as const,
        liste: (filtres: OrganisationFiltres) => [...ORGA_KEYS.organisations.all, filtres] as const,
        detail: (id: string) => [...ORGA_KEYS.organisations.all, 'detail', id] as const,
    },
    unites: {
        all: ['organisation', 'unites'] as const,
        liste: (filtres: UniteFiltres) => [...ORGA_KEYS.unites.all, filtres] as const,
        detail: (id: string) => [...ORGA_KEYS.unites.all, 'detail', id] as const,
        arborescence: (orgId: string) => [...ORGA_KEYS.unites.all, 'arborescence', orgId] as const,
        chemin: (uniteId: string) => [...ORGA_KEYS.unites.all, 'chemin', uniteId] as const,
    },
    postes: {
        all: ['organisation', 'postes'] as const,
        liste: (filtres: PosteFiltres) => [...ORGA_KEYS.postes.all, filtres] as const,
        detail: (id: string) => [...ORGA_KEYS.postes.all, 'detail', id] as const,
        vacants: ['organisation', 'postes-vacants'] as const,
    },
    hierarchie: {
        all: ['organisation', 'hierarchie'] as const,
        liste: (params?: { personnelId?: string }) => [...ORGA_KEYS.hierarchie.all, params] as const,
        superieurs: (personnelId: string) => [...ORGA_KEYS.hierarchie.all, 'superieurs', personnelId] as const,
        subordonnes: (superieurId: string) => [...ORGA_KEYS.hierarchie.all, 'subordonnes', superieurId] as const,
    },
    stats: {
        all: ['organisation', 'statistiques'] as const,
        org: (orgId: string) => [...ORGA_KEYS.stats.all, orgId] as const,
    },
    organigramme: {
        org: (orgId: string) => ['organisation', 'organigramme', orgId] as const,
    },
    validation: {
        org: (orgId: string) => ['organisation', 'validation', orgId] as const,
    },
};

// ─── HELPERS ───

function handleError(error: any, message: string) {
    toast.error(error?.response?.data?.error?.message || message);
    throw error;
}

// ─── ORGANISATIONS ───

export function useOrganisations(filtres: OrganisationFiltres = {}) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ORGA_KEYS.organisations.liste(filtres),
        queryFn: async () => {
            const params: Record<string, any> = {};
            if (filtres.page) params.page = filtres.page;
            if (filtres.limit) params.limit = filtres.limit;
            if (filtres.recherche) params.search = filtres.recherche;
            if (filtres.type) params.type = filtres.type;
            if (filtres.statut) params.statut = filtres.statut;

            const response = await apiClient.get<Organisation[]>('/api/organisation/organisations', params);
            const items = response.data || [];
            const pagination = (response as any).pagination;
            return {
                items,
                meta: pagination ? {
                    totalItems: pagination.total,
                    itemCount: items.length,
                    itemsPerPage: pagination.limit,
                    totalPages: pagination.totalPages,
                    currentPage: pagination.page,
                } : undefined,
            };
        },
        enabled: isAuthenticated,
    });
}

export function useOrganisation(id: string) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ORGA_KEYS.organisations.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<Organisation>(`/api/organisation/organisations/${id}`);
            return response.data;
        },
        enabled: !!id && isAuthenticated,
    });
}

export function useCreerOrganisation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (dto: CreerOrganisationDto) => {
            const response = await apiClient.post<Organisation>('/api/organisation/organisations', dto);
            return response.data;
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: ORGA_KEYS.organisations.all }); toast.success('Organisation créée'); },
        onError: (e: any) => handleError(e, 'Erreur création organisation'),
    });
}

export function useModifierOrganisation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...dto }: { id: string } & ModifierOrganisationDto) => {
            const response = await apiClient.patch<Organisation>(`/api/organisation/organisations/${id}`, dto);
            return response.data;
        },
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: ORGA_KEYS.organisations.all });
            qc.invalidateQueries({ queryKey: ORGA_KEYS.organisations.detail(vars.id) });
            toast.success('Organisation modifiée');
        },
        onError: (e: any) => handleError(e, 'Erreur modification organisation'),
    });
}

export function useSupprimerOrganisation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => { await apiClient.delete(`/api/organisation/organisations/${id}`); return id; },
        onSuccess: () => { qc.invalidateQueries({ queryKey: ORGA_KEYS.organisations.all }); toast.success('Organisation supprimée'); },
        onError: (e: any) => handleError(e, 'Erreur suppression organisation'),
    });
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
        onSuccess: () => { qc.invalidateQueries({ queryKey: ORGA_KEYS.unites.all }); toast.success('Unité créée'); },
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
        mutationFn: async (id: string) => { await apiClient.delete(`/api/organisation/unites/${id}`); return id; },
        onSuccess: () => { qc.invalidateQueries({ queryKey: ORGA_KEYS.unites.all }); toast.success('Unité supprimée'); },
        onError: (e: any) => handleError(e, 'Erreur suppression unité'),
    });
}

export function useArborescence(organisationId: string) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ORGA_KEYS.unites.arborescence(organisationId),
        queryFn: async () => {
            const response = await apiClient.get<any[]>(`/api/organisation/arborescence/${organisationId}`);
            return response.data || [];
        },
        enabled: !!organisationId && isAuthenticated,
    });
}

// ─── POSTES ───

export function usePostes(filtres: PosteFiltres = {}) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ORGA_KEYS.postes.liste(filtres),
        queryFn: async () => {
            const response = await apiClient.get<Poste[]>('/api/organisation/postes', filtres as any);
            return response.data || [];
        },
        enabled: isAuthenticated,
    });
}

export function usePoste(id: string) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ORGA_KEYS.postes.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<Poste>(`/api/organisation/postes/${id}`);
            return response.data;
        },
        enabled: !!id && isAuthenticated,
    });
}

export function useCreerPoste() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (dto: CreerPosteDto) => {
            const response = await apiClient.post<Poste>('/api/organisation/postes', dto);
            return response.data;
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: ORGA_KEYS.postes.all }); toast.success('Poste créé'); },
        onError: (e: any) => handleError(e, 'Erreur création poste'),
    });
}

export function useModifierPoste() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...dto }: { id: string } & ModifierPosteDto) => {
            const response = await apiClient.patch<Poste>(`/api/organisation/postes/${id}`, dto);
            return response.data;
        },
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: ORGA_KEYS.postes.all });
            qc.invalidateQueries({ queryKey: ORGA_KEYS.postes.detail(vars.id) });
            toast.success('Poste modifié');
        },
        onError: (e: any) => handleError(e, 'Erreur modification poste'),
    });
}

export function useSupprimerPoste() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => { await apiClient.delete(`/api/organisation/postes/${id}`); return id; },
        onSuccess: () => { qc.invalidateQueries({ queryKey: ORGA_KEYS.postes.all }); toast.success('Poste supprimé'); },
        onError: (e: any) => handleError(e, 'Erreur suppression poste'),
    });
}

export function useAssignerOccupant() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ posteId, occupantId, occupantNom }: { posteId: string; occupantId: string; occupantNom: string }) => {
            const response = await apiClient.post<Poste>(`/api/organisation/postes/${posteId}/assigner`, { occupantId, occupantNom });
            return response.data;
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: ORGA_KEYS.postes.all }); toast.success('Occupant assigné'); },
        onError: (e: any) => handleError(e, 'Erreur assignation'),
    });
}

export function useLibererPoste() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (posteId: string) => {
            const response = await apiClient.post<Poste>(`/api/organisation/postes/${posteId}/liberer`);
            return response.data;
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: ORGA_KEYS.postes.all }); toast.success('Poste libéré'); },
        onError: (e: any) => handleError(e, 'Erreur libération poste'),
    });
}

export function usePostesVacants() {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ORGA_KEYS.postes.vacants,
        queryFn: async () => {
            const response = await apiClient.get<Poste[]>('/api/organisation/postes-vacants');
            return response.data || [];
        },
        enabled: isAuthenticated,
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
        onSuccess: () => { qc.invalidateQueries({ queryKey: ORGA_KEYS.hierarchie.all }); toast.success('Relation hiérarchique créée'); },
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
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: ORGA_KEYS.hierarchie.all });
            toast.success('Relation hiérarchique modifiée');
        },
        onError: (e: any) => handleError(e, 'Erreur modification hiérarchie'),
    });
}

export function useSupprimerHierarchie() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => { await apiClient.delete(`/api/organisation/hierarchie/${id}`); return id; },
        onSuccess: () => { qc.invalidateQueries({ queryKey: ORGA_KEYS.hierarchie.all }); toast.success('Relation hiérarchique supprimée'); },
        onError: (e: any) => handleError(e, 'Erreur suppression hiérarchie'),
    });
}

// ─── ORGANIGRAMME ───

export function useOrganigramme(organisationId: string) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ORGA_KEYS.organigramme.org(organisationId),
        queryFn: async () => {
            const response = await apiClient.get<OrganigrammeNode[]>(`/api/organisation/organigramme/${organisationId}`);
            return response.data || [];
        },
        enabled: !!organisationId && isAuthenticated,
    });
}

// ─── STATISTIQUES ───

export function useStatistiquesOrganisation(organisationId: string) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ORGA_KEYS.stats.org(organisationId),
        queryFn: async () => {
            const response = await apiClient.get<StatistiquesOrganisation>(`/api/organisation/statistiques/${organisationId}`);
            return response.data;
        },
        enabled: !!organisationId && isAuthenticated,
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
