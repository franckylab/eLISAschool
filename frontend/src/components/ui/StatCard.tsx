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
                <div className="absolute top-0 right-0 p-6 opacity-[0.05] group-hover:opacity-[0.10] transition-opacity pointer-events-none">
                    <Icon className="h-24 w-24 -mr-8 -mt-8 rotate-12" />
                </div>

                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-5">
                        <div className={cn(
                            'h-12 w-12 rounded-xl flex items-center justify-center shadow-sm transition-all duration-500',
                            TONE_CLASSES[tone],
                            'group-hover:bg-dominant-600 group-hover:text-white group-hover:border-dominant-600',
                        )}>
                            <Icon className="h-5 w-5" />
                        </div>
                        {trend && (
                            <div
                                title={`${trend.isPositive ? 'Hausse' : 'Baisse'} de ${Math.abs(trend.value).toFixed(1)}%`}
                                className={cn(
                                    'flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold tracking-tight border',
                                    trend.isPositive
                                        ? 'bg-success/10 text-success border-success/20'
                                        : 'bg-danger/10 text-danger border-danger/20',
                                )}
                            >
                                {trend.isPositive
                                    ? <TrendingUp className="h-3 w-3" />
                                    : <TrendingDown className="h-3 w-3" />}
                                {Math.abs(trend.value).toFixed(1)}%
                            </div>
                        )}
                    </div>

                    <div className="space-y-1">
                        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider group-hover:text-dominant-600 transition-colors">
                            {label}
                        </p>
                        {loading ? (
                            <div className="h-8 w-24 bg-surface-alt rounded animate-pulse mt-1" />
                        ) : (
                            <>
                                <div className="flex items-baseline gap-2">
                                    <h3 className="text-2xl sm:text-3xl font-bold text-text-primary">
                                        {value}
                                    </h3>
                                    {subtitle && (
                                        <span className="text-xs text-text-muted font-semibold tracking-tight">
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
