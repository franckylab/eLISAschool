/**
 * ==================================
 * eLISAschool - Platform Abonnements
 * ==================================
 * Page plateforme — Liste des abonnements actifs par établissement.
 *
 * V1.2 — Panel Admin Enterprise (Lot C v7 : Abonnements)
 */

import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Star, CheckCircle2, XCircle, Clock, CreditCard } from 'lucide-react';

function PlatformAbonnementsPage() {
    const { t } = useTranslation('admin');

    return (
        <div className="p-[var(--space-lg)]">
            {/* Header */}
            <div className="mb-[var(--space-lg)]">
                <h1 className="text-[clamp(1.25rem,3vw,1.75rem)] font-bold text-[var(--color-texte)]">
                    {t('navigation.abonnements')}
                </h1>
                <p className="mt-1 text-sm text-[var(--color-texte-muted)]">
                    {t('sidebar.descAbonnements')}
                </p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-[var(--gap-md)] sm:grid-cols-2 lg:grid-cols-4">
                {/* Total abonnements */}
                <div className="rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-[var(--space-md)]">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[var(--color-texte-muted)]">Total actifs</span>
                        <Star className="h-4 w-4 text-[var(--color-dominante)]" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-[var(--color-texte)]">—</p>
                </div>

                {/* Actifs */}
                <div className="rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-[var(--space-md)]">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[var(--color-texte-muted)]">Actifs</span>
                        <CheckCircle2 className="h-4 w-4 text-[var(--color-success)]" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-[var(--color-success)]">—</p>
                </div>

                {/* En essai */}
                <div className="rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-[var(--space-md)]">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[var(--color-texte-muted)]">En essai</span>
                        <Clock className="h-4 w-4 text-[var(--color-warning)]" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-[var(--color-warning)]">—</p>
                </div>

                {/* Expirés */}
                <div className="rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-[var(--space-md)]">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[var(--color-texte-muted)]">Expirés</span>
                        <XCircle className="h-4 w-4 text-[var(--color-danger)]" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-[var(--color-danger)]">—</p>
                </div>
            </div>

            {/* Placeholder table */}
            <div className="mt-[var(--space-lg)] rounded-xl border border-dashed border-[var(--color-bordure)] bg-[var(--color-surface)] p-[var(--space-xl)] text-center">
                <CreditCard className="mx-auto h-12 w-12 text-[var(--color-texte-muted)]/30" />
                <p className="mt-4 text-sm font-medium text-[var(--color-texte-muted)]">
                    Liste des abonnements — En cours de développement
                </p>
                <p className="mt-1 text-xs text-[var(--color-texte-muted)]/60">
                    Tableau filtrable par plan, statut, établissement — Actions : renouveler, suspendre, modifier
                </p>
            </div>
        </div>
    );
}

export const Route = createFileRoute('/platform/abonnements')({
    component: PlatformAbonnementsPage,
});

export default PlatformAbonnementsPage;
