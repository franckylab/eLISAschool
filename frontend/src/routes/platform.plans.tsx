/**
 * ==================================
 * eLISAschool - Platform Plans
 * ==================================
 * Page dédiée à la gestion des plans d'abonnement.
 * Extraite de platform.facturation.tsx — Refonte Panel Admin v3.
 * Refonte v4.3 — Types partagés + i18n + bouton supprimer.
 *
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 */

import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { PlanFormModal } from '@/features/platform/components/plan-form-modal';
import { ElisaButton } from '@/components/ui';
import {
    Package,
    Plus,
    Edit2,
    Trash2,
    CheckCircle,
    XCircle,
    Sparkles,
} from 'lucide-react';
import type { Plan } from '@/features/billing/types/plan.types';
import { formatPrix } from '@/features/billing/types/plan.types';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

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
// Page
// =============================================

function PlatformPlansPage() {
    const { t } = useTranslation('plans');
    const queryClient = useQueryClient();
    const { data: plans, isLoading } = usePlans();
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

    return (
        <div className="p-[var(--space-lg)] space-y-[var(--space-lg)]">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-[var(--gap-sm)]">
                    <Package className="h-[var(--icon-md)] w-[var(--icon-md)] text-[var(--color-texte-muted)]" />
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

            {/* Loading */}
            {isLoading && <div className="animate-pulse text-[var(--color-texte-muted)]">{t('plans.chargement')}</div>}

            {/* Grille plans */}
            {!isLoading && plans?.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--color-bordure)] py-16 text-center">
                    <Package className="mb-4 h-12 w-12 text-[var(--color-texte-muted)]" />
                    <p className="text-lg font-medium text-[var(--color-texte)]">{t('plans.aucunPlan')}</p>
                    <ElisaButton onClick={handleCreate} size="sm" className="mt-4" icon={<Plus className="h-4 w-4" />}>
                        {t('plans.nouveau')}
                    </ElisaButton>
                </div>
            )}
            <div className="grid gap-[var(--gap-md)] md:grid-cols-2 xl:grid-cols-3">
                {plans?.map((plan) => (
                    <div key={plan.id} className="relative flex flex-col rounded-2xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-5 transition-shadow hover:shadow-sm sm:p-6">
                        {/* Badge + statut */}
                        <div className="mb-3 flex items-start justify-between gap-2">
                            <span
                                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                                style={{
                                    backgroundColor: plan.actif ? 'var(--color-success-100)' : 'var(--color-danger-100)',
                                    color: plan.actif ? 'var(--color-success-700)' : 'var(--color-danger-700)',
                                }}
                            >
                                {plan.actif ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                {plan.actif ? t('plans.actif') : t('plans.inact')}
                            </span>
                            {plan.badge && (
                                <span
                                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
                                    style={{ backgroundColor: 'color-mix(in srgb, var(--color-dominant-600) 10%, transparent)', color: 'var(--color-dominant-600)' }}
                                >
                                    <Sparkles className="h-3 w-3" />
                                    {plan.badge}
                                </span>
                            )}
                        </div>

                        {/* Nom + description */}
                        <div className="mb-3">
                            <h3 className="font-bold text-[var(--color-texte)]" style={{ fontSize: 'clamp(1rem, 0.9rem + 0.4vw, 1.125rem)' }}>{plan.nom}</h3>
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
                        <div className="mt-auto flex items-center justify-end gap-2 border-t border-[var(--color-bordure)] pt-3">
                            <ElisaButton variant="outline" size="xs" onClick={() => handleEdit(plan)} icon={<Edit2 className="h-3.5 w-3.5" />}>
                                {t('plans.modifier')}
                            </ElisaButton>
                            <ElisaButton variant="ghost" size="xs" onClick={() => handleDelete(plan)} className="text-[var(--color-danger-500)] hover:text-[var(--color-danger-700)]" icon={<Trash2 className="h-3.5 w-3.5" />}>
                                {t('plans.supprimer')}
                            </ElisaButton>
                        </div>
                    </div>
                ))}
            </div>

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
