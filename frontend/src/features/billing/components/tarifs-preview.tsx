/**
 * ==================================
 * eLISAschool - Tarifs Preview (composant partagé)
 * ==================================
 * Prévisualisation des plans et tarifs, réutilisable en mode
 * admin (platform.tarifs.tsx) et tenant (_auth.plans.tsx).
 *
 * Refonte v4.3 — Chargement remises depuis API (plus de hardcodé).
 *
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { apiClient } from '@/lib/api-client';
import {
    Check,
    Users,
    Package,
    Calculator,
    ArrowRight,
    Zap,
    Shield,
    Crown,
    CreditCard,
    Sparkles,
    Star,
    School,
    HardDrive,
    MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { ElisaButton } from '@/components/ui';
import type { Plan, CycleFacturation } from '@/features/billing/types/plan.types';
import { formatPrix } from '@/features/billing/types/plan.types';

// =============================================
// Types
// =============================================

interface TarifsPreviewProps {
    plans: Plan[];
    /** Cycles de facturation (optionnel, chargés depuis API si absents) */
    cycles?: CycleFacturation[];
    /** Mode : admin = prévisualisation, tenant = avec sélection */
    mode?: 'admin' | 'tenant';
    /** Plan sélectionné (mode tenant) */
    selectedPlanId?: string | null;
    /** Callback sélection (mode tenant) */
    onPlanSelect?: (planId: string) => void;
    /** Afficher le tableau comparatif intégré (défaut: true, false en mode tenant si ComparisonTable externe) */
    showComparison?: boolean;
}

// =============================================
// Icons mapping
// =============================================

const PLAN_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    decouverte: Shield,
    gratuit: Shield,
    starter: Zap,
    standard: Sparkles,
    pro: Crown,
    enterprise: CreditCard,
};

// =============================================
// Hooks
// =============================================

function useCyclesFacturation() {
    return useQuery<CycleFacturation[]>({
        queryKey: ['cycles-facturation-tarifs'],
        queryFn: async () => {
            const res = await apiClient.get<CycleFacturation[]>('/api/platform/cycles-facturation');
            const payload = res.data as any;
            return Array.isArray(payload) ? payload : payload?.data ?? [];
        },
    });
}

// =============================================
// Composant principal
// =============================================

export function TarifsPreview({
    plans,
    cycles: cyclesProp,
    mode = 'admin',
    selectedPlanId,
    onPlanSelect,
    showComparison = true,
}: TarifsPreviewProps) {
    const { t } = useTranslation('plans');
    const { data: cyclesApi } = useCyclesFacturation();
    const cycles = cyclesProp ?? cyclesApi ?? [];

    const [cycle, setCycle] = useState<string>('MENSUEL');

    // Construire les remises et durées depuis les cycles API
    const remises = useMemo(() => {
        const map: Record<string, number> = { MENSUEL: 0 };
        cycles.forEach(c => {
            map[c.code] = Number(c.remisePourcent) || 0;
        });
        if (!map.TRIMESTRIEL && !cycles.find(c => c.code === 'TRIMESTRIEL')) map.TRIMESTRIEL = 5;
        if (!map.SEMESTRIEL && !cycles.find(c => c.code === 'SEMESTRIEL')) map.SEMESTRIEL = 7.5;
        if (!map.ANNUEL && !cycles.find(c => c.code === 'ANNUEL')) map.ANNUEL = 10;
        return map;
    }, [cycles]);

    const durees = useMemo(() => {
        const map: Record<string, number> = { MENSUEL: 1 };
        cycles.forEach(c => {
            map[c.code] = Number(c.dureeMois) || 1;
        });
        if (!map.TRIMESTRIEL) map.TRIMESTRIEL = 3;
        if (!map.SEMESTRIEL) map.SEMESTRIEL = 6;
        if (!map.ANNUEL) map.ANNUEL = 12;
        return map;
    }, [cycles]);

    // Cycles disponibles (actifs)
    const cyclesDisponibles = useMemo(() => {
        const actifs = cycles.filter(c => c.actif).sort((a, b) => a.ordre - b.ordre);
        if (actifs.length === 0) {
            return ['MENSUEL', 'TRIMESTRIEL', 'SEMESTRIEL', 'ANNUEL'];
        }
        return actifs.map(c => c.code);
    }, [cycles]);

    const prixCycle = (plan: Plan, cycleCode: string): number => {
        const remise = remises[cycleCode] ?? 0;
        const duree = durees[cycleCode] ?? 1;
        return Number(plan.prixBase) * duree * (1 - remise / 100);
    };

    const plansVisibles = useMemo(
        () => plans.filter(p => p.visiblePubliquement !== false).sort((a, b) => (a.rang ?? 0) - (b.rang ?? 0)),
        [plans],
    );

    if (plansVisibles.length === 0) {
        return (
            <div className="py-12 text-center text-[var(--color-texte-secondaire)]">
                {t('commun.aucunResultat')}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Cycle toggle */}
            <div className="flex justify-center">
                <div className="inline-flex flex-wrap items-center justify-center gap-1 rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface-hover)]/30 p-1" role="radiogroup" aria-label={t('tarifs.cycleFacturation', 'Cycle de facturation')}>
                    {cyclesDisponibles.map((c) => (
                        <button
                            key={c}
                            onClick={() => setCycle(c)}
                            role="radio"
                            aria-checked={cycle === c}
                            className={cn(
                                'relative rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 sm:px-4',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dominante)]/50',
                                cycle === c
                                    ? 'bg-[var(--color-dominante)] text-white shadow-sm'
                                    : 'text-[var(--color-texte-secondaire)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-texte)]',
                            )}
                        >
                            <span className="capitalize">{t(`tarifs.${c.toLowerCase()}` as any, c)}</span>
                            {(remises[c] ?? 0) > 0 && (
                                <span className={cn(
                                    'ml-1.5 inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-semibold',
                                    cycle === c
                                        ? 'bg-white/20 text-white'
                                        : 'bg-[var(--color-success-600)]/10 text-[var(--color-success-600)]',
                                )}>
                                    −{remises[c]}%
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {plansVisibles.map(plan => {
                    const Icon = PLAN_ICONS[plan.slug] || Package;
                    const cycleAutorise = plan.cyclesAutorises?.includes(cycle) ?? true;
                    const prix = prixCycle(plan, cycle);
                    const quotas = plan.quotas ?? {};
                    const nbEleves = quotas.eleves;
                    const isSelected = selectedPlanId === plan.id;
                    const estRecommande = plan.estParDefaut === true || /recommand/i.test(plan.badge ?? '') || /recommended/i.test(plan.badge ?? '');

                    return (
                        <motion.div
                            key={plan.id}
                            layout
                            className={cn(
                                'relative flex flex-col rounded-2xl border-2 p-5 transition-all duration-200 sm:p-6',
                                estRecommande && !isSelected && 'border-[var(--color-dominante)]/60 shadow-md',
                                isSelected
                                    ? 'border-[var(--color-dominante)] ring-2 ring-[var(--color-dominante)]/20 shadow-lg'
                                    : estRecommande
                                        ? 'hover:shadow-lg'
                                        : 'border-[var(--color-bordure)] hover:border-[var(--color-dominante)]/40 hover:shadow-sm',
                                !cycleAutorise && 'opacity-50 pointer-events-none',
                                mode === 'admin' && 'cursor-default',
                                mode === 'tenant' && cycleAutorise && 'cursor-pointer',
                            )}
                            onClick={() => mode === 'tenant' && cycleAutorise && onPlanSelect?.(plan.id)}
                            whileHover={mode === 'tenant' && cycleAutorise ? { y: -2 } : undefined}
                        >
                            {/* Badge recommandé / custom */}
                            {(plan.badge || plan.estParDefaut) && (
                                <span className={cn(
                                    'absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-4 py-1 text-xs font-bold shadow-sm',
                                    estRecommande
                                        ? 'bg-[var(--color-dominante)] text-white'
                                        : 'bg-[var(--color-surface-hover)] text-[var(--color-texte)] border border-[var(--color-bordure)]',
                                )}>
                                    {estRecommande && <Star className="mr-1 inline h-3 w-3" />}
                                    {plan.badge || t('tarifs.parDefaut')}
                                </span>
                            )}

                            {/* Icon + Name */}
                            <div className="mb-4 flex items-center gap-3">
                                <div className={cn(
                                    'flex h-11 w-11 items-center justify-center rounded-xl transition-colors',
                                    isSelected || estRecommande
                                        ? 'bg-[var(--color-dominante)]/10 text-[var(--color-dominante)]'
                                        : 'bg-[var(--color-surface-hover)] text-[var(--color-texte-muted)]',
                                )}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="truncate font-bold text-[var(--color-texte)]">{plan.nom}</h3>
                                    {plan.description && (
                                        <p className="line-clamp-1 text-xs text-[var(--color-texte-secondaire)]">{plan.description}</p>
                                    )}
                                </div>
                            </div>

                            {/* Prix */}
                            <div className="mb-4">
                                {!cycleAutorise ? (
                                    <p className="text-sm text-[var(--color-texte-secondaire)]">
                                        {t('tarifs.cycleNonDisponible', { cycle: cycle.toLowerCase() })}
                                    </p>
                                ) : (
                                    <>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-extrabold text-[var(--color-texte)] sm:text-3xl">{formatPrix(prix)}</span>
                                            <span className="text-sm text-[var(--color-texte-secondaire)]">
                                                {plan.devise}/{cycle === 'MENSUEL' ? t('tarifs.periode.mois') : t('tarifs.periode.periodes', { count: durees[cycle] })}
                                            </span>
                                        </div>
                                        {(remises[cycle] ?? 0) > 0 && (
                                            <p className="mt-1 text-xs font-medium text-[var(--color-success-600)]">
                                                {t('tarifs.remise')} −{remises[cycle]}%
                                            </p>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Caractéristiques (JSONB v3) */}
                            <ul className="flex-1 space-y-2.5 text-sm">
                                <li className="flex items-center gap-2">
                                    <Users className="h-4 w-4 shrink-0 text-[var(--color-texte-secondaire)]" />
                                    <span>
                                        {nbEleves === 0
                                            ? <><strong>{t('tarifs.illimites')}</strong> {t('tarifs.eleves').toLowerCase()}</>
                                            : <>{t('tarifs.jusqua')} <strong>{nbEleves.toLocaleString('fr-FR')}</strong> {t('tarifs.eleves').toLowerCase()}</>
                                        }
                                    </span>
                                </li>
                                {quotas.utilisateurs !== undefined && quotas.utilisateurs > 0 && (
                                    <li className="flex items-center gap-2">
                                        <Users className="h-4 w-4 shrink-0 text-[var(--color-texte-secondaire)]" />
                                        <span><strong>{quotas.utilisateurs}</strong> {t('tarifs.utilisateurs')}</span>
                                    </li>
                                )}
                                {quotas.classes !== undefined && quotas.classes > 0 && (
                                    <li className="flex items-center gap-2">
                                        <School className="h-4 w-4 shrink-0 text-[var(--color-texte-secondaire)]" />
                                        <span><strong>{quotas.classes}</strong> {t('tarifs.classes').toLowerCase()}</span>
                                    </li>
                                )}
                                {quotas.stockageGo !== undefined && quotas.stockageGo > 0 && (
                                    <li className="flex items-center gap-2">
                                        <HardDrive className="h-4 w-4 shrink-0 text-[var(--color-texte-secondaire)]" />
                                        <span><strong>{quotas.stockageGo}</strong> Go {t('tarifs.stockage').toLowerCase()}</span>
                                    </li>
                                )}
                                {quotas.sms !== undefined && quotas.sms > 0 && (
                                    <li className="flex items-center gap-2">
                                        <MessageSquare className="h-4 w-4 shrink-0 text-[var(--color-texte-secondaire)]" />
                                        <span><strong>{quotas.sms.toLocaleString('fr-FR')}</strong> SMS</span>
                                    </li>
                                )}
                                <li className="flex items-center gap-2">
                                    <Check className="h-4 w-4 shrink-0 text-[var(--color-success-600)]" />
                                    <span><strong>{plan.entitlements?.modules?.length ?? 0}</strong> {t('tarifs.modulesInclus')}</span>
                                </li>
                                {(plan.tarification?.prixParEleve ?? 0) > 0 && (
                                    <li className="flex items-center gap-2">
                                        <Check className="h-4 w-4 shrink-0 text-[var(--color-success-600)]" />
                                        <span>
                                            {formatPrix(plan.tarification!.prixParEleve)} {t('tarifs.prixParEleve')} {plan.tarification!.elevesInclusGratuits}
                                        </span>
                                    </li>
                                )}
                                {plan.essai?.autorise && (
                                    <li className="flex items-center gap-2">
                                        <Check className="h-4 w-4 shrink-0 text-[var(--color-success-600)]" />
                                        <span>{t('tarifs.essaiGratuit')} {plan.essai.dureeJours} {t('tarifs.jours')}</span>
                                    </li>
                                )}
                            </ul>

                            {/* CTA */}
                            <ElisaButton
                                variant={isSelected ? 'primary' : estRecommande ? 'primary' : 'outline'}
                                fullWidth
                                size="sm"
                                className="mt-6"
                                disabled={!cycleAutorise || mode === 'admin'}
                                icon={isSelected ? <Check className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                            >
                                {isSelected ? t('tarifs.selectionne') : t('tarifs.choisirCePlan')}
                            </ElisaButton>
                        </motion.div>
                    );
                })}
            </div>

            {/* Comparatif (masqué si showComparison=false pour éviter doublon avec ComparisonTable) */}
            {showComparison && plansVisibles.length > 1 && (
                <PlanComparison plans={plansVisibles} />
            )}
        </div>
    );
}

// =============================================
// Comparaison des plans
// =============================================

function PlanComparison({ plans }: { plans: Plan[] }) {
    const { t } = useTranslation('plans');

    const RESSOURCES: Array<{ label: string; cle: string }> = [
        { label: t('tarifs.eleves'), cle: 'eleves' },
        { label: t('tarifs.utilisateurs'), cle: 'utilisateurs' },
        { label: t('tarifs.classes'), cle: 'classes' },
        { label: t('tarifs.stockage'), cle: 'stockageGo' },
        { label: t('tarifs.smsParMois'), cle: 'sms' },
    ];

    const formatQuota = (v?: number) =>
        v === undefined ? '—' : v === 0 ? t('tarifs.illimite') : v.toLocaleString('fr-FR');

    return (
        <div className="rounded-2xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-5 sm:p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--color-texte)]">
                <Calculator className="h-5 w-5 text-[var(--color-dominante)]" />
                {t('tarifs.comparaison')}
            </h2>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-[var(--color-bordure)]">
                            <th className="px-3 py-3 text-left font-medium text-[var(--color-texte-secondaire)] sm:px-4">
                                {t('tarifs.caracteristique')}
                            </th>
                            {plans.map(plan => (
                                <th key={plan.id} className="px-3 py-3 text-center sm:px-4">
                                    <div className="font-bold text-[var(--color-texte)]">{plan.nom}</div>
                                    <div className="text-xs text-[var(--color-texte-secondaire)]">
                                        {formatPrix(Number(plan.prixBase))} {plan.devise}/{t('tarifs.periode.mois', 'mois')}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-b border-[var(--color-bordure)]/50 hover:bg-[var(--color-surface-hover)]/50">
                            <td className="px-3 py-2.5 text-[var(--color-texte-secondaire)] sm:px-4">{t('tarifs.prixEleveSup')}</td>
                            {plans.map(plan => (
                                <td key={plan.id} className="px-3 py-2.5 text-center text-[var(--color-texte)] sm:px-4">
                                    {(plan.tarification?.prixParEleve ?? 0) > 0
                                        ? `${formatPrix(plan.tarification!.prixParEleve)} F ${t('tarifs.apres')} ${plan.tarification!.elevesInclusGratuits}`
                                        : '—'}
                                </td>
                            ))}
                        </tr>
                        {RESSOURCES.map(({ label, cle }) => (
                            <tr key={cle} className="border-b border-[var(--color-bordure)]/50 hover:bg-[var(--color-surface-hover)]/50">
                                <td className="px-3 py-2.5 text-[var(--color-texte-secondaire)] sm:px-4">{label}</td>
                                {plans.map(plan => (
                                    <td key={plan.id} className="px-3 py-2.5 text-center text-[var(--color-texte)] sm:px-4">
                                        {formatQuota(plan.quotas?.[cle])}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        <tr className="border-b border-[var(--color-bordure)]/50 hover:bg-[var(--color-surface-hover)]/50">
                            <td className="px-3 py-2.5 text-[var(--color-texte-secondaire)] sm:px-4">{t('tarifs.modulesInclus')}</td>
                            {plans.map(plan => (
                                <td key={plan.id} className="px-3 py-2.5 text-center font-medium text-[var(--color-texte)] sm:px-4">
                                    {plan.entitlements?.modules?.length ?? 0}
                                </td>
                            ))}
                        </tr>
                        <tr className="hover:bg-[var(--color-surface-hover)]/50">
                            <td className="px-3 py-2.5 text-[var(--color-texte-secondaire)] sm:px-4">{t('tarifs.cyclesAutorises')}</td>
                            {plans.map(plan => (
                                <td key={plan.id} className="px-3 py-2.5 text-center text-[var(--color-texte)] sm:px-4">
                                    {(plan.cyclesAutorises ?? []).map(c => t(`tarifs.${c.toLowerCase()}` as any, c)).join(', ')}
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default TarifsPreview;
