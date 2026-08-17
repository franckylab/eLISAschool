/**
 * ==================================
 * eLISAschool - Mon Abonnement (Dashboard Tenant)
 * ==================================
 * Résumé complet de l'abonnement : plan, quotas, packs, remises.
 *
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import {
    CreditCard,
    Calendar,
    Package,
    Tag,
    TrendingUp,
    AlertTriangle,
    Check,
    ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import type { MonAbonnement } from '@/features/billing/types/plan.types';
import { formatPrix } from '@/features/billing/types/plan.types';

// =============================================
// Hook
// =============================================

function useMonAbonnementDetail() {
    return useQuery<MonAbonnement>({
        queryKey: ['mon-abonnement-detail'],
        queryFn: async () => {
            const res = await apiClient.get<{ success: boolean; data: MonAbonnement }>('/api/billing/mon-abonnement/detail');
            return res.data?.data;
        },
    });
}

// =============================================
// Types
// =============================================

interface MonAbonnementDashboardProps {
    className?: string;
}

// =============================================
// Labels ressources
// =============================================

const RESSOURCE_LABELS: Record<string, string> = {
    eleves: 'Élèves',
    utilisateurs: 'Utilisateurs',
    classes: 'Classes',
    stockageGo: 'Stockage (Go)',
    sms: 'SMS',
};

// =============================================
// Composant principal
// =============================================

export function MonAbonnementDashboard({ className }: MonAbonnementDashboardProps) {
    const { t } = useTranslation('billing');
    const { data: abo, isLoading } = useMonAbonnementDetail();

    if (isLoading) {
        return (
            <div className={cn('animate-pulse space-y-6', className)}>
                <div className="h-32 rounded-xl bg-[var(--color-surface-hover)]" />
                <div className="grid grid-cols-2 gap-4">
                    <div className="h-24 rounded-xl bg-[var(--color-surface-hover)]" />
                    <div className="h-24 rounded-xl bg-[var(--color-surface-hover)]" />
                </div>
            </div>
        );
    }

    if (!abo) {
        return (
            <div className={cn('rounded-xl border border-[var(--color-bordure)] p-8 text-center', className)}>
                <p className="text-[var(--color-texte-secondaire)]">{t('abonnement.aucun')}</p>
            </div>
        );
    }

    const statutColor = abo.statut === 'ACTIF' ? 'success' : abo.statut === 'ESSAI' ? 'warning' : 'error';

    return (
        <div className={cn('space-y-6', className)}>
            {/* ─── Résumé abonnement ─── */}
            <div className="rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-dominante)]/10">
                            <CreditCard className="h-6 w-6 text-[var(--color-dominante)]" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-[var(--color-texte)]">{abo.plan?.nom ?? 'Abonnement'}</h2>
                            <div className="flex items-center gap-2 text-sm text-[var(--color-texte-secondaire)]">
                                <span className={cn(
                                    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                                    statutColor === 'success' && 'bg-[var(--color-success-600)]/10 text-[var(--color-success-600)]',
                                    statutColor === 'warning' && 'bg-[var(--color-warning-600)]/10 text-[var(--color-warning-600)]',
                                    statutColor === 'error' && 'bg-[var(--color-error-600)]/10 text-[var(--color-error-600)]',
                                )}>
                                    {abo.statut}
                                </span>
                                <span>•</span>
                                <span>{formatPrix(Number(abo.montantMensuel))} {abo.plan?.devise ?? 'XAF'}/mois</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[var(--color-texte-secondaire)]">
                        <Calendar className="h-4 w-4" />
                        <span>
                            {t('abonnement.prochaineFacturation', 'Prochaine facturation')} :{' '}
                            <strong className="text-[var(--color-texte)]">
                                {new Date(abo.prochaineFacturation).toLocaleDateString('fr-FR')}
                            </strong>
                        </span>
                    </div>
                </div>
            </div>

            {/* ─── Quotas effectifs (jauges) ─── */}
            {abo.quotasEffectifs && Object.keys(abo.quotasEffectifs).length > 0 && (
                <div className="rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-6">
                    <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-[var(--color-texte)]">
                        <TrendingUp className="h-5 w-5 text-[var(--color-dominante)]" />
                        {t('consommation.titre')}
                    </h3>
                    <div className="space-y-4">
                        {Object.entries(abo.quotasEffectifs).map(([ressource, data]) => {
                            const label = RESSOURCE_LABELS[ressource] ?? ressource;
                            const pct = data.quotaEffectif > 0 ? Math.min(100, Math.round((data.utilisation / data.quotaEffectif) * 100)) : 0;
                            const isWarning = pct >= 80;
                            const isCritical = pct >= 100;

                            return (
                                <div key={ressource}>
                                    <div className="mb-1 flex items-center justify-between text-sm">
                                        <span className="text-[var(--color-texte-secondaire)]">{label}</span>
                                        <span className={cn(
                                            'font-medium',
                                            isCritical ? 'text-[var(--color-error-600)]' : isWarning ? 'text-[var(--color-warning-600)]' : 'text-[var(--color-texte)]',
                                        )}>
                                            {data.utilisation} / {data.quotaEffectif === 0 ? '∞' : data.quotaEffectif}
                                            {data.quotaPacks > 0 && (
                                                <span className="ml-1 text-xs text-[var(--color-dominante)]">(+{data.quotaPacks} pack)</span>
                                            )}
                                        </span>
                                    </div>
                                    {data.quotaEffectif > 0 && (
                                        <div className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-hover)]">
                                            <div
                                                className={cn(
                                                    'h-full rounded-full transition-all',
                                                    isCritical ? 'bg-[var(--color-error-600)]' : isWarning ? 'bg-[var(--color-warning-600)]' : 'bg-[var(--color-success-600)]',
                                                )}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ─── Remises actives ─── */}
            {abo.remisesActives && abo.remisesActives.length > 0 && (
                <div className="rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-6">
                    <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-[var(--color-texte)]">
                        <Tag className="h-5 w-5 text-[var(--color-dominante)]" />
                        {t('abonnement.remisesActives', 'Remises actives')}
                    </h3>
                    <div className="space-y-2">
                        {abo.remisesActives.map((remise) => (
                            <div key={remise.id} className="flex items-center justify-between rounded-lg bg-[var(--color-surface-hover)]/50 px-4 py-2.5">
                                <div>
                                    <p className="text-sm font-medium text-[var(--color-texte)]">{remise.nom}</p>
                                    <p className="text-xs text-[var(--color-texte-secondaire)]">{remise.code}</p>
                                </div>
                                <span className="rounded-full bg-[var(--color-success-600)]/10 px-2.5 py-0.5 text-sm font-bold text-[var(--color-success-600)]">
                                    {remise.typeRemise === 'POURCENTAGE' ? `−${remise.valeur}%` : `−${formatPrix(Number(remise.valeur))}`}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ─── Packs souscrits ─── */}
            {abo.packsSouscrits && abo.packsSouscrits.length > 0 && (
                <div className="rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-6">
                    <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-[var(--color-texte)]">
                        <Package className="h-5 w-5 text-[var(--color-dominante)]" />
                        {t('abonnement.packsSouscrits', 'Packs souscrits')}
                    </h3>
                    <div className="space-y-2">
                        {abo.packsSouscrits.map((pack) => (
                            <div key={pack.id} className="flex items-center justify-between rounded-lg bg-[var(--color-surface-hover)]/50 px-4 py-2.5">
                                <div>
                                    <p className="text-sm font-medium text-[var(--color-texte)]">{pack.pack?.nom ?? 'Pack'}</p>
                                    <p className="text-xs text-[var(--color-texte-secondaire)]">
                                        +{pack.pack?.quantite} {pack.pack?.ressource}
                                        {pack.dateFin && ` — expire le ${new Date(pack.dateFin).toLocaleDateString('fr-FR')}`}
                                    </p>
                                </div>
                                <Check className="h-4 w-4 text-[var(--color-success-600)]" />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default MonAbonnementDashboard;
