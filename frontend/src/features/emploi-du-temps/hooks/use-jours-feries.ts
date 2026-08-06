/**
 * ==================================
 * eLISAschool - Hook Jours Fériés
 * ==================================
 * Data fetching pour les jours fériés via TanStack Query
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { useHandleError } from '@/hooks/use-handle-error';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/auth.store';
import type { JourFerie } from '../types/edt.types';

/** Lister les jours fériés pour une année */
export function useJoursFeries(annee?: number) {
    return useQuery({
        queryKey: ['jours-feries', annee],
        queryFn: async () => {
            const params = annee ? `?annee=${annee}` : '';
            const res = await apiClient.get<JourFerie[]>(
                `/api/emploi-du-temps/jours-feries${params}`
            );
            return res.data;
        },
        staleTime: 5 * 60 * 1000, // 5 min
    });
}

/** Lister les jours fériés pour une plage de dates */
export function useJoursFeriesPlage(dateDebut: string, dateFin: string) {
    return useQuery({
        queryKey: ['jours-feries', 'plage', dateDebut, dateFin],
        queryFn: async () => {
            const res = await apiClient.get<JourFerie[]>(
                `/api/emploi-du-temps/jours-feries?dateDebut=${dateDebut}&dateFin=${dateFin}`
            );
            return res.data;
        },
        enabled: !!dateDebut && !!dateFin,
        staleTime: 5 * 60 * 1000,
    });
}

/** Créer un jour férié */
export function useCreateJourFerie() {
    const queryClient = useQueryClient();
    const { t } = useTranslation('emplois');
    const handleError = useHandleError();

    return useMutation({
        mutationFn: async (data: Partial<JourFerie>) => {
            const res = await apiClient.post<JourFerie>(
                '/api/emploi-du-temps/jours-feries', data
            );
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['jours-feries'] });
            toast.success(t('joursFeries.creeSucces'));
        },
        onError: (error: unknown) => handleError(error, t('joursFeries.erreurCreation', 'Erreur lors de la création')),
    });
}

/** Supprimer un jour férié */
export function useDeleteJourFerie() {
    const queryClient = useQueryClient();
    const { t } = useTranslation('emplois');
    const handleError = useHandleError();

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/emploi-du-temps/jours-feries/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['jours-feries'] });
            toast.success(t('joursFeries.supprimeSucces'));
        },
        onError: (error: unknown) => handleError(error, t('joursFeries.erreurSuppression', 'Erreur lors de la suppression')),
    });
}

/** Mettre à jour un jour férié */
export function useUpdateJourFerie() {
    const queryClient = useQueryClient();
    const { t } = useTranslation('emplois');
    const handleError = useHandleError();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<JourFerie> }) => {
            const res = await apiClient.patch<JourFerie>(
                `/api/emploi-du-temps/jours-feries/${id}`, data
            );
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['jours-feries'] });
            toast.success(t('joursFeries.modifieSucces'));
        },
        onError: (error: unknown) => handleError(error, t('joursFeries.erreurModification', 'Erreur lors de la modification')),
    });
}

/** Charger un modèle de jours fériés par pays */
export function useChargerModelePays() {
    const queryClient = useQueryClient();
    const { t } = useTranslation('emplois');
    const handleError = useHandleError();
    const etablissementId = useAuthStore(s => s.etablissementId);

    return useMutation({
        mutationFn: async ({ pays }: { pays: string }) => {
            const body: Record<string, string> = { pays };
            if (etablissementId) body.etablissementId = etablissementId;
            const res = await apiClient.post<JourFerie[]>(
                '/api/emploi-du-temps/jours-feries/charger-modele', body
            );
            return res.data;
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['jours-feries'] });
            toast.success(t('joursFeries.modeleChargeSucces', { pays: variables.pays }));
        },
        onError: (error: unknown) => handleError(error, t('joursFeries.erreurChargement', 'Erreur lors du chargement du modèle')),
    });
}

/** Générer les jours fériés variables (Computus) pour une année */
export function useGenererVariablesAnnee() {
    const queryClient = useQueryClient();
    const { t } = useTranslation('emplois');
    const handleError = useHandleError();
    const etablissementId = useAuthStore(s => s.etablissementId);

    return useMutation({
        mutationFn: async ({ annee, pays }: { annee: number; pays?: string }) => {
            const body: Record<string, any> = { annee };
            if (pays) body.pays = pays;
            if (etablissementId) body.etablissementId = etablissementId;
            const res = await apiClient.post<JourFerie[]>(
                '/api/emploi-du-temps/jours-feries/generer-variables', body
            );
            return res.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['jours-feries'] });
            toast.success(t('joursFeries.variablesGenereesSucces', '{{count}} jour(s) férié(s) variable(s) généré(s)', { count: data?.length ?? 0 }));
        },
        onError: (error: unknown) => handleError(error, t('joursFeries.erreurGeneration', 'Erreur lors de la génération')),
    });
}

/** Lister les modèles de pays disponibles */
export function useModelesPays() {
    return useQuery({
        queryKey: ['jours-feries-modeles'],
        queryFn: async () => {
            const res = await apiClient.get<{ pays: string; count: number }[]>(
                '/api/emploi-du-temps/jours-feries/modeles'
            );
            return res.data;
        },
        staleTime: 10 * 60 * 1000, // 10 min
    });
}

/**
 * Helper : vérifier si une date est un jour férié à partir d'une liste.
 * Compare en local (pas de bug UTC).
 */
export function estJourFerieFromList(date: Date, joursFeries: JourFerie[]): { estFerie: boolean; nom?: string; couleur?: string } {
    for (const jf of joursFeries) {
        if (jf.estRecurrent && jf.mois && jf.jourMois) {
            if (date.getMonth() + 1 === jf.mois && date.getDate() === jf.jourMois) {
                return { estFerie: true, nom: jf.nom, couleur: jf.couleur || undefined };
            }
        } else if (jf.date) {
            // Parser "YYYY-MM-DD" en local (pas new Date() qui interprète en UTC)
            const [annee, mois, jour] = jf.date.split('-').map(Number);
            if (annee && mois && jour
                && date.getFullYear() === annee
                && date.getMonth() + 1 === mois
                && date.getDate() === jour
            ) {
                return { estFerie: true, nom: jf.nom, couleur: jf.couleur || undefined };
            }
        }
    }
    return { estFerie: false };
}
