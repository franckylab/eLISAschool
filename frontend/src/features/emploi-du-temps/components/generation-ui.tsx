/**
 * ==================================
 * eLISAschool - Composants partagés de génération EDT/Heures de cours
 * ==================================
 * Statistiques et breakdown réutilisables dans les modals de génération.
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { type ReactNode } from 'react';
import {
    Calendar, Clock, BookOpen, AlertTriangle, CheckCircle2,
    XCircle, MinusCircle, BarChart3,
} from 'lucide-react';

// ─── GenerationStatsCard ─────────────────────────────────
// Carte statistique compacte pour les modals de génération.
// Utilisée dans les étapes preview et résultat.

type StatsColor = 'dominant' | 'accent' | 'success' | 'warning' | 'danger' | 'info';

const COLOR_MAP: Record<StatsColor, string> = {
    dominant: 'bg-[var(--color-dominant-50)] text-[var(--color-dominant-700)] border-[var(--color-dominant-200)] dark:bg-[var(--color-dominant-900)]/20 dark:text-[var(--color-dominant-300)] dark:border-[var(--color-dominant-700)]/30',
    accent: 'bg-[var(--color-accent-50)] text-[var(--color-accent-700)] border-[var(--color-accent-200)] dark:bg-[var(--color-accent-900)]/20 dark:text-[var(--color-accent-300)] dark:border-[var(--color-accent-700)]/30',
    success: 'bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/20 dark:bg-[var(--color-success)]/15 dark:border-[var(--color-success)]/30',
    warning: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/20 dark:bg-[var(--color-warning)]/15 dark:border-[var(--color-warning)]/30',
    danger: 'bg-[var(--color-danger)]/10 text-[var(--color-danger)] border-[var(--color-danger)]/20 dark:bg-[var(--color-danger)]/15 dark:border-[var(--color-danger)]/30',
    info: 'bg-[var(--color-info)]/10 text-[var(--color-info)] border-[var(--color-info)]/20 dark:bg-[var(--color-info)]/15 dark:border-[var(--color-info)]/30',
};

export function GenerationStatsCard({ icon, label, value, color, suffix }: {
    icon: ReactNode;
    label: string;
    value: string | number;
    color: StatsColor;
    suffix?: string;
}) {
    return (
        <div className={`p-[clamp(0.5rem,0.4rem+0.3vw,0.75rem)] rounded-[var(--radius-md)] border ${COLOR_MAP[color]}`}>
            <div className="flex items-center gap-[var(--gap-xxs)] mb-1 opacity-80">
                {icon}
                <span className="text-[clamp(0.5625rem,0.5rem+0.2vw,0.6875rem)] font-medium uppercase tracking-wide truncate">{label}</span>
            </div>
            <div className="flex items-baseline gap-1">
                <span className="text-[clamp(1.125rem,1rem+0.5vw,1.5rem)] font-bold leading-tight">{value}</span>
                {suffix && <span className="text-[clamp(0.6875rem,0.63rem+0.2vw,0.8125rem)] opacity-70">{suffix}</span>}
            </div>
        </div>
    );
}

// ─── Presets d'icônes pour stats ──────────────────────────

export const StatsIcons = {
    creneaux: <Calendar className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />,
    heures: <Clock className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />,
    matieres: <BookOpen className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />,
    conflits: <AlertTriangle className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />,
    creees: <CheckCircle2 className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />,
    ignorees: <MinusCircle className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />,
    erreurs: <XCircle className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />,
    total: <BarChart3 className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />,
} as const;

// ─── GenerationResultBreakdown ────────────────────────────
// Breakdown détaillé par matière pour les résultats de génération.
// Affiche un tableau compact avec barres de progression inline.

export interface BreakdownItem {
    matiereId: string;
    matiereNom: string;
    matiereCouleur?: string | null;
    classeNom?: string;
    creees?: number;
    ignorees?: number;
    creneaux?: number;
    heures?: number;
}

export function GenerationResultBreakdown({ items, type }: {
    items: BreakdownItem[];
    type: 'resultat' | 'preview';
}) {
    if (items.length === 0) return null;

    const max = Math.max(...items.map(i =>
        type === 'resultat' ? (i.creees ?? 0) + (i.ignorees ?? 0) : (i.creneaux ?? 0)
    ), 1);

    return (
        <div className="space-y-[var(--space-xxs)]">
            {items.map((item) => {
                const primary = type === 'resultat' ? (item.creees ?? 0) : (item.creneaux ?? 0);
                const secondary = type === 'resultat' ? (item.ignorees ?? 0) : 0;
                const total = primary + secondary;
                const pct = Math.round((total / max) * 100);
                const couleur = item.matiereCouleur || 'var(--color-dominant-500)';

                return (
                    <div key={item.matiereId} className="flex items-center gap-[var(--gap-xs)] py-[var(--space-xxs)]">
                        {/* Barre de couleur matière */}
                        <div
                            className="h-6 w-[3px] rounded-full shrink-0"
                            style={{ backgroundColor: couleur }}
                        />

                        {/* Nom matière + classe */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-[var(--gap-xs)]">
                                <span
                                    className="text-[clamp(0.6875rem,0.63rem+0.2vw,0.8125rem)] font-medium truncate text-[var(--color-text-primary)]"
                                >
                                    {item.matiereNom}
                                </span>
                                {item.classeNom && (
                                    <span className="text-[clamp(0.5625rem,0.5rem+0.15vw,0.6875rem)] text-[var(--color-text-muted)] truncate">
                                        {item.classeNom}
                                    </span>
                                )}
                            </div>
                            {/* Barre de progression inline */}
                            <div className="h-1 rounded-full bg-[var(--color-bordure)] mt-0.5 overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-300"
                                    style={{
                                        width: `${pct}%`,
                                        backgroundColor: couleur,
                                        opacity: 0.7,
                                    }}
                                />
                            </div>
                        </div>

                        {/* Valeurs */}
                        <div className="flex items-center gap-[var(--gap-sm)] shrink-0 text-[clamp(0.625rem,0.57rem+0.15vw,0.75rem)]">
                            {type === 'resultat' ? (
                                <>
                                    <span className="text-[var(--color-success)] font-semibold">{item.creees}</span>
                                    {(item.ignorees ?? 0) > 0 && (
                                        <span className="text-[var(--color-warning)]">{item.ignorees}</span>
                                    )}
                                </>
                            ) : (
                                <>
                                    <span className="font-semibold text-[var(--color-text-primary)]">{primary}</span>
                                    {item.heures != null && (
                                        <span className="text-[var(--color-text-muted)]">{item.heures}h</span>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ─── MiniBarChart ─────────────────────────────────────────
// Mini graphique en barres pour la distribution par jour.

export function MiniBarChart({ data, maxBars = 7 }: {
    data: Array<{ label: string; value: number; color?: string }>;
    maxBars?: number;
}) {
    const sliced = data.slice(0, maxBars);
    const max = Math.max(...sliced.map(d => d.value), 1);

    return (
        <div className="flex items-end gap-[var(--gap-xxs)] h-12">
            {sliced.map((d, i) => {
                const height = Math.max((d.value / max) * 100, 8);
                return (
                    <div key={i} className="flex flex-col items-center gap-0.5 flex-1 min-w-0">
                        <div
                            className="w-full rounded-t-sm transition-all duration-300"
                            style={{
                                height: `${height}%`,
                                backgroundColor: d.color || 'var(--color-dominant-500)',
                                opacity: 0.75,
                            }}
                        />
                        <span className="text-[clamp(0.5rem,0.45rem+0.1vw,0.625rem)] text-[var(--color-text-muted)] truncate w-full text-center leading-none">
                            {d.label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
