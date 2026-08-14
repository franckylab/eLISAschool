/**
 * ==================================
 * eLISAschool - Plans d'Abonnement
 * ==================================
 * Catalogue des plans disponibles avec détails, comparaison
 * et simulateur tarifaire intégré.
 * Refonte SaaS v9 — Menu "Mon Établissement"
 */

import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Check,
    X as XIcon,
    Sparkles,
    Users,
    Package,
    ArrowRight,
    Calculator,
    Crown,
    Rocket,
    Building2,
    Info,
    ChevronDown,
    ChevronUp,
    Zap,
    Shield,
} from 'lucide-react';
import { PlanSimulator } from '@/features/billing/components/plan-simulator';
import { cn } from '@/lib/cn';

export const Route = createFileRoute('/_auth/plans')({
    component: PlansPage,
});

// =============================================
// Types
// =============================================

interface Tranche {
    id: string;
    minEleves: number;
    maxEleves: number | null;
    montantSupplementaire: number;
    label?: string;
}

interface Plan {
    id: string;
    nom: string;
    slug: string;
    description?: string;
    prixBase: number;
    devise: string;
    maxEleves: number;
    modulesInclus: string[];
    tranches?: Tranche[];
    badge?: string;
    actif: boolean;
}

interface AbonnementActuel {
    plan?: { id: string; nom: string };
    statut: string;
}

type ViewMode = 'cards' | 'compare' | 'simulator';

// =============================================
// Icons mapping pour plans
// =============================================

const PLAN_ICONS: Record<string, typeof Package> = {
    gratuit: Package,
    standard: Zap,
    premium: Crown,
    enterprise: Building2,
};

const PLAN_COLORS: Record<string, { bg: string; text: string; border: string; badge: string }> = {
    gratuit: {
        bg: 'bg-slate-500/5',
        text: 'text-slate-600 dark:text-slate-400',
        border: 'border-slate-200 dark:border-slate-700',
        badge: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
    },
    standard: {
        bg: 'bg-blue-500/5',
        text: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-200 dark:border-blue-700',
        badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    premium: {
        bg: 'bg-purple-500/5',
        text: 'text-purple-600 dark:text-purple-400',
        border: 'border-purple-200 dark:border-purple-700',
        badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    },
    enterprise: {
        bg: 'bg-amber-500/5',
        text: 'text-amber-600 dark:text-amber-400',
        border: 'border-amber-200 dark:border-amber-700',
        badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    },
};

const DEFAULT_COLOR = {
    bg: 'bg-emerald-500/5',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-700',
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
};

// =============================================
// Hooks
// =============================================

function usePlans() {
    return useQuery<Plan[]>({
        queryKey: ['plans-catalogue'],
        queryFn: async () => {
            const res = await apiClient.get<Plan[]>('/api/billing/plans');
            return res.data;
        },
    });
}

function useAbonnementActuel() {
    return useQuery<AbonnementActuel | null>({
        queryKey: ['mon-abonnement'],
        queryFn: async () => {
            const res = await apiClient.get<AbonnementActuel | null>('/api/billing/mon-abonnement');
            return res.data;
        },
    });
}

// =============================================
// Helpers
// =============================================

function getPlanColor(slug: string) {
    return PLAN_COLORS[slug.toLowerCase()] || DEFAULT_COLOR;
}

function getPlanIcon(slug: string) {
    return PLAN_ICONS[slug.toLowerCase()] || Rocket;
}

function formatPrix(prix: number, devise: string) {
    return new Intl.NumberFormat('fr-FR').format(prix) + ' ' + devise;
}

// =============================================
// Main Page
// =============================================

function PlansPage() {
    const [viewMode, setViewMode] = useState<ViewMode>('cards');
    const { data: plans, isLoading } = usePlans();
    const { data: abonnement } = useAbonnementActuel();

    const views: { key: ViewMode; label: string; icon: typeof Package }[] = [
        { key: 'cards', label: 'Catalogue', icon: Package },
        { key: 'compare', label: 'Comparer', icon: Shield },
        { key: 'simulator', label: 'Simulateur', icon: Calculator },
    ];

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Plans d'abonnement</h1>
                    <p className="text-muted-foreground mt-1">
                        Découvrez nos offres, comparez les fonctionnalités et simulez votre tarif
                    </p>
                </div>

                {/* View mode switcher */}
                <div className="flex gap-1 border rounded-lg p-1 bg-muted/30">
                    {views.map((v) => {
                        const Icon = v.icon;
                        return (
                            <button
                                key={v.key}
                                onClick={() => setViewMode(v.key)}
                                className={cn(
                                    'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                                    viewMode === v.key
                                        ? 'bg-background text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground',
                                )}
                            >
                                <Icon className="w-4 h-4" />
                                {v.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="border rounded-xl p-6 animate-pulse space-y-4">
                            <div className="h-6 bg-muted rounded w-1/3" />
                            <div className="h-10 bg-muted rounded w-1/2" />
                            <div className="space-y-2">
                                {[1, 2, 3, 4].map((j) => (
                                    <div key={j} className="h-4 bg-muted rounded" />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Content */}
            {!isLoading && (
                <AnimatePresence mode="wait">
                    {viewMode === 'cards' && (
                        <motion.div
                            key="cards"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <PlansCatalogue plans={plans || []} abonnement={abonnement} />
                        </motion.div>
                    )}
                    {viewMode === 'compare' && (
                        <motion.div
                            key="compare"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <PlansComparison plans={plans || []} />
                        </motion.div>
                    )}
                    {viewMode === 'simulator' && (
                        <motion.div
                            key="simulator"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <PlanSimulator />
                        </motion.div>
                    )}
                </AnimatePresence>
            )}
        </div>
    );
}

// =============================================
// Catalogue View — Plan Cards
// =============================================

function PlansCatalogue({ plans, abonnement }: { plans: Plan[]; abonnement: AbonnementActuel | null | undefined }) {
    const queryClient = useQueryClient();

    const upgradeMutation = useMutation({
        mutationFn: async (planId: string) => {
            const res = await apiClient.patch('/api/billing/abonnement/upgrade', { nouveauPlanId: planId });
            return res.data;
        },
    });

    const handleUpgrade = (planId: string) => {
        upgradeMutation.mutate(planId, {
            onSuccess: () => {
                toast.success('Plan mis à jour avec succès');
                queryClient.invalidateQueries({ queryKey: ['mon-abonnement'] });
                queryClient.invalidateQueries({ queryKey: ['plans-catalogue'] });
            },
            onError: () => toast.error('Erreur lors du changement de plan'),
        });
    };

    const currentPlanId = abonnement?.plan?.id;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => {
                const colors = getPlanColor(plan.slug);
                const Icon = getPlanIcon(plan.slug);
                const isCurrentPlan = plan.id === currentPlanId;

                return (
                    <motion.div
                        key={plan.id}
                        whileHover={{ y: -4 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className={cn(
                            'relative border rounded-xl p-6 space-y-5 transition-shadow',
                            colors.border,
                            isCurrentPlan && 'ring-2 ring-primary shadow-lg',
                        )}
                    >
                        {/* Badge actuel */}
                        {isCurrentPlan && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow">
                                    Plan actuel
                                </span>
                            </div>
                        )}

                        {/* Badge plan */}
                        {plan.badge && !isCurrentPlan && (
                            <div className="absolute -top-3 right-4">
                                <span className={cn('text-xs font-bold px-3 py-1 rounded-full', colors.badge)}>
                                    {plan.badge}
                                </span>
                            </div>
                        )}

                        {/* Header */}
                        <div className="flex items-center gap-3">
                            <div className={cn('p-2.5 rounded-xl', colors.bg)}>
                                <Icon className={cn('w-6 h-6', colors.text)} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">{plan.nom}</h3>
                                {plan.description && (
                                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{plan.description}</p>
                                )}
                            </div>
                        </div>

                        {/* Prix */}
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-bold">{formatPrix(plan.prixBase, plan.devise)}</span>
                            <span className="text-sm text-muted-foreground">/mois</span>
                        </div>

                        {/* Capacité */}
                        <div className="flex items-center gap-2 text-sm">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Jusqu'à</span>
                            <span className="font-semibold">{plan.maxEleves}</span>
                            <span className="text-muted-foreground">élèves</span>
                            {plan.maxEleves === 999999 && <span className="text-muted-foreground">(illimité)</span>}
                        </div>

                        {/* Modules inclus */}
                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold flex items-center gap-2">
                                <Sparkles className="w-4 h-4" />
                                Modules inclus
                            </h4>
                            <div className="space-y-1.5">
                                {plan.modulesInclus.slice(0, 6).map((module) => (
                                    <div key={module} className="flex items-center gap-2 text-sm">
                                        <Check className={cn('w-3.5 h-3.5 shrink-0', colors.text)} />
                                        <span className="text-muted-foreground">{module}</span>
                                    </div>
                                ))}
                                {plan.modulesInclus.length > 6 && (
                                    <p className="text-xs text-muted-foreground pl-5">
                                        + {plan.modulesInclus.length - 6} autre{plan.modulesInclus.length - 6 > 1 ? 's' : ''}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Tranches tarifaires */}
                        {plan.tranches && plan.tranches.length > 0 && (
                            <div className="space-y-2 pt-2 border-t">
                                <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                                    <Info className="w-3 h-3" />
                                    Tranches supplémentaires
                                </h4>
                                {plan.tranches.slice(0, 3).map((tranche) => (
                                    <div key={tranche.id} className="flex justify-between text-xs text-muted-foreground">
                                        <span>{tranche.label || `${tranche.minEleves}+ élèves`}</span>
                                        <span className="font-mono">+{formatPrix(tranche.montantSupplementaire, plan.devise)}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* CTA */}
                        <button
                            onClick={() => !isCurrentPlan && handleUpgrade(plan.id)}
                            disabled={isCurrentPlan || upgradeMutation.isPending}
                            className={cn(
                                'w-full py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2',
                                isCurrentPlan
                                    ? 'bg-muted text-muted-foreground cursor-default'
                                    : `bg-primary text-primary-foreground hover:opacity-90 ${upgradeMutation.isPending ? 'opacity-50' : ''}`,
                            )}
                        >
                            {isCurrentPlan ? (
                                <Check className="w-4 h-4" />
                            ) : (
                                <>
                                    Choisir {plan.nom}
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </motion.div>
                );
            })}

            {plans.length === 0 && (
                <div className="col-span-full text-center py-12 space-y-3">
                    <Package className="w-12 h-12 mx-auto text-muted-foreground/50" />
                    <p className="text-muted-foreground">Aucun plan disponible pour le moment</p>
                    <p className="text-sm text-muted-foreground">Contactez l'administrateur de la plateforme</p>
                </div>
            )}
        </div>
    );
}

// =============================================
// Comparison View — Feature Matrix
// =============================================

function PlansComparison({ plans }: { plans: Plan[] }) {
    const [showAllModules, setShowAllModules] = useState(false);

    // Collecter tous les modules uniques
    const allModules = useMemo(() => {
        const modules = new Set<string>();
        plans.forEach((p) => p.modulesInclus.forEach((m) => modules.add(m)));
        return Array.from(modules);
    }, [plans]);

    const displayedModules = showAllModules ? allModules : allModules.slice(0, 10);

    return (
        <div className="border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-muted/30">
                            <th className="text-left p-4 font-semibold min-w-[200px]">Fonctionnalité</th>
                            {plans.map((plan) => {
                                const colors = getPlanColor(plan.slug);
                                return (
                                    <th key={plan.id} className={cn('p-4 text-center min-w-[160px]', colors.bg)}>
                                        <div className="space-y-1">
                                            <div className={cn('font-bold', colors.text)}>{plan.nom}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {formatPrix(plan.prixBase, plan.devise)}/mois
                                            </div>
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {/* Capacité élèves */}
                        <tr className="hover:bg-muted/20">
                            <td className="p-4 font-medium">Nombre d'élèves max</td>
                            {plans.map((plan) => (
                                <td key={plan.id} className="p-4 text-center font-mono">
                                    {plan.maxEleves >= 999999 ? 'Illimité' : plan.maxEleves}
                                </td>
                            ))}
                        </tr>

                        {/* Nombre de modules */}
                        <tr className="hover:bg-muted/20">
                            <td className="p-4 font-medium">Modules inclus</td>
                            {plans.map((plan) => (
                                <td key={plan.id} className="p-4 text-center font-semibold">
                                    {plan.modulesInclus.length}
                                </td>
                            ))}
                        </tr>

                        {/* Tranches tarifaires */}
                        <tr className="hover:bg-muted/20">
                            <td className="p-4 font-medium">Tranches tarifaires</td>
                            {plans.map((plan) => (
                                <td key={plan.id} className="p-4 text-center">
                                    {plan.tranches && plan.tranches.length > 0 ? (
                                        <span className="text-foreground">{plan.tranches.length}</span>
                                    ) : (
                                        <span className="text-muted-foreground">—</span>
                                    )}
                                </td>
                            ))}
                        </tr>

                        {/* Modules détaillés */}
                        {displayedModules.map((module) => (
                            <tr key={module} className="hover:bg-muted/20">
                                <td className="p-4 text-muted-foreground">{module}</td>
                                {plans.map((plan) => (
                                    <td key={plan.id} className="p-4 text-center">
                                        {plan.modulesInclus.includes(module) ? (
                                            <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                                        ) : (
                                            <XIcon className="w-4 h-4 text-muted-foreground/40 mx-auto" />
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Show more modules */}
            {allModules.length > 10 && (
                <div className="border-t p-3 text-center">
                    <button
                        onClick={() => setShowAllModules(!showAllModules)}
                        className="flex items-center gap-1 text-sm text-primary hover:underline mx-auto"
                    >
                        {showAllModules ? (
                            <>
                                Voir moins <ChevronUp className="w-4 h-4" />
                            </>
                        ) : (
                            <>
                                Voir {allModules.length - 10} modules de plus <ChevronDown className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}

export default PlansPage;
