import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import type { BulletinPaie, Cotisation, TypePrime, TypeRetenue, RapportPaieMensuel, ElementSalaire } from '../types/paie.types';

export interface PaginationMeta {
    totalItems: number;
    currentPage: number;
    itemsPerPage: number;
    totalPages: number;
}

export interface PaginatedBulletins {
    items: BulletinPaie[];
    meta: PaginationMeta;
}

export interface BulletinsFiltres {
    page?: number;
    limit?: number;
    membrePersonnelId?: string;
    mois?: number;
    annee?: number;
    statut?: string;
}

export interface SimulationPaie {
    salaireBrut: number;
    salaireNet: number;
    totalPrimes: number;
    totalRetenues: number;
    totalCotisationsSalariales: number;
    totalCotisationsPatronales: number;
    elements?: ElementSalaire[];
}

function messageErreur(e: unknown, fallback: string): string {
    const err = e as { response?: { data?: { message?: string } }; message?: string };
    return err?.response?.data?.message || err?.message || fallback;
}

function extraireListe<T>(data: unknown): T[] {
    if (Array.isArray(data)) return data as T[];
    const items = (data as { items?: T[] })?.items;
    return items || [];
}

const PAIE_KEYS = {
    all: ['paie'] as const,
    bulletins: {
        all: ['paie', 'bulletins'] as const,
        liste: (params?: BulletinsFiltres) => [...PAIE_KEYS.bulletins.all, params] as const,
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

export function useBulletins(params?: BulletinsFiltres) {
    const { isAuthenticated } = useAuthStore();
    return useQuery<PaginatedBulletins>({
        queryKey: PAIE_KEYS.bulletins.liste(params),
        queryFn: async () => {
            const response = await apiClient.get<PaginatedBulletins>('/api/paie/bulletins', params as Record<string, string | number>);
            return response.data as PaginatedBulletins;
        },
        enabled: isAuthenticated,
        placeholderData: (previousData) => previousData,
    });
}

export function useCreerBulletin() {
    const qc = useQueryClient();
    const { t } = useTranslation('paie');
    return useMutation({
        mutationFn: async (dto: { membrePersonnelId: string; contratId: string; mois: number; annee: number; salaireBase: number; primes?: number; deductions?: number }) => {
            const response = await apiClient.post<BulletinPaie>('/api/paie/bulletins', dto);
            return response.data;
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: PAIE_KEYS.bulletins.all }); toast.success(t('toasts.bulletinCree')); },
        onError: (e: unknown) => toast.error(messageErreur(e, t('erreurs.creationBulletin'))),
    });
}

export function useGenererBulletin() {
    const qc = useQueryClient();
    const { t } = useTranslation('paie');
    return useMutation({
        mutationFn: async ({ membreId, mois, annee }: { membreId: string; mois: number; annee: number }) => {
            const response = await apiClient.post<BulletinPaie>(`/api/paie/bulletins/generer/${membreId}`, { mois, annee });
            return response.data;
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: PAIE_KEYS.bulletins.all }); toast.success(t('toasts.bulletinGenere')); },
        onError: (e: unknown) => toast.error(messageErreur(e, t('erreurs.generationBulletin'))),
    });
}

export function useElementsBulletin(bulletinId: string | null) {
    return useQuery({
        queryKey: ['bulletins', bulletinId, 'elements'],
        queryFn: async () => {
            const response = await apiClient.get<ElementSalaire[]>(`/api/paie/bulletins/${bulletinId}/elements`);
            return response.data || [];
        },
        enabled: !!bulletinId,
        placeholderData: (previousData) => previousData,
    });
}

export function useModifierBulletin() {
    const qc = useQueryClient();
    const { t } = useTranslation('paie');
    return useMutation({
        mutationFn: async ({ id, ...dto }: { id: string } & Partial<Pick<BulletinPaie, 'salaireBase' | 'primes' | 'deductions' | 'statut' | 'datePaiement'>>) => {
            const response = await apiClient.patch<BulletinPaie>(`/api/paie/bulletins/${id}`, dto);
            return response.data;
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: PAIE_KEYS.bulletins.all }); toast.success(t('toasts.bulletinModifie')); },
        onError: (e: unknown) => toast.error(messageErreur(e, t('erreurs.modificationBulletin'))),
    });
}

export function useSupprimerBulletin() {
    const qc = useQueryClient();
    const { t } = useTranslation('paie');
    return useMutation({
        mutationFn: async (id: string) => { await apiClient.delete(`/api/paie/bulletins/${id}`); },
        onSuccess: () => { qc.invalidateQueries({ queryKey: PAIE_KEYS.bulletins.all }); toast.success(t('toasts.bulletinSupprime')); },
        onError: (e: unknown) => toast.error(messageErreur(e, t('erreurs.suppressionBulletin'))),
    });
}

export function useCotisations(params?: { actif?: boolean; type?: string; page?: number; limit?: number }) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: [...PAIE_KEYS.cotisations.all, params],
        queryFn: async () => {
            const response = await apiClient.get<Cotisation[]>('/api/paie/cotisations', params as Record<string, string | number>);
            return extraireListe<Cotisation>(response.data);
        },
        enabled: isAuthenticated,
    });
}

export function useCreerCotisation() {
    const qc = useQueryClient();
    const { t } = useTranslation('paie');
    return useMutation({
        mutationFn: async (dto: { code: string; nom: string; type: string; tauxPatronal?: number; tauxSalarial?: number }) => {
            const response = await apiClient.post<Cotisation>('/api/paie/cotisations', dto);
            return response.data;
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: PAIE_KEYS.cotisations.all }); toast.success(t('toasts.cotisationCreee')); },
        onError: (e: unknown) => toast.error(messageErreur(e, t('erreurs.creationCotisation'))),
    });
}

export function useModifierCotisation() {
    const qc = useQueryClient();
    const { t } = useTranslation('paie');
    return useMutation({
        mutationFn: async ({ id, ...dto }: { id: string } & Partial<Omit<Cotisation, 'id' | 'createdAt' | 'updatedAt'>>) => {
            const response = await apiClient.patch<Cotisation>(`/api/paie/cotisations/${id}`, dto);
            return response.data;
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: PAIE_KEYS.cotisations.all }); toast.success(t('toasts.cotisationModifiee')); },
        onError: (e: unknown) => toast.error(messageErreur(e, t('erreurs.modificationCotisation'))),
    });
}

export function useSupprimerCotisation() {
    const qc = useQueryClient();
    const { t } = useTranslation('paie');
    return useMutation({
        mutationFn: async (id: string) => { await apiClient.delete(`/api/paie/cotisations/${id}`); },
        onSuccess: () => { qc.invalidateQueries({ queryKey: PAIE_KEYS.cotisations.all }); toast.success(t('toasts.cotisationSupprimee')); },
        onError: (e: unknown) => toast.error(messageErreur(e, t('erreurs.suppressionCotisation'))),
    });
}

export function useTypesPrimes(params?: { actif?: boolean; page?: number; limit?: number }) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: [...PAIE_KEYS.primes.all, params],
        queryFn: async () => {
            const response = await apiClient.get<TypePrime[]>('/api/paie/types-primes', params as Record<string, string | number>);
            return extraireListe<TypePrime>(response.data);
        },
        enabled: isAuthenticated,
    });
}

export function useCreerTypePrime() {
    const qc = useQueryClient();
    const { t } = useTranslation('paie');
    return useMutation({
        mutationFn: async (dto: { code: string; nom: string; typeCalcul: string; valeur: number }) => {
            const response = await apiClient.post<TypePrime>('/api/paie/types-primes', dto);
            return response.data;
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: PAIE_KEYS.primes.all }); toast.success(t('toasts.typePrimeCree')); },
        onError: (e: unknown) => toast.error(messageErreur(e, t('erreurs.creationTypePrime'))),
    });
}

export function useModifierTypePrime() {
    const qc = useQueryClient();
    const { t } = useTranslation('paie');
    return useMutation({
        mutationFn: async ({ id, ...dto }: { id: string } & Partial<Omit<TypePrime, 'id' | 'createdAt' | 'updatedAt'>>) => {
            const response = await apiClient.patch<TypePrime>(`/api/paie/types-primes/${id}`, dto);
            return response.data;
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: PAIE_KEYS.primes.all }); toast.success(t('toasts.typePrimeModifie')); },
        onError: (e: unknown) => toast.error(messageErreur(e, t('erreurs.modificationTypePrime'))),
    });
}

export function useSupprimerTypePrime() {
    const qc = useQueryClient();
    const { t } = useTranslation('paie');
    return useMutation({
        mutationFn: async (id: string) => { await apiClient.delete(`/api/paie/types-primes/${id}`); },
        onSuccess: () => { qc.invalidateQueries({ queryKey: PAIE_KEYS.primes.all }); toast.success(t('toasts.typePrimeSupprime')); },
        onError: (e: unknown) => toast.error(messageErreur(e, t('erreurs.suppressionTypePrime'))),
    });
}

export function useTypesRetenues(params?: { page?: number; limit?: number }) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: [...PAIE_KEYS.retenues.all, params],
        queryFn: async () => {
            const response = await apiClient.get<TypeRetenue[]>('/api/paie/types-retenues', params as Record<string, string | number>);
            return extraireListe<TypeRetenue>(response.data);
        },
        enabled: isAuthenticated,
    });
}

export function useCreerTypeRetenue() {
    const qc = useQueryClient();
    const { t } = useTranslation('paie');
    return useMutation({
        mutationFn: async (dto: { code: string; nom: string; frequence: string; montantMax?: number }) => {
            const response = await apiClient.post<TypeRetenue>('/api/paie/types-retenues', dto);
            return response.data;
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: PAIE_KEYS.retenues.all }); toast.success(t('toasts.typeRetenueCree')); },
        onError: (e: unknown) => toast.error(messageErreur(e, t('erreurs.creationTypeRetenue'))),
    });
}

export function useModifierTypeRetenue() {
    const qc = useQueryClient();
    const { t } = useTranslation('paie');
    return useMutation({
        mutationFn: async ({ id, ...dto }: { id: string } & Partial<Omit<TypeRetenue, 'id' | 'createdAt' | 'updatedAt'>>) => {
            const response = await apiClient.patch<TypeRetenue>(`/api/paie/types-retenues/${id}`, dto);
            return response.data;
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: PAIE_KEYS.retenues.all }); toast.success(t('toasts.typeRetenueModifie')); },
        onError: (e: unknown) => toast.error(messageErreur(e, t('erreurs.modificationTypeRetenue'))),
    });
}

export function useSupprimerTypeRetenue() {
    const qc = useQueryClient();
    const { t } = useTranslation('paie');
    return useMutation({
        mutationFn: async (id: string) => { await apiClient.delete(`/api/paie/types-retenues/${id}`); },
        onSuccess: () => { qc.invalidateQueries({ queryKey: PAIE_KEYS.retenues.all }); toast.success(t('toasts.typeRetenueSupprime')); },
        onError: (e: unknown) => toast.error(messageErreur(e, t('erreurs.suppressionTypeRetenue'))),
    });
}

export function useSimulerPaie() {
    return useMutation({
        mutationFn: async ({ membreId, mois, annee }: { membreId: string; mois: number; annee: number }) => {
            const response = await apiClient.post<SimulationPaie | { data: SimulationPaie }>(`/api/paie/calcul/simuler/${membreId}`, { mois, annee });
            const payload = response.data as SimulationPaie | { data: SimulationPaie } | undefined;
            if (payload && 'data' in payload) return payload.data;
            return payload as SimulationPaie;
        },
    });
}

export function useGenererBulletinsMasse() {
    const qc = useQueryClient();
    const { t } = useTranslation('paie');
    return useMutation({
        mutationFn: async ({ membres, mois, annee }: { membres: { id: string }[]; mois: number; annee: number }) => {
            const results = { success: 0, errors: 0, details: [] as string[] };
            for (const membre of membres) {
                try {
                    await apiClient.post(`/api/paie/bulletins/generer/${membre.id}`, { mois, annee });
                    results.success++;
                } catch (e: unknown) {
                    results.errors++;
                    results.details.push(`Échec ${membre.id.slice(0, 8)}: ${messageErreur(e, t('erreurs.erreurInconnue'))}`);
                }
            }
            return results;
        },
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: PAIE_KEYS.bulletins.all });
            toast.success(
                data.errors > 0
                    ? t('toasts.bulletinsMasseErreurs', { count: data.success, errors: data.errors })
                    : t('toasts.bulletinsMasse', { count: data.success })
            );
        },
        onError: (e: unknown) => toast.error(messageErreur(e, t('erreurs.generationMasse'))),
    });
}

export function useRapportPaie(mois: number, annee: number) {
    return useQuery<RapportPaieMensuel>({
        queryKey: ['paie', 'rapport', mois, annee],
        queryFn: async () => {
            const response = await apiClient.get<RapportPaieMensuel>(`/api/paie/bulletins/rapport-comptable?mois=${mois}&annee=${annee}`);
            return response.data as RapportPaieMensuel;
        },
    });
}
