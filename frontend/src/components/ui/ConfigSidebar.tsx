/**
 * ==================================
 * eLISAschool - ConfigSidebar — Navigation latérale de configuration
 * ==================================
 * Sidebar verticale réutilisable pour les pages de configuration.
 * Features : indicatrice animée (layoutId), backgrounds tintés par section,
 * recherche inline, navigation clavier (↑/↓/Home/End), indicateurs statut,
 * accessibilité ARIA, et mode drawer mobile.
 *
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Menu, X, RefreshCw, type LucideIcon } from 'lucide-react';

// ==================================
// Types exportés
// ==================================

export interface ConfigSidebarSection {
    key: string;
    label: string;
    icon: LucideIcon;
    color: string;
    tintBg: string;
    description?: string;
}

export interface ConfigSidebarProps {
    /** Sections affichées dans le sidebar */
    sections: ConfigSidebarSection[];
    /** Clé de la section active */
    activeKey: string;
    /** Callback lors du clic sur une section */
    onSectionChange: (key: string) => void;
    /** Valeur de recherche courante */
    searchValue: string;
    /** Callback changement recherche */
    onSearchChange: (value: string) => void;
    /** Placeholder de la recherche */
    searchPlaceholder?: string;
    /** Titre du header */
    title: string;
    /** Sous-titre du header (desktop uniquement) */
    subtitle?: string;
    /** Nombre de modifications non sauvegardées */
    modificationsCount?: number;
    /** Des modifications sont-elles en attente ? */
    hasChanges?: boolean;
    /** Y a-t-il une erreur sur la section active ? */
    hasError?: boolean;
    /** Afficher le champ de recherche */
    showSearch?: boolean;
    /** Afficher le bouton actualiser (footer) */
    showRefresh?: boolean;
    /** Callback actualiser */
    onRefresh?: () => void;
    /** Contenu optionnel dans le footer */
    footerContent?: React.ReactNode;
    /** Mode mobile (drawer) */
    isMobile?: boolean;
    /** Drawer mobile ouvert */
    isDrawerOpen?: boolean;
    /** Callback fermeture drawer */
    onDrawerClose?: () => void;
    /** Bouton hamburger visible (mobile) */
    showMobileToggle?: boolean;
    /** Callback ouverture drawer */
    onDrawerOpen?: () => void;
    /** LayoutId pour l'indicatrice (unique par page) */
    layoutId?: string;
}

// ==================================
// Animation variant
// ==================================
const sidebarIndicator = {
    layout: true,
    transition: { type: 'spring', stiffness: 380, damping: 32 },
};

// ==================================
// Composant ConfigSidebar
// ==================================

export function ConfigSidebar({
    sections,
    activeKey,
    onSectionChange,
    searchValue,
    onSearchChange,
    searchPlaceholder = 'Rechercher...',
    title,
    subtitle,
    modificationsCount = 0,
    hasChanges = false,
    hasError = false,
    showSearch = true,
    showRefresh = true,
    onRefresh,
    footerContent,
    isMobile = false,
    isDrawerOpen = false,
    onDrawerClose,
    showMobileToggle = false,
    onDrawerOpen,
    layoutId = 'config-sidebar-indicator',
}: ConfigSidebarProps) {

    // ─── Navigation clavier (↑/↓/Home/End) ───
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        const currentIndex = sections.findIndex(s => s.key === activeKey);
        let newIndex = -1;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                newIndex = currentIndex < sections.length - 1 ? currentIndex + 1 : 0;
                break;
            case 'ArrowUp':
                e.preventDefault();
                newIndex = currentIndex > 0 ? currentIndex - 1 : sections.length - 1;
                break;
            case 'Home':
                e.preventDefault();
                newIndex = 0;
                break;
            case 'End':
                e.preventDefault();
                newIndex = sections.length - 1;
                break;
            default:
                return;
        }

        if (newIndex >= 0 && sections[newIndex]) {
            onSectionChange(sections[newIndex].key);
        }
    }, [sections, activeKey, onSectionChange]);

    // ─── Items de navigation ───
    const renderNavItems = () =>
        sections.map((section, index) => {
            const isActive = activeKey === section.key;
            const Icon = section.icon;
            const showChanges = isActive && hasChanges;
            const showError = isActive && hasError;

            return (
                <motion.button
                    key={section.key}
                    onClick={() => onSectionChange(section.key)}
                    role="tab"
                    aria-selected={isActive}
                    aria-current={isActive ? 'page' : undefined}
                    tabIndex={isActive ? 0 : -1}
                    className={`relative flex items-center gap-[var(--gap-sm)] rounded-[var(--radius-md)] px-[clamp(0.5rem,0.4rem+0.3vw,0.75rem)] py-[clamp(0.4375rem,0.35rem+0.2vw,0.625rem)] text-left font-medium transition-colors ${
                        isActive ? '' : 'hover:bg-[var(--color-surface-hover)]'
                    }`}
                    style={{
                        fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.8125rem)',
                        ...(isActive
                            ? { backgroundColor: section.tintBg, color: section.color }
                            : { color: 'var(--color-text-primary)' }),
                    }}
                >
                    {/* Barre indicatrice animée */}
                    {isActive && (
                        <motion.div
                            layout
                            layoutId={`${layoutId}-${section.key}`}
                            className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full"
                            style={{ backgroundColor: section.color }}
                        />
                    )}

                    {/* Icône avec micro-animation pulse */}
                    <div className="relative shrink-0">
                        <Icon
                            className="h-[var(--icon-sm)] w-[var(--icon-sm)] transition-transform duration-200"
                            style={{ color: section.color }}
                        />
                        {isActive && (
                            <motion.div
                                className="absolute inset-0 rounded-full"
                                style={{ backgroundColor: section.color, opacity: 0.12 }}
                                initial={{ scale: 0.6, opacity: 0 }}
                                animate={{ scale: 1.6, opacity: 0 }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                            />
                        )}
                    </div>

                    {/* Label */}
                    <span className="flex-1 truncate">{section.label}</span>

                    {/* Compteur de modifications */}
                    {showChanges && (
                        <motion.span
                            className="inline-flex items-center justify-center rounded-full px-[0.3rem] py-[0.0625rem] text-[0.5625rem] font-bold leading-none"
                            style={{
                                backgroundColor: 'var(--color-warning-500)',
                                color: '#fff',
                                minWidth: '1.125rem',
                            }}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                            aria-label={`${modificationsCount} modification(s)`}
                        >
                            {modificationsCount}
                        </motion.span>
                    )}

                    {/* Dot erreur */}
                    {showError && (
                        <span
                            className="h-2 w-2 rounded-full bg-[var(--color-danger-500)] shrink-0"
                            aria-label="Erreur"
                        />
                    )}
                </motion.button>
            );
        });

    // ─── Contenu sidebar (header + search + nav + footer) ───
    const sidebarContent = (
        <>
            {/* Header */}
            <div
                className="flex items-center justify-between px-[var(--space-md)] py-[var(--space-sm)]"
                style={{ borderBottom: '1px solid var(--color-bordure)' }}
            >
                <div className="flex items-center gap-[var(--gap-xs)] min-w-0">
                    <div className="shrink-0 rounded-lg p-1.5" style={{ backgroundColor: 'var(--color-info-100)' }}>
                        {sections.find(s => s.key === activeKey)?.icon
                            ? (() => {
                                const ActiveIcon = sections.find(s => s.key === activeKey)!.icon;
                                return <ActiveIcon className="h-4 w-4" style={{ color: 'var(--color-info-600)' }} />;
                            })()
                            : null
                        }
                    </div>
                    <div className="min-w-0">
                        <span className="block font-semibold text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>
                            {title}
                        </span>
                        {subtitle && (
                            <span className="block text-[0.625rem] truncate" style={{ color: 'var(--color-text-muted)' }}>
                                {subtitle}
                            </span>
                        )}
                    </div>
                </div>
                {/* Bouton fermer (mobile drawer) */}
                {isMobile && onDrawerClose && (
                    <button
                        onClick={onDrawerClose}
                        className="rounded-lg p-1.5 transition-colors hover:bg-[var(--color-surface-hover)]"
                        aria-label="Fermer le menu"
                    >
                        <X className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
                    </button>
                )}
            </div>

            {/* Recherche inline */}
            {showSearch && (
                <div
                    className="px-[var(--space-sm)] py-[var(--space-xs)]"
                    style={{ borderBottom: '1px solid var(--color-bordure)' }}
                >
                    <div className="relative">
                        <Search
                            className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
                            style={{ color: 'var(--color-text-muted)' }}
                        />
                        <input
                            type="text"
                            value={searchValue}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder={searchPlaceholder}
                            className="w-full rounded-lg border py-1.5 pl-8 pr-3 text-xs outline-none transition-colors focus:ring-2"
                            style={{
                                borderColor: 'var(--color-bordure)',
                                backgroundColor: 'var(--color-surface-alt)',
                                color: 'var(--color-text-primary)',
                            }}
                            aria-label={searchPlaceholder}
                        />
                    </div>
                </div>
            )}

            {/* Navigation avec clavier */}
            <div
                className="flex-1 overflow-y-auto px-[var(--space-xs)] py-[var(--space-sm)]"
                role="tablist"
                aria-label="Sections de configuration"
                aria-orientation="vertical"
                onKeyDown={handleKeyDown}
            >
                {renderNavItems()}
            </div>

            {/* Footer */}
            {(showRefresh || footerContent) && (
                <div
                    className="px-[var(--space-sm)] py-[var(--space-xs)]"
                    style={{ borderTop: '1px solid var(--color-bordure)' }}
                >
                    {footerContent}
                    {showRefresh && onRefresh && (
                        <button
                            onClick={onRefresh}
                            className="flex w-full items-center justify-center gap-[var(--gap-xs)] rounded-lg border py-1.5 text-xs font-medium transition-colors hover:bg-[var(--color-surface-hover)]"
                            style={{ borderColor: 'var(--color-bordure)', color: 'var(--color-text-secondary)' }}
                            aria-label="Actualiser"
                        >
                            <RefreshCw className="h-3 w-3" />
                            Actualiser
                        </button>
                    )}
                </div>
            )}
        </>
    );

    // ─── Mode mobile : Drawer overlay ───
    if (isMobile) {
        return (
            <>
                {/* Bouton hamburger */}
                {showMobileToggle && onDrawerOpen && (
                    <button
                        onClick={onDrawerOpen}
                        className="shrink-0 rounded-lg border p-[clamp(0.375rem,0.3rem+0.2vw,0.5rem)] transition-colors hover:bg-[var(--color-surface-hover)]"
                        style={{ borderColor: 'var(--color-bordure)' }}
                        aria-label="Ouvrir le menu de configuration"
                    >
                        <Menu className="h-[var(--icon-sm)] w-[var(--icon-sm)]" style={{ color: 'var(--color-text-primary)' }} />
                    </button>
                )}

                <AnimatePresence>
                    {isDrawerOpen && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                onClick={onDrawerClose}
                            />
                            {/* Drawer */}
                            <motion.aside
                                className="fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r"
                                style={{
                                    backgroundColor: 'var(--color-surface)',
                                    borderColor: 'var(--color-bordure)',
                                }}
                                initial={{ x: -260 }}
                                animate={{ x: 0 }}
                                exit={{ x: -260 }}
                                transition={{ type: 'spring', stiffness: 350, damping: 35 }}
                                role="navigation"
                                aria-label="Navigation configuration"
                            >
                                {sidebarContent}
                            </motion.aside>
                        </>
                    )}
                </AnimatePresence>
            </>
        );
    }

    // ─── Mode desktop : Sidebar sticky ───
    return (
        <aside
            className="sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col border-r md:flex"
            style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-bordure)',
            }}
            role="navigation"
            aria-label="Navigation configuration"
        >
            {sidebarContent}
        </aside>
    );
}
