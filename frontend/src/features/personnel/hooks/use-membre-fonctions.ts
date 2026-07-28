import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

export interface MembreFonction {
    id: string;
    membrePersonnelId: string;
    fonctionId: string;
    fonction?: { id: string; nom: string; code: string };
    dateDebut: string;
    dateFin?: string | null;
    estPrincipale: boolean;
    commentaire?: string | null;
    etablissementId: string;
}

const MEMBRE_FONCTION_KEYS = {
    all: ['membre-fonctions'] as const,
    byMembre: (id: string) => [...MEMBRE_FONCTION_KEYS.all, 'membre', id] as const,
};

export function useMembreFonctions(membrePersonnelId: string) {
    return useQuery({
        queryKey: MEMBRE_FONCTION_KEYS.byMembre(membrePersonnelId),
        queryFn: async () => {
            const res = await apiClient.get<MembreFonction[]>(
                `/api/personnel/membres-fonctions/membre/${membrePersonnelId}`
            );
            return res.data;
        },
        enabled: !!membrePersonnelId,
        placeholderData: (previousData) => previousData,
    });
}

export function useAssignerFonction() {
    const qc = useQueryClient();
    const { t } = useTranslation('personnel');
    return useMutation({
        mutationFn: async (dto: {
            membrePersonnelId: string;
            fonctionId: string;
            dateDebut: string;
            dateFin?: string | null;
            estPrincipale?: boolean;
            commentaire?: string | null;
        }) => {
            const res = await apiClient.post<MembreFonction>('/api/personnel/membres-fonctions', dto);
            return res.data;
        },
        onSuccess: (data) => {
            if (data) qc.invalidateQueries({ queryKey: MEMBRE_FONCTION_KEYS.byMembre(data.membrePersonnelId) });
            toast.success(t('toasts.fonctionAssignee'));
        },
        onError: (error: unknown) => {
            toast.error((error as Error)?.message || t('erreurs.assignation'));
        },
    });
}

export function useModifierMembreFonction() {
    const qc = useQueryClient();
    const { t } = useTranslation('personnel');
    return useMutation({
        mutationFn: async ({ id, dto }: { id: string; dto: Partial<MembreFonction> }) => {
            const res = await apiClient.patch<MembreFonction>(`/api/personnel/membres-fonctions/${id}`, dto);
            return res.data;
        },
        onSuccess: (data) => {
            if (data) qc.invalidateQueries({ queryKey: MEMBRE_FONCTION_KEYS.byMembre(data.membrePersonnelId) });
            toast.success(t('toasts.assignationMiseAJour'));
        },
        onError: (error: unknown) => {
            toast.error((error as Error)?.message || t('erreurs.miseAJour'));
        },
    });
}

export function useRetirerFonction() {
    const qc = useQueryClient();
    const { t } = useTranslation('personnel');
    return useMutation({
        mutationFn: async ({ id, membrePersonnelId }: { id: string; membrePersonnelId: string }) => {
            await apiClient.delete(`/api/personnel/membres-fonctions/${id}`);
            return { membrePersonnelId };
        },
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: MEMBRE_FONCTION_KEYS.byMembre(data.membrePersonnelId) });
            toast.success(t('toasts.fonctionRetiree'));
        },
        onError: (error: unknown) => {
            toast.error((error as Error)?.message || t('erreurs.retrait'));
        },
    });
}
