/**
 * ==================================
 * eLISAschool - DetailPageLayout
 * ==================================
 * Layout partagé pour les pages détail du panel admin plateforme.
 * Remplace le pattern copié-collé (BreadcrumbLabelProvider + PageHeader + TabsBar + TabsContent).
 * CSS vars eLISAschool + ultra-responsif (clamp) + dark mode natif.
 *
 * Phase P1 — Restructuration Panel Admin v3
 */

import { type ReactNode, useState, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';
import { TabsBar, TabsContent } from '@/components/ui';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useConfirmation } from '@/components/ui/ConfirmationModal';
import { BreadcrumbLabelProvider } from '@/components/navigation/breadcrumb-context';
import type { Tab } from '@/components/ui';
import type { LucideIcon } from 'lucide-react';

// =============================================
// Types
// =============================================

interface DetailTab {
    id: string;
    labelKey: string;
    labelFallback?: string;
    icon: LucideIcon;
    permission?: string;
}

interface DetailPageLayoutProps<T extends string> {
    /** Nom affiché dans le header et le breadcrumb */
    displayName: string;
    /** Route de retour (liste) */
    backRoute: string;
    /** Onglets disponibles */
    tabs: DetailTab[];
    /** Onglet actif (contrôlé) */
    activeTab: T;
    /** Callback changement d'onglet */
    onTabChange: (tab: T) => void;
    /** Contenu du header (actions, badges, etc.) */
    headerChildren?: ReactNode;
    /** Contenu des onglets — render prop recevant l'onglet actif */
    children: (activeTab: T) => ReactNode;
    /** État de chargement */
    isLoading?: boolean;
    /** Erreur à afficher */
    error?: Error | null;
    /** Callback retry */
    onRetry?: () => void;
    /** Namespace i18n (défaut: 'admin') */
    i18nNamespace?: string;
    /** Tone du header */
    headerTone?: 'dominant' | 'accent' | 'secondary';
    /** Classe CSS additionnelle */
    className?: string;
}

// =============================================
// DetailPageLayout
// =============================================

export function DetailPageLayout<T extends string>({
    displayName,
    backRoute,
    tabs,
    activeTab,
    onTabChange,
    headerChildren,
    children,
    isLoading = false,
    error = null,
    onRetry,
    i18nNamespace = 'admin',
    headerTone = 'dominant',
    className,
}: DetailPageLayoutProps<T>) {
    const { t } = useTranslation(i18nNamespace);
    const navigate = useNavigate();

    // Construction des tabs UI
    const uiTabs: Tab[] = tabs.map((tab) => ({
        id: tab.id,
        label: t(tab.labelKey, tab.labelFallback ?? tab.id),
        icon: tab.icon,
    }));

    const handleBack = useCallback(() => {
        navigate({ to: backRoute });
    }, [navigate, backRoute]);

    return (
        <BreadcrumbLabelProvider value={displayName}>
            <div
                className={cn('flex flex-col gap-6', className)}
                style={{ padding: 'clamp(1rem, 0.8rem + 0.6vw, 1.5rem)' }}
            >
                {/* Header gradient */}
                <PageHeader
                    variant="gradient"
                    tone={headerTone}
                    showBreadcrumbs
                    breadcrumbLabel={displayName}
                    onBack={handleBack}
                >
                    {headerChildren}
                </PageHeader>

                {/* Contenu */}
                {isLoading ? (
                    <PageSkeleton />
                ) : error ? (
                    <ErrorMessage error={error} onRetry={onRetry} />
                ) : (
                    <>
                        <TabsBar
                            tabs={uiTabs}
                            activeTab={activeTab}
                            onTabChange={(tabId) => onTabChange(tabId as T)}
                            variant="underline"
                            showHeader
                        />
                        <TabsContent activeTab={activeTab}>
                            {children(activeTab)}
                        </TabsContent>
                    </>
                )}
            </div>
        </BreadcrumbLabelProvider>
    );
}

// =============================================
// useDetailPage — Hook pour pages détail avec confirmation
// =============================================

interface UseDetailPageOptions {
    onConfirmDelete?: () => void;
    deleteConfirmTitle?: string;
    deleteConfirmMessage?: string;
}

export function useDetailPage(options: UseDetailPageOptions = {}) {
    const { t } = useTranslation('admin');
    const confirm = useConfirmation();

    const requestDelete = useCallback(() => {
        return new Promise<boolean>((resolve) => {
            confirm.ask({
                title: options.deleteConfirmTitle ?? t('common:confirmDelete', 'Confirmer la suppression'),
                message: options.deleteConfirmMessage ?? t('common:deleteWarning', 'Cette action est irréversible.'),
                variant: 'danger',
                onConfirm: () => {
                    options.onConfirmDelete?.();
                    resolve(true);
                },
            });
        });
    }, [confirm, options, t]);

    return {
        confirm,
        requestDelete,
        ConfirmationModal: confirm.ConfirmationModal,
    };
}

// =============================================
// Helpers
// =============================================

export type { DetailPageLayoutProps, DetailTab, UseDetailPageOptions };
