/**
 * ==================================
 * eLISAschool - Composants Réutilisables Monitoring
 * ==================================
 * [Phase 7.3] MetricCard, AlertBadge, TrendChart
 * Composants partagés pour les pages monitoring plateforme.
 * Thème-aware (variables CSS) + dark mode.
 */

import { type ReactNode } from 'react';
import {
    TrendingUp,
    TrendingDown,
    Minus,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Activity,
} from 'lucide-react';

// =============================================
// MetricCard — Carte métrique avec tendance
// =============================================

interface MetricCardProps {
    label: string;
    value: string | number;
    unit?: string;
    icon?: ReactNode;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    loading?: boolean;
    tone?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

const TONE_COLORS: Record<string, string> = {
    success: 'var(--color-success-500)',
    warning: 'var(--color-warning-500)',
    danger: 'var(--color-danger-500)',
    info: 'var(--color-info-500)',
    neutral: 'var(--color-texte-muted)',
};

export function MetricCard({
    label,
    value,
    unit,
    icon,
    trend,
    trendValue,
    loading = false,
    tone = 'neutral',
}: MetricCardProps) {
    return (
        <div className="rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-4 space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--color-texte-muted)] font-medium">{label}</span>
                {icon && <span style={{ color: TONE_COLORS[tone] }}>{icon}</span>}
            </div>

            <div className="flex items-baseline gap-1">
                <span
                    className={`text-2xl font-bold ${loading ? 'animate-pulse' : ''}`}
                    style={{ color: TONE_COLORS[tone] }}
                >
                    {loading ? '...' : value}
                </span>
                {unit && <span className="text-sm text-[var(--color-texte-muted)]">{unit}</span>}
            </div>

            {(trend || trendValue) && (
                <div className="flex items-center gap-1.5 text-xs">
                    {trend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-[var(--color-success-500)]" />}
                    {trend === 'down' && <TrendingDown className="w-3.5 h-3.5 text-[var(--color-danger-500)]" />}
                    {trend === 'neutral' && <Minus className="w-3.5 h-3.5 text-[var(--color-texte-muted)]" />}
                    {trendValue && <span className="text-[var(--color-texte-muted)]">{trendValue}</span>}
                </div>
            )}
        </div>
    );
}

// =============================================
// AlertBadge — Badge d'alerte monitoring
// =============================================

interface AlertBadgeProps {
    severity: 'info' | 'warning' | 'critical';
    label?: string;
    count?: number;
}

const SEVERITY_STYLES: Record<string, { bg: string; text: string; icon: ReactNode }> = {
    critical: {
        bg: 'bg-[var(--color-danger-100)]',
        text: 'text-[var(--color-danger-700)]',
        icon: <XCircle className="w-3.5 h-3.5" />,
    },
    warning: {
        bg: 'bg-[var(--color-warning-100)]',
        text: 'text-[var(--color-warning-700)]',
        icon: <AlertTriangle className="w-3.5 h-3.5" />,
    },
    info: {
        bg: 'bg-[var(--color-info-100)]',
        text: 'text-[var(--color-info-700)]',
        icon: <Activity className="w-3.5 h-3.5" />,
    },
};

export function AlertBadge({ severity, label, count }: AlertBadgeProps) {
    const style = SEVERITY_STYLES[severity] || SEVERITY_STYLES.info;

    return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full px-2.5 py-0.5 text-xs ${style.bg} ${style.text}`}>
            {style.icon}
            {label || severity}
            {count !== undefined && count > 0 && (
                <span className="ml-0.5 bg-white/50 rounded-full px-1.5 text-[10px] font-bold">
                    {count}
                </span>
            )}
        </span>
    );
}

// =============================================
// TrendChart — Mini chart de tendance (barres CSS)
// =============================================

interface TrendChartProps {
    data: number[];
    height?: number;
    color?: string;
    label?: string;
    maxValue?: number;
}

export function TrendChart({
    data,
    height = 40,
    color = 'var(--color-dominante)',
    label,
    maxValue,
}: TrendChartProps) {
    if (!data.length) return null;

    const max = maxValue || Math.max(...data, 1);
    const barWidth = 100 / data.length;

    return (
        <div className="space-y-1">
            {label && (
                <span className="text-xs text-[var(--color-texte-muted)] font-medium">{label}</span>
            )}
            <div
                className="flex items-end gap-px w-full"
                style={{ height: `${height}px` }}
            >
                {data.map((value, i) => {
                    const barHeight = Math.max(2, (value / max) * height);
                    const opacity = 0.4 + (i / data.length) * 0.6; // Gradient d'opacité
                    return (
                        <div
                            key={i}
                            className="rounded-t-sm transition-all duration-200"
                            style={{
                                width: `${barWidth}%`,
                                height: `${barHeight}px`,
                                backgroundColor: color,
                                opacity,
                            }}
                            title={`${value}`}
                        />
                    );
                })}
            </div>
            {/* Min/Max */}
            <div className="flex justify-between text-[10px] text-[var(--color-texte-muted)]">
                <span>Min: {Math.min(...data)}</span>
                <span>Max: {Math.max(...data)}</span>
            </div>
        </div>
    );
}

// =============================================
// HealthStatus — Indicateur d'état de service
// =============================================

interface HealthStatusProps {
    status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
    service?: string;
    latency?: number;
}

export function HealthStatus({ status, service, latency }: HealthStatusProps) {
    const config: Record<string, { icon: ReactNode; color: string; label: string }> = {
        healthy: {
            icon: <CheckCircle className="w-5 h-5" />,
            color: 'var(--color-success-500)',
            label: 'Sain',
        },
        degraded: {
            icon: <AlertTriangle className="w-5 h-5" />,
            color: 'var(--color-warning-500)',
            label: 'Dégradé',
        },
        unhealthy: {
            icon: <XCircle className="w-5 h-5" />,
            color: 'var(--color-danger-500)',
            label: 'Hors service',
        },
        unknown: {
            icon: <Activity className="w-5 h-5" />,
            color: 'var(--color-texte-muted)',
            label: 'Inconnu',
        },
    };

    const c = config[status] || config.unknown;

    return (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-bordure)]">
            <span style={{ color: c.color }}>{c.icon}</span>
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium capitalize">{service || status}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${c.color}20`, color: c.color }}>
                        {c.label}
                    </span>
                </div>
                {latency !== undefined && (
                    <span className="text-xs text-[var(--color-texte-muted)]">
                        Latence: {latency}ms
                    </span>
                )}
            </div>
        </div>
    );
}

// =============================================
// Exports
// =============================================

export type { MetricCardProps, AlertBadgeProps, TrendChartProps, HealthStatusProps };
