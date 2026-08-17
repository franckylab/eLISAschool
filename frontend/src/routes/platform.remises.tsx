/**
 * ==================================
 * eLISAschool - Plateforme — Remises d'abonnement
 * ==================================
 *
 * CRUD des remises commerciales (Refonte v3.2, migration 213 + 214) :
 * type (% / montant fixe), cible (GLOBAL/PLAN/TENANT/CYCLE),
 * durée d'application, cumul, priorité, coupon, conditions.
 *
 * v3.2 — i18n complet, CustomModal, ElisaButton, CSS variables,
 *        formatPrix partagé, champs conditions (élèves min, ancienneté).
 *
 * Version: 3.2.0
 * Auteur: franck arlos chendjou
 */

import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { ElisaButton } from '@/components/ui';
import { BadgePercent, Plus, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { formatPrix } from '@/features/billing/types/plan.types';
import { RemiseFormModal } from '@/features/platform';
import type { Remise } from '@/features/platform';

// =============================================
// Hooks
// =============================================

function useRemises() {
    return useQuery<Remise[]>({
        queryKey: ['platform-remises'],
        queryFn: async () => {
            const res = await apiClient.get<{ success: boolean; data: Remise[] }>('/api/platform/remises');
            return res.data?.data ?? [];
        },
    });
}

// =============================================
// Page principale
// =============================================

function RemisesPage() {
    const { t } = useTranslation('plans');
    const { data: remises, isLoading } = useRemises();
    const queryClient = useQueryClient();
    const [modalOpen, setModalOpen] = useState(false);
    const [remiseEdit, setRemiseEdit] = useState<Remise | null>(null);
    const [remiseToDelete, setRemiseToDelete] = useState<Remise | null>(null);

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => apiClient.delete(`/api/platform/remises/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['platform-remises'] });
            toast.success(t('remises.supprimeAvecSucces'));
        },
    });

    const handleDelete = (remise: Remise) => {
        setRemiseToDelete(remise);
    };

    const confirmDeleteRemise = () => {
        if (remiseToDelete) {
            deleteMutation.mutate(remiseToDelete.id);
            setRemiseToDelete(null);
        }
    };

    const formatDuree = (r: Remise) => {
        if (r.dureeApplication === 'N_CYCLES') return t('remises.dureeApp.N_CYCLES', { count: r.nbCycles ?? 0 });
        if (r.dureeApplication === 'PERMANENTE') return t('remises.dureeApp.PERMANENTE');
        return t('remises.dureeApp.PREMIERE_FACTURE');
    };

    const formatCondition = (r: Remise) => {
        const parts: string[] = [];
        if (r.conditionElevesMin) parts.push(t('remises.conditions.elevesFormat', { count: r.conditionElevesMin }));
        if (r.conditionAncienneteMois) parts.push(t('remises.conditions.ancienneteFormat', { count: r.conditionAncienneteMois }));
        return parts.length > 0 ? parts.join(', ') : '—';
    };

    return (
        <div className="space-y-[var(--space-lg)] p-[clamp(1rem,0.75rem+1vw,1.5rem)]">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <BadgePercent className="h-6 w-6 text-[var(--color-dominante)]" />
                    <div>
                        <h1 className="text-xl font-bold text-[var(--color-texte)]">{t('remises.titre')}</h1>
                        <p className="text-sm text-[var(--color-texte-secondaire)]">
                            {t('remises.description')}
                        </p>
                    </div>
                </div>
                <ElisaButton onClick={() => { setRemiseEdit(null); setModalOpen(true); }} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    {t('remises.nouveau')}
                </ElisaButton>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-[var(--color-bordure)] bg-[var(--color-surface)]">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-[var(--color-bordure)] text-left text-[var(--color-texte-secondaire)]">
                            <th className="px-4 py-3 font-medium">{t('remises.code')}</th>
                            <th className="px-4 py-3 font-medium">{t('remises.nom')}</th>
                            <th className="px-4 py-3 font-medium">{t('remises.valeur')}</th>
                            <th className="px-4 py-3 font-medium">{t('remises.duree')}</th>
                            <th className="px-4 py-3 font-medium">{t('remises.cible')}</th>
                            <th className="hidden px-4 py-3 font-medium sm:table-cell">{t('remises.conditions.colonne')}</th>
                            <th className="hidden px-4 py-3 font-medium sm:table-cell">{t('remises.priorite')}</th>
                            <th className="hidden px-4 py-3 font-medium lg:table-cell">{t('remises.usage')}</th>
                            <th className="px-4 py-3 font-medium">{t('remises.statut')}</th>
                            <th className="px-4 py-3" />
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading && (
                            <tr>
                                <td colSpan={10} className="px-4 py-8 text-center text-[var(--color-texte-secondaire)]">
                                    {t('remises.chargement')}
                                </td>
                            </tr>
                        )}
                        {(remises ?? []).map(r => (
                            <tr key={r.id} className="border-b border-[var(--color-bordure)]/50 text-[var(--color-texte)] transition-colors hover:bg-[var(--color-surface-hover)]/50">
                                <td className="px-4 py-3 font-mono text-xs">{r.code}</td>
                                <td className="px-4 py-3">{r.nom}</td>
                                <td className="px-4 py-3 font-semibold">
                                    {r.typeRemise === 'POURCENTAGE' ? `−${r.valeur} %` : `−${formatPrix(Number(r.valeur))} F`}
                                </td>
                                <td className="px-4 py-3 text-xs">{formatDuree(r)}</td>
                                <td className="px-4 py-3 text-xs">
                                    {t(`remises.cibles.${r.cible}` as any)}{r.cibleCycle ? ` (${r.cibleCycle})` : ''}
                                </td>
                                <td className="hidden px-4 py-3 text-xs text-[var(--color-texte-secondaire)] sm:table-cell">{formatCondition(r)}</td>
                                <td className="hidden px-4 py-3 sm:table-cell">{r.priorite}</td>
                                <td className="hidden px-4 py-3 text-xs lg:table-cell">
                                    {r.utilisations}{r.maxUtilisations ? ` / ${r.maxUtilisations}` : ''}
                                </td>
                                <td className="px-4 py-3">
                                    <span className={cn(
                                        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
                                        r.actif
                                            ? 'bg-[var(--color-success-100)] text-[var(--color-success-700)]'
                                            : 'bg-[var(--color-surface-hover)] text-[var(--color-texte-muted)]',
                                    )}>
                                        <span className={cn('h-1.5 w-1.5 rounded-full', r.actif ? 'bg-[var(--color-success-500)]' : 'bg-[var(--color-texte-muted)]')} />
                                        {r.actif ? t('remises.actif') : t('remises.inactif')}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-end gap-1">
                                        <ElisaButton variant="ghost" size="xs" onClick={() => { setRemiseEdit(r); setModalOpen(true); }} icon={<Pencil className="h-3.5 w-3.5" />}>
                                            <span className="hidden sm:inline">{t('plans.modifier')}</span>
                                        </ElisaButton>
                                        <ElisaButton variant="ghost" size="xs" onClick={() => handleDelete(r)} className="text-[var(--color-danger-500)] hover:text-[var(--color-danger-700)]" icon={<Trash2 className="h-3.5 w-3.5" />}>
                                            <span className="hidden sm:inline">{t('plans.supprimer')}</span>
                                        </ElisaButton>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {!isLoading && (remises ?? []).length === 0 && (
                            <tr>
                                <td colSpan={10} className="px-4 py-12 text-center">
                                    <div className="flex flex-col items-center">
                                        <BadgePercent className="mb-3 h-10 w-10 text-[var(--color-texte-muted)]" />
                                        <p className="text-[var(--color-texte-secondaire)]">{t('remises.aucuneRemise')}</p>
                                        <ElisaButton size="sm" className="mt-3" onClick={() => { setRemiseEdit(null); setModalOpen(true); }} icon={<Plus className="h-4 w-4" />}>
                                            {t('remises.nouveau')}
                                        </ElisaButton>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <RemiseFormModal
                remise={remiseEdit}
                open={modalOpen}
                onOpenChange={setModalOpen}
            />

            <ConfirmationModal
                isOpen={!!remiseToDelete}
                title={t('remises.supprimerTitre', 'Supprimer cette remise')}
                message={t('remises.confirmerSuppression', { nom: remiseToDelete?.nom ?? '' })}
                variant="danger"
                confirmLabel={t('common:actions.supprimer', 'Supprimer')}
                cancelLabel={t('common:actions.annuler', 'Annuler')}
                onConfirm={confirmDeleteRemise}
                onCancel={() => setRemiseToDelete(null)}
            />
        </div>
    );
}

export const Route = createFileRoute('/platform/remises')({
    component: RemisesPage,
});

export default RemisesPage;
