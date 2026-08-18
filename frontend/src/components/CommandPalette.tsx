/**
 * ==================================
 * eLISAschool - Command Palette (Cmd+K)
 * ==================================
 * Navigation rapide vers toutes les routes + actions rapides.
 * Recherche fuzzy, raccourcis clavier.
 * 
 * Phase 6.6 — Refonte SaaS
 * Phase E.2 — Refonte SaaS v2 (enrichi: modules, notifications, permissions)
 * Audit V3 — Synchronisation avec sidebar 7 groupes / 23 items.
 * v3.0 — Détection contexte (platform/tenant), i18n, style unifié,
 *         événement custom `open-command-palette`, recherche fuzzy améliorée.
 *
 * Version: 3.0.0
 * Auteur: franck arlos chendjou
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/auth.store';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    LayoutDashboard,
    Building2,
    Settings,
    Activity,
    ScrollText,
    CreditCard,
    Users,
    GraduationCap,
    Calendar,
    FileText,
    Bus,
    Library,
    X,
    Puzzle,
    Bell,
    ShieldCheck,
    BarChart3,
    Network,
    KeyRound,
    Wallet,
    Layers,
    Store,
    TrendingUp,
    Percent,
    PackagePlus,
    CalendarClock,
    BadgePercent,
    MonitorSmartphone,
    HardDrive,
    ToggleRight,
    Sparkles,
    type LucideIcon,
} from 'lucide-react';

// =============================================
// Types
// =============================================

interface CommandItem {
    id: string;
    labelKey: string;
    labelFallback: string;
    descriptionKey?: string;
    descriptionFallback?: string;
    path: string;
    icon: LucideIcon;
    category: 'platform' | 'tenant';
    categoryKey: string;
    categoryFallback: string;
    keywords: string[];
}

// =============================================
// Commandes — Platform (Control Plane)
// 7 groupes, 23 routes dédiées
// =============================================

const PLATFORM_COMMANDS: CommandItem[] = [
    // — Pilotage (3)
    { id: 'p-dashboard', labelKey: 'admin:commandPalette.dashboard', labelFallback: 'Dashboard Plateforme', descriptionKey: 'admin:commandPalette.dashboardDesc', descriptionFallback: 'KPIs globaux', path: '/platform/dashboard', icon: LayoutDashboard, category: 'platform', categoryKey: 'admin:commandPalette.catPilotage', categoryFallback: 'Pilotage', keywords: ['dashboard', 'kpi', 'stats', 'pilotage'] },
    { id: 'p-monitoring', labelKey: 'admin:commandPalette.monitoring', labelFallback: 'Monitoring', descriptionKey: 'admin:commandPalette.monitoringDesc', descriptionFallback: 'Health, signaux, alertes', path: '/platform/monitoring', icon: Activity, category: 'platform', categoryKey: 'admin:commandPalette.catPilotage', categoryFallback: 'Pilotage', keywords: ['monitoring', 'infrastructure', 'health', 'signaux', 'alertes'] },
    { id: 'p-revenus', labelKey: 'admin:commandPalette.revenus', labelFallback: 'Revenus & KPIs', descriptionKey: 'admin:commandPalette.revenusDesc', descriptionFallback: 'MRR, ARR, santé financière', path: '/platform/revenus', icon: TrendingUp, category: 'platform', categoryKey: 'admin:commandPalette.catPilotage', categoryFallback: 'Pilotage', keywords: ['revenus', 'mrr', 'arr', 'kpi', 'usage', 'finance'] },

    // — Établissement (4)
    { id: 'p-etablissements', labelKey: 'admin:commandPalette.etablissements', labelFallback: 'Établissements', descriptionKey: 'admin:commandPalette.etablissementsDesc', descriptionFallback: 'Gestion CRUD', path: '/platform/etablissements', icon: Building2, category: 'platform', categoryKey: 'admin:commandPalette.catEtablissement', categoryFallback: 'Établissement', keywords: ['etablissements', 'ecoles', 'clients', 'tenants'] },
    { id: 'p-groupes', labelKey: 'admin:commandPalette.groupes', labelFallback: 'Groupes établissement', descriptionKey: 'admin:commandPalette.groupesDesc', descriptionFallback: 'Groupes d\'établissements', path: '/platform/groupes', icon: Network, category: 'platform', categoryKey: 'admin:commandPalette.catEtablissement', categoryFallback: 'Établissement', keywords: ['groupes', 'groupes etablissements', 'saas groups'] },
    { id: 'p-abonnements', labelKey: 'admin:commandPalette.abonnements', labelFallback: 'Abonnements', descriptionKey: 'admin:commandPalette.abonnementsDesc', descriptionFallback: 'Abonnements établissements', path: '/platform/abonnements', icon: CreditCard, category: 'platform', categoryKey: 'admin:commandPalette.catEtablissement', categoryFallback: 'Établissement', keywords: ['abonnements', 'subscriptions', 'clients'] },
    { id: 'p-factures', labelKey: 'admin:commandPalette.factures', labelFallback: 'Factures', descriptionKey: 'admin:commandPalette.facturesDesc', descriptionFallback: 'Facturation plateforme', path: '/platform/factures', icon: FileText, category: 'platform', categoryKey: 'admin:commandPalette.catEtablissement', categoryFallback: 'Établissement', keywords: ['factures', 'invoices', 'billing'] },

    // — Plans & abonnements (4)
    { id: 'p-plans', labelKey: 'admin:commandPalette.plans', labelFallback: 'Plans', descriptionKey: 'admin:commandPalette.plansDesc', descriptionFallback: 'Catalogue plans et tarifs', path: '/platform/plans', icon: BadgePercent, category: 'platform', categoryKey: 'admin:commandPalette.catPlans', categoryFallback: 'Plans & abonnements', keywords: ['plans', 'abonnement', 'tarifs', 'pricing', 'catalogue'] },
    { id: 'p-cycles', labelKey: 'admin:commandPalette.cycles', labelFallback: 'Cycles & Stratégies', descriptionKey: 'admin:commandPalette.cyclesDesc', descriptionFallback: 'Cycles de facturation', path: '/platform/cycles-strategies', icon: CalendarClock, category: 'platform', categoryKey: 'admin:commandPalette.catPlans', categoryFallback: 'Plans & abonnements', keywords: ['cycles', 'facturation', 'strategies', 'expiration'] },
    { id: 'p-packs', labelKey: 'admin:commandPalette.packs', labelFallback: 'Packs Quota', descriptionKey: 'admin:commandPalette.packsDesc', descriptionFallback: 'Packs de quotas supplémentaires', path: '/platform/packs-quota', icon: PackagePlus, category: 'platform', categoryKey: 'admin:commandPalette.catPlans', categoryFallback: 'Plans & abonnements', keywords: ['packs', 'quota', 'quotas', 'supplement'] },
    { id: 'p-tarifs', labelKey: 'admin:commandPalette.tarifs', labelFallback: 'Tarifs', descriptionKey: 'admin:commandPalette.tarifsDesc', descriptionFallback: 'Grilles tarifaires', path: '/platform/tarifs', icon: TrendingUp, category: 'platform', categoryKey: 'admin:commandPalette.catPlans', categoryFallback: 'Plans & abonnements', keywords: ['tarifs', 'pricing', 'grilles', 'tarification'] },

    // — Commerce (2)
    { id: 'p-providers', labelKey: 'admin:commandPalette.providers', labelFallback: 'Providers Paiement', descriptionKey: 'admin:commandPalette.providersDesc', descriptionFallback: 'MTN, OM, Wave, Stripe...', path: '/platform/providers', icon: Wallet, category: 'platform', categoryKey: 'admin:commandPalette.catCommerce', categoryFallback: 'Commerce', keywords: ['providers', 'paiement', 'payment', 'stripe', 'momo', 'wave'] },
    { id: 'p-promotions', labelKey: 'admin:commandPalette.promotionsRemises', labelFallback: 'Promotions & Remises', descriptionKey: 'admin:commandPalette.promotionsRemisesDesc', descriptionFallback: 'Promotions multi-scopes, bundles, cascade, coupons, réductions', path: '/platform/promotions', icon: Sparkles, category: 'platform', categoryKey: 'admin:commandPalette.catCommerce', categoryFallback: 'Commerce', keywords: ['promotions', 'remises', 'bundles', 'cascade', 'multi-scopes', 'coupons', 'reductions', 'discounts', 'gratuite'] },

    // — Modules et fonctions (2)
    { id: 'p-modules', labelKey: 'admin:commandPalette.modules', labelFallback: 'Modules', descriptionKey: 'admin:commandPalette.modulesDesc', descriptionFallback: 'Registre & activation module', path: '/platform/modules', icon: Puzzle, category: 'platform', categoryKey: 'admin:commandPalette.catModules', categoryFallback: 'Modules & fonctions', keywords: ['modules', 'activation', 'registry', 'premium', 'catalogue'] },
    { id: 'p-fonctionnalites', labelKey: 'admin:commandPalette.featureFlags', labelFallback: 'Feature Flags', descriptionKey: 'admin:commandPalette.featureFlagsDesc', descriptionFallback: 'Définitions, matrice, audit', path: '/platform/fonctionnalites', icon: ToggleRight, category: 'platform', categoryKey: 'admin:commandPalette.catModules', categoryFallback: 'Modules & fonctions', keywords: ['feature flags', 'fonctionnalites', 'toggles', 'experiments'] },

    // — Sécurité & Audit (5)
    { id: 'p-audit', labelKey: 'admin:commandPalette.audit', labelFallback: 'Audit Global', descriptionKey: 'admin:commandPalette.auditDesc', descriptionFallback: 'Logs tous établissements', path: '/platform/audit', icon: ScrollText, category: 'platform', categoryKey: 'admin:commandPalette.catSecurite', categoryFallback: 'Sécurité & Audit', keywords: ['audit', 'logs', 'historique', 'trail'] },
    { id: 'p-approbations', labelKey: 'admin:commandPalette.approbations', labelFallback: 'Approbations', descriptionKey: 'admin:commandPalette.approbationsDesc', descriptionFallback: 'Actions critiques 2FA', path: '/platform/approbations', icon: ShieldCheck, category: 'platform', categoryKey: 'admin:commandPalette.catSecurite', categoryFallback: 'Sécurité & Audit', keywords: ['approbations', 'actions critiques', 'mfa', '2fa'] },
    { id: 'p-sessions', labelKey: 'admin:commandPalette.sessions', labelFallback: 'Sessions & Activité', descriptionKey: 'admin:commandPalette.sessionsDesc', descriptionFallback: 'Sessions actives, connexions', path: '/platform/sessions', icon: MonitorSmartphone, category: 'platform', categoryKey: 'admin:commandPalette.catSecurite', categoryFallback: 'Sécurité & Audit', keywords: ['sessions', 'activite', 'connexions', 'login'] },
    { id: 'p-utilisateurs', labelKey: 'admin:commandPalette.utilisateurs', labelFallback: 'Utilisateurs Plateforme', descriptionKey: 'admin:commandPalette.utilisateursDesc', descriptionFallback: 'Comptes plateforme', path: '/platform/utilisateurs', icon: Users, category: 'platform', categoryKey: 'admin:commandPalette.catSecurite', categoryFallback: 'Sécurité & Audit', keywords: ['utilisateurs', 'comptes', 'admin', 'platform users'] },
    { id: 'p-roles', labelKey: 'admin:commandPalette.roles', labelFallback: 'Rôles & Permissions', descriptionKey: 'admin:commandPalette.rolesDesc', descriptionFallback: 'Rôles plateforme', path: '/platform/roles', icon: KeyRound, category: 'platform', categoryKey: 'admin:commandPalette.catSecurite', categoryFallback: 'Sécurité & Audit', keywords: ['roles', 'permissions', 'rbac', 'acces'] },

    // — Système (3)
    { id: 'p-configuration', labelKey: 'admin:commandPalette.configuration', labelFallback: 'Configuration', descriptionKey: 'admin:commandPalette.configurationDesc', descriptionFallback: 'Paramètres système', path: '/platform/configuration', icon: Settings, category: 'platform', categoryKey: 'admin:commandPalette.catSysteme', categoryFallback: 'Système', keywords: ['configuration', 'config', 'parametres', 'systeme'] },
    { id: 'p-backups', labelKey: 'admin:commandPalette.backups', labelFallback: 'Sauvegardes', descriptionKey: 'admin:commandPalette.backupsDesc', descriptionFallback: 'Backup, historique, restauration', path: '/platform/backups', icon: HardDrive, category: 'platform', categoryKey: 'admin:commandPalette.catSysteme', categoryFallback: 'Système', keywords: ['sauvegardes', 'backup', 'historique', 'restauration'] },
    { id: 'p-notifications', labelKey: 'admin:commandPalette.notificationsConfig', labelFallback: 'Notifications Config', descriptionKey: 'admin:commandPalette.notificationsConfigDesc', descriptionFallback: 'Providers, templates, test', path: '/platform/notifications-config', icon: Bell, category: 'platform', categoryKey: 'admin:commandPalette.catSysteme', categoryFallback: 'Système', keywords: ['notifications', 'config', 'email', 'sms', 'push', 'templates'] },
];

// =============================================
// Commandes — Tenant (Data Plane)
// =============================================

const TENANT_COMMANDS: CommandItem[] = [
    { id: 'e-dashboard', labelKey: 'admin:commandPalette.tenantDashboard', labelFallback: 'Dashboard', descriptionKey: 'admin:commandPalette.tenantDashboardDesc', descriptionFallback: 'Tableau de bord établissement', path: '/', icon: LayoutDashboard, category: 'tenant', categoryKey: 'admin:commandPalette.catEtablissement', categoryFallback: 'Établissement', keywords: ['dashboard', 'accueil', 'tableau de bord'] },
    { id: 'e-eleves', labelKey: 'admin:commandPalette.eleves', labelFallback: 'Élèves', descriptionKey: 'admin:commandPalette.elevesDesc', descriptionFallback: 'Gestion des élèves', path: '/eleves', icon: GraduationCap, category: 'tenant', categoryKey: 'admin:commandPalette.catEtablissement', categoryFallback: 'Établissement', keywords: ['eleves', 'etudiants', 'inscriptions'] },
    { id: 'e-notes', labelKey: 'admin:commandPalette.notes', labelFallback: 'Notes', descriptionKey: 'admin:commandPalette.notesDesc', descriptionFallback: 'Saisie et consultation', path: '/notes', icon: FileText, category: 'tenant', categoryKey: 'admin:commandPalette.catEtablissement', categoryFallback: 'Établissement', keywords: ['notes', 'evaluations'] },
    { id: 'e-emploi', labelKey: 'admin:commandPalette.emploi', labelFallback: 'Emploi du temps', descriptionKey: 'admin:commandPalette.emploiDesc', descriptionFallback: 'Planification horaires', path: '/emploi-du-temps', icon: Calendar, category: 'tenant', categoryKey: 'admin:commandPalette.catEtablissement', categoryFallback: 'Établissement', keywords: ['emploi', 'temps', 'horaires', 'planning'] },
    { id: 'e-finances', labelKey: 'admin:commandPalette.finances', labelFallback: 'Finances', descriptionKey: 'admin:commandPalette.financesDesc', descriptionFallback: 'Frais de scolarité', path: '/finances', icon: CreditCard, category: 'tenant', categoryKey: 'admin:commandPalette.catEtablissement', categoryFallback: 'Établissement', keywords: ['finances', 'paiement', 'frais', 'scolarite'] },
    { id: 'e-transport', labelKey: 'admin:commandPalette.transport', labelFallback: 'Transport', descriptionKey: 'admin:commandPalette.transportDesc', descriptionFallback: 'Gestion transport', path: '/transport', icon: Bus, category: 'tenant', categoryKey: 'admin:commandPalette.catEtablissement', categoryFallback: 'Établissement', keywords: ['transport', 'bus', 'trajets'] },
    { id: 'e-bibliotheque', labelKey: 'admin:commandPalette.bibliotheque', labelFallback: 'Bibliothèque', descriptionKey: 'admin:commandPalette.bibliothequeDesc', descriptionFallback: 'Gestion ouvrages', path: '/bibliotheque', icon: Library, category: 'tenant', categoryKey: 'admin:commandPalette.catEtablissement', categoryFallback: 'Établissement', keywords: ['bibliotheque', 'livres', 'emprunts'] },
    { id: 'e-personnel', labelKey: 'admin:commandPalette.personnel', labelFallback: 'Personnel', descriptionKey: 'admin:commandPalette.personnelDesc', descriptionFallback: 'RH et personnel', path: '/personnel', icon: Users, category: 'tenant', categoryKey: 'admin:commandPalette.catEtablissement', categoryFallback: 'Établissement', keywords: ['personnel', 'rh', 'employes'] },
    { id: 'e-paiements', labelKey: 'admin:commandPalette.paiements', labelFallback: 'Paiements', descriptionKey: 'admin:commandPalette.paiementsDesc', descriptionFallback: 'Configuration providers', path: '/paiements', icon: CreditCard, category: 'tenant', categoryKey: 'admin:commandPalette.catEtablissement', categoryFallback: 'Établissement', keywords: ['paiements', 'providers', 'momo', 'stripe'] },
    { id: 'e-abonnement', labelKey: 'admin:commandPalette.abonnement', labelFallback: 'Mon Abonnement', descriptionKey: 'admin:commandPalette.abonnementDesc', descriptionFallback: 'Abonnement plateforme', path: '/mon-abonnement', icon: CreditCard, category: 'tenant', categoryKey: 'admin:commandPalette.catEtablissement', categoryFallback: 'Établissement', keywords: ['abonnement', 'subscription', 'plan', 'factures'] },
    { id: 'e-factures', labelKey: 'admin:commandPalette.facturesTenant', labelFallback: 'Factures', descriptionKey: 'admin:commandPalette.facturesTenantDesc', descriptionFallback: 'Historique et paiement', path: '/factures', icon: FileText, category: 'tenant', categoryKey: 'admin:commandPalette.catEtablissement', categoryFallback: 'Établissement', keywords: ['factures', 'invoices', 'paiement', 'billing', 'avoir'] },
    { id: 'e-plans', labelKey: 'admin:commandPalette.plansTenant', labelFallback: "Plans d'abonnement", descriptionKey: 'admin:commandPalette.plansTenantDesc', descriptionFallback: 'Catalogue, comparaison, simulateur', path: '/plans', icon: Layers, category: 'tenant', categoryKey: 'admin:commandPalette.catEtablissement', categoryFallback: 'Établissement', keywords: ['plans', 'tarification', 'simulateur', 'pricing', 'comparaison'] },
    { id: 'e-marketplace', labelKey: 'admin:commandPalette.marketplace', labelFallback: 'Marché', descriptionKey: 'admin:commandPalette.marketplaceDesc', descriptionFallback: 'Catalogue modules', path: '/marketplace', icon: Store, category: 'tenant', categoryKey: 'admin:commandPalette.catEtablissement', categoryFallback: 'Établissement', keywords: ['marketplace', 'marché', 'modules', 'catalogue', 'activation'] },
    { id: 'e-notifications', labelKey: 'admin:commandPalette.notificationsTenant', labelFallback: 'Notifications', descriptionKey: 'admin:commandPalette.notificationsTenantDesc', descriptionFallback: 'Configuration canaux', path: '/notifications-config', icon: Bell, category: 'tenant', categoryKey: 'admin:commandPalette.catEtablissement', categoryFallback: 'Établissement', keywords: ['notifications', 'email', 'sms', 'push', 'canaux'] },
    { id: 'e-sondages', labelKey: 'admin:commandPalette.sondages', labelFallback: 'Sondages', descriptionKey: 'admin:commandPalette.sondagesDesc', descriptionFallback: 'Enquêtes et sondages', path: '/sondages', icon: BarChart3, category: 'tenant', categoryKey: 'admin:commandPalette.catEtablissement', categoryFallback: 'Établissement', keywords: ['sondages', 'enquetes', 'questionnaires'] },
];

// =============================================
// Helpers — Recherche fuzzy légère
// =============================================

function fuzzyMatch(text: string, query: string): boolean {
    const t = text.toLowerCase();
    const q = query.toLowerCase();
    // Match direct (includes)
    if (t.includes(q)) return true;
    // Match début de mot (ex: "gp" match "groupes plateforme")
    const words = t.split(/\s+/);
    const qWords = q.split(/\s+/);
    return qWords.every(qw => words.some(w => w.startsWith(qw)));
}

// =============================================
// Composant
// =============================================

export function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation(['admin', 'common']);
    const utilisateur = useAuthStore((s) => s.utilisateur);

    // Détection du contexte : platform vs tenant
    const isPlatformContext = location.pathname.startsWith('/platform');

    // Commandes accessibles selon le contexte
    const commands = useMemo(() => {
        return isPlatformContext ? PLATFORM_COMMANDS : TENANT_COMMANDS;
    }, [isPlatformContext]);

    // Recherche fuzzy
    const filteredCommands = useMemo(() => {
        if (!query.trim()) return commands;
        const q = query.trim().toLowerCase();
        return commands.filter((cmd) => {
            // Match sur label, description, keywords, path
            if (fuzzyMatch(cmd.labelFallback, q)) return true;
            if (cmd.descriptionFallback && fuzzyMatch(cmd.descriptionFallback, q)) return true;
            if (cmd.keywords.some(kw => fuzzyMatch(kw, q))) return true;
            if (fuzzyMatch(cmd.path, q)) return true;
            // Match i18n (fallback déjà vérifié, mais au cas où)
            const labelI18n = t(cmd.labelKey, cmd.labelFallback);
            if (fuzzyMatch(labelI18n, q)) return true;
            return false;
        });
    }, [query, commands, t]);

    // Grouper par catégorie
    const groupedCommands = useMemo(() => {
        const groups: { category: string; items: CommandItem[] }[] = [];
        const categoryMap = new Map<string, CommandItem[]>();
        for (const cmd of filteredCommands) {
            const catKey = cmd.categoryKey;
            const catFallback = cmd.categoryFallback;
            const catLabel = t(catKey, catFallback);
            if (!categoryMap.has(catLabel)) {
                categoryMap.set(catLabel, []);
                groups.push({ category: catLabel, items: categoryMap.get(catLabel)! });
            }
            categoryMap.get(catLabel)!.push(cmd);
        }
        return groups;
    }, [filteredCommands, t]);

    // Nombre total de résultats
    const totalResults = filteredCommands.length;

    // ── Ouvrir via événement custom (depuis le header) ──
    useEffect(() => {
        const handler = () => {
            setIsOpen(true);
            setQuery('');
            setSelectedIndex(0);
        };
        window.addEventListener('open-command-palette', handler);
        return () => window.removeEventListener('open-command-palette', handler);
    }, []);

    // ── Raccourci Cmd+K / Ctrl+K + Escape ──
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen((prev) => {
                    if (!prev) {
                        setQuery('');
                        setSelectedIndex(0);
                    }
                    return !prev;
                });
            }
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen]);

    // ── Focus input à l'ouverture ──
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    // ── Scroll into view quand selectedIndex change ──
    useEffect(() => {
        if (!listRef.current) return;
        const selected = listRef.current.querySelector('[data-selected="true"]');
        selected?.scrollIntoView({ block: 'nearest' });
    }, [selectedIndex]);

    // ── Navigation vers une commande ──
    const handleSelect = useCallback((cmd: CommandItem) => {
        setIsOpen(false);
        setQuery('');
        navigate({ to: cmd.path });
    }, [navigate]);

    // ── Clavier navigation (↑↓ Enter) ──
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => Math.min(prev + 1, totalResults - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredCommands[selectedIndex]) {
                handleSelect(filteredCommands[selectedIndex]);
            }
        }
    }, [totalResults, filteredCommands, selectedIndex, handleSelect]);

    // ── Reset index quand la query change ──
    const handleQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
        setSelectedIndex(0);
    }, []);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => setIsOpen(false)}
                >
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />

                    {/* Modal */}
                    <motion.div
                        className="relative w-full max-w-xl overflow-hidden rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] shadow-2xl"
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-label={t('admin:commandPalette.titre', 'Recherche globale')}
                    >
                        {/* Search input */}
                        <div className="flex items-center gap-3 border-b border-[var(--color-bordure)] px-4 py-3">
                            <Search className="h-5 w-5 shrink-0 text-[var(--color-texte-muted)]" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={handleQueryChange}
                                onKeyDown={handleKeyDown}
                                placeholder={isPlatformContext
                                    ? t('admin:commandPalette.placeholderPlatform', 'Rechercher dans la plateforme...')
                                    : t('admin:commandPalette.placeholderTenant', 'Rechercher dans l\'établissement...')
                                }
                                className="flex-1 bg-transparent text-sm text-[var(--color-texte)] outline-none placeholder:text-[var(--color-texte-muted)]/60"
                            />
                            {query && (
                                <span className="text-xs text-[var(--color-texte-muted)]">
                                    {totalResults} {t('admin:commandPalette.resultats', 'résultats')}
                                </span>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="rounded p-1 text-[var(--color-texte-muted)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-texte)]"
                                aria-label={t('common:boutons.fermer', 'Fermer')}
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Results */}
                        <div ref={listRef} className="max-h-[50vh] overflow-y-auto p-2">
                            {groupedCommands.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-10 text-center">
                                    <Search className="mb-3 h-8 w-8 text-[var(--color-texte-muted)]/30" />
                                    <p className="text-sm text-[var(--color-texte-muted)]">
                                        {t('admin:commandPalette.aucunResultat', 'Aucun résultat pour')}
                                        <span className="font-medium text-[var(--color-texte)]"> "{query}"</span>
                                    </p>
                                    <p className="mt-1 text-xs text-[var(--color-texte-muted)]/60">
                                        {t('admin:commandPalette.essayezAutre', 'Essayez un autre terme ou mot-clé')}
                                    </p>
                                </div>
                            )}

                            {groupedCommands.map(({ category, items }) => (
                                <div key={category} className="mb-2">
                                    <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-texte-muted)]/70">
                                        {category}
                                    </div>
                                    {items.map((cmd) => {
                                        const idx = filteredCommands.indexOf(cmd);
                                        const Icon = cmd.icon;
                                        const isSelected = idx === selectedIndex;
                                        const label = t(cmd.labelKey, cmd.labelFallback);
                                        const desc = cmd.descriptionKey
                                            ? t(cmd.descriptionKey, cmd.descriptionFallback || '')
                                            : cmd.descriptionFallback;

                                        return (
                                            <button
                                                key={cmd.id}
                                                data-selected={isSelected}
                                                onClick={() => handleSelect(cmd)}
                                                onMouseEnter={() => setSelectedIndex(idx)}
                                                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                                                    isSelected
                                                        ? 'bg-[var(--color-dominante)]/10 text-[var(--color-dominante)]'
                                                        : 'text-[var(--color-texte)] hover:bg-[var(--color-surface-hover)]'
                                                }`}
                                            >
                                                <Icon className={`h-4 w-4 shrink-0 ${isSelected ? 'text-[var(--color-dominante)]' : 'text-[var(--color-texte-muted)]/60'}`} />
                                                <div className="min-w-0 flex-1">
                                                    <div className="truncate text-sm font-medium">{label}</div>
                                                    {desc && (
                                                        <div className={`truncate text-xs ${isSelected ? 'text-[var(--color-dominante)]/70' : 'text-[var(--color-texte-muted)]'}`}>
                                                            {desc}
                                                        </div>
                                                    )}
                                                </div>
                                                {isSelected && (
                                                    <kbd className="shrink-0 rounded border border-[var(--color-bordure)] bg-[var(--color-surface)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-texte-muted)]">
                                                        ↵
                                                    </kbd>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between border-t border-[var(--color-bordure)] px-4 py-2">
                            <div className="flex items-center gap-3 text-xs text-[var(--color-texte-muted)]">
                                <div className="flex items-center gap-1.5">
                                    <kbd className="rounded border border-[var(--color-bordure)] bg-[var(--color-surface)] px-1.5 py-0.5 text-[10px] font-medium">↑↓</kbd>
                                    <span>{t('admin:commandPalette.naviguer', 'Naviguer')}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <kbd className="rounded border border-[var(--color-bordure)] bg-[var(--color-surface)] px-1.5 py-0.5 text-[10px] font-medium">↵</kbd>
                                    <span>{t('admin:commandPalette.selectionner', 'Ouvrir')}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <kbd className="rounded border border-[var(--color-bordure)] bg-[var(--color-surface)] px-1.5 py-0.5 text-[10px] font-medium">Esc</kbd>
                                    <span>{t('admin:commandPalette.fermer', 'Fermer')}</span>
                                </div>
                            </div>
                            <div className="text-[10px] text-[var(--color-texte-muted)]/50">
                                {isPlatformContext ? 'Control Plane' : 'Data Plane'}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default CommandPalette;
