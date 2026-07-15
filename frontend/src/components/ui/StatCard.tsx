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
}: StatCardProps) {
    const tone = toneProp || (color ? (COLOR_TO_TONE[color] ?? 'muted') : 'muted');
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4, ease: 'easeOut' }}
        >
            <Card className={cn(
                'transition-shadow duration-300 hover:shadow-sm',
                loading && 'animate-pulse',
                className,
            )}>
                <div className="absolute top-0 right-0 p-[clamp(0.375rem,1cqi+0.25rem,0.75rem)] opacity-[0.04] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
                    <Icon className="h-[clamp(2rem,6cqi+0.5rem,3.5rem)] w-[clamp(2rem,6cqi+0.5rem,3.5rem)] -mr-[clamp(0.375rem,1.5cqi+0.25rem,0.75rem)] -mt-[clamp(0.375rem,1.5cqi+0.25rem,0.75rem)] rotate-12" />
                </div>
                <CardContent className="p-[clamp(0.5rem,1.5cqi+0.25rem,0.75rem)]">
                    <div className="flex items-start gap-[clamp(0.375rem,1cqi+0.125rem,0.5rem)]">
                        <div className={cn(
                            'h-[clamp(1.25rem,3cqi+0.25rem,1.625rem)] w-[clamp(1.25rem,3cqi+0.25rem,1.625rem)] rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                            TONE_CLASSES[tone],
                            'group-hover:bg-dominant-600 group-hover:text-white group-hover:border-dominant-600',
                        )}>
                            <Icon className="h-[clamp(0.625rem,1.5cqi+0.125rem,0.875rem)] w-[clamp(0.625rem,1.5cqi+0.125rem,0.875rem)]" />
                        </div>
                        <div className="min-w-0 flex-1 space-y-[clamp(0.0625rem,0.25cqi+0.0625rem,0.125rem)]">
                            <div className="flex items-center justify-between gap-1">
                                <p className="text-[clamp(0.625rem,1.5cqi+0.125rem,0.75rem)] font-semibold text-text-secondary uppercase tracking-wider group-hover:text-dominant-600 transition-colors leading-tight truncate">
                                    {label}
                                </p>
                                {trend && (
                                    <div
                                        title={`${trend.isPositive ? 'Hausse' : 'Baisse'} de ${Math.abs(trend.value).toFixed(1)}%`}
                                        className={cn(
                                            'flex items-center gap-[clamp(0.125rem,0.375cqi+0.0625rem,0.25rem)] px-[clamp(0.1875rem,0.5cqi+0.0625rem,0.375rem)] py-[clamp(0.0625rem,0.25cqi+0.0625rem,0.125rem)] rounded-full text-[clamp(0.4375rem,0.75cqi+0.0625rem,0.5625rem)] font-semibold tracking-tight border shrink-0',
                                            trend.isPositive
                                                ? 'bg-success/10 text-success border-success/20'
                                                : 'bg-danger/10 text-danger border-danger/20',
                                        )}
                                    >
                                        {trend.isPositive
                                            ? <TrendingUp className="h-[clamp(0.375rem,0.5cqi+0.0625rem,0.5rem)] w-[clamp(0.375rem,0.5cqi+0.0625rem,0.5rem)]" />
                                            : <TrendingDown className="h-[clamp(0.375rem,0.5cqi+0.0625rem,0.5rem)] w-[clamp(0.375rem,0.5cqi+0.0625rem,0.5rem)]" />}
                                        {Math.abs(trend.value).toFixed(1)}%
                                    </div>
                                )}
                            </div>
                            {loading ? (
                                <div className="h-[clamp(0.75rem,1.5cqi+0.25rem,1rem)] w-[clamp(2rem,6cqi+0.5rem,3rem)] bg-surface-alt rounded animate-pulse" />
                            ) : (
                                <div className="flex items-baseline gap-[clamp(0.125rem,0.375cqi+0.0625rem,0.25rem)]">
                                    <h3 className="text-[clamp(0.8125rem,2.5cqi+0.25rem,1.125rem)] font-bold text-text-primary leading-tight">
                                        {value}
                                    </h3>
                                    {subtitle && (
                                        <span className="text-[clamp(0.5rem,0.75cqi+0.125rem,0.625rem)] text-text-muted font-semibold tracking-tight leading-tight truncate">
                                            {subtitle}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
