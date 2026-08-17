/**
 * ==================================
 * eLISAschool - PlatformStatCard
 * ==================================
 * Carte statistique partagée pour le panel admin plateforme.
 * CSS vars eLISAschool (pas de tokens shadcn).
 * Ultra-responsif (clamp) + dark mode natif.
 *
 * Phase P1 — Restructuration Panel Admin v3
 */

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

// =============================================
// Types
// =============================================

type StatTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'dominant' | 'accent';
type StatTrend = 'up' | 'down' | 'neutral';

// =============================================
// Styles par ton
// =============================================

const TONE_TEXT: Record<StatTone, string> = {
    success: 'text-[var(--color-success-600)]',
    warning: 'text-[var(--color-warning-600)]',
    danger: 'text-[var(--color-danger-600)]',
    info: 'text-[var(--color-info-600)]',
    neutral: 'text-[var(--color-text-secondary)]',
    dominant: 'text-[var(--color-dominant-600)]',
    accent: 'text-[var(--color-accent-600)]',
};

const TONE_BG: Record<StatTone, string> = {
    success: 'bg-[var(--color-success-50)] dark:bg-[var(--color-success-900)]/20',
    warning: 'bg-[var(--color-warning-50)] dark:bg-[var(--color-warning-900)]/20',
    danger: 'bg-[var(--color-danger-50)] dark:bg-[var(--color-danger-900)]/20',
    info: 'bg-[var(--color-info-50)] dark:bg-[var(--color-info-900)]/20',
    neutral: 'bg-[var(--color-surface-alt)]',
    dominant: 'bg-[var(--color-dominant-50)] dark:bg-[var(--color-dominant-900)]/20',
    accent: 'bg-[var(--color-accent-50)] dark:bg-[var(--color-accent-900)]/20',
};

// =============================================
// PlatformStatCard
// =============================================

interface PlatformStatCardProps {
    label: string;
    value: string | number;
    sublabel?: string;
    icon?: ReactNode;
    tone?: StatTone;
    trend?: StatTrend;
    trendValue?: string;
    loading?: boolean;
    watermark?: ReactNode;
    onClick?: () => void;
    className?: string;
}

export function PlatformStatCard({
    label,
    value,
    sublabel,
    icon,
    tone = 'neutral',
    trend,
    trendValue,
    loading = false,
    watermark,
    onClick,
    className,
}: PlatformStatCardProps) {
    return (
        <div
            className={cn(
                'relative overflow-hidden border border-[var(--color-bordure)] rounded-xl bg-[var(--color-surface)]',
                onClick && 'cursor-pointer transition-shadow hover:shadow-md',
                className,
            )}
            style={{ padding: 'clamp(0.75rem, 0.6rem + 0.5vw, 1.25rem)' }}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
        >
            {/* Watermark décoratif */}
            {watermark && (
                <div
                    className="absolute -right-3 -top-3 pointer-events-none select-none opacity-[0.06]"
                    aria-hidden
                >
                    {watermark}
                </div>
            )}

            {/* Label + icône */}
            <div className="flex items-center justify-between gap-2 relative z-10">
                <span
                    className="text-[var(--color-text-muted)] font-medium truncate"
                    style={{ fontSize: 'clamp(0.6875rem, 0.6rem + 0.3vw, 0.8125rem)' }}
                >
                    {label}
                </span>
                {icon && (
                    <span
                        className={cn('shrink-0 rounded-lg flex items-center justify-center', TONE_BG[tone])}
                        style={{
                            width: 'clamp(1.5rem, 1.2rem + 0.5vw, 2rem)',
                            height: 'clamp(1.5rem, 1.2rem + 0.5vw, 2rem)',
                        }}
                    >
                        <span className={TONE_TEXT[tone]}>
                            {typeof icon === 'string' ? null : icon}
                        </span>
                    </span>
                )}
            </div>

            {/* Valeur */}
            <div
                className={cn(
                    'font-bold mt-1 relative z-10',
                    TONE_TEXT[tone],
                    loading && 'animate-pulse',
                )}
                style={{ fontSize: 'clamp(1.125rem, 0.9rem + 0.8vw, 1.75rem)' }}
            >
                {loading ? '...' : value}
            </div>

            {/* Sublabel + tendance */}
            {(sublabel || trend) && (
                <div
                    className="flex items-center gap-1.5 mt-1 relative z-10"
                    style={{ fontSize: 'clamp(0.625rem, 0.55rem + 0.25vw, 0.75rem)' }}
                >
                    {trend && trend !== 'neutral' && (
                        <span
                            className={cn(
                                'inline-flex items-center font-semibold',
                                trend === 'up' ? 'text-[var(--color-success-500)]' : 'text-[var(--color-danger-500)]',
                            )}
                        >
                            {trend === 'up' ? '↑' : '↓'}
                            {trendValue && <span className="ml-0.5">{trendValue}</span>}
                        </span>
                    )}
                    {sublabel && (
                        <span className="text-[var(--color-text-muted)] truncate">{sublabel}</span>
                    )}
                </div>
            )}
        </div>
    );
}

export type { PlatformStatCardProps, StatTone, StatTrend };
