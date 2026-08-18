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
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/lib/api-client';
import {
    Calculator,
    Check,
    ArrowRight,
    Users,
    Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Plan, SimulationResult, CycleFacturation } from '@/features/billing/types/plan.types';
import { modulesInclus, formatQuotaEleves, formatPrix } from '@/features/billing/types/plan.types';

// =============================================
// Hooks
// =============================================

function usePlansDisponibles() {
    return useQuery<Plan[] | undefined>({
        queryKey: ['plans-catalogue'],
        queryFn: async () => {
            const res = await apiClient.get<Plan[]>('/api/billing/plans');
            const payload = res.data as any;
            const liste: Plan[] = Array.isArray(payload) ? payload : payload?.data ?? [];
            return [...liste].sort((a, b) => (a.rang ?? 0) - (b.rang ?? 0));
        },
    });
}

function useCyclesFacturation() {
    return useQuery<CycleFacturation[]>({
        queryKey: ['cycles-facturation-simulateur'],
        queryFn: async () => {
            const res = await apiClient.get<CycleFacturation[]>('/api/platform/cycles-facturation');
            const payload = res.data as any;
            return Array.isArray(payload) ? payload : payload?.data ?? [];
        },
    });
}

function useSimulerPlan() {
    return useMutation<SimulationResult | undefined, Error, { planId: string; nombreEleves: number; cycleFacturation: string }>({
        mutationFn: async (params) => {
            const res = await apiClient.post<SimulationResult>('/api/billing/simuler', params);
            const payload = res.data as any;
            return payload?.data ?? (payload?.montantTotal !== undefined ? payload : undefined);
        },
    });
}

// =============================================
// Composant principal
// =============================================

export function PlanSimulator() {
    const { t } = useTranslation('plans');
    const { data: plans, isLoading } = usePlansDisponibles();
    const { data: cyclesApi } = useCyclesFacturation();
    const simulerMutation = useSimulerPlan();

    const [planSelectionne, setPlanSelectionne] = useState<string | null>(null);
    const [nombreEleves, setNombreEleves] = useState<number>(100);
    const [resultat, setResultat] = useState<SimulationResult | null>(null);

    // Cycles dynamiques depuis l'API
    const cyclesDisponibles = useMemo(() => {
        const actifs = (cyclesApi ?? []).filter(c => c.actif).sort((a, b) => a.ordre - b.ordre);
        if (actifs.length === 0) return [{ code: 'MENSUEL', remisePourcent: 0 }, { code: 'ANNUEL', remisePourcent: 10 }];
        return actifs;
    }, [cyclesApi]);

    const [cycle, setCycle] = useState<string>(cyclesDisponibles[0]?.code ?? 'MENSUEL');

    const planActif = useMemo(() => plans?.find(p => p.id === planSelectionne), [plans, planSelectionne]);

    const handleSimuler = () => {
        if (!planSelectionne) return;
        simulerMutation.mutate(
            { planId: planSelectionne, nombreEleves, cycleFacturation: cycle },
            {
                onSuccess: (res) => setResultat(res ?? null),
            }
        );
    };

    if (isLoading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-8 bg-[var(--color-surface-hover)] rounded w-1/3" />
                <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-48 bg-[var(--color-surface-hover)] rounded-xl" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Calculator className="w-6 h-6 text-[var(--color-dominante)]" />
                <div>
                    <h2 className="text-xl font-bold text-[var(--color-texte)]">{t('simulateur.titre')}</h2>
                    <p className="text-sm text-[var(--color-texte-muted)]">
                        {t('simulateur.sousTitre')}
                    </p>
                </div>
            </div>

            {/* Contrôles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Nombre d'élèves */}
                <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2 text-[var(--color-texte)]">
                        <Users className="w-4 h-4 text-[var(--color-texte-muted)]" />
                        {t('simulateur.nombreEleves')}
                    </label>
                    <input
                        type="range"
                        min={10}
                        max={2000}
                        step={10}
                        value={nombreEleves}
                        onChange={(e) => setNombreEleves(Number(e.target.value))}
                        className="w-full accent-[var(--color-dominante)]"
                    />
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-[var(--color-texte-muted)]">10</span>
                        <span className="font-bold text-lg text-[var(--color-dominante)]">{nombreEleves}</span>
                        <span className="text-[var(--color-texte-muted)]">2000</span>
                    </div>
                    <input
                        type="number"
                        min={10}
                        max={5000}
                        value={nombreEleves}
                        onChange={(e) => setNombreEleves(Math.max(10, Number(e.target.value)))}
                        className="w-full border border-[var(--color-bordure)] rounded-lg px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-texte)]"
                    />
                </div>

                {/* Cycle de facturation */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--color-texte)]">{t('simulateur.cycleFacturation')}</label>
                    <div className={cn('grid gap-2', cyclesDisponibles.length > 2 ? 'grid-cols-2' : 'grid-cols-2')}>
                        {cyclesDisponibles.map((c) => (
                            <button
                                key={c.code}
                                onClick={() => setCycle(c.code)}
                                className={cn(
                                    'px-4 py-3 rounded-lg border text-sm font-medium transition-colors',
                                    cycle === c.code
                                        ? 'border-[var(--color-dominante)] bg-[var(--color-dominante)]/10 text-[var(--color-dominante)]'
                                        : 'border-[var(--color-bordure)] hover:bg-[var(--color-surface-hover)]',
                                )}
                            >
                                {c.code.charAt(0) + c.code.slice(1).toLowerCase()}
                                {Number(c.remisePourcent) > 0 && (
                                    <span className="block text-xs text-[var(--color-success-600)] mt-0.5">−{Number(c.remisePourcent)} %</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Simuler */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--color-texte)]">{t('simulateur.action')}</label>
                    <button
                        onClick={handleSimuler}
                        disabled={!planSelectionne || simulerMutation.isPending}
                        className="w-full px-4 py-3 bg-[var(--color-dominante)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
                    >
                        {simulerMutation.isPending ? (
                            <span className="animate-spin">⏳</span>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                {t('simulateur.simuler')}
                            </>
                        )}
                    </button>
                    {resultat && (
                        <div className="text-center p-3 rounded-lg border border-[var(--color-success-200)] bg-[var(--color-success-50)]">
                            <div className="text-xs text-[var(--color-texte-muted)]">
                                {t('simulateur.estimation')} {cycle === 'MENSUEL' ? t('simulateur.parMois') : t('simulateur.parAn')}
                            </div>
                            <div className="text-2xl font-bold text-[var(--color-success-700)]">
                                {formatPrix(resultat.montantTotal, resultat.devise)}
                            </div>
                            {resultat.montantElevesSupplementaires > 0 && (
                                <div className="text-xs text-[var(--color-texte-muted)] mt-1">
                                    + {formatPrix(resultat.montantElevesSupplementaires, resultat.devise)} ({t('simulateur.elevesSup')})
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
                    const modulesCount = modulesInclus(plan).length;

                    return (
                        <div
                            key={plan.id}
                            onClick={() => setPlanSelectionne(plan.id)}
                            className={cn(
                                'relative border rounded-xl p-5 cursor-pointer transition-all',
                                isSelected
                                    ? 'border-[var(--color-dominante)] ring-2 ring-[var(--color-dominante)]/20 shadow-md'
                                    : 'border-[var(--color-bordure)] hover:border-[var(--color-dominante)]/50 hover:shadow-sm',
                            )}
                        >
                            {plan.badge && (
                                <span className="absolute -top-2 right-4 text-xs bg-[var(--color-dominante)] text-white px-2 py-0.5 rounded-full">
                                    {plan.badge}
                                </span>
                            )}

                            <h3 className="text-lg font-bold text-[var(--color-texte)]">{plan.nom}</h3>
                            {plan.description && (
                                <p className="text-sm text-[var(--color-texte-muted)] mt-1 line-clamp-2">{plan.description}</p>
                            )}

                            <div className="mt-4 flex items-baseline gap-1">
                                <span className="text-3xl font-bold text-[var(--color-texte)]">{new Intl.NumberFormat('fr-FR').format(plan.prixBase)}</span>
                                <span className="text-sm text-[var(--color-texte-muted)]">{plan.devise}/mois</span>
                            </div>

                            <div className="mt-3 space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-[var(--color-texte-muted)]" />
                                    <span>{t('simulateur.jusqua', 'Jusqu\'à')} <strong>{formatQuotaEleves(plan, t('plans.illimite', 'illimité'))}</strong> {t('simulateur.eleves', 'élèves')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-[var(--color-success-600)]" />
                                    <span><strong>{modulesCount}</strong> {t('simulateur.modulesInclus')}</span>
                                </div>
                            </div>

                            {/* Modules inclus */}
                            {modulesInclus(plan).length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-1">
                                    {modulesInclus(plan).slice(0, 5).map((mod) => (
                                        <span key={mod} className="text-xs bg-[var(--color-surface-hover)] px-2 py-0.5 rounded text-[var(--color-texte)]">
                                            {mod.replace(/_/g, ' ')}
                                        </span>
                                    ))}
                                    {modulesCount > 5 && (
                                        <span className="text-xs text-[var(--color-texte-muted)]">+{modulesCount - 5}</span>
                                    )}
                                </div>
                            )}

                            {/* Bouton sélectionner */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setPlanSelectionne(plan.id);
                                }}
                                className={cn(
                                    'mt-4 w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors',
                                    isSelected
                                        ? 'bg-[var(--color-dominante)] text-white'
                                        : 'bg-[var(--color-surface-hover)] hover:bg-[var(--color-dominante)]/10 text-[var(--color-texte)]',
                                )}
                            >
                                {isSelected ? (
                                    <>
                                        <Check className="w-4 h-4" /> {t('simulateur.selectionne')}
                                    </>
                                ) : (
                                    <>
                                        <ArrowRight className="w-4 h-4" /> {t('simulateur.choisir')}
                                    </>
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Détail du plan sélectionné */}
            {planActif && resultat && (
                <div className="border border-[var(--color-bordure)] rounded-xl p-6 space-y-4 bg-[var(--color-surface)]">
                    <h3 className="text-lg font-semibold flex items-center gap-2 text-[var(--color-texte)]">
                        <Sparkles className="w-5 h-5 text-[var(--color-dominante)]" />
                        {t('simulateur.detailEstimation', { nom: planActif.nom })}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <div className="text-sm text-[var(--color-texte-muted)]">{t('simulateur.prixBase')}</div>
                            <div className="font-semibold text-[var(--color-texte)]">{formatPrix(resultat.prixBase, resultat.devise)}</div>
                        </div>
                        <div>
                            <div className="text-sm text-[var(--color-texte-muted)]">{t('simulateur.supplementEleves')}</div>
                            <div className="font-semibold text-[var(--color-texte)]">
                                {resultat.montantElevesSupplementaires > 0
                                    ? '+ ' + formatPrix(resultat.montantElevesSupplementaires, resultat.devise)
                                    : t('simulateur.inclus')}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-[var(--color-texte-muted)]">{t('simulateur.nombreEleves')}</div>
                            <div className="font-semibold text-[var(--color-texte)]">{resultat.nombreEleves}</div>
                        </div>
                        <div>
                            <div className="text-sm text-[var(--color-texte-muted)]">{t('simulateur.total')} {cycle === 'MENSUEL' ? t('simulateur.parMois') : t('simulateur.parAn')}</div>
                            <div className="text-xl font-bold text-[var(--color-dominante)]">{formatPrix(resultat.montantTotal, resultat.devise)}</div>
                        </div>
                    </div>

                    {/* Modules inclus */}
                    <div className="pt-3 border-t border-[var(--color-bordure)]">
                        <h4 className="text-sm font-medium mb-2 text-[var(--color-texte)]">{t('simulateur.modulesInclus')}</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {(resultat.modulesInclus ?? []).map((mod) => (
                                <div key={mod} className="flex items-center gap-2 text-sm text-[var(--color-texte)]">
                                    <Check className="w-3 h-3 text-[var(--color-success-600)]" />
                                    <span>{mod.replace(/_/g, ' ')}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="pt-3 flex items-center gap-3">
                        <button className="px-6 py-2.5 bg-[var(--color-dominante)] text-white rounded-lg hover:opacity-90 font-medium flex items-center gap-2">
                            {t('simulateur.sabonner')} <ArrowRight className="w-4 h-4" />
                        </button>
                        <span className="text-xs text-[var(--color-texte-muted)]">
                            {t('simulateur.modifierPlan')}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PlanSimulator;
