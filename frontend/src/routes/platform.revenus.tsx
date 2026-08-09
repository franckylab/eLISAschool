/**
 * ==================================
 * eLISAschool - Platform Revenus
 * ==================================
 * Page plateforme — Dashboard revenus (MRR, ARR, revenue).
 *
 * V1.2 — Panel Admin Enterprise (Lot C v7 : Revenus)
 */

import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';

function PlatformRevenusPage() {
    const { t } = useTranslation('admin');

    return (
        <div className="p-[var(--space-lg)]">
            {/* Header */}
            <div className="mb-[var(--space-lg)]">
                <h1 className="text-[clamp(1.25rem,3vw,1.75rem)] font-bold text-[var(--color-texte)]">
                    {t('navigation.revenus')}
                </h1>
                <p className="mt-1 text-sm text-[var(--color-texte-muted)]">
                    {t('sidebar.descRevenus')}
                </p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-[var(--gap-md)] sm:grid-cols-2 lg:grid-cols-4">
                {/* MRR */}
                <div className="rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-[var(--space-md)]">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[var(--color-texte-muted)]">MRR</span>
                        <DollarSign className="h-4 w-4 text-[var(--color-dominante)]" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-[var(--color-texte)]">—</p>
                    <div className="mt-1 flex items-center gap-1 text-xs text-[var(--color-success)]">
                        <ArrowUpRight className="h-3 w-3" />
                        <span>—</span>
                    </div>
                </div>

                {/* ARR */}
                <div className="rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-[var(--space-md)]">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[var(--color-texte-muted)]">ARR</span>
                        <TrendingUp className="h-4 w-4 text-[var(--color-dominante)]" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-[var(--color-texte)]">—</p>
                    <div className="mt-1 flex items-center gap-1 text-xs text-[var(--color-success)]">
                        <ArrowUpRight className="h-3 w-3" />
                        <span>—</span>
                    </div>
                </div>

                {/* ARPU */}
                <div className="rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-[var(--space-md)]">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[var(--color-texte-muted)]">ARPU</span>
                        <DollarSign className="h-4 w-4 text-[var(--color-dominante)]" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-[var(--color-texte)]">—</p>
                    <div className="mt-1 flex items-center gap-1 text-xs text-[var(--color-texte-muted)]">
                        <span>—</span>
                    </div>
                </div>

                {/* Churn */}
                <div className="rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-[var(--space-md)]">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[var(--color-texte-muted)]">Churn Rate</span>
                        <TrendingDown className="h-4 w-4 text-[var(--color-danger)]" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-[var(--color-texte)]">—</p>
                    <div className="mt-1 flex items-center gap-1 text-xs text-[var(--color-texte-muted)]">
                        <ArrowDownRight className="h-3 w-3" />
                        <span>—</span>
                    </div>
                </div>
            </div>

            {/* Placeholder */}
            <div className="mt-[var(--space-lg)] rounded-xl border border-dashed border-[var(--color-bordure)] bg-[var(--color-surface)] p-[var(--space-xl)] text-center">
                <DollarSign className="mx-auto h-12 w-12 text-[var(--color-texte-muted)]/30" />
                <p className="mt-4 text-sm font-medium text-[var(--color-texte-muted)]">
                    Dashboard revenus — En cours de développement
                </p>
                <p className="mt-1 text-xs text-[var(--color-texte-muted)]/60">
                    Graphiques MRR 6 mois, répartition par plan, évolution abonnements
                </p>
            </div>
        </div>
    );
}

export const Route = createFileRoute('/platform/revenus')({
    component: PlatformRevenusPage,
});

export default PlatformRevenusPage;
