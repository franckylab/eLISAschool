/**
 * ==================================
 * eLISAschool - Platform Plans (v3.4)
 * ==================================
 * Page dédiée à la gestion des plans d'abonnement.
 * Refonte v3.4 — Skeleton loading, stats résumé, animations,
 * dark mode, responsive 320px-2560px.
 *
 * Version: 3.4.0
 * Auteur: franck arlos chendjou
 */

import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { PlanFormModal } from '@/features/platform/components/plan-form-modal';
import { ElisaButton } from '@/components/ui';
import {
    Sparkles,
    Plus,
    Pencil,
    Trash2,
    LayoutGrid,
    AlertCircle,
    RefreshCw,
    Check,
} from 'lucide-react';
import type { Plan } from '@/features/billing/types/plan.types';
import { formatPrix } from '@/features/billing/types/plan.types';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { cn } from '@/lib/cn';

// =============================================
// Hook data fetching
// =============================================

function usePlans() {
    return useQuery<Plan[]>({
        queryKey: ['platform-plans'],
        queryFn: async () => {
            const res = await apiClient.get<Plan[] | { success: boolean; data: Plan[] }>('/api/platform/facturation/plans');
            const payload = res.data as any;
            const liste: Plan[] = Array.isArray(payload) ? payload : payload?.data ?? [];
            return [...liste].sort((a, b) => (a.rang ?? 0) - (b.rang ?? 0));
        },
    });
}

// =============================================
// Skeleton loading
// =============================================

function PlansSkeleton() {
    return (
        <div className="grid gap-[var(--gap-md)] md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse space-y-4 rounded-2xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-5 sm:p-6">
                    <div className="flex items-center justify-between">
                        <div className="h-5 w-16 rounded-full bg-[var(--color-surface-hover)]" />
                        <div className="h-5 w-20 rounded-full bg-[var(--color-surface-hover)]" />
                    </div>
                    <div className="space-y-2">
                        <div className="h-5 w-2/3 rounded bg-[var(--color-surface-hover)]" />
                        <div className="h-4 w-full rounded bg-[var(--color-surface-hover)]" />
                    </div>
                    <div className="h-8 w-1/2 rounded bg-[var(--color-surface-hover)]" />
                    <div className="space-y-2">
                        {[1, 2, 3].map((j) => (
                            <div key={j} className="h-4 w-full rounded bg-[var(--color-surface-hover)]" />
                        ))}
                    </div>
                    <div className="flex gap-2 border-t border-[var(--color-bordure)] pt-3">
                        <div className="h-7 w-16 rounded-lg bg-[var(--color-surface-hover)]" />
                        <div className="h-7 w-16 rounded-lg bg-[var(--color-surface-hover)]" />
                    </div>
                </div>
            ))}
        </div>
    );
}

// =============================================
// Error state
// =============================================

function PlansError({ onRetry }: { onRetry: () => void }) {
    const { t } = useTranslation('plans');
    return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--color-danger-200)] bg-[var(--color-danger-50)] py-12 text-center">
            <AlertCircle className="mb-3 h-10 w-10 text-[var(--color-danger-500)]" />
            <p className="text-[var(--color-texte)] font-medium">{t('plans.erreurChargement', 'Erreur de chargement des plans')}</p>
            <ElisaButton variant="ghost" size="sm" className="mt-3" onClick={onRetry} icon={<RefreshCw className="h-4 w-4" />}>
                {t('plans.reessayer', 'Réessayer')}
            </ElisaButton>
        </div>
    );
}

// =============================================
// Page
// =============================================

function PlatformPlansPage() {
    const { t } = useTranslation('plans');
    const queryClient = useQueryClient();
    const { data: plans, isLoading, isError, refetch } = usePlans();
    const [modalOpen, setModalOpen] = useState(false);
    const [editPlan, setEditPlan] = useState<Plan | undefined>(undefined);
    const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => apiClient.delete(`/api/platform/facturation/plans/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['platform-plans'] });
            toast.success(t('plans.supprimeAvecSucces'));
        },
    });

    const handleEdit = (plan: Plan) => {
        setEditPlan(plan);
        setModalOpen(true);
    };

    const handleCreate = () => {
        setEditPlan(undefined);
        setModalOpen(true);
    };

    const handleDelete = (plan: Plan) => {
        setPlanToDelete(plan);
    };

    const confirmDeletePlan = () => {
        if (planToDelete) {
            deleteMutation.mutate(planToDelete.id);
            setPlanToDelete(null);
        }
    };

    // Stats résumé
    const nbActifs = plans?.filter((p) => p.actif).length ?? 0;
    const planDefaut = plans?.find((p) => p.estParDefaut);

    return (
        <div className="p-[var(--space-lg)] space-y-[var(--space-lg)]">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-[var(--gap-sm)]">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-dominante)]/10">
                        <Sparkles className="h-5 w-5 text-[var(--color-dominante)]" />
                    </div>
                    <div>
                        <h1 className="font-bold text-[var(--color-texte)]" style={{ fontSize: 'clamp(1.25rem, 1.1rem + 0.5vw, 1.5rem)' }}>
                            {t('plans.titre')}
                        </h1>
                        <p style={{ fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)', color: 'var(--color-texte-muted)' }}>
                            {t('plans.description')}
                        </p>
                    </div>
                </div>
                <ElisaButton onClick={handleCreate} size="sm">
                    <Plus className="h-[var(--icon-sm)] w-[var(--icon-sm)] mr-2" />
                    {t('plans.nouveau')}
                </ElisaButton>
            </div>

            {/* Stats résumé */}
            {!isLoading && !isError && plans && plans.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 text-sm">
                    <div className="flex items-center gap-1.5 rounded-full border border-[var(--color-bordure)] bg-[var(--color-surface)] px-3 py-1.5">
                        <LayoutGrid className="h-3.5 w-3.5 text-[var(--color-texte-muted)]" />
                        <span className="font-medium text-[var(--color-texte)]">{plans.length}</span>
                        <span className="text-[var(--color-texte-muted)]">{t('plans.stats.total', 'plans')}</span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full border border-[var(--color-bordure)] bg-[var(--color-surface)] px-3 py-1.5">
                        <span className="h-2 w-2 rounded-full bg-[var(--color-success-500)]" />
                        <span className="font-medium text-[var(--color-texte)]">{nbActifs}</span>
                        <span className="text-[var(--color-texte-muted)]">{t('plans.stats.actifs', 'actifs')}</span>
                    </div>
                    {planDefaut && (
                        <div className="flex items-center gap-1.5 rounded-full border border-[var(--color-dominante)]/20 bg-[var(--color-dominante)]/5 px-3 py-1.5">
                            <Check className="h-3.5 w-3.5 text-[var(--color-dominante)]" />
                            <span className="font-medium text-[var(--color-dominante)]">{planDefaut.nom}</span>
                            <span className="text-[var(--color-texte-muted)]">{t('plans.stats.defaut', 'par défaut')}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Loading */}
            {isLoading && <PlansSkeleton />}

            {/* Error */}
            {isError && <PlansError onRetry={() => refetch()} />}

            {/* Empty state */}
            {!isLoading && !isError && plans?.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--color-bordure)] py-16 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-surface-hover)]">
                        <Sparkles className="h-8 w-8 text-[var(--color-texte-muted)]" />
                    </div>
                    <p className="text-lg font-medium text-[var(--color-texte)]">{t('plans.aucunPlan')}</p>
                    <p className="mt-1 text-sm text-[var(--color-texte-muted)]">{t('plans.aucunPlanDesc', 'Créez votre premier plan d\'abonnement pour commencer.')}</p>
                    <ElisaButton onClick={handleCreate} size="sm" className="mt-4" icon={<Plus className="h-4 w-4" />}>
                        {t('plans.nouveau')}
                    </ElisaButton>
                </div>
            )}

            {/* Grille plans */}
            <AnimatePresence mode="popLayout">
                {!isLoading && !isError && plans && plans.length > 0 && (
                    <motion.div
                        className="grid gap-[var(--gap-md)] md:grid-cols-2 xl:grid-cols-3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        {plans.map((plan, index) => (
                            <motion.div
                                key={plan.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                className="relative flex flex-col rounded-2xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-5 transition-shadow hover:shadow-md sm:p-6"
                            >
                                {/* Badge + statut */}
                                <div className="mb-3 flex items-start justify-between gap-2">
                                    <span className={cn(
                                        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                                        plan.actif
                                            ? 'bg-[var(--color-success-100)] text-[var(--color-success-700)]'
                                            : 'bg-[var(--color-surface-hover)] text-[var(--color-texte-muted)]',
                                    )}>
                                        <span className={cn('h-1.5 w-1.5 rounded-full', plan.actif ? 'bg-[var(--color-success-500)]' : 'bg-[var(--color-texte-muted)]')} />
                                        {plan.actif ? t('plans.actif') : t('plans.inact')}
                                    </span>
                                    {plan.badge && (
                                        <span
                                            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
                                            style={{ backgroundColor: 'color-mix(in srgb, var(--color-dominante) 10%, transparent)', color: 'var(--color-dominante)' }}
                                        >
                                            <Sparkles className="h-3 w-3" />
                                            {plan.badge}
                                        </span>
                                    )}
                                </div>

                                {/* Nom + description */}
                                <div className="mb-3">
                                    <h3 className="font-bold text-[var(--color-texte)]" style={{ fontSize: 'clamp(1rem, 0.9rem + 0.4vw, 1.125rem)' }}>
                                        {plan.nom}
                                        {plan.estParDefaut && (
                                            <span className="ml-2 inline-flex items-center rounded-full bg-[var(--color-dominante)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--color-dominante)]">
                                                {t('plans.parDefaut', 'Défaut')}
                                            </span>
                                        )}
                                    </h3>
                                    {plan.description && (
                                        <p className="mt-1 line-clamp-2 text-[var(--color-texte-muted)]" style={{ fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)' }}>{plan.description}</p>
                                    )}
                                </div>

                                {/* Prix */}
                                <div className="mb-4" style={{ fontSize: 'clamp(1.5rem, 1.2rem + 1vw, 1.875rem)' }}>
                                    <span className="font-extrabold text-[var(--color-texte)]">{formatPrix(Number(plan.prixBase), plan.devise)}</span>
                                    <span className="font-normal text-[var(--color-texte-muted)]" style={{ fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)' }}>{t('plans.parMois')}</span>
                                </div>

                                {/* Quotas */}
                                <div className="mb-4 space-y-[var(--space-xs)] text-[var(--color-texte-secondaire)]" style={{ fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)' }}>
                                    <div className="flex justify-between">
                                        <span>{t('plans.elevesMax')}</span>
                                        <span className="font-medium text-[var(--color-texte)]">
                                            {(plan.quotas?.eleves ?? 0) === 0 ? t('plans.illimite') : plan.quotas?.eleves?.toLocaleString('fr-FR')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>{t('plans.utilisateursMax')}</span>
                                        <span className="font-medium text-[var(--color-texte)]">{(plan.quotas?.utilisateurs ?? 0) === 0 ? t('plans.illimite') : plan.quotas?.utilisateurs?.toLocaleString('fr-FR')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>{t('plans.classesMax')}</span>
                                        <span className="font-medium text-[var(--color-texte)]">{(plan.quotas?.classes ?? 0) === 0 ? t('plans.illimite') : plan.quotas?.classes?.toLocaleString('fr-FR')}</span>
                                    </div>
                                    {Number(plan.tarification?.prixParEleve) > 0 && (
                                        <div className="flex justify-between">
                                            <span>{t('plans.prixParEleve')}</span>
                                            <span className="font-medium text-[var(--color-texte)]">
                                                {formatPrix(Number(plan.tarification?.prixParEleve), plan.devise)} {t('plans.apresFranchise', { count: plan.tarification?.elevesInclusGratuits ?? 0 })}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Modules inclus */}
                                {(plan.entitlements?.modules?.length ?? 0) > 0 && (
                                    <div className="mb-4 border-t border-[var(--color-bordure)] pt-3">
                                        <span className="text-xs text-[var(--color-texte-muted)]">{t('plans.modulesInclus')} ({plan.entitlements!.modules.length})</span>
                                        <div className="mt-1.5 flex flex-wrap gap-1">
                                            {plan.entitlements!.modules.slice(0, 6).map((m) => (
                                                <span key={m} className="rounded-md bg-[var(--color-surface-hover)] px-2 py-0.5 text-xs text-[var(--color-texte)]">{m}</span>
                                            ))}
                                            {plan.entitlements!.modules.length > 6 && (
                                                <span className="rounded-md bg-[var(--color-surface-hover)] px-2 py-0.5 text-xs text-[var(--color-texte-muted)]">+{plan.entitlements!.modules.length - 6}</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="mt-auto flex items-center justify-end gap-1 border-t border-[var(--color-bordure)] pt-3">
                                    <ElisaButton variant="ghost" size="xs" onClick={() => handleEdit(plan)} icon={<Pencil className="h-3.5 w-3.5" />}>
                                        <span className="hidden sm:inline">{t('plans.modifier')}</span>
                                    </ElisaButton>
                                    <ElisaButton variant="ghost" size="xs" onClick={() => handleDelete(plan)} className="text-[var(--color-danger-500)] hover:text-[var(--color-danger-700)]" icon={<Trash2 className="h-3.5 w-3.5" />}>
                                        <span className="hidden sm:inline">{t('plans.supprimer')}</span>
                                    </ElisaButton>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal CRUD Plan (v3 JSONB) */}
            <PlanFormModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                plan={editPlan ? {
                    id: editPlan.id,
                    nom: editPlan.nom,
                    slug: editPlan.slug,
                    description: editPlan.description ?? '',
                    prixBase: Number(editPlan.prixBase),
                    devise: editPlan.devise,
                    rang: editPlan.rang ?? 0,
                    estParDefaut: editPlan.estParDefaut ?? false,
                    badge: editPlan.badge ?? '',
                    tarification: editPlan.tarification
                        ? { ...editPlan.tarification, paliers: editPlan.tarification.paliers ?? [] }
                        : { prixBase: Number(editPlan.prixBase), prixParEleve: 0, elevesInclusGratuits: 0, paliers: [] },
                    quotas: editPlan.quotas ?? {},
                    entitlements: editPlan.entitlements ?? { modules: [], fonctionnalites: [] },
                    cyclesAutorises: editPlan.cyclesAutorises ?? ['MENSUEL', 'ANNUEL'],
                    essai: editPlan.essai
                        ? { autorise: editPlan.essai.autorise, dureeJours: editPlan.essai.dureeJours ?? 14 }
                        : { autorise: false, dureeJours: 14 },
                } : undefined}
                mode={editPlan ? 'edit' : 'create'}
            />

            <ConfirmationModal
                isOpen={!!planToDelete}
                title={t('plans.supprimerTitre', 'Supprimer ce plan')}
                message={t('plans.confirmerSuppression', { nom: planToDelete?.nom ?? '' })}
                variant="danger"
                confirmLabel={t('common:actions.supprimer', 'Supprimer')}
                cancelLabel={t('common:actions.annuler', 'Annuler')}
                onConfirm={confirmDeletePlan}
                onCancel={() => setPlanToDelete(null)}
            />
        </div>
    );
}

export const Route = createFileRoute('/platform/plans')({
    component: PlatformPlansPage,
});

export default PlatformPlansPage;
