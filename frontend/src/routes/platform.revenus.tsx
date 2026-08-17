/**
 * ==================================
 * eLISAschool - Platform Revenus & KPIs
 * ==================================
 * Page dédiée aux revenus, KPIs SaaS et usage.
 * Remplace l'ancienne redirection — Refonte Panel Admin v3.
 *
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 */

import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { TrendingUp } from 'lucide-react';
import { UsageMetersDashboard } from '@/features/platform/components/usage-meters-dashboard';
import { RevenusDashboard } from '@/features/platform/components/revenus-dashboard';

// =============================================
// Page
// =============================================

function PlatformRevenusPage() {
    const { t } = useTranslation('admin');

    return (
        <div className="p-[var(--space-lg)] space-y-[var(--space-lg)]">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-[var(--gap-sm)]">
                    <TrendingUp className="h-[var(--icon-md)] w-[var(--icon-md)] text-[var(--color-texte-muted)]" />
                    <div>
                        <h1 className="font-bold text-[var(--color-texte)]" style={{ fontSize: 'clamp(1.25rem, 1.1rem + 0.5vw, 1.5rem)' }}>
                            {t('facturation.onglets.revenus', 'Revenus & KPIs')}
                        </h1>
                        <p style={{ fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)', color: 'var(--color-texte-muted)' }}>
                            {t('facturation.revenus.sousTitre', 'Métriques financières et usage de la plateforme')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Dashboard Revenus */}
            <RevenusDashboard />

            {/* Dashboard Usage */}
            <UsageMetersDashboard />
        </div>
    );
}

export const Route = createFileRoute('/platform/revenus')({
    component: PlatformRevenusPage,
});

export default PlatformRevenusPage;
