/**
 * ==================================
 * eLISAschool - Command Palette (Cmd+K)
 * ==================================
 * Navigation rapide vers toutes les routes + actions rapides.
 * Recherche fuzzy, raccourcis clavier.
 * 
 * Phase 6.6 — Refonte SaaS
 * Phase E.2 — Refonte SaaS v2 (enrichi: modules, notifications, permissions)
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/auth.store';
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
} from 'lucide-react';

interface CommandItem {
    id: string;
    label: string;
    description?: string;
    path: string;
    icon: typeof LayoutDashboard;
    category: string;
    keywords: string[];
    requireSuperAdmin?: boolean;
}

const ALL_COMMANDS: CommandItem[] = [
    // Platform — v5.2: préfixe /platform/* corrigé
    { id: 'p-dashboard', label: 'Dashboard Plateforme', description: 'KPIs globaux', path: '/platform/dashboard', icon: LayoutDashboard, category: 'Plateforme', keywords: ['dashboard', 'kpi', 'stats'], requireSuperAdmin: true },
    { id: 'p-etablissements', label: 'Établissements', description: 'Gestion CRUD', path: '/platform/etablissements', icon: Building2, category: 'Plateforme', keywords: ['etablissements', 'ecoles', 'clients'], requireSuperAdmin: true },
    { id: 'p-facturation', label: 'Facturation', description: 'Plans, abonnements, factures, revenus', path: '/platform/facturation', icon: CreditCard, category: 'Plateforme', keywords: ['facturation', 'billing', 'abonnement', 'plan', 'facture', 'revenus', 'mrr', 'arr'], requireSuperAdmin: true },
    { id: 'p-configuration', label: 'Configuration', description: 'Paramètres système', path: '/platform/configuration', icon: Settings, category: 'Plateforme', keywords: ['configuration', 'config', 'parametres'], requireSuperAdmin: true },
    { id: 'p-monitoring', label: 'Monitoring', description: 'Infrastructure', path: '/platform/monitoring', icon: Activity, category: 'Plateforme', keywords: ['monitoring', 'infrastructure', 'health'], requireSuperAdmin: true },
    { id: 'p-audit', label: 'Audit Global', description: 'Logs tous établissements', path: '/platform/audit', icon: ScrollText, category: 'Plateforme', keywords: ['audit', 'logs', 'historique'], requireSuperAdmin: true },
    { id: 'p-modules', label: 'Modules', description: 'Registre & activation modules', path: '/platform/modules', icon: Puzzle, category: 'Plateforme', keywords: ['modules', 'activation', 'registry', 'premium'], requireSuperAdmin: true },
    { id: 'p-approbations', label: 'Approbations', description: 'Actions critiques 2F', path: '/platform/approbations', icon: ShieldCheck, category: 'Plateforme', keywords: ['approbations', 'actions critiques', 'mfa'], requireSuperAdmin: true },
    { id: 'p-utilisateurs', label: 'Utilisateurs Plateforme', description: 'Comptes plateforme', path: '/platform/utilisateurs', icon: Users, category: 'Plateforme', keywords: ['utilisateurs', 'comptes', 'admin', 'platform users'], requireSuperAdmin: true },
    { id: 'p-groupes', label: 'Groupes', description: 'Groupes d\'établissements', path: '/platform/groupes', icon: Network, category: 'Plateforme', keywords: ['groupes', 'groupes etablissements', 'saas groups'], requireSuperAdmin: true },
    { id: 'p-permissions', label: 'Permissions', description: 'Matrice des permissions', path: '/platform/permissions', icon: KeyRound, category: 'Plateforme', keywords: ['permissions', 'rbac', 'roles', 'acces', 'matrice'], requireSuperAdmin: true },
    { id: 'p-notifications-config', label: 'Notifications Config', description: 'Configuration notifications', path: '/platform/notifications-config', icon: Bell, category: 'Plateforme', keywords: ['notifications', 'config', 'email', 'sms', 'push'], requireSuperAdmin: true },
    { id: 'p-providers', label: 'Providers', description: 'Providers de paiement', path: '/platform/providers', icon: Wallet, category: 'Plateforme', keywords: ['providers', 'paiement', 'payment', 'stripe', 'momo'], requireSuperAdmin: true },
    { id: 'p-parametres-cascade', label: 'Paramètres cascade', description: 'Cascade 4 niveaux', path: '/platform/parametres-cascade', icon: Layers, category: 'Plateforme', keywords: ['parametres', 'cascade', 'multi-niveaux', 'configuration', 'overrides'], requireSuperAdmin: true },

    // Etablissement
    { id: 'e-dashboard', label: 'Dashboard', description: 'Tableau de bord établissement', path: '/', icon: LayoutDashboard, category: 'Établissement', keywords: ['dashboard', 'accueil', 'tableau de bord'] },
    { id: 'e-eleves', label: 'Élèves', description: 'Gestion des élèves', path: '/eleves', icon: GraduationCap, category: 'Établissement', keywords: ['eleves', 'etudiants', 'inscriptions'] },
    { id: 'e-notes', label: 'Notes', description: 'Saisie et consultation', path: '/notes', icon: FileText, category: 'Établissement', keywords: ['notes', 'notes', 'evaluations'] },
    { id: 'e-emploi', label: 'Emploi du temps', description: 'Planification horaires', path: '/emploi-du-temps', icon: Calendar, category: 'Établissement', keywords: ['emploi', 'temps', 'horaires', 'planning'] },
    { id: 'e-finances', label: 'Finances', description: 'Frais de scolarité', path: '/finances', icon: CreditCard, category: 'Établissement', keywords: ['finances', 'paiement', 'frais', 'scolarite'] },
    { id: 'e-transport', label: 'Transport', description: 'Gestion transport', path: '/transport', icon: Bus, category: 'Établissement', keywords: ['transport', 'bus', 'trajets'] },
    { id: 'e-bibliotheque', label: 'Bibliothèque', description: 'Gestion ouvrages', path: '/bibliotheque', icon: Library, category: 'Établissement', keywords: ['bibliotheque', 'livres', 'emprunts'] },
    { id: 'e-personnel', label: 'Personnel', description: 'RH et personnel', path: '/personnel', icon: Users, category: 'Établissement', keywords: ['personnel', 'rh', 'employes'] },
    { id: 'e-paiements', label: 'Paiements', description: 'Configuration providers', path: '/paiements', icon: CreditCard, category: 'Établissement', keywords: ['paiements', 'providers', 'momo', 'stripe'] },
    { id: 'e-abonnement', label: 'Mon Abonnement', description: 'Abonnement plateforme', path: '/mon-abonnement', icon: CreditCard, category: 'Établissement', keywords: ['abonnement', 'subscription', 'plan', 'factures'] },
    { id: 'e-factures', label: 'Factures', description: 'Historique et paiement des factures', path: '/factures', icon: FileText, category: 'Établissement', keywords: ['factures', 'invoices', 'paiement', 'billing', 'avoir'] },
    { id: 'e-plans', label: "Plans d'abonnement", description: 'Catalogue, comparaison et simulateur', path: '/plans', icon: Layers, category: 'Établissement', keywords: ['plans', 'tarification', 'simulateur', 'pricing', 'comparaison', 'upgrade'] },
    { id: 'e-marketplace', label: 'Marché', description: 'Catalogue modules et activation', path: '/marketplace', icon: Store, category: 'Établissement', keywords: ['marketplace', 'marché', 'modules', 'catalogue', 'activation', 'addons'] },
    { id: 'e-notifications-config', label: 'Notifications', description: 'Configuration canaux', path: '/notifications-config', icon: Bell, category: 'Établissement', keywords: ['notifications', 'email', 'sms', 'push', 'canaux'] },
    { id: 'e-sondages', label: 'Sondages', description: 'Enquêtes et sondages', path: '/sondages', icon: BarChart3, category: 'Établissement', keywords: ['sondages', 'enquetes', 'questionnaires'] },
];

export function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();
    const utilisateur = useAuthStore((s) => s.utilisateur);
    const isSuperAdmin = utilisateur?.role === 'SUPER_ADMIN';

    // Filtrer les commandes accessibles
    const accessibleCommands = useMemo(() => {
        return ALL_COMMANDS.filter((cmd) => {
            if (cmd.requireSuperAdmin && !isSuperAdmin) return false;
            return true;
        });
    }, [isSuperAdmin]);

    // Recherche fuzzy
    const filteredCommands = useMemo(() => {
        if (!query.trim()) return accessibleCommands;

        const q = query.toLowerCase();
        return accessibleCommands.filter((cmd) => {
            return (
                cmd.label.toLowerCase().includes(q) ||
                cmd.description?.toLowerCase().includes(q) ||
                cmd.category.toLowerCase().includes(q) ||
                cmd.keywords.some((kw) => kw.includes(q))
            );
        });
    }, [query, accessibleCommands]);

    // Grouper par catégorie
    const groupedCommands = useMemo(() => {
        const groups: Record<string, CommandItem[]> = {};
        for (const cmd of filteredCommands) {
            if (!groups[cmd.category]) groups[cmd.category] = [];
            groups[cmd.category].push(cmd);
        }
        return groups;
    }, [filteredCommands]);

    // Raccourci Cmd+K / Ctrl+K
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen((prev) => !prev);
                setQuery('');
                setSelectedIndex(0);
            }
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen]);

    // Focus input
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    // Navigation
    const handleSelect = useCallback((cmd: CommandItem) => {
        setIsOpen(false);
        setQuery('');
        navigate({ to: cmd.path });
    }, [navigate]);

    // Clavier navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredCommands[selectedIndex]) {
                handleSelect(filteredCommands[selectedIndex]);
            }
        }
    }, [filteredCommands, selectedIndex, handleSelect]);

    if (!isOpen) return null;

    let flatIndex = -1;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={() => setIsOpen(false)}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" />

            {/* Modal */}
            <div
                className="relative w-full max-w-lg bg-background border rounded-xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Search input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b">
                    <Search className="w-5 h-5 text-muted-foreground shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
                        onKeyDown={handleKeyDown}
                        placeholder="Rechercher une page, une action..."
                        className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
                    />
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-1 hover:bg-muted rounded"
                    >
                        <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                </div>

                {/* Results */}
                <div className="max-h-[50vh] overflow-y-auto p-2">
                    {Object.keys(groupedCommands).length === 0 && (
                        <div className="py-8 text-center text-muted-foreground text-sm">
                            Aucun résultat pour "{query}"
                        </div>
                    )}

                    {Object.entries(groupedCommands).map(([category, items]) => (
                        <div key={category} className="mb-2">
                            <div className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                {category}
                            </div>
                            {items.map((cmd) => {
                                flatIndex++;
                                const idx = flatIndex;
                                const Icon = cmd.icon;
                                const isSelected = idx === selectedIndex;

                                return (
                                    <button
                                        key={cmd.id}
                                        onClick={() => handleSelect(cmd)}
                                        onMouseEnter={() => setSelectedIndex(idx)}
                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                                            isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'
                                        }`}
                                    >
                                        <Icon className="w-4 h-4 shrink-0 opacity-60" />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium truncate">{cmd.label}</div>
                                            {cmd.description && (
                                                <div className="text-xs text-muted-foreground truncate">{cmd.description}</div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-2 border-t text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">↑↓</kbd>
                        <span>Naviguer</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">↵</kbd>
                        <span>Sélectionner</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Esc</kbd>
                        <span>Fermer</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CommandPalette;
