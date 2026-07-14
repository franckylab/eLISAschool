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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            transition={{ delay, duration: 0.5, ease: 'easeOut' }}
        >
            <Card className={cn(
                'transition-shadow duration-500 hover:shadow-md',
                loading && 'animate-pulse',
                className,
            )}>
                <div className="absolute top-0 right-0 p-[clamp(0.75rem,2cqi+0.25rem,1.5rem)] opacity-[0.05] group-hover:opacity-[0.10] transition-opacity pointer-events-none">
                    <Icon className="h-[clamp(3.5rem,12cqi+0.5rem,6rem)] w-[clamp(3.5rem,12cqi+0.5rem,6rem)] -mr-[clamp(1rem,4cqi+0.25rem,2rem)] -mt-[clamp(1rem,4cqi+0.25rem,2rem)] rotate-12" />
                </div>

                <CardContent className="p-[clamp(0.75rem,2cqi+0.25rem,1.5rem)]">
                    <div className="flex items-center justify-between mb-[clamp(0.5rem,1.5cqi+0.125rem,1.25rem)]">
                        <div className={cn(
                            'h-[clamp(2.25rem,6cqi+0.5rem,3rem)] w-[clamp(2.25rem,6cqi+0.5rem,3rem)] rounded-xl flex items-center justify-center shadow-sm transition-all duration-500',
                            TONE_CLASSES[tone],
                            'group-hover:bg-dominant-600 group-hover:text-white group-hover:border-dominant-600',
                        )}>
                            <Icon className="h-[clamp(0.875rem,2cqi+0.25rem,1.125rem)] w-[clamp(0.875rem,2cqi+0.25rem,1.125rem)]" />
                        </div>
                        {trend && (
                            <div
                                title={`${trend.isPositive ? 'Hausse' : 'Baisse'} de ${Math.abs(trend.value).toFixed(1)}%`}
                                className={cn(
                                    'flex items-center gap-1 px-[clamp(0.375rem,1cqi+0.125rem,0.75rem)] py-[clamp(0.25rem,0.5cqi+0.125rem,0.375rem)] rounded-full text-[clamp(0.625rem,1.5cqi+0.125rem,0.75rem)] font-semibold tracking-tight border',
                                    trend.isPositive
                                        ? 'bg-success/10 text-success border-success/20'
                                        : 'bg-danger/10 text-danger border-danger/20',
                                )}
                            >
                                {trend.isPositive
                                    ? <TrendingUp className="h-[clamp(0.625rem,1cqi+0.125rem,0.75rem)] w-[clamp(0.625rem,1cqi+0.125rem,0.75rem)]" />
                                    : <TrendingDown className="h-[clamp(0.625rem,1cqi+0.125rem,0.75rem)] w-[clamp(0.625rem,1cqi+0.125rem,0.75rem)]" />}
                                {Math.abs(trend.value).toFixed(1)}%
                            </div>
                        )}
                    </div>

                    <div className="space-y-1">
                        <p className="text-[clamp(0.625rem,1.5cqi+0.125rem,0.75rem)] font-semibold text-text-secondary uppercase tracking-wider group-hover:text-dominant-600 transition-colors">
                            {label}
                        </p>
                        {loading ? (
                            <div className="h-[clamp(1.5rem,3cqi+0.25rem,2rem)] w-[clamp(4rem,10cqi+0.5rem,6rem)] bg-surface-alt rounded animate-pulse mt-1" />
                        ) : (
                            <>
                                <div className="flex items-baseline gap-[clamp(0.25rem,0.75cqi+0.125rem,0.5rem)]">
                                    <h3 className="text-[clamp(1.125rem,4cqi+0.25rem,1.75rem)] font-bold text-text-primary">
                                        {value}
                                    </h3>
                                    {subtitle && (
                                        <span className="text-[clamp(0.625rem,1.5cqi+0.125rem,0.75rem)] text-text-muted font-semibold tracking-tight">
                                            {subtitle}
                                        </span>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
