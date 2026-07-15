import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import type { ContratPersonnel, BulletinPaie, Cotisation, TypePrime, TypeRetenue, TypeContratPersonnalise, RapportPaieMensuel, ElementSalaire } from '../types/personnel.types';

const PAIE_KEYS = {
    all: ['paie'] as const,
    contrats: {
        all: ['paie', 'contrats'] as const,
        liste: (params?: any) => [...PAIE_KEYS.contrats.all, params] as const,
        detail: (id: string) => [...PAIE_KEYS.contrats.all, id] as const,
    },
    bulletins: {
        all: ['paie', 'bulletins'] as const,
        liste: (params?: any) => [...PAIE_KEYS.bulletins.all, params] as const,
        detail: (id: string) => [...PAIE_KEYS.bulletins.all, id] as const,
    },
    cotisations: {
        all: ['paie', 'cotisations'] as const,
    },
    primes: {
        all: ['paie', 'primes'] as const,
    },
    retenues: {
        all: ['paie', 'retenues'] as const,
    },
};

// ─── CONTRATS ───

export function useContrats(params?: { page?: number; limit?: number; membrePersonnelId?: string; statut?: string }) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: PAIE_KEYS.contrats.liste(params),
        queryFn: async () => {
            const response = await apiClient.get<ContratPersonnel[]>('/api/personnel/contrats', params as any);
            return (response.data as any)?.items || response.data || [];
        },
        enabled: isAuthenticated,
    });
}

export function useCreerContrat() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (dto: Partial<ContratPersonnel> & { membrePersonnelId: string; typeContrat: string; dateDebut: string; salaireBase: number }) => {
            const response = await apiClient.post<ContratPersonnel>('/api/personnel/contrats', dto);
            return response.data;
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: PAIE_KEYS.contrats.all }); toast.success('Contrat créé'); },
        onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || 'Erreur création contrat'),
    });
}

export function useModifierContrat() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...dto }: { id: string } & Record<string, any>) => {
            const response = await apiClient.patch<ContratPersonnel>(`/api/personnel/contrats/${id}`, dto);
            return response.data;
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: PAIE_KEYS.contrats.all }); toast.success('Contrat modifié'); },
        onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || 'Erreur modification contrat'),
    });
}

export function useSupprimerContrat() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => { await apiClient.delete(`/api/personnel/contrats/${id}`); },
        onSuccess: () => { qc.invalidateQueries({ queryKey: PAIE_KEYS.contrats.all }); toast.success('Contrat supprimé'); },
        onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || 'Erreur suppression contrat'),
    });
}

// ─── BULLETINS ───

export function useBulletins(params?: { page?: number; limit?: number; membrePersonnelId?: string; mois?: number; annee?: number; statut?: string }) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: PAIE_KEYS.bulletins.liste(params),
        queryFn: async () => {
            const response = await apiClient.get<any>('/api/personnel/bulletins', params as any);
            return (response.data as any)?.items || response.data || [];
        },
        enabled: isAuthenticated,
    });
}

export function useCreerBulletin() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (dto: { membrePersonnelId: string; contratId: string; mois: number; annee: number; salaireBase: number; primes?: number; deductions?: number }) => {
            const response = await apiClient.post<BulletinPaie>('/api/personnel/bulletins', dto);
            return response.data;
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: PAIE_KEYS.bulletins.all }); toast.success('Bulletin créé'); },
        onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || 'Erreur création bulletin'),
    });
}

export function useGenererBulletin() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ membreId, mois, annee }: { membreId: string; mois: number; annee: number }) => {
            const response = await apiClient.post<BulletinPaie>(`/api/personnel/bulletins/generer/${membreId}`, { mois, annee });
            return response.data;
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: PAIE_KEYS.bulletins.all }); toast.success('Bulletin généré'); },
        onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || 'Erreur génération bulletin'),
    });
}

export function useElementsBulletin(bulletinId: string | null) {
    return useQuery({
        queryKey: ['bulletins', bulletinId, 'elements'],
        queryFn: async () => {
            const response = await apiClient.get<ElementSalaire[]>(`/api/personnel/bulletins/${bulletinId}/elements`);
            return (response as any).data || [];
        },
        enabled: !!bulletinId,
        placeholderData: (previousData) => previousData,
    });
}

export function useModifierBulletin() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...dto }: { id: string } & Record<string, any>) => {
            const response = await apiClient.patch<BulletinPaie>(`/api/personnel/bulletins/${id}`, dto);
            return response.data;
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: PAIE_KEYS.bulletins.all }); toast.success('Bulletin modifié'); },
        onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || 'Erreur modification bulletin'),
    });
}

export function useSupprimerBulletin() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => { await apiClient.delete(`/api/personnel/bulletins/${id}`); },
        onSuccess: () => { qc.invalidateQueries({ queryKey: PAIE_KEYS.bulletins.all }); toast.success('Bulletin supprimé'); },
        onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || 'Erreur suppression bulletin'),
    });
}

// ─── COTISATIONS ───

export function useCotisations() {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: PAIE_KEYS.cotisations.all,
        queryFn: async () => {
            const response = await apiClient.get<Cotisation[]>('/api/personnel/cotisations');
            return response.data || [];
        },
        enabled: isAuthenticated,
    });
}

export function useCreerCotisation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (dto: { code: string; nom: string; type: string; tauxPatronal?: number; tauxSalarial?: number }) => {
            const response = await apiClient.post<Cotisation>('/api/personnel/cotisations', dto);
            return response.data;
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: PAIE_KEYS.cotisations.all }); toast.success('Cotisation créée'); },
        onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || 'Erreur création cotisation'),
    });
}

export function useModifierCotisation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...dto }: { id: string } & Record<string, any>) => {
            const response = await apiClient.patch<Cotisation>(`/api/personnel/cotisations/${id}`, dto);
            return response.data;
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: PAIE_KEYS.cotisations.all }); toast.success('Cotisation modifiée'); },
        onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || 'Erreur modification cotisation'),
    });
}

export function useSupprimerCotisation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => { await apiClient.delete(`/api/personnel/cotisations/${id}`); },
        onSuccess: () => { qc.invalidateQueries({ queryKey: PAIE_KEYS.cotisations.all }); toast.success('Cotisation supprimée'); },
        onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || 'Erreur suppression cotisation'),
    });
}

// ─── PRIMES ───

export function useTypesPrimes() {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: PAIE_KEYS.primes.all,
        queryFn: async () => {
            const response = await apiClient.get<TypePrime[]>('/api/personnel/types-primes');
            return response.data || [];
        },
        enabled: isAuthenticated,
    });
}

export function useCreerTypePrime() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (dto: { code: string; nom: string; typeCalcul: string; valeur: number }) => {
            const response = await apiClient.post<TypePrime>('/api/personnel/types-primes', dto);
            return response.data;
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: PAIE_KEYS.primes.all }); toast.success('Type prime créé'); },
        onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || 'Erreur création type prime'),
    });
}

export function useModifierTypePrime() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...dto }: { id: string } & Record<string, any>) => {
            const response = await apiClient.patch<TypePrime>(`/api/personnel/types-primes/${id}`, dto);
            return response.data;
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: PAIE_KEYS.primes.all }); toast.success('Type prime modifié'); },
        onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || 'Erreur modification type prime'),
    });
}

export function useSupprimerTypePrime() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => { await apiClient.delete(`/api/personnel/types-primes/${id}`); },
        onSuccess: () => { qc.invalidateQueries({ queryKey: PAIE_KEYS.primes.all }); toast.success('Type prime supprimé'); },
        onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || 'Erreur suppression'),
    });
}

// ─── RETENUES ───

export function useTypesRetenues() {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: PAIE_KEYS.retenues.all,
        queryFn: async () => {
            const response = await apiClient.get<TypeRetenue[]>('/api/personnel/types-retenues');
            return response.data || [];
        },
        enabled: isAuthenticated,
    });
}

export function useCreerTypeRetenue() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (dto: { code: string; nom: string; frequence: string; montantMax?: number }) => {
            const response = await apiClient.post<TypeRetenue>('/api/personnel/types-retenues', dto);
            return response.data;
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: PAIE_KEYS.retenues.all }); toast.success('Type retenue créé'); },
        onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || 'Erreur création type retenue'),
    });
}

export function useModifierTypeRetenue() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...dto }: { id: string } & Record<string, any>) => {
            const response = await apiClient.patch<TypeRetenue>(`/api/personnel/types-retenues/${id}`, dto);
            return response.data;
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: PAIE_KEYS.retenues.all }); toast.success('Type retenue modifié'); },
        onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || 'Erreur modification type retenue'),
    });
}

export function useSupprimerTypeRetenue() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => { await apiClient.delete(`/api/personnel/types-retenues/${id}`); },
        onSuccess: () => { qc.invalidateQueries({ queryKey: PAIE_KEYS.retenues.all }); toast.success('Type retenue supprimé'); },
        onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || 'Erreur suppression'),
    });
}

// ─── TYPES DE CONTRAT ───

export function useTypesContrat() {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ['paie', 'types-contrat'],
        queryFn: async () => {
            const response = await apiClient.get<TypeContratPersonnalise[]>('/api/personnel/types-contrat');
            return (response.data as any)?.items || response.data || [];
        },
        enabled: isAuthenticated,
    });
}

export function useCreerTypeContrat() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (dto: {
            code: string; nom: string; description?: string; categorie?: string;
            modeRemuneration?: string; ordre?: number;
            renouvellementAutoDefaut?: boolean; dureeMaxMois?: number;
        }) => {
            const response = await apiClient.post<TypeContratPersonnalise>('/api/personnel/types-contrat', dto);
            return response.data;
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['paie', 'types-contrat'] }); toast.success('Type contrat créé'); },
        onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || 'Erreur création type contrat'),
    });
}

export function useModifierTypeContrat() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...dto }: { id: string } & Record<string, any>) => {
            const response = await apiClient.patch<TypeContratPersonnalise>(`/api/personnel/types-contrat/${id}`, dto);
            return response.data;
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['paie', 'types-contrat'] }); toast.success('Type contrat modifié'); },
        onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || 'Erreur modification type contrat'),
    });
}

export function useSupprimerTypeContrat() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => { await apiClient.delete(`/api/personnel/types-contrat/${id}`); },
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['paie', 'types-contrat'] }); toast.success('Type contrat supprimé'); },
        onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || 'Erreur suppression type contrat'),
    });
}

export function useToggleTypeContrat() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await apiClient.post<TypeContratPersonnalise>(`/api/personnel/types-contrat/${id}/toggle`);
            return response.data;
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['paie', 'types-contrat'] }); toast.success('Statut modifié'); },
        onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || 'Erreur modification statut'),
    });
}

// ─── SIMULATION ───

export function useSimulerPaie() {
    return useMutation({
        mutationFn: async ({ membreId, mois, annee }: { membreId: string; mois: number; annee: number }) => {
            const response = await apiClient.post<any>(`/api/personnel/paie/simuler/${membreId}`, { mois, annee });
            return response.data?.data || response.data;
        },
    });
}

// ─── RÉGÉNÉRATION ───

export function useRegenererBulletin() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, membreId, mois, annee }: { id: string; membreId: string; mois: number; annee: number }) => {
            await apiClient.delete(`/api/personnel/bulletins/${id}`);
            const response = await apiClient.post<BulletinPaie>(`/api/personnel/bulletins/generer/${membreId}`, { mois, annee });
            return response.data;
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: PAIE_KEYS.bulletins.all }); toast.success('Bulletin régénéré'); },
        onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || 'Erreur régénération'),
    });
}

// ─── GÉNÉRATION EN MASSE ───

export function useGenererBulletinsMasse() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ membres, mois, annee }: { membres: { id: string }[]; mois: number; annee: number }) => {
            const results = { success: 0, errors: 0, details: [] as string[] };
            for (const membre of membres) {
                try {
                    await apiClient.post(`/api/personnel/bulletins/generer/${membre.id}`, { mois, annee });
                    results.success++;
                } catch (e: any) {
                    results.errors++;
                    results.details.push(`Échec ${membre.id.slice(0, 8)}: ${e?.response?.data?.message || e?.message}`);
                }
            }
            return results;
        },
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: PAIE_KEYS.bulletins.all });
            toast.success(`${data.success} bulletin(s) généré(s)` + (data.errors > 0 ? `, ${data.errors} erreur(s)` : ''));
        },
        onError: (e: any) => toast.error(e?.message || 'Erreur génération masse'),
    });
}

// ─── PERSONNEL SEARCH ───

export function usePersonnelSearch(search?: string) {
    return useQuery({
        queryKey: ['personnel', 'search', search],
        queryFn: async () => {
            const response = await apiClient.get<any[]>('/api/personnel', { search, limit: 20 });
            return response.data || [];
        },
        enabled: !!search && search.length >= 2,
    });
}

export function useRapportPaie(mois: number, annee: number) {
    return useQuery<RapportPaieMensuel>({
        queryKey: ['personnel', 'paie', 'rapport', mois, annee],
        queryFn: async () => {
            const response = await apiClient.get(`/api/personnel/bulletins/rapport-comptable?mois=${mois}&annee=${annee}`);
            return (response as any).data;
        },
    });
}
