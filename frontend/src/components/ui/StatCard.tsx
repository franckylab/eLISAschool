/**
 * ==================================
 * eLISAschool - Carte Statistique Unifiée
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * Composant StatCard générique avec :
 * - Orientation horizontal (défaut) ou vertical
 * - Mode compact pour grilles denses
 * - Effets hover : scale, shadow, transitions couleur
 * - Tendance (hausse/baisse) avec badge
 * - Support loading, subtitle, 9 tones
 */

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Card, CardContent } from './Card';
import { TONE_CLASSES, type CardTone, type TrendData } from './card-variants';

const COLOR_TO_TONE: Record<string, CardTone> = {
    blue: 'accent',
    green: 'success',
    purple: 'purple',
    yellow: 'warning',
    red: 'danger',
    orange: 'orange',
    gray: 'muted',
};

export interface StatCardProps {
    icon: LucideIcon;
    label: string;
    value: string | number;
    tone?: CardTone;
    /** @deprecated Use `tone` instead */
    color?: string;
    delay?: number;
    subtitle?: string;
    trend?: TrendData;
    loading?: boolean;
    className?: string;
    /** Orientation du layout : horizontal (icône gauche) ou vertical (icône haut) */
    orientation?: 'horizontal' | 'vertical';
    /** Mode compact : padding réduit, icône plus petite */
    compact?: boolean;
}

export function StatCard({
    icon: Icon,
    label,
    value,
    tone: toneProp,
    color,
    delay = 0,
    subtitle,
    trend,
    loading,
    className,
    orientation = 'horizontal',
    compact = false,
}: StatCardProps) {
    const tone = toneProp || (color ? (COLOR_TO_TONE[color] ?? 'muted') : 'muted');
    const isVertical = orientation === 'vertical';

    // Tailles responsives adaptées au mode compact
    const iconContainerSize = compact
        ? 'h-[clamp(1.25rem,2cqi+0.25rem,1.5rem)] w-[clamp(1.25rem,2cqi+0.25rem,1.5rem)]'
        : 'h-[clamp(1.5rem,3cqi+0.25rem,1.875rem)] w-[clamp(1.5rem,3cqi+0.25rem,1.875rem)]';

    const iconSize = compact
        ? 'h-[clamp(0.5rem,1.25cqi+0.125rem,0.75rem)] w-[clamp(0.5rem,1.25cqi+0.125rem,0.75rem)]'
        : 'h-[clamp(0.625rem,1.5cqi+0.125rem,0.875rem)] w-[clamp(0.625rem,1.5cqi+0.125rem,0.875rem)]';

    const paddingClass = compact
        ? 'p-[clamp(0.375rem,1cqi+0.125rem,0.5rem)]'
        : 'p-[clamp(0.5rem,1.5cqi+0.25rem,0.75rem)]';

    const watermarkSize = compact
        ? 'h-[clamp(1.5rem,4cqi+0.25rem,2.5rem)] w-[clamp(1.5rem,4cqi+0.25rem,2.5rem)]'
        : 'h-[clamp(2rem,6cqi+0.5rem,3.5rem)] w-[clamp(2rem,6cqi+0.5rem,3.5rem)]';

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4, ease: 'easeOut' }}
            className="h-full"
        >
            <Card
                className={cn(
                    'transition-all duration-200 hover:shadow-md hover:scale-[1.02]',
                    loading && 'animate-pulse pointer-events-none',
                    className,
                )}
            >
                {/* Icône décorative en watermark */}
                <div
                    className={cn(
                        'absolute top-0 right-0 opacity-[0.04] group-hover:opacity-[0.10] transition-all duration-200 pointer-events-none',
                        compact ? 'p-[clamp(0.25rem,0.75cqi+0.125rem,0.5rem)]' : 'p-[clamp(0.375rem,1cqi+0.25rem,0.75rem)]',
                    )}
                >
                    <Icon
                        className={cn(watermarkSize, '-mr-[clamp(0.375rem,1.5cqi+0.25rem,0.75rem)] -mt-[clamp(0.375rem,1.5cqi+0.25rem,0.75rem)] rotate-12')}
                    />
                </div>

                <CardContent className={paddingClass}>
                    {isVertical ? (
                        /* ── Layout Vertical ── */
                        <div className="flex flex-col items-center text-center gap-[clamp(0.25rem,0.75cqi+0.125rem,0.5rem)]">
                            {/* Icône centrée */}
                            <div
                                className={cn(
                                    'rounded-lg flex items-center justify-center shrink-0 border transition-all duration-200',
                                    iconContainerSize,
                                    TONE_CLASSES[tone],
                                    'group-hover:bg-dominant-600 group-hover:text-white group-hover:border-dominant-600',
                                )}
                            >
                                <Icon className={iconSize} />
                            </div>

                            {/* Label */}
                            <p
                                className="font-semibold text-text-secondary uppercase tracking-wider group-hover:text-dominant-600 transition-colors leading-tight truncate max-w-full"
                                style={{ fontSize: compact ? 'clamp(0.5625rem,1.25cqi+0.0625rem,0.6875rem)' : 'clamp(0.625rem,1.5cqi+0.125rem,0.75rem)' }}
                            >
                                {label}
                            </p>

                            {/* Valeur + tendance */}
                            {loading ? (
                                <div className={cn(
                                    'bg-surface-alt rounded animate-pulse',
                                    compact ? 'h-[clamp(0.625rem,1.25cqi+0.25rem,0.875rem)] w-[clamp(1.5rem,4cqi+0.5rem,2.5rem)]' : 'h-[clamp(0.75rem,1.5cqi+0.25rem,1rem)] w-[clamp(2rem,6cqi+0.5rem,3rem)]',
                                )} />
                            ) : (
                                <div className="flex items-baseline gap-[clamp(0.125rem,0.375cqi+0.0625rem,0.25rem)]">
                                    <h3
                                        className="font-bold text-text-primary leading-tight"
                                        style={{ fontSize: compact ? 'clamp(0.875rem,2cqi+0.25rem,1.125rem)' : 'clamp(1rem,2.5cqi+0.25rem,1.25rem)' }}
                                    >
                                        {value}
                                    </h3>
                                    {subtitle && (
                                        <span className="text-text-muted font-semibold tracking-tight leading-tight truncate"
                                            style={{ fontSize: 'clamp(0.5rem,0.75cqi+0.125rem,0.625rem)' }}>
                                            {subtitle}
                                        </span>
                                    )}
                                    {trend && <TrendBadge trend={trend} compact={compact} />}
                                </div>
                            )}
                        </div>
                    ) : (
                        /* ── Layout Horizontal ── */
                        <div className={cn(
                            'flex items-start',
                            compact ? 'gap-[clamp(0.25rem,0.75cqi+0.125rem,0.375rem)]' : 'gap-[clamp(0.375rem,1cqi+0.125rem,0.5rem)]',
                        )}>
                            {/* Icône gauche */}
                            <div
                                className={cn(
                                    'rounded-lg flex items-center justify-center shrink-0 border transition-all duration-200',
                                    iconContainerSize,
                                    TONE_CLASSES[tone],
                                    'group-hover:bg-dominant-600 group-hover:text-white group-hover:border-dominant-600',
                                    compact ? 'mt-0' : 'mt-0.5',
                                )}
                            >
                                <Icon className={iconSize} />
                            </div>

                            {/* Contenu texte */}
                            <div className="min-w-0 flex-1 space-y-[clamp(0.0625rem,0.25cqi+0.0625rem,0.125rem)]">
                                <div className="flex items-center justify-between gap-1">
                                    <p
                                        className="font-semibold text-text-secondary uppercase tracking-wider group-hover:text-dominant-600 transition-colors leading-tight truncate"
                                        style={{ fontSize: compact ? 'clamp(0.5625rem,1.25cqi+0.0625rem,0.6875rem)' : 'clamp(0.625rem,1.5cqi+0.125rem,0.75rem)' }}
                                    >
                                        {label}
                                    </p>
                                    {trend && <TrendBadge trend={trend} compact={compact} />}
                                </div>

                                {loading ? (
                                    <div className={cn(
                                        'bg-surface-alt rounded animate-pulse',
                                        compact ? 'h-[clamp(0.625rem,1.25cqi+0.25rem,0.875rem)] w-[clamp(1.5rem,4cqi+0.5rem,2.5rem)]' : 'h-[clamp(0.75rem,1.5cqi+0.25rem,1rem)] w-[clamp(2rem,6cqi+0.5rem,3rem)]',
                                    )} />
                                ) : (
                                    <div className="flex items-baseline gap-[clamp(0.125rem,0.375cqi+0.0625rem,0.25rem)]">
                                        <h3
                                            className="font-bold text-text-primary leading-tight"
                                            style={{ fontSize: compact ? 'clamp(0.8125rem,2cqi+0.25rem,1.0625rem)' : 'clamp(0.875rem,2.5cqi+0.25rem,1.125rem)' }}
                                        >
                                            {value}
                                        </h3>
                                        {subtitle && (
                                            <span
                                                className="text-text-muted font-semibold tracking-tight leading-tight truncate"
                                                style={{ fontSize: 'clamp(0.5rem,0.75cqi+0.125rem,0.625rem)' }}
                                            >
                                                {subtitle}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}

/* ─── Badge Tendance (extrait pour réutilisation) ─── */

function TrendBadge({ trend, compact }: { trend: TrendData; compact?: boolean }) {
    return (
        <div
            title={`${trend.isPositive ? 'Hausse' : 'Baisse'} de ${Math.abs(trend.value).toFixed(1)}%`}
            className={cn(
                'flex items-center gap-[clamp(0.125rem,0.375cqi+0.0625rem,0.25rem)] rounded-full font-semibold tracking-tight border shrink-0',
                compact
                    ? 'px-[clamp(0.125rem,0.375cqi+0.0625rem,0.25rem)] py-[clamp(0.0625rem,0.125cqi+0.0625rem,0.125rem)] text-[clamp(0.375rem,0.625cqi+0.0625rem,0.5rem)]'
                    : 'px-[clamp(0.1875rem,0.5cqi+0.0625rem,0.375rem)] py-[clamp(0.0625rem,0.25cqi+0.0625rem,0.125rem)] text-[clamp(0.4375rem,0.75cqi+0.0625rem,0.5625rem)]',
                trend.isPositive
                    ? 'bg-success/10 text-success border-success/20'
                    : 'bg-danger/10 text-danger border-danger/20',
            )}
        >
            {trend.isPositive
                ? <TrendingUp className={cn(compact ? 'h-[clamp(0.3rem,0.4cqi+0.0625rem,0.375rem)] w-[clamp(0.3rem,0.4cqi+0.0625rem,0.375rem)]' : 'h-[clamp(0.375rem,0.5cqi+0.0625rem,0.5rem)] w-[clamp(0.375rem,0.5cqi+0.0625rem,0.5rem)]')} />
                : <TrendingDown className={cn(compact ? 'h-[clamp(0.3rem,0.4cqi+0.0625rem,0.375rem)] w-[clamp(0.3rem,0.4cqi+0.0625rem,0.375rem)]' : 'h-[clamp(0.375rem,0.5cqi+0.0625rem,0.5rem)] w-[clamp(0.375rem,0.5cqi+0.0625rem,0.5rem)]')} />}
            {Math.abs(trend.value).toFixed(1)}%
        </div>
    );
}
