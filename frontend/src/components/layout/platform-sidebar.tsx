/**
 * ==================================
 * eLISAschool - Platform Sidebar
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * Sidebar dédiée à l'espace plateforme (Control Plane).
 * v2.0 : i18n, sections groupées, responsive drawer (mobile),
 *        CSS vars, dark mode, ultra-responsif (clamp).
 *
 * Plan v7.1 — Panel Admin Enterprise
 */

import { Link, useMatchRoute } from '@tanstack/react-router';
import {
    LayoutDashboard,
    Building2,
    CreditCard,
    Package,
    Activity,
    FileText,
    Settings,
    Bell,
    Shield,
    ChevronLeft,
    ChevronRight,
    Wallet,
    KeyRound,
    Network,
    X,
    DollarSign,
    Users,
    Star,
    Layers,
} from 'lucide-react';
import { useState, useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from '@/hooks/use-media-query';
import { cn } from '@/lib/cn';

// =============================================
// Types
// =============================================

interface PlatformNavItem {
    labelKey: string;
    descKey: string;
    path: string;
    icon: typeof LayoutDashboard;
    group: 'pilotage' | 'tenants' | 'technique' | 'securite';
    subGroup?: 'identite' | 'surveillance';
}

interface PlatformNavGroup {
    key: string;
    labelKey: string;
    items: PlatformNavItem[];
}

// =============================================
// Configuration navigation (4 groupes workflow)
// Plan v7.1 — Proposition A (Workflow)
// =============================================

const PLATFORM_NAV_ITEMS: PlatformNavItem[] = [
    // Groupe Pilotage (3 items)
    { labelKey: 'navigation.dashboard', descKey: 'sidebar.descDashboard', path: '/platform/dashboard', icon: LayoutDashboard, group: 'pilotage' },
    { labelKey: 'navigation.monitoring', descKey: 'sidebar.descMonitoring', path: '/platform/monitoring', icon: Activity, group: 'pilotage' },
    { labelKey: 'navigation.revenus', descKey: 'sidebar.descRevenus', path: '/platform/revenus', icon: DollarSign, group: 'pilotage' },
    // Groupe Tenants (4 items)
    { labelKey: 'navigation.etablissements', descKey: 'sidebar.descEtablissements', path: '/platform/etablissements', icon: Building2, group: 'tenants' },
    { labelKey: 'navigation.groupes', descKey: 'sidebar.descGroupes', path: '/platform/groupes', icon: Network, group: 'tenants' },
    { labelKey: 'navigation.facturation', descKey: 'sidebar.descFacturation', path: '/platform/facturation', icon: CreditCard, group: 'tenants' },
    { labelKey: 'navigation.abonnements', descKey: 'sidebar.descAbonnements', path: '/platform/abonnements', icon: Star, group: 'tenants' },
    // Groupe Technique (4 items)
    { labelKey: 'navigation.modules', descKey: 'sidebar.descModules', path: '/platform/modules', icon: Package, group: 'technique' },
    { labelKey: 'navigation.configuration', descKey: 'sidebar.descConfiguration', path: '/platform/configuration', icon: Settings, group: 'technique' },
    { labelKey: 'navigation.notifications', descKey: 'sidebar.descNotifications', path: '/platform/notifications-config', icon: Bell, group: 'technique' },
    { labelKey: 'navigation.providers', descKey: 'sidebar.descProviders', path: '/platform/providers', icon: Wallet, group: 'technique' },
    { labelKey: 'navigation.parametresCascade', descKey: 'sidebar.descParametresCascade', path: '/platform/parametres-cascade', icon: Layers, group: 'technique' },
    // Groupe Sécurité (5 items — sous-groupes Identité + Surveillance)
    { labelKey: 'navigation.utilisateurs', descKey: 'sidebar.descUtilisateurs', path: '/platform/utilisateurs', icon: Users, group: 'securite', subGroup: 'identite' },
    { labelKey: 'navigation.rolesPlateforme', descKey: 'sidebar.descRolesPlateforme', path: '/platform/roles', icon: Shield, group: 'securite', subGroup: 'identite' },
    { labelKey: 'navigation.permissions', descKey: 'sidebar.descPermissions', path: '/platform/permissions', icon: KeyRound, group: 'securite', subGroup: 'identite' },
    { labelKey: 'navigation.sessionsActivite', descKey: 'sidebar.descSessionsActivite', path: '/platform/sessions', icon: Activity, group: 'securite', subGroup: 'surveillance' },
    { labelKey: 'navigation.audit', descKey: 'sidebar.descAudit', path: '/platform/audit', icon: FileText, group: 'securite', subGroup: 'surveillance' },
];

const NAV_GROUPS: PlatformNavGroup[] = [
    { key: 'pilotage', labelKey: 'sidebar.groupePilotage', items: PLATFORM_NAV_ITEMS.filter(i => i.group === 'pilotage') },
    { key: 'tenants', labelKey: 'sidebar.groupeTenants', items: PLATFORM_NAV_ITEMS.filter(i => i.group === 'tenants') },
    { key: 'technique', labelKey: 'sidebar.groupeTechnique', items: PLATFORM_NAV_ITEMS.filter(i => i.group === 'technique') },
    { key: 'securite', labelKey: 'sidebar.groupeSecurite', items: PLATFORM_NAV_ITEMS.filter(i => i.group === 'securite') },
];

// =============================================
// Composant NavItemLink (extrait pour sous-groupes)
// =============================================

function NavItemLink({ item, collapsed, t, matchRoute, isMobile, setMobileOpen }: {
    item: PlatformNavItem;
    collapsed: boolean;
    t: any;
    matchRoute: any;
    isMobile: boolean;
    setMobileOpen: (v: boolean) => void;
}) {
    const isActive = matchRoute({ to: item.path, fuzzy: true });
    const Icon = item.icon;

    return (
        <Link
            to={item.path}
            onClick={() => isMobile && setMobileOpen(false)}
            className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group',
                item.subGroup ? 'ml-2' : '',
                isActive
                    ? 'bg-[var(--color-danger-100)] text-[var(--color-danger-700)] font-medium'
                    : 'text-[var(--color-texte-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-texte)]'
            )}
            style={{ fontSize: 'clamp(0.8125rem, 0.77rem + 0.2vw, 0.875rem)' }}
            title={collapsed ? t(item.labelKey) : undefined}
        >
            <Icon
                className={cn(
                    'flex-shrink-0',
                    isActive
                        ? 'text-[var(--color-danger-500)]'
                        : 'text-[var(--color-texte-muted)] group-hover:text-[var(--color-texte)]'
                )}
                style={{ width: 'var(--icon-sm)', height: 'var(--icon-sm)' }}
            />
            {!collapsed && (
                <div className="flex-1 min-w-0">
                    <span className="truncate block">{t(item.labelKey)}</span>
                    <span
                        className="text-[var(--color-texte-muted)] block truncate"
                        style={{ fontSize: 'clamp(0.563rem, 0.52rem + 0.2vw, 0.625rem)' }}
                    >
                        {t(item.descKey)}
                    </span>
                </div>
            )}
        </Link>
    );
}

// =============================================
// Composant
// =============================================

interface PlatformSidebarProps {
    collapsed?: boolean;
}

export function PlatformSidebar({ collapsed: initialCollapsed = false }: PlatformSidebarProps) {
    const { t } = useTranslation('admin');
    const [collapsed, setCollapsed] = useState(initialCollapsed);
    const matchRoute = useMatchRoute();
    const isMobile = useMediaQuery('(max-width: 767px)');
    const [mobileOpen, setMobileOpen] = useState(false);

    // Fermer le drawer mobile au changement de route
    useEffect(() => {
        if (isMobile) setMobileOpen(false);
    }, [isMobile]);

    // Contenu navigation (réutilisé en desktop et mobile)
    const navContent: ReactNode = (
        <nav className="flex-1 py-2 px-2 overflow-y-auto scrollbar-hide">
            {NAV_GROUPS.map((group) => {
                // Groupe Sécurité : afficher avec sous-groupes
                if (group.key === 'securite') {
                    const identiteItems = group.items.filter(i => i.subGroup === 'identite');
                    const surveillanceItems = group.items.filter(i => i.subGroup === 'surveillance');

                    return (
                        <div key={group.key} className="mb-2">
                            {!collapsed && (
                                <p
                                    className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-texte-muted)]"
                                    style={{ fontSize: 'clamp(0.563rem, 0.52rem + 0.2vw, 0.625rem)' }}
                                >
                                    {t(group.labelKey)}
                                </p>
                            )}
                            {/* Sous-groupe Identité */}
                            {!collapsed && identiteItems.length > 0 && (
                                <p className="px-3 pt-2 pb-0.5 text-[9px] font-medium uppercase tracking-wider text-[var(--color-texte-muted)]/70">
                                    {t('sidebar.sousGroupeIdentite', 'Identité')}
                                </p>
                            )}
                            {identiteItems.map((item) => (
                                <NavItemLink key={item.path} item={item} collapsed={collapsed} t={t} matchRoute={matchRoute} isMobile={isMobile} setMobileOpen={setMobileOpen} />
                            ))}
                            {/* Sous-groupe Surveillance */}
                            {!collapsed && surveillanceItems.length > 0 && (
                                <p className="px-3 pt-2 pb-0.5 text-[9px] font-medium uppercase tracking-wider text-[var(--color-texte-muted)]/70">
                                    {t('sidebar.sousGroupeSurveillance', 'Surveillance')}
                                </p>
                            )}
                            {surveillanceItems.map((item) => (
                                <NavItemLink key={item.path} item={item} collapsed={collapsed} t={t} matchRoute={matchRoute} isMobile={isMobile} setMobileOpen={setMobileOpen} />
                            ))}
                        </div>
                    );
                }

                // Autres groupes : rendu standard
                return (
                    <div key={group.key} className="mb-2">
                        {!collapsed && (
                            <p
                                className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-texte-muted)]"
                                style={{ fontSize: 'clamp(0.563rem, 0.52rem + 0.2vw, 0.625rem)' }}
                            >
                                {t(group.labelKey)}
                            </p>
                        )}
                        {group.items.map((item) => (
                            <NavItemLink key={item.path} item={item} collapsed={collapsed} t={t} matchRoute={matchRoute} isMobile={isMobile} setMobileOpen={setMobileOpen} />
                        ))}
                    </div>
                );
            })}
        </nav>
    );

    // =============================================
    // Mode mobile — Drawer overlay
    // =============================================
    if (isMobile) {
        return (
            <>
                {/* Bouton hamburger visible sur toutes les pages platform */}
                <button
                    onClick={() => setMobileOpen(true)}
                    className="fixed top-3 left-3 z-40 p-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-bordure)] shadow-sm text-[var(--color-texte-muted)]"
                    aria-label={t('sidebar.ouvrirNavigation', 'Ouvrir la navigation plateforme')}
                >
                    <Shield style={{ width: 'var(--icon-sm)', height: 'var(--icon-sm)' }} />
                </button>

                {/* Overlay drawer */}
                {mobileOpen && (
                    <div className="fixed inset-0 z-50 flex">
                        {/* Backdrop */}
                        <div
                            className="flex-1 bg-black/40"
                            onClick={() => setMobileOpen(false)}
                        />
                        {/* Panel */}
                        <aside
                            className="flex flex-col bg-[var(--color-surface)] border-r border-[var(--color-bordure)]"
                            style={{
                                width: 'clamp(260px, 80vw, 320px)',
                                maxWidth: '85vw',
                            }}
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
                        </aside>
                    </div>
                )}
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
