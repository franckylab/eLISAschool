/**
 * ==================================
 * eLISAschool - Marketplace (Page Unique — Refonte v3)
 * ==================================
 * Refonte v3 (migration 213) — marché unifié modules + fonctionnalités.
 *
 * Point d'entrée UNIQUE côté tenant pour la gestion du marché :
 * 4 onglets :
 *   - Inclus    : modules inclus par le plan (toggles ON/OFF) + fonctionnalités du plan
 *   - Gratuits  : modules & fonctionnalités gratuits (toujours accessibles)
 *   - Payants   : modules & fonctionnalités payants (inclus / à débloquer)
 *   - Usage     : consommation des quotas + achat de packs supplémentaires
 *
 * Classification binaire GRATUIT | PAYANT (fin BASE/PREMIUM/ADDON).
 * Dark mode, responsive, animations Framer Motion.
 *
 * Version: 3.0.0
 * Auteur: franck arlos chendjou
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
    Loader2,
    Sparkles,
    X,
    ShoppingCart,
    LayoutGrid,
    Gauge,
    Lock,
    Zap,
} from 'lucide-react';
import { ModuleToggleCard } from '@/features/modules/components/module-toggle-card';
import { cn } from '@/lib/cn';

export const Route = createFileRoute('/_auth/marketplace')({
    component: MarketplacePage,
});

// =============================================
// TYPES
// =============================================

type TabId = 'inclus' | 'gratuits' | 'payants' | 'usage';

interface ResolvedModule {
    id: string;
    code: string;
    nom: string;
    nomEn?: string;
    description?: string;
    categorie: string;
    estCritique?: boolean;
    icone?: string;
    prixMensuel?: number;
    prixAnnuel?: number;
    estFacturable?: boolean;
    estSouscriptible?: boolean;
    planMinimal?: string;
    inclusParPlan: boolean;
    actif: boolean;
    source: string;
    entitlement?: {
        accessible: boolean;
        visible?: boolean;
        raison: string;
        message?: string;
        source: string;
        lectureSeule?: boolean;
    };
}

interface FonctionnaliteItem {
    cle: string;
    nom: string;
    description?: string;
    categorie: string;
    categorieCommerciale: 'GRATUIT' | 'PAYANT';
    incluseParPlan: boolean;
}

interface AbonnementStatut {
    actif: boolean;
    statut: string;
    planSlug?: string;
    planNom?: string;
    phaseExpiration?: string;
}

interface EtatQuota {
    ressource: string;
    utilisation: number;
    limite: number;
    quotaPlan: number;
    quotaPacks: number;
    pourcentage: number;
}

interface PackItem {
    id: string;
    code: string;
    nom: string;
    ressource: string;
    quantite: number;
    prix: number;
    devise: string;
    dureeValidite: 'CYCLE_COURANT' | 'ILLIMITE';
    description?: string;
    ordre: number;
}

/** Enveloppe standard des réponses API ({ success, data }) */
interface ApiEnvelope<T> {
    success: boolean;
    data: T;
    message?: string;
}

// =============================================
// HOOKS
// =============================================

function useMarketplace() {
    return useQuery<{
        modules: ResolvedModule[];
        fonctionnalites: FonctionnaliteItem[];
        abonnement: AbonnementStatut;
    }>({
        queryKey: ['marketplace-v3'],
        queryFn: async () => {
            const res = await apiClient.get<{
                modules: ResolvedModule[];
                fonctionnalites: FonctionnaliteItem[];
                abonnement: AbonnementStatut;
            }>('/api/billing/marketplace');
            const payload = res.data as any;
            return (payload?.modules ? payload : payload?.data) ?? { modules: [], fonctionnalites: [], abonnement: undefined as unknown as AbonnementStatut };
        },
        staleTime: 30_000,
    });
}

const RESSOURCE_LABELS: Record<string, string> = {
    eleves: 'Élèves',
    utilisateurs: 'Utilisateurs',
    classes: 'Classes',
    stockageGo: 'Stockage (Go)',
    sms: 'SMS',
};

const ressourceLabel = (r: string) => RESSOURCE_LABELS[r] || r;

// =============================================
// COMPONENT
// =============================================

function MarketplacePage() {
    const [activeTab, setActiveTab] = useState<TabId>('inclus');

    const tabs: { id: TabId; label: string; icon: typeof LayoutGrid }[] = [
        { id: 'inclus', label: 'Inclus', icon: CheckCircle },
        { id: 'gratuits', label: 'Gratuits', icon: Shield },
        { id: 'payants', label: 'Payants', icon: Star },
        { id: 'usage', label: 'Usage', icon: Gauge },
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
                    Marché des modules
                </h1>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                    Modules, fonctionnalités et quotas de votre établissement
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
                    {activeTab === 'inclus' && <InclusTab />}
                    {activeTab === 'gratuits' && <GratuitsTab />}
                    {activeTab === 'payants' && <PayantsTab />}
                    {activeTab === 'usage' && <UsageTab />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

// =============================================
// BANNIÈRE ABONNEMENT (partagée)
// =============================================

function AbonnementBanner({ abonnement, nbActifs, nbTotal }: {
    abonnement?: AbonnementStatut;
    nbActifs?: number;
    nbTotal?: number;
}) {
    if (!abonnement) return null;
    return (
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
                        {abonnement.actif ? 'Abonnement actif' : `Statut : ${abonnement.statut}`}
                        {abonnement.phaseExpiration ? ` — phase : ${abonnement.phaseExpiration}` : ''}
                    </p>
                </div>
            </div>
            {nbTotal !== undefined && (
                <span className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    {nbActifs}/{nbTotal} modules actifs
                </span>
            )}
        </motion.div>
    );
}

// =============================================
// ONGLET INCLUS (modules du plan + fonctionnalités du plan)
// =============================================

function InclusTab() {
    const [search, setSearch] = useState('');
    const [configModule, setConfigModule] = useState<string | null>(null);
    const { data, isLoading } = useMarketplace();

    const modules = data?.modules ?? [];
    const fonctionnalites = data?.fonctionnalites ?? [];
    const abonnement = data?.abonnement;

    const inclus = useMemo(() => {
        let result = modules.filter(m => m.actif);
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(m =>
                m.nom.toLowerCase().includes(q) || m.code.toLowerCase().includes(q)
            );
        }
        return result;
    }, [modules, search]);

    const fonctionnalitesIncluses = fonctionnalites.filter(f => f.incluseParPlan);

    if (isLoading) {
        return (
            <div className="flex h-48 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--color-dominant-600)]" />
            </div>
        );
    }

    return (
        <div>
            <AbonnementBanner
                abonnement={abonnement}
                nbActifs={modules.filter(m => m.actif).length}
                nbTotal={modules.length}
            />

            {/* Recherche */}
            <div className="mb-4 flex justify-center">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Rechercher un module inclus..."
                        className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-2.5 pl-10 pr-4 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-dominant-500)] focus:outline-none focus:ring-1 focus:ring-[var(--color-dominant-500)]"
                    />
                </div>
            </div>

            {/* Fonctionnalités incluses par le plan */}
            <section className="mb-8">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--color-text-primary)]">
                    <Zap size={18} className="text-[var(--color-dominant-600)]" />
                    Fonctionnalités incluses ({fonctionnalitesIncluses.length})
                </h2>
                {fonctionnalitesIncluses.length === 0 ? (
                    <p className="text-sm text-[var(--color-text-muted)]">
                        Aucune fonctionnalité supplémentaire incluse par votre plan.
                    </p>
                ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {fonctionnalitesIncluses.map((f) => (
                            <div
                                key={f.cle}
                                className="flex items-start gap-3 rounded-xl border border-[var(--color-dominant-500)]/20 bg-[var(--color-surface)] p-4"
                            >
                                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--color-dominant-600)]/10">
                                    <Zap size={16} className="text-[var(--color-dominant-600)]" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">{f.nom}</p>
                                    {f.description && (
                                        <p className="mt-0.5 line-clamp-2 text-xs text-[var(--color-text-secondary)]">{f.description}</p>
                                    )}
                                </div>
                                <CheckCircle size={16} className="ml-auto flex-shrink-0 text-emerald-500" />
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Modules actifs (toggles) */}
            <section>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--color-text-primary)]">
                    <CheckCircle size={18} className="text-emerald-500" />
                    Modules actifs ({inclus.length})
                </h2>
                {inclus.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <Package className="mb-4 h-12 w-12 text-[var(--color-text-muted)]" />
                        <p className="text-sm text-[var(--color-text-secondary)]">Aucun module actif</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {inclus.map((module) => (
                            <ModuleToggleCard
                                key={module.code}
                                code={module.code}
                                nom={module.nom}
                                icone={module.icone}
                                categorie={module.categorie}
                                source={module.source}
                                actif={module.actif}
                                estCritique={module.estCritique}
                                inclusParPlan={module.inclusParPlan}
                                desactivable={!module.estCritique}
                                onConfigure={(code) => setConfigModule(code)}
                            />
                        ))}
                    </div>
                )}
            </section>

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
// ONGLET GRATUITS (modules + fonctionnalités GRATUIT)
// =============================================

function GratuitsTab() {
    const { data, isLoading } = useMarketplace();
    const modules = data?.modules ?? [];
    const fonctionnalites = data?.fonctionnalites ?? [];

    const gratuits = modules.filter(m => m.categorie === 'GRATUIT');
    const foncGratuites = fonctionnalites.filter(f => f.categorieCommerciale === 'GRATUIT');

    if (isLoading) {
        return (
            <div className="flex h-48 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--color-dominant-600)]" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <p className="text-center text-sm text-[var(--color-text-secondary)]">
                Le socle gratuit d'eLISAschool — accessible quel que soit votre plan.
            </p>

            {/* Modules gratuits */}
            <section>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--color-text-primary)]">
                    <Shield size={18} className="text-emerald-500" />
                    Modules gratuits ({gratuits.length})
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {gratuits.map((m) => (
                        <div
                            key={m.code}
                            className="rounded-xl border border-emerald-500/20 bg-[var(--color-surface)] p-4"
                        >
                            <div className="mb-3 flex items-start justify-between">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                                    <Puzzle size={20} className="text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <span className={cn(
                                    'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                                    m.actif
                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                        : 'bg-zinc-500/10 text-[var(--color-text-muted)]',
                                )}>
                                    {m.actif ? <CheckCircle size={10} /> : <Lock size={10} />}
                                    {m.actif ? 'Actif' : 'Inactif'}
                                </span>
                            </div>
                            <h3 className="font-semibold text-[var(--color-text-primary)]">{m.nom}</h3>
                            <p className="mt-1 line-clamp-2 text-xs text-[var(--color-text-secondary)]">
                                {m.description || 'Module gratuit'}
                            </p>
                            {m.estCritique && (
                                <p className="mt-2 flex items-center gap-1 text-[10px] text-[var(--color-text-muted)]">
                                    <Lock size={10} /> Module critique — toujours actif
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* Fonctionnalités gratuites */}
            <section>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--color-text-primary)]">
                    <Zap size={18} className="text-emerald-500" />
                    Fonctionnalités gratuites ({foncGratuites.length})
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {foncGratuites.map((f) => (
                        <div key={f.cle} className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-[var(--color-surface)] p-4">
                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                                <Zap size={16} className="text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-[var(--color-text-primary)]">{f.nom}</p>
                                {f.description && (
                                    <p className="mt-0.5 line-clamp-2 text-xs text-[var(--color-text-secondary)]">{f.description}</p>
                                )}
                            </div>
                            <CheckCircle size={16} className="ml-auto flex-shrink-0 text-emerald-500" />
                        </div>
                    ))}
                    {foncGratuites.length === 0 && (
                        <p className="text-sm text-[var(--color-text-muted)]">Aucune fonctionnalité gratuite référencée.</p>
                    )}
                </div>
            </section>
        </div>
    );
}

// =============================================
// ONGLET PAYANTS (modules + fonctionnalités PAYANT)
// =============================================

function PayantsTab() {
    const { data, isLoading } = useMarketplace();
    const modules = data?.modules ?? [];
    const fonctionnalites = data?.fonctionnalites ?? [];

    const payants = modules.filter(m => m.categorie === 'PAYANT');
    const foncPayantes = fonctionnalites.filter(f => f.categorieCommerciale === 'PAYANT');

    if (isLoading) {
        return (
            <div className="flex h-48 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--color-dominant-600)]" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <p className="text-center text-sm text-[var(--color-text-secondary)]">
                Modules et fonctionnalités disponibles selon votre plan ou en supplément.
            </p>

            {/* Modules payants */}
            <section>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--color-text-primary)]">
                    <Star size={18} className="text-amber-500" />
                    Modules ({payants.length})
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {payants.map((m) => (
                        <div
                            key={m.code}
                            className={cn(
                                'rounded-xl border bg-[var(--color-surface)] p-4',
                                m.actif ? 'border-emerald-500/30' : 'border-[var(--color-border)]',
                            )}
                        >
                            <div className="mb-3 flex items-start justify-between">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                                    <Star size={20} className="text-amber-500" />
                                </div>
                                {m.actif ? (
                                    <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                        <CheckCircle size={10} />
                                        {m.inclusParPlan ? 'Inclus plan' : 'Actif'}
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                                        <Lock size={10} />
                                        {m.planMinimal ? `Plan ${m.planMinimal}` : 'À débloquer'}
                                    </span>
                                )}
                            </div>
                            <h3 className="font-semibold text-[var(--color-text-primary)]">{m.nom}</h3>
                            <p className="mt-1 line-clamp-2 text-xs text-[var(--color-text-secondary)]">
                                {m.description || 'Module payant'}
                            </p>
                            {!m.actif && m.entitlement?.message && (
                                <p className="mt-2 text-[10px] italic text-[var(--color-text-muted)]">
                                    {m.entitlement.message}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* Fonctionnalités payantes */}
            <section>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--color-text-primary)]">
                    <Zap size={18} className="text-amber-500" />
                    Fonctionnalités ({foncPayantes.length})
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {foncPayantes.map((f) => (
                        <div
                            key={f.cle}
                            className={cn(
                                'flex items-start gap-3 rounded-xl border bg-[var(--color-surface)] p-4',
                                f.incluseParPlan ? 'border-emerald-500/30' : 'border-[var(--color-border)]',
                            )}
                        >
                            <div className={cn(
                                'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg',
                                f.incluseParPlan ? 'bg-emerald-500/10' : 'bg-amber-500/10',
                            )}>
                                {f.incluseParPlan
                                    ? <Zap size={16} className="text-emerald-600 dark:text-emerald-400" />
                                    : <Lock size={16} className="text-amber-600 dark:text-amber-400" />}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-[var(--color-text-primary)]">{f.nom}</p>
                                {f.description && (
                                    <p className="mt-0.5 line-clamp-2 text-xs text-[var(--color-text-secondary)]">{f.description}</p>
                                )}
                                <p className="mt-1 text-[10px] font-medium">
                                    {f.incluseParPlan
                                        ? <span className="text-emerald-600 dark:text-emerald-400">Incluse dans votre plan</span>
                                        : <span className="text-[var(--color-text-muted)]">Disponible sur un plan supérieur</span>}
                                </p>
                            </div>
                        </div>
                    ))}
                    {foncPayantes.length === 0 && (
                        <p className="text-sm text-[var(--color-text-muted)]">Aucune fonctionnalité payante référencée.</p>
                    )}
                </div>
            </section>
        </div>
    );
}

// =============================================
// ONGLET USAGE (quotas + packs)
// =============================================

function UsageTab() {
    const queryClient = useQueryClient();

    const { data: usageData, isLoading } = useQuery<{ quotas: EtatQuota[]; abonnement: AbonnementStatut }>({
        queryKey: ['marketplace-usage'],
        queryFn: async () => {
            const res = await apiClient.get<{ quotas: EtatQuota[]; abonnement: AbonnementStatut }>(
                '/api/billing/marketplace/usage',
            );
            const payload = res.data as any;
            return payload?.quotas ? payload : payload?.data;
        },
        staleTime: 30_000,
    });

    const { data: packs = [] } = useQuery<PackItem[]>({
        queryKey: ['marketplace-packs'],
        queryFn: async () => {
            const res = await apiClient.get<PackItem[]>('/api/billing/marketplace/packs');
            const payload = res.data as any;
            return Array.isArray(payload) ? payload : payload?.data ?? [];
        },
        staleTime: 60_000,
    });

    const souscrirePack = useMutation({
        mutationFn: (packId: string) =>
            apiClient.post<ApiEnvelope<unknown>>(`/api/billing/marketplace/packs/${packId}/souscrire`),
        onSuccess: (res) => {
            toast.success(res.data?.message || 'Pack souscrit avec succès');
            queryClient.invalidateQueries({ queryKey: ['marketplace-usage'] });
            queryClient.invalidateQueries({ queryKey: ['marketplace-v3'] });
        },
        onError: (err: any) => toast.error(err?.message || 'Erreur lors de la souscription du pack'),
    });

    const quotas = usageData?.quotas ?? [];
    const abonnement = usageData?.abonnement;

    const couleurPourcentage = (p: number) => {
        if (p >= 100) return 'bg-red-500';
        if (p >= 80) return 'bg-amber-500';
        return 'bg-emerald-500';
    };

    if (isLoading) {
        return (
            <div className="flex h-48 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--color-dominant-600)]" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <AbonnementBanner abonnement={abonnement} />

            {/* Quotas */}
            <section>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--color-text-primary)]">
                    <Gauge size={18} className="text-[var(--color-dominant-600)]" />
                    Consommation des quotas
                </h2>
                {quotas.length === 0 ? (
                    <p className="text-sm text-[var(--color-text-muted)]">Aucun quota suivi.</p>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {quotas.map((q) => (
                            <div key={q.ressource} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                                        {ressourceLabel(q.ressource)}
                                    </span>
                                    <span className={cn(
                                        'text-xs font-bold',
                                        q.pourcentage >= 100 ? 'text-red-500' : q.pourcentage >= 80 ? 'text-amber-500' : 'text-emerald-500',
                                    )}>
                                        {q.pourcentage >= 100 ? 'Quota dépassé' : `${q.pourcentage.toFixed(0)} %`}
                                    </span>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-hover)]">
                                    <div
                                        className={cn('h-full rounded-full transition-all', couleurPourcentage(q.pourcentage))}
                                        style={{ width: `${Math.min(q.pourcentage, 100)}%` }}
                                    />
                                </div>
                                <div className="mt-2 flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                                    <span>
                                        {q.utilisation.toLocaleString('fr-FR')}
                                        {' / '}
                                        {q.limite === 0 ? 'Illimité' : q.limite.toLocaleString('fr-FR')}
                                    </span>
                                    {q.quotaPacks > 0 && (
                                        <span className="text-[var(--color-dominant-600)]">
                                            +{q.quotaPacks.toLocaleString('fr-FR')} (packs)
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Packs quota */}
            <section>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--color-text-primary)]">
                    <ShoppingCart size={18} className="text-[var(--color-secondary-600)]" />
                    Packs supplémentaires
                </h2>
                {packs.length === 0 ? (
                    <p className="text-sm text-[var(--color-text-muted)]">Aucun pack disponible à l'achat.</p>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {packs.map((pack) => (
                            <div key={pack.id} className="flex flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-all hover:border-[var(--color-secondary-500)]/40 hover:shadow-lg">
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="rounded-full bg-[var(--color-secondary-600)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--color-secondary-600)]">
                                        {ressourceLabel(pack.ressource)}
                                    </span>
                                    <span className="text-[10px] text-[var(--color-text-muted)]">
                                        {pack.dureeValidite === 'ILLIMITE' ? 'Permanent' : 'Cycle courant'}
                                    </span>
                                </div>
                                <h3 className="font-semibold text-[var(--color-text-primary)]">{pack.nom}</h3>
                                {pack.description && (
                                    <p className="mt-1 line-clamp-2 text-xs text-[var(--color-text-secondary)]">{pack.description}</p>
                                )}
                                <div className="mt-3 flex items-end justify-between">
                                    <span className="text-lg font-bold text-[var(--color-text-primary)]">
                                        {Number(pack.prix).toLocaleString('fr-FR')}
                                        <span className="ml-1 text-xs font-normal text-[var(--color-text-muted)]">{pack.devise}</span>
                                    </span>
                                </div>
                                <button
                                    onClick={() => souscrirePack.mutate(pack.id)}
                                    disabled={souscrirePack.isPending}
                                    className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-[var(--color-secondary-600)] px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-[var(--color-secondary-700)] disabled:opacity-50"
                                >
                                    {souscrirePack.isPending ? <Loader2 size={14} className="animate-spin" /> : <ShoppingCart size={14} />}
                                    Acheter
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>
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

                <div className="mb-4 space-y-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-[var(--color-text-muted)]">Code</span>
                        <span className="font-mono text-xs">{code}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-[var(--color-text-muted)]">Catégorie</span>
                        <span>{module?.categorie === 'GRATUIT' ? 'Gratuit' : 'Payant'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-[var(--color-text-muted)]">Source</span>
                        <span>{module?.inclusParPlan ? 'Inclus par le plan' : module?.source || '—'}</span>
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

export default MarketplacePage;
