/**
 * ==================================
 * eLISAschool - Plateforme — Cycles & Stratégies d'expiration (v3.4)
 * ==================================
 *
 * CRUD des cycles de facturation configurables et des stratégies
 * d'expiration d'abonnement (Refonte v3, migration 213).
 *
 * Refonte v3.4 — Skeleton loading, animations, stats, dark mode,
 * responsive 320px-2560px, error states.
 *
 * Version: 3.4.0
 * Auteur: franck arlos chendjou
 */

import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/lib/api-client';
import { CycleFormModal, StrategieFormModal } from '@/features/platform';
import { ElisaButton } from '@/components/ui';
import {
    CalendarClock,
    Hourglass,
    Plus,
    Pencil,
    Trash2,
    AlertCircle,
    RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import type { CycleFacturation, StrategieExpiration, ComportementPhase } from '@/features/billing/types/plan.types';

// =============================================
// Hooks
// =============================================

function useCycles() {
    return useQuery<CycleFacturation[]>({
        queryKey: ['platform-cycles-facturation'],
        queryFn: async () => {
            const res = await apiClient.get<CycleFacturation[]>('/api/platform/cycles-facturation');
            const payload = res.data as any;
            return Array.isArray(payload) ? payload : payload?.data ?? [];
        },
    });
}

function useStrategies() {
    return useQuery<StrategieExpiration[]>({
        queryKey: ['platform-strategies-expiration'],
        queryFn: async () => {
            const res = await apiClient.get<StrategieExpiration[]>('/api/platform/strategies-expiration');
            const payload = res.data as any;
            return Array.isArray(payload) ? payload : payload?.data ?? [];
        },
    });
}

// =============================================
// Skeleton
// =============================================

function TableSkeleton({ cols = 6 }: { cols?: number }) {
    return (
        <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-4 rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] p-4">
                    {Array.from({ length: cols }).map((_, j) => (
                        <div key={j} className="h-4 flex-1 animate-pulse rounded bg-[var(--color-surface-hover)]" />
                    ))}
                </div>
            ))}
        </div>
    );
}

// =============================================
// Page principale (2 onglets)
// =============================================

type TabKey = 'cycles' | 'strategies';

function CyclesStrategiesPage() {
    const { t } = useTranslation('plans');
    const [tab, setTab] = useState<TabKey>('cycles');
    const { data: cycles, isLoading: cyclesLoading, isError: cyclesError, refetch: refetchCycles } = useCycles();
    const { data: strategies, isLoading: strategiesLoading, isError: strategiesError, refetch: refetchStrategies } = useStrategies();
    const queryClient = useQueryClient();

    const [cycleModal, setCycleModal] = useState<{ open: boolean; cycle: CycleFacturation | null }>({ open: false, cycle: null });
    const [strategieModal, setStrategieModal] = useState<{ open: boolean; strategie: StrategieExpiration | null }>({ open: false, strategie: null });
    const [cycleToDelete, setCycleToDelete] = useState<CycleFacturation | null>(null);
    const [strategieToDelete, setStrategieToDelete] = useState<StrategieExpiration | null>(null);

    const deleteCycle = useMutation({
        mutationFn: async (id: string) => apiClient.delete(`/api/platform/cycles-facturation/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['platform-cycles-facturation'] });
            toast.success(t('cycles.supprimeAvecSucces'));
        },
    });

    const deleteStrategie = useMutation({
        mutationFn: async (id: string) => apiClient.delete(`/api/platform/strategies-expiration/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['platform-strategies-expiration'] });
            toast.success(t('cycles.supprimeAvecSucces'));
        },
    });

    const handleDeleteCycle = (cycle: CycleFacturation) => setCycleToDelete(cycle);
    const handleDeleteStrategie = (strategie: StrategieExpiration) => setStrategieToDelete(strategie);

    const confirmDeleteCycle = () => {
        if (cycleToDelete) {
            deleteCycle.mutate(cycleToDelete.id);
            setCycleToDelete(null);
        }
    };

    const confirmDeleteStrategie = () => {
        if (strategieToDelete) {
            deleteStrategie.mutate(strategieToDelete.id);
            setStrategieToDelete(null);
        }
    };

    return (
        <div className="space-y-[var(--space-lg)] p-[clamp(1rem,0.75rem+1vw,1.5rem)]">
            {/* En-tête */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-dominante)]/10">
                        <CalendarClock className="h-5 w-5 text-[var(--color-dominante)]" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-[var(--color-texte)]">{t('cycles.titre')}</h1>
                        <p className="text-sm text-[var(--color-texte-secondaire)]">
                            {t('cycles.description')}
                        </p>
                    </div>
                </div>
                <ElisaButton
                    onClick={() => tab === 'cycles'
                        ? setCycleModal({ open: true, cycle: null })
                        : setStrategieModal({ open: true, strategie: null })}
                    size="sm"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    {tab === 'cycles' ? t('cycles.nouveauCycle') : t('cycles.nouvelleStrategie')}
                </ElisaButton>
            </div>

            {/* Onglets */}
            <div className="inline-flex items-center gap-1 rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface-hover)]/30 p-1">
                {([
                    { key: 'cycles', label: t('cycles.ongletCycles'), icon: CalendarClock },
                    { key: 'strategies', label: t('cycles.ongletStrategies'), icon: Hourglass },
                ] as Array<{ key: TabKey; label: string; icon: any }>).map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => setTab(key)}
                        className={cn(
                            'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 sm:px-4',
                            tab === key
                                ? 'bg-[var(--color-dominante)] text-white shadow-sm'
                                : 'text-[var(--color-texte-secondaire)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-texte)]',
                        )}
                    >
                        <Icon className="h-4 w-4" />
                        <span className="hidden sm:inline">{label}</span>
                    </button>
                ))}
            </div>

            {/* Onglet Cycles */}
            <AnimatePresence mode="wait">
                {tab === 'cycles' && (
                    <motion.div
                        key="cycles"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                    >
                        {cyclesLoading && <TableSkeleton cols={6} />}

                        {cyclesError && (
                            <div className="flex flex-col items-center rounded-2xl border border-[var(--color-danger-200)] bg-[var(--color-danger-50)] py-8">
                                <AlertCircle className="mb-2 h-8 w-8 text-[var(--color-danger-500)]" />
                                <p className="text-[var(--color-texte)]">{t('cycles.erreurChargement', 'Erreur de chargement')}</p>
                                <ElisaButton variant="ghost" size="sm" className="mt-2" onClick={() => refetchCycles()} icon={<RefreshCw className="h-4 w-4" />}>
                                    {t('plans.reessayer', 'Réessayer')}
                                </ElisaButton>
                            </div>
                        )}

                        {!cyclesLoading && !cyclesError && (cycles ?? []).length === 0 && (
                            <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-[var(--color-bordure)] py-12">
                                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-surface-hover)]">
                                    <CalendarClock className="h-7 w-7 text-[var(--color-texte-muted)]" />
                                </div>
                                <p className="text-[var(--color-texte-secondaire)]">{t('cycles.aucunCycle')}</p>
                                <ElisaButton size="sm" className="mt-3" onClick={() => setCycleModal({ open: true, cycle: null })} icon={<Plus className="h-4 w-4" />}>
                                    {t('cycles.nouveauCycle')}
                                </ElisaButton>
                            </div>
                        )}

                        {!cyclesLoading && !cyclesError && (cycles ?? []).length > 0 && (
                            <div className="overflow-x-auto rounded-2xl border border-[var(--color-bordure)] bg-[var(--color-surface)]">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-[var(--color-bordure)] text-left text-[var(--color-texte-secondaire)]">
                                            <th className="px-4 py-3 font-medium">{t('cycles.code')}</th>
                                            <th className="px-4 py-3 font-medium">{t('cycles.nom')}</th>
                                            <th className="hidden px-4 py-3 font-medium sm:table-cell">{t('cycles.duree')}</th>
                                            <th className="px-4 py-3 font-medium">{t('cycles.remise')}</th>
                                            <th className="hidden px-4 py-3 font-medium sm:table-cell">{t('cycles.statut')}</th>
                                            <th className="px-4 py-3" />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(cycles ?? []).map((c, index) => (
                                            <motion.tr
                                                key={c.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: index * 0.03 }}
                                                className="border-b border-[var(--color-bordure)]/50 text-[var(--color-texte)] transition-colors hover:bg-[var(--color-surface-hover)]/50"
                                            >
                                                <td className="px-4 py-3 font-mono text-xs">{c.code}</td>
                                                <td className="px-4 py-3 font-medium">{c.nom}</td>
                                                <td className="hidden px-4 py-3 sm:table-cell">{t('cycles.dureeMois', { count: c.dureeMois })}</td>
                                                <td className="px-4 py-3">
                                                    {Number(c.remisePourcent) > 0
                                                        ? <span className="inline-flex items-center rounded-full bg-[var(--color-success-100)] px-2 py-0.5 text-xs font-semibold text-[var(--color-success-700)]">−{Number(c.remisePourcent)}%</span>
                                                        : <span className="text-[var(--color-texte-muted)]">—</span>}
                                                </td>
                                                <td className="hidden px-4 py-3 sm:table-cell">
                                                    <span className={cn(
                                                        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
                                                        c.actif
                                                            ? 'bg-[var(--color-success-100)] text-[var(--color-success-700)]'
                                                            : 'bg-[var(--color-surface-hover)] text-[var(--color-texte-muted)]',
                                                    )}>
                                                        <span className={cn('h-1.5 w-1.5 rounded-full', c.actif ? 'bg-[var(--color-success-500)]' : 'bg-[var(--color-texte-muted)]')} />
                                                        {c.actif ? t('cycles.actif') : t('cycles.inactif')}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <ElisaButton variant="ghost" size="xs" onClick={() => setCycleModal({ open: true, cycle: c })} icon={<Pencil className="h-3.5 w-3.5" />}>
                                                            <span className="hidden sm:inline">{t('plans.modifier')}</span>
                                                        </ElisaButton>
                                                        <ElisaButton variant="ghost" size="xs" onClick={() => handleDeleteCycle(c)} className="text-[var(--color-danger-500)] hover:text-[var(--color-danger-700)]" icon={<Trash2 className="h-3.5 w-3.5" />}>
                                                            <span className="hidden sm:inline">{t('plans.supprimer')}</span>
                                                        </ElisaButton>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Onglet Stratégies */}
            <AnimatePresence mode="wait">
                {tab === 'strategies' && (
                    <motion.div
                        key="strategies"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                    >
                        {strategiesLoading && <TableSkeleton cols={3} />}

                        {strategiesError && (
                            <div className="flex flex-col items-center rounded-2xl border border-[var(--color-danger-200)] bg-[var(--color-danger-50)] py-8">
                                <AlertCircle className="mb-2 h-8 w-8 text-[var(--color-danger-500)]" />
                                <p className="text-[var(--color-texte)]">{t('cycles.erreurChargement', 'Erreur de chargement')}</p>
                                <ElisaButton variant="ghost" size="sm" className="mt-2" onClick={() => refetchStrategies()} icon={<RefreshCw className="h-4 w-4" />}>
                                    {t('plans.reessayer', 'Réessayer')}
                                </ElisaButton>
                            </div>
                        )}

                        {!strategiesLoading && !strategiesError && (strategies ?? []).length === 0 && (
                            <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-[var(--color-bordure)] py-12">
                                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-surface-hover)]">
                                    <Hourglass className="h-7 w-7 text-[var(--color-texte-muted)]" />
                                </div>
                                <p className="text-[var(--color-texte-secondaire)]">{t('cycles.aucuneStrategie')}</p>
                                <ElisaButton size="sm" className="mt-3" onClick={() => setStrategieModal({ open: true, strategie: null })} icon={<Plus className="h-4 w-4" />}>
                                    {t('cycles.nouvelleStrategie')}
                                </ElisaButton>
                            </div>
                        )}

                        {!strategiesLoading && !strategiesError && (strategies ?? []).length > 0 && (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {(strategies ?? []).map((s, index) => (
                                    <motion.div
                                        key={s.id}
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="flex flex-col rounded-2xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-5 transition-shadow hover:shadow-md"
                                    >
                                        <div className="mb-3 flex items-start justify-between">
                                            <div>
                                                <h3 className="flex items-center gap-2 font-bold text-[var(--color-texte)]">
                                                    {s.nom}
                                                    {s.estDefaut && (
                                                        <span className="rounded-full bg-[var(--color-dominante)]/10 px-2.5 py-0.5 text-xs font-medium text-[var(--color-dominante)]">
                                                            {t('cycles.parDefaut')}
                                                        </span>
                                                    )}
                                                </h3>
                                                <p className="mt-0.5 font-mono text-xs text-[var(--color-texte-secondaire)]">
                                                    {s.code}{s.planSlug ? ` · ${t('cycles.planSlugLabel', { slug: s.planSlug })}` : ''}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <ElisaButton variant="ghost" size="xs" onClick={() => setStrategieModal({ open: true, strategie: s })} icon={<Pencil className="h-3.5 w-3.5" />} />
                                                <ElisaButton variant="ghost" size="xs" onClick={() => handleDeleteStrategie(s)} className="text-[var(--color-danger-500)] hover:text-[var(--color-danger-700)]" icon={<Trash2 className="h-3.5 w-3.5" />} />
                                            </div>
                                        </div>
                                        {/* Phases — timeline verticale */}
                                        <div className="mt-1 space-y-0">
                                            {(s.phases ?? []).map((phase, i) => (
                                                <div key={i} className="flex items-start gap-3">
                                                    <div className="flex flex-col items-center">
                                                        <div className={cn(
                                                            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                                                            i === 0 ? 'bg-[var(--color-dominante)]/10 text-[var(--color-dominante)]'
                                                                : phase.comportement === 'ARCHIVED' ? 'bg-[var(--color-danger-100)] text-[var(--color-danger-600)]'
                                                                : 'bg-[var(--color-surface-hover)] text-[var(--color-texte-secondaire)]',
                                                        )}>
                                                            {i + 1}
                                                        </div>
                                                        {i < (s.phases?.length ?? 0) - 1 && (
                                                            <div className="my-0.5 h-4 w-px bg-[var(--color-bordure)]" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 pb-2">
                                                        <div className="flex items-center justify-between rounded-lg bg-[var(--color-surface-hover)] px-3 py-2">
                                                            <span className="text-sm font-medium text-[var(--color-texte)]">
                                                                {t(`cycles.phase.${phase.comportement}` as any)}
                                                            </span>
                                                            <span className="text-xs text-[var(--color-texte-secondaire)]">
                                                                {phase.jours === null ? t('cycles.illimitee') : `${phase.jours} ${t('cycles.jours')}`}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modals */}
            <CycleFormModal
                open={cycleModal.open}
                onOpenChange={(open) => setCycleModal({ open, cycle: null })}
                cycle={cycleModal.cycle}
            />
            <StrategieFormModal
                open={strategieModal.open}
                onOpenChange={(open) => setStrategieModal({ open, strategie: null })}
                strategie={strategieModal.strategie}
            />

            <ConfirmationModal
                isOpen={!!cycleToDelete}
                title={t('cycles.supprimerCycleTitre', 'Supprimer ce cycle')}
                message={t('cycles.confirmerSuppressionCycle', { nom: cycleToDelete?.nom ?? '' })}
                variant="danger"
                confirmLabel={t('common:actions.supprimer', 'Supprimer')}
                cancelLabel={t('common:actions.annuler', 'Annuler')}
                onConfirm={confirmDeleteCycle}
                onCancel={() => setCycleToDelete(null)}
            />

            <ConfirmationModal
                isOpen={!!strategieToDelete}
                title={t('cycles.supprimerStrategieTitre', 'Supprimer cette stratégie')}
                message={t('cycles.confirmerSuppressionStrategie', { nom: strategieToDelete?.nom ?? '' })}
                variant="danger"
                confirmLabel={t('common:actions.supprimer', 'Supprimer')}
                cancelLabel={t('common:actions.annuler', 'Annuler')}
                onConfirm={confirmDeleteStrategie}
                onCancel={() => setStrategieToDelete(null)}
            />
        </div>
    );
}

export const Route = createFileRoute('/platform/cycles-strategies')({
    component: CyclesStrategiesPage,
});
