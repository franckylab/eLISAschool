/**
 * ==================================
 * eLISAschool - Page Tarifs & Packs
 * ==================================
 * P5.4 v7 — Page tarifs plateforme avec comparaison de plans,
 * simulateur de coût et sélection de modules optionnels.
 *
 * Utilise le composant existant PlanSimulator + ajoute :
 * - Grille de comparaison des plans
 * - PackSelector (sélection modules)
 * - PlanComparison (tableau comparatif)
 */

import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useTranslation } from 'react-i18next';
import {
    CreditCard,
    Check,
    X as XIcon,
    Users,
    Package,
    Sparkles,
    Calculator,
    ArrowRight,
    Zap,
    Shield,
    Crown,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { PlanSimulator } from '@/features/billing/components/plan-simulator';

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
    maxUtilisateurs: number;
    maxClasses: number;
    stockageMaxGo: number;
    smsInclus: number;
    modulesInclus: string[];
    badge?: string;
    tranches?: Tranche[];
}

interface ModuleCatalogue {
    id: string;
    code: string;
    nom: string;
    categorie: 'BASE' | 'PREMIUM' | 'ADDON';
    prixMensuel?: number;
    description?: string;
    estFacturable: boolean;
}

// =============================================
// Hooks
// =============================================

function usePlansDisponibles() {
    return useQuery<Plan[]>({
        queryKey: ['plans-tarifs'],
        queryFn: async () => {
            const res = await apiClient.get<Plan[]>('/api/billing/plans');
            return res.data ?? [];
        },
    });
}

function useModulesFacturables() {
    return useQuery<ModuleCatalogue[]>({
        queryKey: ['modules-facturables'],
        queryFn: async () => {
            const res = await apiClient.get<ModuleCatalogue[]>('/api/platform/facturation/modules/catalogue', {
                categorie: 'PREMIUM,ADDON',
                facturable: 'true',
            });
            return res.data ?? [];
        },
    });
}

// =============================================
// Composants
// =============================================

const PLAN_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    gratuit: Shield,
    starter: Zap,
    standard: Sparkles,
    premium: Crown,
    enterprise: CreditCard,
};

function PlanCard({
    plan,
    isSelected,
    onSelect,
    cycle,
}: {
    plan: Plan;
    isSelected: boolean;
    onSelect: () => void;
    cycle: 'MENSUEL' | 'ANNUEL';
}) {
    const { t } = useTranslation('admin');
    const Icon = PLAN_ICONS[plan.slug] || Package;
    const prix = cycle === 'ANNUEL' ? Math.round(plan.prixBase * 12 * 0.85) : plan.prixBase;
    const formatPrix = (n: number) => new Intl.NumberFormat('fr-FR').format(n);

    return (
        <button
            onClick={onSelect}
            className={cn(
                'relative flex flex-col rounded-xl border p-6 text-left transition-all',
                isSelected
                    ? 'border-[var(--color-dominante)] ring-2 ring-[var(--color-dominante)]/20 shadow-lg'
                    : 'border-[var(--color-bordure)] hover:border-[var(--color-dominante)]/50 hover:shadow-sm',
            )}
        >
            {/* Badge */}
            {plan.badge && (
                <span className="absolute -top-3 right-4 rounded-full bg-[var(--color-dominante)] px-3 py-0.5 text-xs font-bold text-white">
                    {plan.badge}
                </span>
            )}

            {/* Icon + Name */}
            <div className="flex items-center gap-3 mb-4">
                <div className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-lg',
                    isSelected
                        ? 'bg-[var(--color-dominante)]/10 text-[var(--color-dominante)]'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500',
                )}>
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <h3 className="font-bold text-[var(--color-texte)]">{plan.nom}</h3>
                    {plan.description && (
                        <p className="text-xs text-[var(--color-texte-secondaire)] line-clamp-1">{plan.description}</p>
                    )}
                </div>
            </div>

            {/* Prix */}
            <div className="mb-4">
                <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-[var(--color-texte)]">
                        {formatPrix(prix)}
                    </span>
                    <span className="text-sm text-[var(--color-texte-secondaire)]">
                        {plan.devise}/{cycle === 'MENSUEL' ? 'mois' : 'an'}
                    </span>
                </div>
                {cycle === 'ANNUEL' && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                        Économisez 15%
                    </p>
                )}
            </div>

            {/* Caractéristiques */}
            <ul className="space-y-2 text-sm flex-1">
                <li className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-[var(--color-texte-secondaire)]" />
                    <span>Jusqu'à <strong>{plan.maxEleves}</strong> élèves</span>
                </li>
                {plan.maxUtilisateurs > 0 && (
                    <li className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-[var(--color-texte-secondaire)]" />
                        <span><strong>{plan.maxUtilisateurs}</strong> utilisateurs</span>
                    </li>
                )}
                {plan.stockageMaxGo > 0 && (
                    <li className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-[var(--color-texte-secondaire)]" />
                        <span><strong>{plan.stockageMaxGo}</strong> Go stockage</span>
                    </li>
                )}
                <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span><strong>{plan.modulesInclus?.length ?? 0}</strong> modules inclus</span>
                </li>
                {plan.smsInclus > 0 && (
                    <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-emerald-600" />
                        <span><strong>{plan.smsInclus}</strong> SMS/mois</span>
                    </li>
                )}
            </ul>

            {/* CTA */}
            <div className={cn(
                'mt-6 w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors',
                isSelected
                    ? 'bg-[var(--color-dominante)] text-white'
                    : 'bg-[var(--color-surface-hover)] text-[var(--color-texte)] hover:bg-[var(--color-dominante)]/10',
            )}>
                {isSelected ? (
                    <>
                        <Check className="h-4 w-4" /> Sélectionné
                    </>
                ) : (
                    <>
                        Choisir ce plan <ArrowRight className="h-4 w-4" />
                    </>
                )}
            </div>
        </button>
    );
}

function PackSelector({
    modules,
    selectedModules,
    onToggle,
}: {
    modules: ModuleCatalogue[];
    selectedModules: Set<string>;
    onToggle: (code: string) => void;
}) {
    const formatPrix = (n?: number) =>
        n ? `${new Intl.NumberFormat('fr-FR').format(n)} XAF/mois` : 'Inclus';

    const premium = modules.filter(m => m.categorie === 'PREMIUM');
    const addons = modules.filter(m => m.categorie === 'ADDON');

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-[var(--color-texte)] mb-1">
                    Modules complémentaires
                </h3>
                <p className="text-sm text-[var(--color-texte-secondaire)]">
                    Ajoutez des modules supplémentaires à votre plan
                </p>
            </div>

            {/* PREMIUM */}
            {premium.length > 0 && (
                <div>
                    <h4 className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-3">
                        Modules Premium
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {premium.map(m => {
                            const selected = selectedModules.has(m.code);
                            return (
                                <button
                                    key={m.code}
                                    onClick={() => onToggle(m.code)}
                                    className={cn(
                                        'flex items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                                        selected
                                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                                            : 'border-[var(--color-bordure)] hover:border-[var(--color-dominante)]/50',
                                    )}
                                >
                                    <div className={cn(
                                        'flex h-8 w-8 items-center justify-center rounded-full shrink-0',
                                        selected ? 'bg-emerald-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800',
                                    )}>
                                        {selected ? <Check className="h-4 w-4" /> : <Package className="h-4 w-4" />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-[var(--color-texte)] truncate">{m.nom}</p>
                                        <p className="text-xs text-[var(--color-texte-secondaire)]">{formatPrix(m.prixMensuel)}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ADDON */}
            {addons.length > 0 && (
                <div>
                    <h4 className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-3">
                        Modules Add-on
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {addons.map(m => {
                            const selected = selectedModules.has(m.code);
                            return (
                                <button
                                    key={m.code}
                                    onClick={() => onToggle(m.code)}
                                    className={cn(
                                        'flex items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                                        selected
                                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                                            : 'border-[var(--color-bordure)] hover:border-[var(--color-dominante)]/50',
                                    )}
                                >
                                    <div className={cn(
                                        'flex h-8 w-8 items-center justify-center rounded-full shrink-0',
                                        selected ? 'bg-emerald-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800',
                                    )}>
                                        {selected ? <Check className="h-4 w-4" /> : <Package className="h-4 w-4" />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-[var(--color-texte)] truncate">{m.nom}</p>
                                        <p className="text-xs text-[var(--color-texte-secondaire)]">{formatPrix(m.prixMensuel)}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

function PlanComparison({ plans }: { plans: Plan[] }) {
    if (!plans || plans.length === 0) return null;

    // Collect all features across plans
    const features = [
        { label: 'Élèves max', key: 'maxEleves', format: (v: number) => v.toLocaleString('fr-FR') },
        { label: 'Utilisateurs', key: 'maxUtilisateurs', format: (v: number) => v === 0 ? 'Illimité' : v.toLocaleString('fr-FR') },
        { label: 'Classes', key: 'maxClasses', format: (v: number) => v === 0 ? 'Illimité' : v.toLocaleString('fr-FR') },
        { label: 'Stockage (Go)', key: 'stockageMaxGo', format: (v: number) => v.toLocaleString('fr-FR') },
        { label: 'SMS/mois', key: 'smsInclus', format: (v: number) => v.toLocaleString('fr-FR') },
        { label: 'Modules inclus', key: 'modulesInclus', format: (v: string[]) => `${v?.length ?? 0} modules` },
    ];

    const formatPrix = (n: number, devise: string) =>
        `${new Intl.NumberFormat('fr-FR').format(n)} ${devise}/mois`;

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-[var(--color-bordure)]">
                        <th className="text-left py-3 px-4 font-medium text-[var(--color-texte-secondaire)]">
                            Fonctionnalité
                        </th>
                        {plans.map(plan => (
                            <th key={plan.id} className="text-center py-3 px-4">
                                <div className="font-bold text-[var(--color-texte)]">{plan.nom}</div>
                                <div className="text-xs text-[var(--color-texte-secondaire)]">
                                    {formatPrix(Number(plan.prixBase), plan.devise)}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {features.map(feature => (
                        <tr key={feature.key} className="border-b border-[var(--color-bordure)]/50">
                            <td className="py-2.5 px-4 text-[var(--color-texte-secondaire)]">{feature.label}</td>
                            {plans.map(plan => {
                                const value = (plan as any)[feature.key];
                                return (
                                    <td key={plan.id} className="text-center py-2.5 px-4 text-[var(--color-texte)]">
                                        {feature.format(value)}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// =============================================
// Page principale
// =============================================

function TarifsPage() {
    const { t } = useTranslation('admin');
    const { data: plans, isLoading } = usePlansDisponibles();
    const { data: modulesFacturables } = useModulesFacturables();

    const [cycle, setCycle] = useState<'MENSUEL' | 'ANNUEL'>('MENSUEL');
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
    const [selectedModules, setSelectedModules] = useState<Set<string>>(new Set());

    const handleModuleToggle = (code: string) => {
        setSelectedModules(prev => {
            const next = new Set(prev);
            if (next.has(code)) next.delete(code);
            else next.add(code);
            return next;
        });
    };

    const selectedPlan = useMemo(
        () => plans?.find(p => p.id === selectedPlanId),
        [plans, selectedPlanId],
    );

    // Calcul du total modules sélectionnés
    const totalModules = useMemo(() => {
        if (!modulesFacturables) return 0;
        let total = 0;
        for (const m of modulesFacturables) {
            if (selectedModules.has(m.code) && m.prixMensuel) {
                total += m.prixMensuel;
            }
        }
        return total;
    }, [modulesFacturables, selectedModules]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-pulse text-[var(--color-texte-secondaire)]">
                    Chargement des tarifs...
                </div>
            </div>
        );
    }

    return (
        <div className="p-[clamp(1rem,0.75rem+1vw,1.5rem)] space-y-[var(--space-xl)]">
            {/* Header */}
            <div className="text-center space-y-3">
                <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-texte)]">
                    Tarifs & Plans
                </h1>
                <p className="text-[var(--color-texte-secondaire)] max-w-2xl mx-auto">
                    Choisissez le plan adapté à votre établissement.
                    Tous les plans incluent les modules critiques de base.
                </p>

                {/* Cycle toggle */}
                <div className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-bordure)] p-1">
                    <button
                        onClick={() => setCycle('MENSUEL')}
                        className={cn(
                            'rounded-md px-4 py-2 text-sm font-medium transition-colors',
                            cycle === 'MENSUEL'
                                ? 'bg-[var(--color-dominante)] text-white'
                                : 'text-[var(--color-texte-secondaire)] hover:text-[var(--color-texte)]',
                        )}
                    >
                        Mensuel
                    </button>
                    <button
                        onClick={() => setCycle('ANNUEL')}
                        className={cn(
                            'rounded-md px-4 py-2 text-sm font-medium transition-colors',
                            cycle === 'ANNUEL'
                                ? 'bg-[var(--color-dominante)] text-white'
                                : 'text-[var(--color-texte-secondaire)] hover:text-[var(--color-texte)]',
                        )}
                    >
                        Annuel
                        <span className="ml-1.5 text-xs opacity-80">-15%</span>
                    </button>
                </div>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {plans?.map(plan => (
                    <PlanCard
                        key={plan.id}
                        plan={plan}
                        isSelected={selectedPlanId === plan.id}
                        onSelect={() => setSelectedPlanId(plan.id)}
                        cycle={cycle}
                    />
                ))}
            </div>

            {/* Comparatif */}
            {plans && plans.length > 1 && (
                <div className="rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-6">
                    <h2 className="text-lg font-semibold text-[var(--color-texte)] mb-4 flex items-center gap-2">
                        <Calculator className="h-5 w-5 text-[var(--color-dominante)]" />
                        Comparaison des plans
                    </h2>
                    <PlanComparison plans={plans} />
                </div>
            )}

            {/* Modules complémentaires */}
            {modulesFacturables && modulesFacturables.length > 0 && (
                <div className="rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-6">
                    <PackSelector
                        modules={modulesFacturables}
                        selectedModules={selectedModules}
                        onToggle={handleModuleToggle}
                    />
                </div>
            )}

            {/* Simulateur */}
            <div className="rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-6">
                <PlanSimulator />
            </div>

            {/* Résumé + CTA */}
            {selectedPlan && (
                <div className="sticky bottom-4 rounded-xl border border-[var(--color-dominante)]/30 bg-[var(--color-surface)] shadow-lg p-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-bold text-[var(--color-texte)]">
                                {selectedPlan.nom}
                            </h3>
                            <p className="text-sm text-[var(--color-texte-secondaire)]">
                                {selectedModules.size > 0 && (
                                    <span>+ {selectedModules.size} module{selectedModules.size > 1 ? 's' : ''} complémentaire{selectedModules.size > 1 ? 's' : ''}</span>
                                )}
                                {totalModules > 0 && (
                                    <span className="ml-2 font-medium text-[var(--color-dominante)]">
                                        (+ {new Intl.NumberFormat('fr-FR').format(totalModules)} XAF/mois)
                                    </span>
                                )}
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <div className="text-2xl font-bold text-[var(--color-texte)]">
                                    {new Intl.NumberFormat('fr-FR').format(
                                        cycle === 'ANNUEL'
                                            ? Math.round(Number(selectedPlan.prixBase) * 12 * 0.85) + totalModules * 12
                                            : Number(selectedPlan.prixBase) + totalModules,
                                    )} {selectedPlan.devise}
                                </div>
                                <div className="text-xs text-[var(--color-texte-secondaire)]">
                                    /{cycle === 'MENSUEL' ? 'mois' : 'an'}
                                </div>
                            </div>
                            <button className="px-6 py-3 rounded-lg bg-[var(--color-dominante)] text-white font-medium hover:opacity-90 transition-opacity flex items-center gap-2">
                                Souscrire <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export const Route = createFileRoute('/platform/tarifs')({
    component: TarifsPage,
});
