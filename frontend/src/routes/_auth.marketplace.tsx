/**
 * ==================================
 * eLISAschool - Marketplace (Page Unique Gestion Modules)
 * ==================================
 * Refonte SaaS v9 — Consolidation & Déduplication
 *
 * Point d'entrée UNIQUE côté tenant pour la gestion des modules.
 * 3 onglets :
 *   - Catalogue : Découvrir/souscrire des add-ons (App Store)
 *   - Mes Modules : Toggles ON/OFF + statut abonnement
 *   - Analytics : Résumé rapide d'utilisation
 *
 * Dark mode, responsive, animations Framer Motion.
 */

import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Package,
    Shield,
    Star,
    Puzzle,
    CheckCircle,
    ArrowUpCircle,
    Loader2,
    Sparkles,
    X,
    ShoppingCart,
    Clock,
    LayoutGrid,
    ToggleLeft,
    BarChart3,
    Calendar,
    Filter,
} from 'lucide-react';
import { ModuleToggleCard } from '@/features/modules/components/module-toggle-card';
import { cn } from '@/lib/cn';

export const Route = createFileRoute('/_auth/marketplace')({
    component: MarketplacePage,
});

// =============================================
// TYPES
// =============================================

type TabId = 'catalogue' | 'mes-modules' | 'analytics';

interface AddonItem {
    id: string;
    code: string;
    nom: string;
    description?: string;
    icone?: string;
    categorie: string;
    accessible: boolean;
    estSouscriptible: boolean;
    aPrix: boolean;
    planMinimal?: string;
}

interface AddonDetail {
    id: string;
    code: string;
    nom: string;
    nomEn?: string;
    description?: string;
    descriptionEn?: string;
    icone?: string;
    categorie: string;
    prixMensuel: number;
    prixAnnuel: number;
    estFacturable: boolean;
    dependencies: string[];
    accessible: boolean;
    entitlementMessage?: string;
    config: Record<string, unknown>;
}

interface ResolvedModule {
    code: string;
    nom: string;
    icone?: string;
    categorie: string;
    actif: boolean;
    source: string;
    description?: string;
    prixMensuel?: number;
    entitlement?: {
        accessible: boolean;
        visible: boolean;
        raison: string;
        message?: string;
        source: string;
        lectureSeule?: boolean;
    };
}

interface AbonnementStatut {
    actif: boolean;
    statut: string;
    planSlug?: string;
    planNom?: string;
}

// =============================================
// COMPONENT
// =============================================

function MarketplacePage() {
    const [activeTab, setActiveTab] = useState<TabId>('catalogue');

    const tabs: { id: TabId; label: string; icon: typeof LayoutGrid }[] = [
        { id: 'catalogue', label: 'Catalogue', icon: LayoutGrid },
        { id: 'mes-modules', label: 'Mes Modules', icon: ToggleLeft },
        { id: 'analytics', label: 'Aperçu', icon: BarChart3 },
    ];

    return (
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 text-center"
            >
                <div className="mb-3 flex items-center justify-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-dominant-600)] to-[var(--color-secondary-600)]">
                        <Sparkles size={24} className="text-white" />
                    </div>
                </div>
                <h1 className="text-2xl font-bold text-[var(--color-text-primary)] sm:text-3xl">
                    Modules
                </h1>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                    Gérez les modules de votre établissement
                </p>
            </motion.div>

            {/* Onglets */}
            <div className="mb-6 flex justify-center">
                <div className="inline-flex items-center gap-1 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-1">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                                    activeTab === tab.id
                                        ? 'bg-[var(--color-dominant-600)] text-white shadow-sm'
                                        : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]',
                                )}
                            >
                                <Icon size={16} />
                                <span className="hidden sm:inline">{tab.label}</span>
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
                    transition={{ duration: 0.15 }}
                >
                    {activeTab === 'catalogue' && <CatalogueTab />}
                    {activeTab === 'mes-modules' && <MesModulesTab />}
                    {activeTab === 'analytics' && <AnalyticsTab />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

// =============================================
// ONGLET CATALOGUE (Add-ons)
// =============================================

function CatalogueTab() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [selectedAddon, setSelectedAddon] = useState<string | null>(null);
    const [categorieFilter, setCategorieFilter] = useState<string>('ALL');

    const { data: addons, isLoading } = useQuery({
        queryKey: ['marketplace-addons'],
        queryFn: async () => {
            const res = await apiClient.get<AddonItem[]>('/api/billing/marketplace');
            return res.data ?? [];
        },
        staleTime: 60_000,
    });

    const { data: detail } = useQuery({
        queryKey: ['marketplace-addon-detail', selectedAddon],
        queryFn: async () => {
            if (!selectedAddon) return null;
            const res = await apiClient.get<AddonDetail>(`/api/billing/marketplace/${selectedAddon}`);
            return res.data;
        },
        enabled: !!selectedAddon,
    });

    const essaiMutation = useMutation({
        mutationFn: (code: string) => apiClient.post<{ message: string }>(`/api/billing/marketplace/${code}/essayer`),
        onSuccess: (res) => {
            toast.success(res.data?.message || 'Succès');
            queryClient.invalidateQueries({ queryKey: ['marketplace-addons'] });
            queryClient.invalidateQueries({ queryKey: ['marketplace-mes-modules'] });
            setSelectedAddon(null);
        },
        onError: (err: any) => toast.error(err?.message || 'Erreur'),
    });

    const souscrireMutation = useMutation({
        mutationFn: (code: string) => apiClient.post<{ message: string }>(`/api/billing/marketplace/${code}/souscrire`),
        onSuccess: (res) => {
            toast.success(res.data?.message || 'Succès');
            queryClient.invalidateQueries({ queryKey: ['marketplace-addons'] });
            queryClient.invalidateQueries({ queryKey: ['marketplace-mes-modules'] });
            setSelectedAddon(null);
        },
        onError: (err: any) => toast.error(err?.message || 'Erreur'),
    });

    const filtered = useMemo(() => {
        if (!addons) return [];
        let result = addons;
        if (categorieFilter !== 'ALL') {
            result = result.filter(a => a.categorie === categorieFilter);
        }
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(a =>
                a.nom.toLowerCase().includes(q) ||
                a.code.toLowerCase().includes(q) ||
                (a.description || '').toLowerCase().includes(q)
            );
        }
        return result;
    }, [addons, search, categorieFilter]);

    const actifs = filtered.filter(a => a.accessible);
    const disponibles = filtered.filter(a => !a.accessible && a.estSouscriptible);

    const categorieIcon = (cat: string) => {
        switch (cat) {
            case 'BASE': return Shield;
            case 'PREMIUM': return Star;
            default: return Puzzle;
        }
    };

    return (
        <div>
            {/* Barre de recherche + filtres */}
            <div className="mb-6 flex flex-col sm:flex-row items-center gap-3 justify-center">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Rechercher un module..."
                        className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-2.5 pl-10 pr-4 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-dominant-500)] focus:outline-none focus:ring-1 focus:ring-[var(--color-dominant-500)]"
                    />
                </div>
                <div className="flex items-center gap-1 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] p-1">
                    {(['ALL', 'BASE', 'PREMIUM', 'ADDON'] as const).map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setCategorieFilter(cat)}
                            className={cn(
                                'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                                categorieFilter === cat
                                    ? 'bg-[var(--color-dominant-600)] text-white'
                                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]',
                            )}
                        >
                            {cat === 'ALL' ? 'Tous' : cat === 'BASE' ? 'Base' : cat === 'PREMIUM' ? 'Premium' : 'Add-ons'}
                        </button>
                    ))}
                </div>
            </div>

            {isLoading ? (
                <div className="flex h-48 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-[var(--color-dominant-600)]" />
                </div>
            ) : (
                <>
                    {/* Modules actifs */}
                    {actifs.length > 0 && (
                        <section className="mb-8">
                            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--color-text-primary)]">
                                <CheckCircle size={18} className="text-emerald-500" />
                                Modules actifs
                            </h2>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {actifs.map((addon) => {
                                    const Icon = categorieIcon(addon.categorie);
                                    return (
                                        <motion.div
                                            key={addon.code}
                                            layout
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="group relative rounded-xl border border-emerald-500/20 bg-[var(--color-surface)] p-4 transition-all hover:border-emerald-500/40 hover:shadow-lg"
                                        >
                                            <div className="mb-3 flex items-start justify-between">
                                                <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', 'bg-emerald-500/10')}>
                                                    <Icon size={20} className="text-emerald-600 dark:text-emerald-400" />
                                                </div>
                                                <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                                    <CheckCircle size={10} />
                                                    Actif
                                                </span>
                                            </div>
                                            <h3 className="font-semibold text-[var(--color-text-primary)]">{addon.nom}</h3>
                                            <p className="mt-1 line-clamp-2 text-xs text-[var(--color-text-secondary)]">
                                                {addon.description || 'Module complémentaire'}
                                            </p>
                                            <button
                                                onClick={() => setSelectedAddon(addon.code)}
                                                className="mt-3 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                                            >
                                                Détails →
                                            </button>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* Modules disponibles */}
                    {disponibles.length > 0 && (
                        <section>
                            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--color-text-primary)]">
                                <ArrowUpCircle size={18} className="text-[var(--color-secondary-600)]" />
                                Modules disponibles
                            </h2>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {disponibles.map((addon) => {
                                    const Icon = categorieIcon(addon.categorie);
                                    return (
                                        <motion.div
                                            key={addon.code}
                                            layout
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="group relative cursor-pointer rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-all hover:border-[var(--color-secondary-500)]/40 hover:shadow-lg"
                                            onClick={() => setSelectedAddon(addon.code)}
                                        >
                                            <div className="mb-3 flex items-start justify-between">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-secondary-600)]/10">
                                                    <Icon size={20} className="text-[var(--color-secondary-600)]" />
                                                </div>
                                                {addon.aPrix && (
                                                    <span className="flex items-center gap-1 rounded-full bg-[var(--color-secondary-600)]/10 px-2 py-0.5 text-xs font-medium text-[var(--color-secondary-600)]">
                                                        <ShoppingCart size={10} />
                                                        Premium
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="font-semibold text-[var(--color-text-primary)]">{addon.nom}</h3>
                                            <p className="mt-1 line-clamp-2 text-xs text-[var(--color-text-secondary)]">
                                                {addon.description || 'Module complémentaire'}
                                            </p>
                                            <button
                                                className="mt-3 w-full rounded-lg bg-[var(--color-secondary-600)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--color-secondary-700)]"
                                                onClick={(e) => { e.stopPropagation(); setSelectedAddon(addon.code); }}
                                            >
                                                Découvrir
                                            </button>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {filtered.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <Package className="mb-4 h-12 w-12 text-[var(--color-text-muted)]" />
                            <p className="text-sm text-[var(--color-text-secondary)]">
                                Aucun module ne correspond à votre recherche
                            </p>
                        </div>
                    )}
                </>
            )}

            {/* Modal détail */}
            <AnimatePresence>
                {selectedAddon && detail && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                        onClick={() => setSelectedAddon(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="w-full max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="mb-4 flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-secondary-600)]/10">
                                        {(() => { const Icon = categorieIcon(detail.categorie); return <Icon size={24} className="text-[var(--color-secondary-600)]" />; })()}
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">{detail.nom}</h2>
                                        <span className="text-xs text-[var(--color-text-muted)]">{detail.code}</span>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedAddon(null)} className="rounded-lg p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text-primary)]">
                                    <X size={18} />
                                </button>
                            </div>

                            <p className="mb-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                                {detail.description || 'Pas de description disponible.'}
                            </p>

                            {detail.estFacturable && (
                                <div className="mb-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-[var(--color-text-muted)]">Mensuel</span>
                                        <span className="font-semibold">{detail.prixMensuel > 0 ? `${detail.prixMensuel.toLocaleString('fr-FR')} XAF` : 'Gratuit'}</span>
                                    </div>
                                    <div className="mt-1 flex items-center justify-between text-sm">
                                        <span className="text-[var(--color-text-muted)]">Annuel</span>
                                        <span className="font-semibold">{detail.prixAnnuel > 0 ? `${detail.prixAnnuel.toLocaleString('fr-FR')} XAF` : 'Gratuit'}</span>
                                    </div>
                                </div>
                            )}

                            {detail.dependencies.length > 0 && (
                                <div className="mb-4">
                                    <p className="mb-1 text-xs font-medium text-[var(--color-text-muted)]">Dépendances :</p>
                                    <div className="flex flex-wrap gap-1">
                                        {detail.dependencies.map((dep) => (
                                            <span key={dep} className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">{dep}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {detail.entitlementMessage && (
                                <p className="mb-4 text-xs text-[var(--color-text-muted)] italic">{detail.entitlementMessage}</p>
                            )}

                            <div className="flex gap-3">
                                {!detail.accessible && (
                                    <button
                                        onClick={() => essaiMutation.mutate(detail.code)}
                                        disabled={essaiMutation.isPending}
                                        className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[var(--color-secondary-500)] px-4 py-2.5 text-sm font-medium text-[var(--color-secondary-600)] transition-colors hover:bg-[var(--color-secondary-600)]/10 disabled:opacity-50"
                                    >
                                        {essaiMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Clock size={16} />}
                                        Essayer 7 jours
                                    </button>
                                )}
                                {!detail.accessible && detail.estFacturable && (
                                    <button
                                        onClick={() => souscrireMutation.mutate(detail.code)}
                                        disabled={souscrireMutation.isPending}
                                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--color-secondary-600)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-secondary-700)] disabled:opacity-50"
                                    >
                                        {souscrireMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <ShoppingCart size={16} />}
                                        Souscrire
                                    </button>
                                )}
                                {detail.accessible && (
                                    <div className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                        <CheckCircle size={16} />
                                        Module actif
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// =============================================
// ONGLET MES MODULES (Toggles ON/OFF)
// =============================================

function MesModulesTab() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [categorieFilter, setCategorieFilter] = useState<string>('ALL');
    const [configModule, setConfigModule] = useState<string | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ['marketplace-mes-modules'],
        queryFn: async () => {
            const res = await apiClient.get<{ modules: ResolvedModule[]; abonnement: AbonnementStatut }>('/api/billing/marketplace/mes-modules');
            return res.data;
        },
        staleTime: 30_000,
    });

    const modules = data?.modules ?? [];
    const abonnement = data?.abonnement;

    const filtered = useMemo(() => {
        let result = modules;
        if (categorieFilter !== 'ALL') {
            result = result.filter(m => m.categorie === categorieFilter);
        }
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(m =>
                m.nom.toLowerCase().includes(q) ||
                m.code.toLowerCase().includes(q)
            );
        }
        return result;
    }, [modules, search, categorieFilter]);

    const actifs = filtered.filter(m => m.actif);
    const inactifs = filtered.filter(m => !m.actif);
    const totalActifs = modules.filter(m => m.actif).length;

    // Modules de base non désactivables
    const isDesactivable = (m: ResolvedModule) => {
        return m.categorie !== 'BASE' && m.source !== 'base';
    };

    return (
        <div>
            {/* Info abonnement */}
            {abonnement && (
                <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                >
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-dominant-100)]">
                            <Shield size={20} className="text-[var(--color-dominant-700)]" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                                {abonnement.planNom || abonnement.planSlug || 'Aucun plan'}
                            </p>
                            <p className="text-xs text-[var(--color-text-muted)]">
                                {abonnement.actif ? 'Abonnement actif' : `Statut: ${abonnement.statut}`}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            {totalActifs}/{modules.length} modules actifs
                        </span>
                    </div>
                </motion.div>
            )}

            {/* Recherche + filtres */}
            <div className="mb-4 flex flex-col sm:flex-row items-center gap-3">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Rechercher..."
                        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pl-9 pr-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-dominant-500)] focus:outline-none"
                    />
                </div>
                <div className="flex items-center gap-1 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] p-1">
                    {(['ALL', 'BASE', 'PREMIUM', 'ADDON'] as const).map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setCategorieFilter(cat)}
                            className={cn(
                                'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                                categorieFilter === cat
                                    ? 'bg-[var(--color-dominant-600)] text-white'
                                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]',
                            )}
                        >
                            {cat === 'ALL' ? 'Tous' : cat === 'BASE' ? 'Base' : cat === 'PREMIUM' ? 'Premium' : 'Add-ons'}
                        </button>
                    ))}
                </div>
            </div>

            {isLoading ? (
                <div className="flex h-48 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-[var(--color-dominant-600)]" />
                </div>
            ) : (
                <>
                    {/* Modules actifs */}
                    {actifs.length > 0 && (
                        <section className="mb-6">
                            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
                                <CheckCircle size={14} className="text-emerald-500" />
                                Actifs ({actifs.length})
                            </h3>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {actifs.map((module) => (
                                    <ModuleToggleCard
                                        key={module.code}
                                        code={module.code}
                                        nom={module.nom}
                                        icone={module.icone}
                                        categorie={module.categorie}
                                        source={module.source}
                                        actif={module.actif}
                                        desactivable={isDesactivable(module)}
                                        onConfigure={(code) => setConfigModule(code)}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Modules inactifs */}
                    {inactifs.length > 0 && (
                        <section>
                            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--color-text-muted)]">
                                <Filter size={14} />
                                Inactifs ({inactifs.length})
                            </h3>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {inactifs.map((module) => (
                                    <ModuleToggleCard
                                        key={module.code}
                                        code={module.code}
                                        nom={module.nom}
                                        icone={module.icone}
                                        categorie={module.categorie}
                                        source={module.source}
                                        actif={module.actif}
                                        desactivable={false}
                                        raisonBlocage={module.entitlement?.message}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {filtered.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <Package className="mb-4 h-12 w-12 text-[var(--color-text-muted)]" />
                            <p className="text-sm text-[var(--color-text-secondary)]">
                                Aucun module trouvé
                            </p>
                        </div>
                    )}
                </>
            )}

            {/* Modal configuration rapide */}
            <AnimatePresence>
                {configModule && (
                    <ModuleConfigModal
                        code={configModule}
                        module={modules.find(m => m.code === configModule)}
                        onClose={() => setConfigModule(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// =============================================
// MODAL CONFIGURATION RAPIDE
// =============================================

function ModuleConfigModal({ code, module, onClose }: {
    code: string;
    module?: ResolvedModule;
    onClose: () => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-4 flex items-start justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
                            {module?.nom || code}
                        </h2>
                        <p className="text-xs text-[var(--color-text-muted)]">
                            Configuration du module
                        </p>
                    </div>
                    <button onClick={onClose} className="rounded-lg p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-bg)]">
                        <X size={18} />
                    </button>
                </div>

                {module?.description && (
                    <p className="mb-4 text-sm text-[var(--color-text-secondary)]">{module.description}</p>
                )}

                <div className="mb-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-[var(--color-text-muted)]">Code</span>
                        <span className="font-mono text-xs">{code}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-[var(--color-text-muted)]">Catégorie</span>
                        <span>{module?.categorie || '—'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-[var(--color-text-muted)]">Source</span>
                        <span>{module?.source || '—'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-[var(--color-text-muted)]">État</span>
                        <span className={module?.actif ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}>
                            {module?.actif ? 'Actif' : 'Inactif'}
                        </span>
                    </div>
                </div>

                <p className="text-xs text-[var(--color-text-muted)]">
                    Pour une configuration avancée, rendez-vous dans{' '}
                    <a href="/configuration" className="text-[var(--color-dominant-600)] hover:underline">
                        Paramètres → Configuration
                    </a>
                </p>

                <button
                    onClick={onClose}
                    className="mt-4 w-full rounded-lg bg-[var(--color-dominant-600)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-dominant-700)]"
                >
                    Fermer
                </button>
            </motion.div>
        </motion.div>
    );
}

// =============================================
// ONGLET ANALYTICS (Aperçu rapide)
// =============================================

function AnalyticsTab() {
    const { data, isLoading } = useQuery({
        queryKey: ['marketplace-mes-modules'],
        queryFn: async () => {
            const res = await apiClient.get<{ modules: ResolvedModule[]; abonnement: AbonnementStatut }>('/api/billing/marketplace/mes-modules');
            return res.data;
        },
        staleTime: 30_000,
    });

    const modules = data?.modules ?? [];
    const abonnement = data?.abonnement;

    const parCategorie = useMemo(() => {
        const counts: Record<string, { total: number; actifs: number }> = {};
        for (const m of modules) {
            if (!counts[m.categorie]) counts[m.categorie] = { total: 0, actifs: 0 };
            counts[m.categorie].total++;
            if (m.actif) counts[m.categorie].actifs++;
        }
        return counts;
    }, [modules]);

    const parSource = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const m of modules) {
            if (m.actif) {
                const src = m.source || 'autre';
                counts[src] = (counts[src] || 0) + 1;
            }
        }
        return Object.entries(counts).sort((a, b) => b[1] - a[1]);
    }, [modules]);

    if (isLoading) {
        return (
            <div className="flex h-48 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--color-dominant-600)]" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Résumé abonnement */}
            {abonnement && (
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Abonnement</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                            <p className="text-xs text-[var(--color-text-muted)]">Plan</p>
                            <p className="text-lg font-bold text-[var(--color-text-primary)]">{abonnement.planNom || '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-[var(--color-text-muted)]">Statut</p>
                            <p className={cn('text-lg font-bold', abonnement.actif ? 'text-emerald-500' : 'text-red-500')}>
                                {abonnement.actif ? 'Actif' : abonnement.statut}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-[var(--color-text-muted)]">Modules actifs</p>
                            <p className="text-lg font-bold text-[var(--color-text-primary)]">
                                {modules.filter(m => m.actif).length}/{modules.length}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-[var(--color-text-muted)]">Couverture</p>
                            <p className="text-lg font-bold text-[var(--color-dominant-600)]">
                                {modules.length > 0 ? Math.round((modules.filter(m => m.actif).length / modules.length) * 100) : 0}%
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Par catégorie */}
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Par catégorie</h3>
                <div className="space-y-2">
                    {Object.entries(parCategorie).map(([cat, data]) => (
                        <div key={cat} className="flex items-center justify-between">
                            <span className="text-sm text-[var(--color-text-primary)]">{cat}</span>
                            <div className="flex items-center gap-3">
                                <div className="h-2 w-24 rounded-full bg-[var(--color-surface-hover)] overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-emerald-500 transition-all"
                                        style={{ width: `${data.total > 0 ? (data.actifs / data.total) * 100 : 0}%` }}
                                    />
                                </div>
                                <span className="text-xs text-[var(--color-text-muted)] w-12 text-right">
                                    {data.actifs}/{data.total}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Par source */}
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Par source d'activation</h3>
                <div className="flex flex-wrap gap-2">
                    {parSource.map(([source, count]) => (
                        <span
                            key={source}
                            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-surface-hover)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-primary)]"
                        >
                            {source}
                            <span className="rounded-full bg-[var(--color-dominant-100)] px-1.5 py-0.5 text-[10px] text-[var(--color-dominant-700)]">
                                {count}
                            </span>
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default MarketplacePage;
