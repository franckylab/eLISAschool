/**
 * ==================================
 * eLISAschool - Platform Sidebar
 * ==================================
 * Version: 4.4.0
 * Auteur: franck arlos chendjou
 *
 * Sidebar dédiée à l'espace plateforme (Control Plane).
 * v4.4 : Auto-expand groupe actif, persist collapsed (localStorage),
 *        mobile slide animation (framer-motion), indicateur actif barre
 *        gauche sur groupe, séparateurs visuels entre groupes, navigation
 *        clavier (↑↓ Enter Esc), compteurs badges par groupe.
 * v4.3 : Nouveau groupe "Plans & abonnements" (Plans, Cycles, Quotas, Tarifs),
 *        Modules et fonctions réduit (Modules, Fonctionnalités).
 * v4.2 : Réorganisation menus — Abonnements/Factures → Établissement,
 *        Plans/Fonctionnalités → Modules et fonctions,
 *        Utilisateurs/Rôles → Sécurité, suppression Clubs/Matériel.
 * v4.1 : Correction structure — Groupe Pilotage (Dashboard + Facturation),
 *        Groupe Établissement (6 items : Établissements, Groupes, Utilisateurs,
 *        Rôles, Clubs, Matériel).
 * v4.0 : Routes dédiées — chaque entrée = 1 URL unique (plus de ?tab=).
 * v3.1 : Dédoublonnage — suppression Analytics, Notifications, Sauvegardes.
 * v2.0 : i18n, sections groupées, responsive drawer (mobile), CSS vars.
 */

import { Link, useMatchRoute } from '@tanstack/react-router';
import {
    LayoutDashboard,
    Building2,
    CreditCard,
    Package,
    FileText,
    Settings,
    Shield,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Wallet,
    Network,
    X,
    Users,
    Layers,
    BadgePercent,
    ToggleRight,
    Percent,
    PackagePlus,
    CalendarClock,
    Bell,
    Key,
    MonitorSmartphone,
    TrendingUp,
    Activity,
    Sparkles,
    type LucideIcon,
} from 'lucide-react';
import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaQuery } from '@/hooks/use-media-query';
import { cn } from '@/lib/cn';

// =============================================
// Types — Sidebar 7 menus expandables (Refonte v4.4)
// =============================================

interface PlatformNavItem {
    labelKey: string;
    path: string;
    icon: LucideIcon;
}

interface PlatformNavGroup {
    key: string;
    labelKey: string;
    icon: LucideIcon;
    items: PlatformNavItem[];
}

// =============================================
// Configuration navigation — 7 groupes (v4.4)
// Pilotage : Dashboard + Monitoring + Revenus
// Établissement : Établissements, Groupes, Abonnements, Factures
// Plans & abonnements : Plans, Cycles, Quotas, Tarifs
// Commerce : Providers, Remises
// Modules et fonctions : Modules, Fonctionnalités
// Sécurité : Audit, Approbations, Sessions, Utilisateurs, Rôles
// Configuration : Paramètres, Sauvegardes, Notifications
// =============================================

const NAV_GROUPS: PlatformNavGroup[] = [
    // 1. Pilotage (3) — Dashboard + Monitoring + Revenus
    {
        key: 'pilotage', labelKey: 'sidebar.groupePilotage', icon: LayoutDashboard,
        items: [
            { labelKey: 'navigation.dashboard', path: '/platform/dashboard', icon: LayoutDashboard },
            { labelKey: 'navigation.monitoring', path: '/platform/monitoring', icon: Activity },
            { labelKey: 'navigation.revenus', path: '/platform/revenus', icon: TrendingUp },
        ],
    },
    // 2. Établissement (4) — Établissements, Groupes, Abonnements, Factures
    {
        key: 'etablissement', labelKey: 'sidebar.groupeEtablissement', icon: Building2,
        items: [
            { labelKey: 'navigation.etablissements', path: '/platform/etablissements', icon: Building2 },
            { labelKey: 'navigation.groupes', path: '/platform/groupes', icon: Network },
            { labelKey: 'navigation.abonnements', path: '/platform/abonnements', icon: CreditCard },
            { labelKey: 'navigation.factures', path: '/platform/factures', icon: FileText },
        ],
    },
    // 3. Plans & abonnements (4) — Plans, Cycles, Quotas, Tarifs
    {
        key: 'plansAbonnements', labelKey: 'sidebar.groupePlansAbonnements', icon: BadgePercent,
        items: [
            { labelKey: 'navigation.plansAbonnement', path: '/platform/plans', icon: BadgePercent },
            { labelKey: 'navigation.cyclesStrategies', path: '/platform/cycles-strategies', icon: CalendarClock },
            { labelKey: 'navigation.quotasPacks', path: '/platform/packs-quota', icon: PackagePlus },
            { labelKey: 'navigation.tarifs', path: '/platform/tarifs', icon: TrendingUp },
        ],
    },
    // 4. Commerce (2) — Providers, Promotions & Remises (unifié)
    {
        key: 'commerce', labelKey: 'sidebar.groupeCommerce', icon: Wallet,
        items: [
            { labelKey: 'navigation.providers', path: '/platform/providers', icon: Wallet },
            { labelKey: 'navigation.promotionsRemises', path: '/platform/promotions', icon: Sparkles },
        ],
    },
    // 5. Modules et fonctions (2) — Modules, Fonctionnalités
    {
        key: 'catalogue', labelKey: 'sidebar.groupeModulesFonctions', icon: Package,
        items: [
            { labelKey: 'navigation.modules', path: '/platform/modules', icon: Package },
            { labelKey: 'navigation.featureFlags', path: '/platform/fonctionnalites', icon: ToggleRight },
        ],
    },
    // 6. Sécurité & Audit (5) — Audit, Approbations, Sessions, Utilisateurs, Rôles
    {
        key: 'securite', labelKey: 'sidebar.groupeSecurite', icon: Shield,
        items: [
            { labelKey: 'navigation.audit', path: '/platform/audit', icon: FileText },
            { labelKey: 'navigation.approbations', path: '/platform/approbations', icon: Key },
            { labelKey: 'navigation.sessions', path: '/platform/sessions', icon: MonitorSmartphone },
            { labelKey: 'navigation.utilisateurs', path: '/platform/utilisateurs', icon: Users },
            { labelKey: 'navigation.rolesPlateforme', path: '/platform/roles', icon: Shield },
        ],
    },
    // 7. Système (3) — Configuration, Sauvegardes, Notifications
    {
        key: 'configuration', labelKey: 'sidebar.groupeConfiguration', icon: Settings,
        items: [
            { labelKey: 'navigation.parametresSysteme', path: '/platform/configuration', icon: Settings },
            { labelKey: 'navigation.sauvegardes', path: '/platform/backups', icon: Layers },
            { labelKey: 'navigation.notifications', path: '/platform/notifications-config', icon: Bell },
        ],
    },
];

// =============================================
// Helpers — LocalStorage persistence
// =============================================

const LS_COLLAPSED = 'platform-sidebar-collapsed';
const LS_EXPANDED = 'platform-sidebar-expanded';

function readLS<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
}

function writeLS(key: string, value: unknown) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota */ }
}

// =============================================
// Composant NavItemLink (item dans un sous-menu)
// v4.4 : ref support pour keyboard navigation
// =============================================

function NavItemLink({ item, collapsed, t, matchRoute, isMobile, setMobileOpen, itemRef }: {
    item: PlatformNavItem;
    collapsed: boolean;
    t: any;
    matchRoute: any;
    isMobile: boolean;
    setMobileOpen: (v: boolean) => void;
    itemRef?: (el: HTMLAnchorElement | null) => void;
}) {
    const basePath = item.path.split('?')[0];
    const isActive = matchRoute({ to: basePath, fuzzy: true });
    const Icon = item.icon;

    return (
        <Link
            ref={itemRef}
            to={item.path}
            onClick={() => isMobile && setMobileOpen(false)}
            tabIndex={-1}
            className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors text-sm',
                isActive
                    ? 'bg-[var(--color-danger-100)] text-[var(--color-danger-700)] font-medium'
                    : 'text-[var(--color-texte-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-texte)]'
            )}
            style={{ fontSize: 'clamp(0.75rem, 0.72rem + 0.15vw, 0.8125rem)' }}
            title={collapsed ? t(item.labelKey) : undefined}
        >
            <Icon
                className={cn(
                    'flex-shrink-0',
                    isActive
                        ? 'text-[var(--color-danger-500)]'
                        : 'text-[var(--color-texte-muted)] group-hover:text-[var(--color-texte)]'
                )}
                style={{ width: 'clamp(0.875rem, 0.83rem + 0.2vw, 1rem)', height: 'clamp(0.875rem, 0.83rem + 0.2vw, 1rem)' }}
            />
            {!collapsed && <span className="truncate">{t(item.labelKey)}</span>}
        </Link>
    );
}

// =============================================
// Composant NavGroup (groupe expandable)
// v4.4 : indicateur actif barre gauche, séparateurs, badge compteur
// =============================================

function NavGroup({ group, collapsed, expandedGroups, toggleGroup, t, matchRoute, isMobile, setMobileOpen, focusedIndex, registerItemRef }: {
    group: PlatformNavGroup;
    collapsed: boolean;
    expandedGroups: Set<string>;
    toggleGroup: (key: string) => void;
    t: any;
    matchRoute: any;
    isMobile: boolean;
    setMobileOpen: (v: boolean) => void;
    focusedIndex: number;
    registerItemRef: (index: number, el: HTMLAnchorElement | null) => void;
}) {
    const isExpanded = expandedGroups.has(group.key);
    const GroupIcon = group.icon;
    const hasActive = group.items.some(item => matchRoute({ to: item.path.split('?')[0], fuzzy: true }));

    // Mode collapsed : icône simple avec tooltip au hover
    if (collapsed) {
        return (
            <div className="relative group/nav">
                <button
                    className="flex items-center justify-center w-full py-2.5 rounded-lg text-[var(--color-texte-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-texte)] transition-colors"
                    title={t(group.labelKey)}
                    aria-label={t(group.labelKey)}
                    onClick={() => toggleGroup(group.key)}
                >
                    <GroupIcon style={{ width: 'var(--icon-sm)', height: 'var(--icon-sm)' }} />
                    {/* Indicateur actif en mode collapsed */}
                    {hasActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r bg-[var(--color-danger-500)]" />
                    )}
                </button>
                {/* Tooltip au hover */}
                <div className="absolute left-full top-0 ml-2 px-2 py-1 bg-[var(--color-surface)] border border-[var(--color-bordure)] rounded-md shadow-lg text-xs whitespace-nowrap opacity-0 pointer-events-none group-hover/nav:opacity-100 transition-opacity z-50">
                    {t(group.labelKey)}
                </div>
            </div>
        );
    }

    return (
        <div className="mb-0.5">
            {/* Header du groupe (cliquable pour expand/collapse) */}
            <button
                onClick={() => toggleGroup(group.key)}
                className={cn(
                    'flex items-center gap-2.5 w-full px-3 py-2 rounded-lg transition-colors text-left relative',
                    hasActive
                        ? 'text-[var(--color-danger-600)]'
                        : 'text-[var(--color-texte-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-texte)]'
                )}
                style={{ fontSize: 'clamp(0.75rem, 0.72rem + 0.15vw, 0.8125rem)' }}
            >
                {/* Indicateur actif — barre gauche */}
                {hasActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r bg-[var(--color-danger-500)]" />
                )}
                <GroupIcon
                    className="flex-shrink-0"
                    style={{ width: 'clamp(0.875rem, 0.83rem + 0.2vw, 1rem)', height: 'clamp(0.875rem, 0.83rem + 0.2vw, 1rem)' }}
                />
                <span className="flex-1 truncate font-medium">{t(group.labelKey)}</span>
                {/* Badge compteur */}
                <span
                    className="flex-shrink-0 min-w-[1.25rem] h-5 flex items-center justify-center rounded-full text-[10px] font-semibold"
                    style={{
                        backgroundColor: hasActive
                            ? 'color-mix(in srgb, var(--color-danger-500) 10%, transparent)'
                            : 'var(--color-surface-hover)',
                        color: hasActive
                            ? 'var(--color-danger-600)'
                            : 'var(--color-texte-muted)',
                    }}
                >
                    {group.items.length}
                </span>
                <ChevronDown
                    className={cn(
                        'flex-shrink-0 transition-transform duration-200',
                        isExpanded ? 'rotate-0' : '-rotate-90'
                    )}
                    style={{ width: 'clamp(0.75rem, 0.7rem + 0.15vw, 0.875rem)', height: 'clamp(0.75rem, 0.7rem + 0.15vw, 0.875rem)' }}
                />
            </button>

            {/* Sous-items (animés) */}
            <div
                className={cn(
                    'overflow-hidden transition-all duration-200',
                    isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                )}
            >
                <div className="ml-4 pl-2 border-l border-[var(--color-bordure)] mt-0.5 mb-1 space-y-0.5">
                    {group.items.map((item, idx) => (
                        <NavItemLink
                            key={item.path}
                            item={item}
                            collapsed={false}
                            t={t}
                            matchRoute={matchRoute}
                            isMobile={isMobile}
                            setMobileOpen={setMobileOpen}
                            itemRef={(el) => registerItemRef(focusedIndex + idx, el)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

// =============================================
// Composant principal — v4.4
// Auto-expand, persist collapsed, keyboard nav, mobile slide
// =============================================

interface PlatformSidebarProps {
    collapsed?: boolean;
}

export function PlatformSidebar({ collapsed: initialCollapsed = false }: PlatformSidebarProps) {
    const { t } = useTranslation('admin');
    const matchRoute = useMatchRoute();
    const isMobile = useMediaQuery('(max-width: 767px)');
    const [mobileOpen, setMobileOpen] = useState(false);

    // ── Persist collapsed state (localStorage) ──
    const [collapsed, setCollapsed] = useState(() => readLS(LS_COLLAPSED, initialCollapsed));
    useEffect(() => { writeLS(LS_COLLAPSED, collapsed); }, [collapsed]);

    // ── Expanded groups with auto-expand on active route ──
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
        return new Set(readLS<string[]>(LS_EXPANDED, []));
    });

    // Auto-expand: ouvrir le groupe contenant un item actif
    useEffect(() => {
        const activeGroup = NAV_GROUPS.find(g =>
            g.items.some(item => matchRoute({ to: item.path.split('?')[0], fuzzy: true }))
        );
        if (activeGroup && !expandedGroups.has(activeGroup.key)) {
            setExpandedGroups(prev => {
                const next = new Set(prev);
                next.add(activeGroup.key);
                writeLS(LS_EXPANDED, [...next]);
                return next;
            });
        }
    }, [matchRoute]); // eslint-disable-line react-hooks/exhaustive-deps

    const toggleGroup = useCallback((key: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            writeLS(LS_EXPANDED, [...next]);
            return next;
        });
    }, []);

    // ── Keyboard navigation refs ──
    const itemRefs = useRef<Map<number, HTMLAnchorElement>>(new Map());
    const [focusedIdx, setFocusedIdx] = useState(-1);

    const registerItemRef = useCallback((index: number, el: HTMLAnchorElement | null) => {
        if (el) itemRefs.current.set(index, el);
        else itemRefs.current.delete(index);
    }, []);

    // Calculer l'index de départ pour chaque groupe
    const groupStartIndex = useCallback((groupIdx: number) => {
        let idx = 0;
        for (let i = 0; i < groupIdx; i++) idx += NAV_GROUPS[i].items.length;
        return idx;
    }, []);

    // Total items pour navigation clavier
    const totalItems = NAV_GROUPS.reduce((sum, g) => sum + g.items.length, 0);

    // Keyboard handler
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (isMobile && !mobileOpen) return;

        switch (e.key) {
            case 'ArrowDown': {
                e.preventDefault();
                const next = Math.min(focusedIdx + 1, totalItems - 1);
                setFocusedIdx(next);
                itemRefs.current.get(next)?.focus();
                break;
            }
            case 'ArrowUp': {
                e.preventDefault();
                const prev = Math.max(focusedIdx - 1, 0);
                setFocusedIdx(prev);
                itemRefs.current.get(prev)?.focus();
                break;
            }
            case 'Escape': {
                if (isMobile) setMobileOpen(false);
                break;
            }
        }
    }, [focusedIdx, totalItems, isMobile, mobileOpen]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // Fermer le drawer mobile au changement de route
    useEffect(() => {
        if (isMobile) setMobileOpen(false);
    }, [isMobile]);

    // Contenu navigation (réutilisé en desktop et mobile)
    const navContent: ReactNode = (
        <nav className="flex-1 py-2 px-2 overflow-y-auto scrollbar-hide" role="navigation" aria-label={t('sidebar.titre')}>
            {NAV_GROUPS.map((group, groupIdx) => (
                <div key={group.key}>
                    {/* Séparateur visuel entre groupes */}
                    {groupIdx > 0 && (
                        <div className="mx-3 my-1.5 border-t border-[var(--color-bordure)]/50" />
                    )}
                    <NavGroup
                        group={group}
                        collapsed={collapsed}
                        expandedGroups={expandedGroups}
                        toggleGroup={toggleGroup}
                        t={t}
                        matchRoute={matchRoute}
                        isMobile={isMobile}
                        setMobileOpen={setMobileOpen}
                        focusedIndex={groupStartIndex(groupIdx)}
                        registerItemRef={registerItemRef}
                    />
                </div>
            ))}
        </nav>
    );

    // =============================================
    // Mode mobile — Drawer slide animé (framer-motion)
    // =============================================
    if (isMobile) {
        return (
            <>
                {/* Bouton hamburger visible sur toutes les pages platform */}
                <motion.button
                    onClick={() => setMobileOpen(true)}
                    className="fixed top-3 left-3 z-40 p-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-bordure)] shadow-sm text-[var(--color-texte-muted)]"
                    aria-label={t('sidebar.ouvrirNavigation', 'Ouvrir la navigation plateforme')}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.15 }}
                >
                    <Shield style={{ width: 'var(--icon-sm)', height: 'var(--icon-sm)' }} />
                </motion.button>

                {/* Overlay drawer animé */}
                <AnimatePresence>
                    {mobileOpen && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                className="fixed inset-0 z-50 bg-black/40"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                onClick={() => setMobileOpen(false)}
                            />
                            {/* Panel slide */}
                            <motion.aside
                                className="fixed top-0 left-0 bottom-0 z-50 flex flex-col bg-[var(--color-surface)] border-r border-[var(--color-bordure)]"
                                style={{
                                    width: 'clamp(260px, 80vw, 320px)',
                                    maxWidth: '85vw',
                                }}
                                initial={{ x: '-100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '-100%' }}
                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            >
                                {/* Header mobile */}
                                <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-bordure)]">
                                    <Shield className="w-5 h-5 text-[var(--color-danger-500)] flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <h2
                                            className="font-bold truncate"
                                            style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.3vw, 1rem)' }}
                                        >
                                            {t('sidebar.titre')}
                                        </h2>
                                        <p
                                            className="text-[var(--color-texte-muted)]"
                                            style={{ fontSize: 'clamp(0.625rem, 0.58rem + 0.2vw, 0.688rem)' }}
                                        >
                                            {t('sidebar.sousTitre')}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setMobileOpen(false)}
                                        className="p-1 rounded hover:bg-[var(--color-surface-hover)] text-[var(--color-texte-muted)]"
                                        aria-label={t('common:fermer', 'Fermer')}
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {navContent}

                                {/* Footer mobile */}
                                <div className="px-4 py-3 border-t border-[var(--color-bordure)]">
                                    <div className="flex items-center gap-2 text-xs text-[var(--color-texte-muted)]">
                                        <Shield className="w-3.5 h-3.5 text-[var(--color-danger-500)]" />
                                        <span>{t('sidebar.accesProprietaire')}</span>
                                    </div>
                                </div>
                            </motion.aside>
                        </>
                    )}
                </AnimatePresence>
            </>
        );
    }

    // =============================================
    // Mode desktop — Sidebar classique
    // =============================================
    return (
        <aside
            className="flex flex-col border-r border-[var(--color-bordure)] bg-[var(--color-surface)] transition-all duration-200"
            style={{ width: collapsed ? 'clamp(3.5rem, 4vw, 4rem)' : 'clamp(13rem, 18vw, 16rem)' }}
        >
            {/* En-tête */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-bordure)]">
                <Shield
                    className="text-[var(--color-danger-500)] flex-shrink-0"
                    style={{ width: 'var(--icon-sm)', height: 'var(--icon-sm)' }}
                />
                {!collapsed && (
                    <div className="flex-1 min-w-0">
                        <h2
                            className="font-bold truncate"
                            style={{ fontSize: 'clamp(0.8125rem, 0.77rem + 0.2vw, 0.875rem)' }}
                        >
                            {t('sidebar.titre')}
                        </h2>
                        <p
                            className="text-[var(--color-texte-muted)]"
                            style={{ fontSize: 'clamp(0.563rem, 0.52rem + 0.2vw, 0.625rem)' }}
                        >
                            {t('sidebar.sousTitre')}
                        </p>
                    </div>
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-1 rounded hover:bg-[var(--color-surface-hover)] text-[var(--color-texte-muted)]"
                    aria-label={collapsed ? t('sidebar.deplier', 'Déplier') : t('sidebar.replier', 'Replier')}
                >
                    {collapsed
                        ? <ChevronRight style={{ width: 'var(--icon-xs)', height: 'var(--icon-xs)' }} />
                        : <ChevronLeft style={{ width: 'var(--icon-xs)', height: 'var(--icon-xs)' }} />
                    }
                </button>
            </div>

            {navContent}

            {/* Footer — info SUPER_ADMIN */}
            {!collapsed && (
                <div className="px-4 py-3 border-t border-[var(--color-bordure)]">
                    <div className="flex items-center gap-2 text-xs text-[var(--color-texte-muted)]">
                        <Shield
                            className="text-[var(--color-danger-500)]"
                            style={{ width: 'var(--icon-xs)', height: 'var(--icon-xs)' }}
                        />
                        <span>{t('sidebar.accesProprietaire')}</span>
                    </div>
                </div>
            )}
        </aside>
    );
}

export default PlatformSidebar;
