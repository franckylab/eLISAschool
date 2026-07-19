import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import type { BulletinPaie, Cotisation, TypePrime, TypeRetenue, RapportPaieMensuel, ElementSalaire } from '../types/paie.types';

const PAIE_KEYS = {
    all: ['paie'] as const,
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

export function useBulletins(params?: { page?: number; limit?: number; membrePersonnelId?: string; mois?: number; annee?: number; statut?: string }) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: PAIE_KEYS.bulletins.liste(params),
        queryFn: async () => {
            const response = await apiClient.get<any>('/api/paie/bulletins', params as any);
            return (response.data as any)?.items || response.data || [];
        },
        enabled: isAuthenticated,
    });
}

export function useCreerBulletin() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (dto: { membrePersonnelId: string; contratId: string; mois: number; annee: number; salaireBase: number; primes?: number; deductions?: number }) => {
            const response = await apiClient.post<BulletinPaie>('/api/paie/bulletins', dto);
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
            const response = await apiClient.post<BulletinPaie>(`/api/paie/bulletins/generer/${membreId}`, { mois, annee });
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
            const response = await apiClient.get<ElementSalaire[]>(`/api/paie/bulletins/${bulletinId}/elements`);
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
            const response = await apiClient.patch<BulletinPaie>(`/api/paie/bulletins/${id}`, dto);
            return response.data;
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: PAIE_KEYS.bulletins.all }); toast.success('Bulletin modifié'); },
        onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || 'Erreur modification bulletin'),
    });
}

export function useSupprimerBulletin() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => { await apiClient.delete(`/api/paie/bulletins/${id}`); },
        onSuccess: () => { qc.invalidateQueries({ queryKey: PAIE_KEYS.bulletins.all }); toast.success('Bulletin supprimé'); },
        onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || 'Erreur suppression bulletin'),
    });
}

export function useCotisations(params?: { actif?: boolean; type?: string; page?: number; limit?: number }) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: [...PAIE_KEYS.cotisations.all, params],
        queryFn: async () => {
            const response = await apiClient.get<Cotisation[]>('/api/paie/cotisations', params as any);
            return (response.data as any)?.items || response.data || [];
        },
        enabled: isAuthenticated,
    });
}

export function useCreerCotisation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (dto: { code: string; nom: string; type: string; tauxPatronal?: number; tauxSalarial?: number }) => {
            const response = await apiClient.post<Cotisation>('/api/paie/cotisations', dto);
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
            const response = await apiClient.patch<Cotisation>(`/api/paie/cotisations/${id}`, dto);
            return response.data;
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: PAIE_KEYS.cotisations.all }); toast.success('Cotisation modifiée'); },
        onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || 'Erreur modification cotisation'),
    });
}

export function useSupprimerCotisation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => { await apiClient.delete(`/api/paie/cotisations/${id}`); },
        onSuccess: () => { qc.invalidateQueries({ queryKey: PAIE_KEYS.cotisations.all }); toast.success('Cotisation supprimée'); },
        onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || 'Erreur suppression cotisation'),
    });
}

export function useTypesPrimes(params?: { actif?: boolean; page?: number; limit?: number }) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: [...PAIE_KEYS.primes.all, params],
        queryFn: async () => {
            const response = await apiClient.get<TypePrime[]>('/api/paie/types-primes', params as any);
            return (response.data as any)?.items || response.data || [];
        },
        enabled: isAuthenticated,
    });
}

export function useCreerTypePrime() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (dto: { code: string; nom: string; typeCalcul: string; valeur: number }) => {
            const response = await apiClient.post<TypePrime>('/api/paie/types-primes', dto);
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
            const response = await apiClient.patch<TypePrime>(`/api/paie/types-primes/${id}`, dto);
            return response.data;
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: PAIE_KEYS.primes.all }); toast.success('Type prime modifié'); },
        onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || 'Erreur modification type prime'),
    });
}

export function useSupprimerTypePrime() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => { await apiClient.delete(`/api/paie/types-primes/${id}`); },
        onSuccess: () => { qc.invalidateQueries({ queryKey: PAIE_KEYS.primes.all }); toast.success('Type prime supprimé'); },
        onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || 'Erreur suppression'),
    });
}

export function useTypesRetenues(params?: { page?: number; limit?: number }) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: [...PAIE_KEYS.retenues.all, params],
        queryFn: async () => {
            const response = await apiClient.get<TypeRetenue[]>('/api/paie/types-retenues', params as any);
            return (response.data as any)?.items || response.data || [];
        },
        enabled: isAuthenticated,
    });
}

export function useCreerTypeRetenue() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (dto: { code: string; nom: string; frequence: string; montantMax?: number }) => {
            const response = await apiClient.post<TypeRetenue>('/api/paie/types-retenues', dto);
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
            const response = await apiClient.patch<TypeRetenue>(`/api/paie/types-retenues/${id}`, dto);
            return response.data;
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: PAIE_KEYS.retenues.all }); toast.success('Type retenue modifié'); },
        onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || 'Erreur modification type retenue'),
    });
}

export function useSupprimerTypeRetenue() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => { await apiClient.delete(`/api/paie/types-retenues/${id}`); },
        onSuccess: () => { qc.invalidateQueries({ queryKey: PAIE_KEYS.retenues.all }); toast.success('Type retenue supprimé'); },
        onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || 'Erreur suppression'),
    });
}

export function useSimulerPaie() {
    return useMutation({
        mutationFn: async ({ membreId, mois, annee }: { membreId: string; mois: number; annee: number }) => {
            const response = await apiClient.post<any>(`/api/paie/simuler/${membreId}`, { mois, annee });
            return response.data?.data || response.data;
        },
    });
}

export function useGenererBulletinsMasse() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ membres, mois, annee }: { membres: { id: string }[]; mois: number; annee: number }) => {
            const results = { success: 0, errors: 0, details: [] as string[] };
            for (const membre of membres) {
                try {
                    await apiClient.post(`/api/paie/bulletins/generer/${membre.id}`, { mois, annee });
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

export function useRapportPaie(mois: number, annee: number) {
    return useQuery<RapportPaieMensuel>({
        queryKey: ['paie', 'rapport', mois, annee],
        queryFn: async () => {
            const response = await apiClient.get(`/api/paie/bulletins/rapport-comptable?mois=${mois}&annee=${annee}`);
            return (response as any).data;
        },
    });
}
