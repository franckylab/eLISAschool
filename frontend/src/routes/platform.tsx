/**
 * ==================================
 * eLISAschool - Platform Layout Route
 * ==================================
 * Layout dédié aux routes PLATEFORME (Control Plane)
 * Réservé SUPER_ADMIN — séparation structurelle v5.1
 * Phase 7.1 — PlatformSidebar dédiée intégrée
 */

import { createFileRoute, Outlet } from '@tanstack/react-router';
import { requireRole } from '@/app/permission-guards';
import { PlatformSidebar } from '@/components/layout/platform-sidebar';
import { PlatformHeader } from '@/components/layout/PlatformHeader';
import { AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import { Component, ReactNode, ErrorInfo, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { CommandPalette } from '@/components/CommandPalette';

// ==========================================
// ErrorBoundary pour la plateforme
// Phase P4.1 — Refonte SaaS v6
// ==========================================

interface ErrorBoundaryProps {
    children: ReactNode;
    t?: TFunction;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

class PlatformErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('[PlatformErrorBoundary] Erreur attrapée:', error, errorInfo);
    }

    render() {
        const t = this.props.t ?? ((key: string, fallback?: string) => fallback ?? key) as TFunction;
        if (this.state.hasError) {
            return (
                <div className="flex min-h-[400px] items-center justify-center p-8">
                    <div className="max-w-md text-center space-y-[var(--space-lg)]">
                        <div
                            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
                            style={{ backgroundColor: 'color-mix(in srgb, var(--color-danger) 10%, transparent)' }}
                        >
                            <AlertTriangle
                                className="h-8 w-8"
                                style={{ color: 'var(--color-danger)' }}
                            />
                        </div>
                        <h2
                            className="font-bold"
                            style={{ fontSize: 'clamp(1.125rem, 1rem + 0.6vw, 1.25rem)', color: 'var(--color-texte)' }}
                        >
                            {t('platform.erreurTitre', 'Erreur de la plateforme')}
                        </h2>
                        <p
                            style={{ fontSize: 'clamp(0.8125rem, 0.77rem + 0.2vw, 0.875rem)', color: 'var(--color-texte-muted)' }}
                        >
                            {t('platform.erreurMessage', 'Une erreur inattendue s\'est produite dans l\'espace plateforme.')}
                        </p>
                        <details className="text-left text-xs">
                            <summary
                                className="cursor-pointer hover:opacity-80"
                                style={{ color: 'var(--color-texte-muted)' }}
                            >
                                {t('platform.detailsTechniques', 'Détails techniques')}
                            </summary>
                            <pre
                                className="mt-2 rounded p-[var(--space-md)] overflow-auto font-mono text-xs"
                                style={{ backgroundColor: 'var(--color-surface-alt)', color: 'var(--color-texte-secondary)' }}
                            >
                                {this.state.error?.message}
                            </pre>
                        </details>
                        <div className="flex gap-[var(--gap-sm)] justify-center">
                            <button
                                className="px-[var(--space-md)] py-[var(--space-sm)] rounded-lg border border-[var(--color-bordure)] hover:bg-[var(--color-surface-hover)] transition-colors flex items-center gap-[var(--gap-sm)]"
                                style={{ color: 'var(--color-texte)', fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)' }}
                                onClick={() => this.setState({ hasError: false, error: null })}
                            >
                                <RefreshCw className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />
                                {t('platform.reessayer', 'Réessayer')}
                            </button>
                            <button
                                className="px-[var(--space-md)] py-[var(--space-sm)] rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors" style={{ color: 'var(--color-texte-muted)', fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)' }}
                                onClick={() => window.location.reload()}
                            >
                                {t('platform.rechargerPage', 'Recharger la page')}
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

function PlatformLayout() {
    const { t } = useTranslation('admin');
    return (
        <div className="flex h-screen overflow-hidden bg-[var(--color-fond)]">
            {/* Sidebar plateforme dédiée */}
            <PlatformSidebar />

            {/* Command Palette (Cmd+K) — Phase P4.3 v6 */}
            <CommandPalette />

            {/* Contenu principal */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header plateforme complet (remplace la bannière statique) */}
                <PlatformHeader />
                <main className="flex-1 overflow-y-auto">
                    <PlatformErrorBoundary t={t}>
                        <Suspense fallback={<PlatformSkeleton />}>
                            <Outlet />
                        </Suspense>
                    </PlatformErrorBoundary>
                </main>
            </div>
        </div>
    );
}

// ==========================================
// Skeleton loading pour les pages plateforme
// Phase P4.2 — Refonte SaaS v6
// ==========================================

function PlatformSkeleton() {
    return (
        <div className="p-[var(--space-xl)] space-y-[var(--space-xl)] animate-pulse">
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
                <div className="space-y-[var(--space-sm)]">
                    <div className="h-7 w-48 rounded" style={{ backgroundColor: 'var(--color-surface-hover)' }} />
                    <div className="h-4 w-64 rounded" style={{ backgroundColor: 'color-mix(in srgb, var(--color-surface-hover) 60%, transparent)' }} />
                </div>
                <div className="h-9 w-28 rounded" style={{ backgroundColor: 'var(--color-surface-hover)' }} />
            </div>

            {/* Stats cards skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-[var(--space-lg)]">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="rounded-lg p-[var(--space-md)] space-y-[var(--space-sm)] border"
                        style={{ borderColor: 'var(--color-bordure)' }}
                    >
                        <div className="h-4 w-24 rounded" style={{ backgroundColor: 'var(--color-surface-hover)' }} />
                        <div className="h-8 w-16 rounded" style={{ backgroundColor: 'color-mix(in srgb, var(--color-surface-hover) 60%, transparent)' }} />
                        <div className="h-3 w-32 rounded" style={{ backgroundColor: 'color-mix(in srgb, var(--color-surface-hover) 40%, transparent)' }} />
                    </div>
                ))}
            </div>

            {/* Table skeleton */}
            <div
                className="rounded-lg p-[var(--space-md)] space-y-[var(--space-sm)] border"
                style={{ borderColor: 'var(--color-bordure)' }}
            >
                <div className="h-5 w-36 rounded" style={{ backgroundColor: 'var(--color-surface-hover)' }} />
                <div className="space-y-[var(--space-sm)]">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-10 rounded" style={{ backgroundColor: 'color-mix(in srgb, var(--color-surface-hover) 40%, transparent)' }} />
                    ))}
                </div>
            </div>

            {/* Loader discret */}
            <div className="flex items-center justify-center py-4">
                <Loader2
                    className="h-[var(--icon-md)] w-[var(--icon-md)] animate-spin"
                    style={{ color: 'var(--color-texte-muted)' }}
                />
            </div>
        </div>
    );
}

export const Route = createFileRoute('/platform')({
    beforeLoad: () => {
        // Guard global : SUPER_ADMIN uniquement
        requireRole(['SUPER_ADMIN']);
    },
    component: PlatformLayout,
});
