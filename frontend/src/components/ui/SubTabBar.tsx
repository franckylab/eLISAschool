/**
 * ==================================
 * eLISAschool - SubTabBar (sous-onglets)
 * ==================================
 * Composant réutilisable pour les sous-onglets de formulaire/configuration.
 * Distinct du TabsBar (onglets de page principaux).
 *
 * Design : pill container avec fond subtil, tab actif coloré (dominant),
 * transition fluide via layoutId, responsive (icône seule sur mobile).
 *
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import type { LucideIcon } from 'lucide-react';

export interface SubTab {
    id: string;
    label: string;
    icon: LucideIcon;
    count?: number;
    disabled?: boolean;
}

export interface SubTabBarProps {
    tabs: SubTab[];
    activeTab: string;
    onTabChange: (id: string) => void;
    className?: string;
}

export function SubTabBar({ tabs, activeTab, onTabChange, className }: SubTabBarProps) {
    return (
        <div
            role="tablist"
            className={cn(
                'flex items-center gap-1 overflow-x-auto scrollbar-hide',
                'rounded-xl border border-[var(--color-bordure)]',
                'bg-[var(--color-surface-alt)] p-1',
                className,
            )}
        >
            {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = tab.id === activeTab;

                return (
                    <motion.button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        aria-disabled={tab.disabled}
                        onClick={() => !tab.disabled && onTabChange(tab.id)}
                        className={cn(
                            'relative flex items-center gap-[var(--space-xs)]',
                            'px-[var(--space-md)] py-[var(--space-sm)]',
                            'rounded-lg text-sm font-medium',
                            'transition-colors duration-200 whitespace-nowrap',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dominant-400)]',
                            tab.disabled && 'opacity-40 cursor-not-allowed',
                            isActive
                                ? 'bg-[var(--color-dominant-600)] text-white shadow-sm'
                                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]',
                        )}
                    >
                        {/* Pill animé pour l'état actif */}
                        {isActive && (
                            <motion.div
                                layoutId="subtab-active-pill"
                                className="absolute inset-0 rounded-lg bg-[var(--color-dominant-600)]"
                                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                                aria-hidden="true"
                            />
                        )}

                        {/* Icône */}
                        <Icon className="relative z-10 h-[var(--icon-xs)] w-[var(--icon-xs)] shrink-0" />

                        {/* Label (masqué sur mobile) */}
                        <span className="relative z-10 hidden sm:inline">{tab.label}</span>

                        {/* Badge count (optionnel) */}
                        {tab.count !== undefined && (
                            <span
                                className={cn(
                                    'relative z-10 inline-flex items-center justify-center',
                                    'min-w-[1.25rem] h-5 px-1.5 rounded-full',
                                    'text-[10px] font-semibold leading-none',
                                    isActive
                                        ? 'bg-white/20 text-white'
                                        : 'bg-[var(--color-dominant-100)] text-[var(--color-dominant-700)]',
                                )}
                            >
                                {tab.count}
                            </span>
                        )}
                    </motion.button>
                );
            })}
        </div>
    );
}
