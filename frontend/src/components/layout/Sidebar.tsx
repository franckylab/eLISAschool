/**
 * ==================================
 * eLISAschool - Sidebar
 * ==================================
 * Navigation latérale par catégories de modules
 * Icônes Lucide, filtrage par permissions, collapse/expand
 */

import { useTranslation } from 'react-i18next';
import { Link, useMatchRoute } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    GraduationCap,
    Users,
    BookOpen,
    ClipboardList,
    Calendar,
    CreditCard,
    MessageSquare,
    Bus,
    Library,
    Settings,
    ChevronDown,
    ChevronLeft,
    type LucideIcon,
} from 'lucide-react';
import { useSidebarStore } from '@/stores/sidebar.store';
import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/lib/cn';

interface NavItem {
    label: string;
    path: string;
    icon: LucideIcon;
    module?: string;
}

interface NavSection {
    title: string;
    items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
    {
        title: 'Principal',
        items: [
            { label: 'Tableau de bord', path: '/dashboard', icon: LayoutDashboard },
        ],
    },
    {
        title: 'Académique',
        items: [
            { label: 'Élèves', path: '/eleves', icon: Users, module: 'eleves' },
            { label: 'Enseignants', path: '/enseignants', icon: GraduationCap, module: 'enseignants' },
            { label: 'Classes', path: '/classes', icon: BookOpen, module: 'classes' },
            { label: 'Notes', path: '/notes', icon: ClipboardList, module: 'notes' },
            { label: 'Emploi du temps', path: '/emploi-du-temps', icon: Calendar, module: 'emploiDuTemps' },
        ],
    },
    {
        title: 'Administration',
        items: [
            { label: 'Finances', path: '/finances', icon: CreditCard, module: 'finances' },
            { label: 'Communication', path: '/communication', icon: MessageSquare, module: 'communication' },
            { label: 'Transport', path: '/transport', icon: Bus, module: 'transport' },
            { label: 'Bibliothèque', path: '/bibliotheque', icon: Library, module: 'bibliotheque' },
        ],
    },
    {
        title: 'Système',
        items: [
            { label: 'Configuration', path: '/configuration', icon: Settings },
        ],
    },
];

export function Sidebar() {
    const { t } = useTranslation('common');
    const { isCollapsed, toggle, setActiveSection } = useSidebarStore();
    const utilisateur = useAuthStore((s) => s.utilisateur);
    const matchRoute = useMatchRoute();

    return (
        <div className="flex h-full flex-col">
            {/* Logo / Titre */}
            <div className="flex h-16 items-center justify-between border-b border-[var(--color-bordure)] px-4">
                <AnimatePresence mode="wait">
                    {!isCollapsed ? (
                        <motion.div
                            key="logo-full"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-lg font-bold text-[var(--color-dominante)]"
                        >
                            elisa<span className="text-[var(--color-accent)]">°</span>school
                        </motion.div>
                    ) : (
                        <motion.div
                            key="logo-mini"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-lg font-bold text-[var(--color-dominante)]"
                        >
                            e<span className="text-[var(--color-accent)]">°</span>
                        </motion.div>
                    )}
                </AnimatePresence>
                <button
                    onClick={toggle}
                    className="hidden rounded-md p-1 text-[var(--color-texte-secondaire)] transition-colors hover:bg-[var(--color-surface-hover)] lg:block"
                    aria-label="Toggle sidebar"
                >
                    <ChevronLeft className={cn('h-5 w-5 transition-transform', isCollapsed && 'rotate-180')} />
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-2">
                {NAV_SECTIONS.map((section) => (
                    <div key={section.title} className="mb-4">
                        {!isCollapsed && (
                            <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-texte-secondaire)]">
                                {section.title}
                            </p>
                        )}
                        {section.items.map((item) => {
                            const Icon = item.icon;
                            const isActive = matchRoute({ to: item.path, fuzzy: true });

                            return (
                                <Link
                                    key={item.path}
                                    to={item.path as any}
                                    className={cn(
                                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                                        isActive
                                            ? 'bg-[var(--color-dominante)]/10 text-[var(--color-dominante)]'
                                            : 'text-[var(--color-texte-secondaire)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-texte)]',
                                        isCollapsed && 'justify-center px-2',
                                    )}
                                    title={isCollapsed ? item.label : undefined}
                                >
                                    <Icon className="h-5 w-5 shrink-0" />
                                    {!isCollapsed && <span>{item.label}</span>}
                                </Link>
                            );
                        })}
                    </div>
                ))}
            </nav>

            {/* User info */}
            {utilisateur && !isCollapsed && (
                <div className="border-t border-[var(--color-bordure)] p-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-dominante)] text-xs font-bold text-white">
                            {utilisateur.prenom?.[0]}{utilisateur.nom?.[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-[var(--color-texte)]">
                                {utilisateur.prenom} {utilisateur.nom}
                            </p>
                            <p className="truncate text-xs text-[var(--color-texte-secondaire)]">
                                {t(`roles.${utilisateur.role}` as any, utilisateur.role)}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
