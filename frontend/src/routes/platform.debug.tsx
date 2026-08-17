/**
 * ==================================
 * eLISAschool - Platform Debug Layout
 * ==================================
 * Layout pour les pages de debug plateforme.
 * Refonte v3 — migration 213.
 */

import { createFileRoute, Outlet, Link, useMatchRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Bug, Terminal, FlaskConical } from 'lucide-react';
import { cn } from '@/lib/cn';

export const Route = createFileRoute('/platform/debug')({
    component: PlatformDebugLayout,
});

const DEBUG_TABS = [
    { key: 'entitlements', labelKey: 'navigation.resolutionEntitlements', path: '/platform/debug/entitlements', icon: Bug },
    { key: 'api', labelKey: 'navigation.consoleApi', path: '/platform/debug/api', icon: Terminal },
    { key: 'features', labelKey: 'navigation.featureToggles', path: '/platform/debug/features', icon: FlaskConical },
] as const;

function PlatformDebugLayout() {
    const { t } = useTranslation('admin');
    const matchRoute = useMatchRoute();

    return (
        <div className="p-[var(--space-lg)] space-y-[var(--space-md)]">
            {/* Header */}
            <div>
                <h1 className="font-bold text-[var(--color-texte)]" style={{ fontSize: 'clamp(1.25rem, 1.1rem + 0.5vw, 1.5rem)' }}>
                    {t('sidebar.groupeDebug', 'Tests & Debug')}
                </h1>
                <p style={{ fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)', color: 'var(--color-texte-muted)' }}>
                    Outils de diagnostic et résolution pour l'équipe technique
                </p>
            </div>

            {/* Tabs navigation */}
            <div className="flex gap-1 border-b border-[var(--color-bordure)] pb-px">
                {DEBUG_TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = matchRoute({ to: tab.path, fuzzy: true });
                    return (
                        <Link
                            key={tab.key}
                            to={tab.path}
                            className={cn(
                                'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-md border-b-2 transition-colors',
                                isActive
                                    ? 'border-[var(--color-danger-500)] text-[var(--color-danger-600)] bg-[var(--color-danger-50)]'
                                    : 'border-transparent text-[var(--color-texte-muted)] hover:text-[var(--color-texte)] hover:bg-[var(--color-surface-hover)]'
                            )}
                            style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.15vw, 0.8125rem)' }}
                        >
                            <Icon className="w-4 h-4" />
                            {t(tab.labelKey)}
                        </Link>
                    );
                })}
            </div>

            {/* Outlet for child routes */}
            <Outlet />
        </div>
    );
}
