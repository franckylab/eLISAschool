/**
 * ==================================
 * eLISAschool - Platform Backups — Sauvegardes & Historique
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Page dédiée aux sauvegardes et à l'historique de configuration.
 * Extrait de platform.configuration.tsx (Phase 6 — audit panel admin).
 * 2 onglets : Sauvegardes (BackupManagement) + Historique (HistoriqueTab).
 */

import { createFileRoute } from '@tanstack/react-router';
import { useState, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { HardDrive, History, Loader2, type LucideIcon } from 'lucide-react';

// Lazy load des composants lourds
const BackupManagementLazy = lazy(() =>
    import('@/features/configuration/components/BackupManagement').then(m => ({
        default: m.BackupManagement,
    }))
);

const HistoriqueTabLazy = lazy(() =>
    import('@/features/configuration/components/HistoriqueTab').then(m => ({
        default: m.HistoriqueTab,
    }))
);

// =============================================
// Types & configuration des onglets
// =============================================

type BackupTab = 'sauvegardes' | 'historique';

interface TabDef {
    key: BackupTab;
    labelKey: string;
    icon: LucideIcon;
    color: string;
    tintBg: string;
}

const TABS: TabDef[] = [
    {
        key: 'sauvegardes',
        labelKey: 'backups.tabs.sauvegardes',
        icon: HardDrive,
        color: 'var(--color-info-600)',
        tintBg: 'var(--color-info-50)',
    },
    {
        key: 'historique',
        labelKey: 'backups.tabs.historique',
        icon: History,
        color: 'var(--color-text-secondary)',
        tintBg: 'var(--color-surface-hover)',
    },
];

// =============================================
// Composant de fallback loading
// =============================================

function TabFallback() {
    return (
        <div className="flex items-center justify-center py-16">
            <Loader2 className="mr-3 h-6 w-6 animate-spin" style={{ color: 'var(--color-info-600)' }} />
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Chargement...
            </span>
        </div>
    );
}

// =============================================
// Page principale
// =============================================

function PlatformBackupsPage() {
    const { t } = useTranslation('admin');
    const [activeTab, setActiveTab] = useState<BackupTab>('sauvegardes');

    const activeTabDef = TABS.find(tab => tab.key === activeTab) ?? TABS[0];

    return (
        <div className="flex h-full min-h-0">
            {/* ═══ Sidebar onglets ═══ */}
            <nav
                className="hidden w-56 shrink-0 border-r flex-col gap-1 p-4 md:flex"
                style={{ borderColor: 'var(--color-bordure)' }}
            >
                <div className="mb-4 flex items-center gap-2 px-2">
                    <HardDrive
                        className="h-5 w-5"
                        style={{ color: 'var(--color-info-600)' }}
                    />
                    <h2
                        className="text-sm font-semibold"
                        style={{ color: 'var(--color-text-primary)' }}
                    >
                        {t('backups.titre', 'Sauvegardes')}
                    </h2>
                </div>

                {TABS.map(tab => {
                    const isActive = tab.key === activeTab;
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors"
                            style={{
                                backgroundColor: isActive ? tab.tintBg : 'transparent',
                                color: isActive ? tab.color : 'var(--color-text-secondary)',
                            }}
                        >
                            <Icon className="h-4 w-4 shrink-0" />
                            {t(tab.labelKey, tab.key === 'sauvegardes' ? 'Sauvegardes' : 'Historique')}
                        </button>
                    );
                })}

                <p
                    className="mt-auto px-2 text-xs"
                    style={{ color: 'var(--color-text-muted)' }}
                >
                    {t('backups.description', 'Gestion des sauvegardes et historique des modifications')}
                </p>
            </nav>

            {/* ═══ Zone de contenu ═══ */}
            <div className="flex-1 min-w-0 overflow-y-auto">
                <div className="p-[var(--space-lg)] space-y-[var(--space-lg)]">

                    {/* Header mobile + tabs */}
                    <div className="flex flex-wrap items-center justify-between gap-[var(--gap-sm)]">
                        <div className="flex items-center gap-[var(--gap-sm)] min-w-0">
                            <div
                                className="shrink-0 rounded-lg p-[clamp(0.25rem,0.2rem+0.15vw,0.375rem)]"
                                style={{ backgroundColor: activeTabDef.tintBg }}
                            >
                                <activeTabDef.icon
                                    className="h-[var(--icon-sm)] w-[var(--icon-sm)]"
                                    style={{ color: activeTabDef.color }}
                                />
                            </div>
                            <div className="min-w-0">
                                <h1
                                    className="text-base font-semibold truncate"
                                    style={{ color: 'var(--color-text-primary)' }}
                                >
                                    {t('backups.titre', 'Sauvegardes')}
                                </h1>
                                <p
                                    className="truncate text-xs"
                                    style={{ color: 'var(--color-text-muted)' }}
                                >
                                    {t(activeTabDef.labelKey)}
                                </p>
                            </div>
                        </div>

                        {/* Tabs mobile */}
                        <div className="flex gap-1 md:hidden">
                            {TABS.map(tab => {
                                const isActive = tab.key === activeTab;
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key)}
                                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                                        style={{
                                            backgroundColor: isActive ? tab.tintBg : 'transparent',
                                            color: isActive ? tab.color : 'var(--color-text-secondary)',
                                        }}
                                    >
                                        <Icon className="h-3.5 w-3.5" />
                                        {t(tab.labelKey)}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Contenu des onglets */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2 }}
                        >
                            {activeTab === 'sauvegardes' && (
                                <Suspense fallback={<TabFallback />}>
                                    <BackupManagementLazy etablissementId="platform" />
                                </Suspense>
                            )}
                            {activeTab === 'historique' && (
                                <Suspense fallback={<TabFallback />}>
                                    <HistoriqueTabLazy />
                                </Suspense>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

export const Route = createFileRoute('/platform/backups')({
    component: PlatformBackupsPage,
});
