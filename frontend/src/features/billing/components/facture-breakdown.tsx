/**
 * ==================================
 * eLISAschool - Composant FactureBreakdown v5.0
 * ==================================
 *
 * Récapitulatif ligne par ligne de la cascade des promotions.
 * Affiche le détail par scope (plan/packs/quota/modules/gratuités)
 * avec les montants avant/après et les promotions appliquées.
 *
 * Version: 5.0.0
 * Auteur: franck arlos chendjou
 */

import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight, Gift, Percent, Banknote, Check } from 'lucide-react';
import type { ResultatCascadePromotions, LignePromotionResult } from '@/features/billing/types/promotion.types';
import { TypePromotion, SCOPE_LABELS, formaterValeurPromotion } from '@/features/billing/types/promotion.types';

interface FactureBreakdownProps {
    resultat: ResultatCascadePromotions;
    /** Devise (défaut: FCFA) */
    devise?: string;
    /** Mode compact (cache les sections vides) */
    compact?: boolean;
}

const TYPE_ICONS = {
    [TypePromotion.POURCENTAGE]: Percent,
    [TypePromotion.MONTANT_FIXE]: Banknote,
    [TypePromotion.GRATUITE]: Gift,
} as const;

function formatMontant(v: number, devise: string): string {
    return `${v.toLocaleString('fr-FR')} ${devise}`;
}

export const FactureBreakdown = memo(function FactureBreakdown({
    resultat,
    devise = 'FCFA',
    compact = false,
}: FactureBreakdownProps) {
    const { t } = useTranslation('promotions');
    const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set(['plan', 'packs', 'quota', 'modules']));

    const togglePhase = (phase: string) => {
        setExpandedPhases(prev => {
            const next = new Set(prev);
            if (next.has(phase)) next.delete(phase);
            else next.add(phase);
            return next;
        });
    };

    const economieTotale = resultat.montantAvantPromotions - resultat.montantFinal;
    const pourcentageEconomie = resultat.montantAvantPromotions > 0
        ? Math.round((economieTotale / resultat.montantAvantPromotions) * 100)
        : 0;

    const phases = [
        {
            key: 'plan',
            label: t('breakdown.plan'),
            subtitle: t('breakdown.plafond40'),
            montantAvant: resultat.plan.montantAvant,
            montantApres: resultat.plan.montantApres,
            promotions: resultat.plan.promotions,
            color: 'blue',
        },
        {
            key: 'packs',
            label: t('breakdown.packs'),
            subtitle: t('breakdown.sansPlafond'),
            montantAvant: resultat.packs.montantAvant,
            montantApres: resultat.packs.montantApres,
            promotions: resultat.packs.promotions,
            color: 'emerald',
        },
        {
            key: 'quota',
            label: t('breakdown.quota'),
            subtitle: t('breakdown.sansPlafond'),
            montantAvant: resultat.quota?.montantAvant ?? 0,
            montantApres: resultat.quota?.montantApres ?? 0,
            promotions: resultat.quota?.promotions ?? [],
            color: 'cyan',
        },
        {
            key: 'modules',
            label: t('breakdown.modules'),
            subtitle: t('breakdown.sansPlafond'),
            montantAvant: resultat.modules.montantAvant,
            montantApres: resultat.modules.montantApres,
            promotions: resultat.modules.promotions,
            color: 'violet',
        },
    ];

    const COLOR_MAP: Record<string, { bg: string; text: string; border: string; badge: string }> = {
        blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', badge: 'bg-blue-500/15 text-blue-400' },
        emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', badge: 'bg-emerald-500/15 text-emerald-400' },
        cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20', badge: 'bg-cyan-500/15 text-cyan-400' },
        violet: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20', badge: 'bg-violet-500/15 text-violet-400' },
    };

    // Ne pas afficher si aucune promotion
    if (resultat.toutesPromotions.length === 0 && compact) {
        return null;
    }

    return (
        <div className="rounded-2xl border border-[var(--color-bordure)] bg-[var(--color-surface)] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--color-bordure)] px-4 py-3">
                <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-400" />
                    <span className="text-sm font-semibold text-[var(--color-texte)]">
                        {t('breakdown.titre')}
                    </span>
                    <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-medium text-green-400">
                        {resultat.toutesPromotions.length}
                    </span>
                </div>
                {economieTotale > 0 && (
                    <div className="text-right">
                        <p className="text-sm font-bold text-green-400">
                            −{formatMontant(economieTotale, devise)}
                        </p>
                        <p className="text-[10px] text-[var(--color-texte-muted)]">
                            −{pourcentageEconomie}%
                        </p>
                    </div>
                )}
            </div>

            {/* Phases */}
            <div className="divide-y divide-[var(--color-bordure)]/50">
                {phases.map((phase) => {
                    const colors = COLOR_MAP[phase.color];
                    const isExpanded = expandedPhases.has(phase.key);
                    const aDesPromos = phase.promotions.length > 0;
                    const economie = phase.montantAvant - phase.montantApres;

                    if (compact && !aDesPromos) return null;

                    return (
                        <div key={phase.key}>
                            {/* Phase header */}
                            <button
                                onClick={() => togglePhase(phase.key)}
                                className="flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-[var(--color-surface-hover)]/50"
                            >
                                <div className="flex items-center gap-2">
                                    {isExpanded
                                        ? <ChevronDown className="h-3.5 w-3.5 text-[var(--color-texte-muted)]" />
                                        : <ChevronRight className="h-3.5 w-3.5 text-[var(--color-texte-muted)]" />
                                    }
                                    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${colors.badge}`}>
                                        {phase.label}
                                    </span>
                                    <span className="text-[10px] text-[var(--color-texte-muted)]">
                                        {phase.subtitle}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-xs">
                                    <span className="text-[var(--color-texte-muted)]">
                                        {formatMontant(phase.montantAvant, devise)}
                                    </span>
                                    {economie > 0 && (
                                        <span className="text-red-400 font-medium">
                                            → {formatMontant(phase.montantApres, devise)}
                                        </span>
                                    )}
                                </div>
                            </button>

                            {/* Promotions detail */}
                            {isExpanded && (
                                <div className="px-4 pb-2.5 pl-10">
                                    {!aDesPromos ? (
                                        <p className="text-xs text-[var(--color-texte-muted)] italic">
                                            {t('breakdown.aucuneScope')}
                                        </p>
                                    ) : (
                                        <div className="space-y-1.5">
                                            {phase.promotions.map((promo, idx) => (
                                                <PromoLine key={`${promo.promotionId}-${idx}`} promo={promo} devise={devise} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Phase 4 — Gratuités */}
                {resultat.gratuités.length > 0 && (
                    <div className="px-4 py-2.5">
                        <div className="flex items-center gap-2 mb-2">
                            <Gift className="h-3.5 w-3.5 text-green-400" />
                            <span className="rounded-md bg-green-500/15 px-2 py-0.5 text-xs font-medium text-green-400">
                                {t('breakdown.gratuites')}
                            </span>
                        </div>
                        <div className="space-y-1.5 pl-5">
                            {resultat.gratuités.map((promo, idx) => (
                                <PromoLine key={`${promo.promotionId}-gratuite-${idx}`} promo={promo} devise={devise} />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer — Total */}
            <div className="flex items-center justify-between border-t border-[var(--color-bordure)] bg-[var(--color-surface-hover)]/30 px-4 py-3">
                <span className="text-sm font-medium text-[var(--color-texte-secondaire)]">
                    {t('breakdown.totalApres')}
                </span>
                <span className="text-lg font-bold text-[var(--color-texte)]">
                    {formatMontant(resultat.montantFinal, devise)}
                </span>
            </div>
        </div>
    );
});

// =============================================
// Ligne de promotion individuelle
// =============================================

function PromoLine({ promo, devise }: { promo: LignePromotionResult; devise: string }) {
    const Icon = TYPE_ICONS[promo.type];

    return (
        <div className="flex items-center justify-between rounded-lg bg-[var(--color-surface-hover)]/50 px-3 py-1.5">
            <div className="flex items-center gap-2">
                <Icon className="h-3 w-3 text-[var(--color-texte-muted)]" />
                <span className="text-xs font-mono text-[var(--color-texte-secondaire)]">
                    {promo.code}
                </span>
                <span className="text-[10px] text-[var(--color-texte-muted)]">
                    {SCOPE_LABELS[promo.scope]}
                </span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-red-400">
                    {formaterValeurPromotion(promo.type, promo.valeur)}
                </span>
                <span className="text-[10px] text-[var(--color-texte-muted)]">
                    (−{formatMontant(promo.montantDeduit, devise)})
                </span>
            </div>
        </div>
    );
}
