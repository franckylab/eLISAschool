import React from 'react';
import { cn } from '@/lib/cn';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { type CardTone } from './card-variants';

const kpiCardVariants = cva(
    'group relative overflow-hidden rounded-xl border text-card-foreground shadow-sm min-w-0',
    {
        variants: {
            tone: {
                dominant: 'border-dominant-200 dark:border-dominant-800 bg-gradient-to-br from-dominant-50/50 to-transparent dark:from-dominant-950/20',
                accent: 'border-accent-200 dark:border-accent-800 bg-gradient-to-br from-accent-50/50 to-transparent dark:from-accent-950/20',
                success: 'border-success/20 bg-gradient-to-br from-success/5 to-transparent',
                danger: 'border-danger/20 bg-gradient-to-br from-danger/5 to-transparent',
                warning: 'border-warning/20 bg-gradient-to-br from-warning/5 to-transparent',
                info: 'border-info/20 bg-gradient-to-br from-info/5 to-transparent',
                muted: 'border-border bg-card',
                purple: 'border-purple-200 bg-gradient-to-br from-purple-50/50 to-transparent',
                orange: 'border-orange-200 bg-gradient-to-br from-orange-50/50 to-transparent',
            },
            size: {
                sm: 'p-[clamp(0.5rem,1.5cqi+0.25rem,1rem)]',
                md: 'p-[clamp(0.75rem,2cqi+0.25rem,1.25rem)]',
            },
        },
        defaultVariants: {
            tone: 'muted',
            size: 'md',
        },
    },
);

const valueVariants = cva('font-semibold tracking-tight', {
    variants: {
        tone: {
            dominant: 'text-dominant-700 dark:text-dominant-400',
            accent: 'text-accent-700 dark:text-accent-400',
            success: 'text-success',
            danger: 'text-danger',
            warning: 'text-warning',
            info: 'text-info',
            muted: 'text-text-primary',
            purple: 'text-purple-600',
            orange: 'text-orange-600',
        },
        size: {
            sm: 'text-[clamp(1rem,4cqi+0.25rem,1.5rem)]',
            md: 'text-[clamp(1.25rem,5cqi+0.25rem,1.875rem)]',
        },
    },
    defaultVariants: {
        tone: 'muted',
        size: 'md',
    },
});

const titleVariants = cva('font-semibold uppercase leading-tight tracking-wider', {
    variants: {
        tone: {
            dominant: 'text-dominant-500 dark:text-dominant-400',
            accent: 'text-accent-500 dark:text-accent-400',
            success: 'text-success/70',
            danger: 'text-danger/70',
            warning: 'text-warning/70',
            info: 'text-info/70',
            muted: 'text-text-muted',
            purple: 'text-purple-500',
            orange: 'text-orange-500',
        },
    },
    defaultVariants: {
        tone: 'muted',
    },
});

interface TrendGap {
    actual: number | null | undefined;
    planned: number | null | undefined;
    suffix?: string;
    reverseColors?: boolean;
}

export interface KpiCardProps extends VariantProps<typeof kpiCardVariants> {
    title: string;
    value: string | number;
    tone?: CardTone;
    size?: 'sm' | 'md';
    unit?: string;
    subtitle?: string;
    trend?: TrendGap;
    className?: string;
    valueClassName?: string;
}

function formatTrendValue(val: number | null | undefined, suffix: string = ''): string {
    if (val === undefined || val === null) return '-';
    const abs = Math.abs(val);
    if (abs >= 1_000_000) return `${(abs / 1_000_000).toFixed(1)}M${suffix ? ' ' + suffix : ''}`;
    if (abs >= 1_000) return `${(abs / 1_000).toFixed(1)}k${suffix ? ' ' + suffix : ''}`;
    return `${abs.toFixed(1)}${suffix ? ' ' + suffix : ''}`;
}

function TrendIndicator({ trend }: { trend: TrendGap }) {
    const { actual, planned, suffix = '', reverseColors = false } = trend;

    if (actual === undefined || actual === null) return null;

    const gap = actual - (planned || 0);
    const gapPercent = (planned && planned !== 0) ? (gap / planned) * 100 : 0;
    const isPositive = gap > 0;
    const isNeutral = Math.abs(gapPercent) < 0.1;

    const absGap = Math.abs(gap);
    const prefix = gap > 0 ? '+' : (gap < 0 ? '-' : '');

    let colorClass = 'text-text-muted';
    let Icon = Minus;

    if (!isNeutral) {
        if (isPositive) {
            colorClass = reverseColors ? 'text-danger' : 'text-success';
            Icon = TrendingUp;
        } else {
            colorClass = reverseColors ? 'text-success' : 'text-danger';
            Icon = TrendingDown;
        }
    }

    return (
        <div className={cn('flex items-center gap-1 text-[clamp(0.5rem,1.5cqi+0.125rem,0.75rem)] font-bold', colorClass)}>
            <Icon className="h-[clamp(0.5rem,1cqi+0.125rem,0.75rem)] w-[clamp(0.5rem,1cqi+0.125rem,0.75rem)] shrink-0" />
            <span>{prefix}{formatTrendValue(absGap, suffix)}</span>
            {!isNeutral && (
                <span className="opacity-60 text-[clamp(0.5rem,1.5cqi+0.125rem,0.75rem)] font-medium">
                    ({Math.abs(gapPercent).toFixed(1)}%)
                </span>
            )}
        </div>
    );
}

export const KpiCard = React.forwardRef<HTMLDivElement, KpiCardProps>(
    ({ className, title, value, tone = 'muted', size = 'md', unit, subtitle, trend, valueClassName, ...props }, ref) => {
        const showUnit = !!unit && typeof value === 'number';
        const displayValue = showUnit ? value : value;

        return (
            <div
                ref={ref}
                className={cn(kpiCardVariants({ tone, size }), className)}
                {...props}
            >
                <div className="pointer-events-none absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="relative z-10">
                    <p className={cn(
                        'text-[clamp(0.5rem,1.5cqi+0.125rem,0.75rem)]',
                        titleVariants({ tone }),
                        'mb-[clamp(0.25rem,0.75cqi+0.125rem,0.5rem)]',
                    )}>
                        {title}
                    </p>
                    <p className={cn(valueVariants({ tone, size }), valueClassName, 'inline-flex items-baseline gap-0.5')}>
                        <span>{displayValue}</span>
                        {showUnit && (
                            <span className={cn(
                                'text-text-muted/60 font-medium',
                                size === 'sm'
                                    ? 'text-[clamp(0.5rem,1.5cqi+0.125rem,0.75rem)]'
                                    : 'text-[clamp(0.625rem,2cqi+0.125rem,1rem)]',
                            )}>
                                {unit}
                            </span>
                        )}
                    </p>
                    {subtitle && (
                        <p className="text-[clamp(0.625rem,1.5cqi+0.125rem,0.75rem)] text-text-muted font-bold mt-1">
                            {subtitle}
                        </p>
                    )}
                    {trend && (
                        <div className="mt-1">
                            <TrendIndicator trend={trend} />
                        </div>
                    )}
                </div>
            </div>
        );
    },
);

KpiCard.displayName = 'KpiCard';
