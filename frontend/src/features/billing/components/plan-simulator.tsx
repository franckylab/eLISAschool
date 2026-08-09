/**
 * ==================================
 * eLISAschool - Simulateur de Plan
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Phase K.4 — Refonte SaaS v3
 * Simulateur de plan tarifaire avec calcul en temps réel.
 * L'utilisateur sélectionne un plan + nombre d'élèves → calcul du montant.
 * Comparaison côte-à-côte entre plans.
 */

import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import {
    Calculator,
    Check,
    ArrowRight,
    Users,
    Sparkles,
} from 'lucide-react';

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
}

interface SimulationResult {
    plan: { id: string; nom: string; slug: string };
    nombreEleves: number;
    prixBase: number;
    montantSupplementaire: number;
    montantTotal: number;
    devise: string;
    modulesInclus: string[];
}

// =============================================
// Hooks
// =============================================

function usePlansDisponibles() {
    return useQuery<Plan[] | undefined>({
        queryKey: ['plans-catalogue'],
        queryFn: async () => {
            const res = await apiClient.get<Plan[]>('/api/billing/plans');
            return res.data;
        },
    });
}

function useSimulerPlan() {
    return useMutation<{ data: SimulationResult } | undefined, Error, { planId: string; nombreEleves: number; cycleFacturation: string }>({
        mutationFn: async (params) => {
            const res = await apiClient.post<SimulationResult>('/api/billing/simuler', params);
            return res.data ? { data: res.data } : undefined;
        },
    });
}

// =============================================
// Composant principal
// =============================================

export function PlanSimulator() {
    const { data: plans, isLoading } = usePlansDisponibles();
    const simulerMutation = useSimulerPlan();

    const [planSelectionne, setPlanSelectionne] = useState<string | null>(null);
    const [nombreEleves, setNombreEleves] = useState<number>(100);
    const [cycle, setCycle] = useState<'MENSUEL' | 'ANNUEL'>('MENSUEL');
    const [resultat, setResultat] = useState<SimulationResult | null>(null);

    const planActif = useMemo(() => plans?.find(p => p.id === planSelectionne), [plans, planSelectionne]);

    const handleSimuler = () => {
        if (!planSelectionne) return;
        simulerMutation.mutate(
            { planId: planSelectionne, nombreEleves, cycleFacturation: cycle },
            {
                onSuccess: (res) => setResultat(res?.data ?? null),
            }
        );
    };

    const formatPrix = (montant: number, devise = 'XAF') =>
        new Intl.NumberFormat('fr-FR').format(montant) + ' ' + devise;

    if (isLoading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-8 bg-muted rounded w-1/3" />
                <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-48 bg-muted rounded-xl" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Calculator className="w-6 h-6 text-primary" />
                <div>
                    <h2 className="text-xl font-bold">Simulateur de plan</h2>
                    <p className="text-sm text-muted-foreground">
                        Estimez le coût mensuel selon votre nombre d'élèves
                    </p>
                </div>
            </div>

            {/* Contrôles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Nombre d'élèves */}
                <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        Nombre d'élèves
                    </label>
                    <input
                        type="range"
                        min={10}
                        max={2000}
                        step={10}
                        value={nombreEleves}
                        onChange={(e) => setNombreEleves(Number(e.target.value))}
                        className="w-full accent-primary"
                    />
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">10</span>
                        <span className="font-bold text-lg text-primary">{nombreEleves}</span>
                        <span className="text-muted-foreground">2000</span>
                    </div>
                    <input
                        type="number"
                        min={10}
                        max={5000}
                        value={nombreEleves}
                        onChange={(e) => setNombreEleves(Math.max(10, Number(e.target.value)))}
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                </div>

                {/* Cycle de facturation */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Cycle de facturation</label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => setCycle('MENSUEL')}
                            className={`px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                                cycle === 'MENSUEL'
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-border hover:bg-muted'
                            }`}
                        >
                            Mensuel
                        </button>
                        <button
                            onClick={() => setCycle('ANNUEL')}
                            className={`px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                                cycle === 'ANNUEL'
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-border hover:bg-muted'
                            }`}
                        >
                            Annuel
                            <span className="block text-xs text-green-600 mt-0.5">-15%</span>
                        </button>
                    </div>
                </div>

                {/* Simuler */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Action</label>
                    <button
                        onClick={handleSimuler}
                        disabled={!planSelectionne || simulerMutation.isPending}
                        className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
                    >
                        {simulerMutation.isPending ? (
                            <span className="animate-spin">⏳</span>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                Simuler
                            </>
                        )}
                    </button>
                    {resultat && (
                        <div className="text-center p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                            <div className="text-xs text-muted-foreground">Estimation {cycle === 'MENSUEL' ? '/mois' : '/an'}</div>
                            <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                                {formatPrix(resultat.montantTotal, resultat.devise)}
                            </div>
                            {resultat.montantSupplementaire > 0 && (
                                <div className="text-xs text-muted-foreground mt-1">
                                    + {formatPrix(resultat.montantSupplementaire, resultat.devise)} (élèves sup.)
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Comparaison des plans */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {plans?.map((plan) => {
                    const isSelected = planSelectionne === plan.id;
                    const modulesCount = plan.modulesInclus?.length || 0;

                    return (
                        <div
                            key={plan.id}
                            onClick={() => setPlanSelectionne(plan.id)}
                            className={`relative border rounded-xl p-5 cursor-pointer transition-all ${
                                isSelected
                                    ? 'border-primary ring-2 ring-primary/20 shadow-md'
                                    : 'border-border hover:border-primary/50 hover:shadow-sm'
                            }`}
                        >
                            {plan.badge && (
                                <span className="absolute -top-2 right-4 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                                    {plan.badge}
                                </span>
                            )}

                            <h3 className="text-lg font-bold">{plan.nom}</h3>
                            {plan.description && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{plan.description}</p>
                            )}

                            <div className="mt-4 flex items-baseline gap-1">
                                <span className="text-3xl font-bold">{new Intl.NumberFormat('fr-FR').format(plan.prixBase)}</span>
                                <span className="text-sm text-muted-foreground">{plan.devise}/mois</span>
                            </div>

                            <div className="mt-3 space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-muted-foreground" />
                                    <span>Jusqu'à <strong>{plan.maxEleves}</strong> élèves</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-green-600" />
                                    <span><strong>{modulesCount}</strong> modules inclus</span>
                                </div>
                            </div>

                            {/* Modules inclus */}
                            {plan.modulesInclus && plan.modulesInclus.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-1">
                                    {plan.modulesInclus.slice(0, 5).map((mod) => (
                                        <span key={mod} className="text-xs bg-muted px-2 py-0.5 rounded">
                                            {mod.replace(/_/g, ' ')}
                                        </span>
                                    ))}
                                    {modulesCount > 5 && (
                                        <span className="text-xs text-muted-foreground">+{modulesCount - 5}</span>
                                    )}
                                </div>
                            )}

                            {/* Bouton sélectionner */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setPlanSelectionne(plan.id);
                                }}
                                className={`mt-4 w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                                    isSelected
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted hover:bg-primary/10 text-foreground'
                                }`}
                            >
                                {isSelected ? (
                                    <>
                                        <Check className="w-4 h-4" /> Sélectionné
                                    </>
                                ) : (
                                    <>
                                        <ArrowRight className="w-4 h-4" /> Choisir
                                    </>
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Détail du plan sélectionné */}
            {planActif && resultat && (
                <div className="border rounded-xl p-6 space-y-4 bg-card">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        Détail de l'estimation — {planActif.nom}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <div className="text-sm text-muted-foreground">Prix de base</div>
                            <div className="font-semibold">{formatPrix(resultat.prixBase, resultat.devise)}</div>
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground">Supplément élèves</div>
                            <div className="font-semibold">
                                {resultat.montantSupplementaire > 0
                                    ? '+ ' + formatPrix(resultat.montantSupplementaire, resultat.devise)
                                    : 'Inclus'}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground">Élèves</div>
                            <div className="font-semibold">{resultat.nombreEleves}</div>
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground">Total {cycle === 'MENSUEL' ? '/mois' : '/an'}</div>
                            <div className="text-xl font-bold text-primary">{formatPrix(resultat.montantTotal, resultat.devise)}</div>
                        </div>
                    </div>

                    {/* Modules inclus */}
                    <div className="pt-3 border-t">
                        <h4 className="text-sm font-medium mb-2">Modules inclus dans ce plan</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {resultat.modulesInclus.map((mod) => (
                                <div key={mod} className="flex items-center gap-2 text-sm">
                                    <Check className="w-3 h-3 text-green-600" />
                                    <span>{mod.replace(/_/g, ' ')}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="pt-3 flex items-center gap-3">
                        <button className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium flex items-center gap-2">
                            S'abonner <ArrowRight className="w-4 h-4" />
                        </button>
                        <span className="text-xs text-muted-foreground">
                            Vous pourrez modifier votre plan à tout moment
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PlanSimulator;
