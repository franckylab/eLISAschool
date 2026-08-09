/**
 * ==================================
 * eLISAschool - Monitoring Sections
 * ==================================
 * Sous-composants du dashboard monitoring plateforme.
 * Découpés depuis platform.monitoring.tsx pour maintenabilité.
 *
 * Phase v6 — Refactor + CSS vars + i18n
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import {
    Activity,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Server,
    Database,
    Globe,
    Clock,
    BellOff,
    Loader2,
    TrendingUp,
    Zap,
    Download,
    BarChart3,
    Cpu,
    Wifi,
    Users as UsersIcon,
    Plus,
    Trash2,
    Pencil,
    Settings2,
} from 'lucide-react';
import { CustomModal } from '@/components/modals/CustomModal';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ElisaInput } from '@/components/ui/ElisaInput';
import { ElisaSelect } from '@/components/ui/ElisaSelect';

// =============================================
// Types partagés
// =============================================

export interface HealthCheck {
    service: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    latency?: number;
    message?: string;
}

export interface AggregatedMetrics {
    period: string;
    timestamp: string;
    platform: {
        totalEtablissements: number;
        totalUtilisateurs: number;
        totalEleves: number;
    };
    health: HealthCheck[];
}

export interface Alert {
    id: string;
    rule: string;
    severity: 'info' | 'warning' | 'critical';
    message: string;
    value: number;
    threshold: number;
    timestamp: Date;
    acknowledged: boolean;
}

export interface GoldenSignals {
    latency: { p50: number; p95: number; p99: number; mean: number };
    traffic: { requestsPerSecond: number; activeUsers: number };
    errors: { rate5xx: number; rate4xx: number; total5xx: number; total4xx: number };
    saturation: { cpuPercent: number; memoryPercent: number; dbConnectionsPercent: number; redisConnectionsPercent: number };
}

export interface TenantUsageRow {
    etablissementId: string;
    nomEtablissement?: string;
    nombreEleves: number;
    nombreUtilisateurs: number;
    volumeDonnees: number;
    scoreCharge: number;
    statut: 'normal' | 'warning' | 'critique';
    lastMeasuredAt: string;
}

export interface TenantAlertRow {
    id: string;
    etablissementId: string;
    nomEtablissement?: string;
    type: string;
    severity: string;
    message: string;
    valeurActuelle: number;
    seuil: number;
    resolved: boolean;
}

// =============================================
// Helpers
// =============================================

function statusIcon(status: string) {
    switch (status) {
        case 'healthy': return <CheckCircle2 className="h-5 w-5" style={{ color: 'var(--color-success-500)' }} />;
        case 'degraded': return <AlertTriangle className="h-5 w-5" style={{ color: 'var(--color-warning-600)' }} />;
        case 'unhealthy': return <XCircle className="h-5 w-5" style={{ color: 'var(--color-danger-500)' }} />;
        default: return <Activity className="h-5 w-5 text-[var(--color-texte-muted)]" />;
    }
}

function statutBg(status: string) {
    switch (status) {
        case 'healthy': return { bg: 'var(--color-success-100)', text: 'var(--color-success-700)' };
        case 'degraded': return { bg: 'var(--color-warning-100)', text: 'var(--color-warning-700)' };
        default: return { bg: 'var(--color-danger-100)', text: 'var(--color-danger-700)' };
    }
}

function severityBorder(severity: string) {
    switch (severity) {
        case 'critical': return { bg: 'var(--color-danger-100)', text: 'var(--color-danger-700)', border: 'var(--color-danger-200)' };
        case 'warning': return { bg: 'var(--color-warning-100)', text: 'var(--color-warning-700)', border: 'var(--color-warning-200)' };
        default: return { bg: 'var(--color-info-100)', text: 'var(--color-info-700)', border: 'var(--color-info-200)' };
    }
}

// =============================================
// HealthChecksSection
// =============================================

export function HealthChecksSection({ healthData, loading }: { healthData: { status: string; checks: HealthCheck[]; timestamp: string } | undefined; loading: boolean }) {
    const { t } = useTranslation('admin');
    const bg = healthData ? statutBg(healthData.status) : { bg: '', text: '' };

    return (
        <div className="rounded-xl border border-[var(--color-bordure)] p-5 bg-[var(--color-surface)]">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-[var(--color-texte)]">
                <Zap className="h-5 w-5 text-[var(--color-texte-muted)]" />
                {t('monitoring.health.titre')}
                {healthData && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: bg.bg, color: bg.text }}>
                        {healthData.status}
                    </span>
                )}
            </h2>

            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-[var(--color-texte-muted)]" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {healthData?.checks.map((check) => (
                        <div key={check.service} className="rounded-lg border border-[var(--color-bordure)] p-4 space-y-2 bg-[var(--color-surface)]">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {check.service === 'database' && <Database className="h-4 w-4 text-[var(--color-texte-muted)]" />}
                                    {check.service === 'api' && <Server className="h-4 w-4 text-[var(--color-texte-muted)]" />}
                                    {check.service === 'external' && <Globe className="h-4 w-4 text-[var(--color-texte-muted)]" />}
                                    <span className="font-medium capitalize text-[var(--color-texte)]">{check.service}</span>
                                </div>
                                {statusIcon(check.status)}
                            </div>
                            <p className="text-sm text-[var(--color-texte-muted)]">{check.message}</p>
                            {check.latency !== undefined && (
                                <div className="flex items-center gap-1 text-xs text-[var(--color-texte-muted)]">
                                    <Clock className="h-3 w-3" />
                                    {check.latency}ms
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// =============================================
// MetricsCards
// =============================================

export function MetricsCards({ metrics, loading }: { metrics: AggregatedMetrics | undefined; loading: boolean }) {
    const { t } = useTranslation('admin');

    const cards = [
        { label: t('monitoring.metriques.etablissements'), icon: Database, value: metrics?.platform.totalEtablissements },
        { label: t('monitoring.metriques.utilisateurs'), icon: Server, value: metrics?.platform.totalUtilisateurs },
        { label: t('monitoring.metriques.eleves'), icon: TrendingUp, value: metrics?.platform.totalEleves },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {cards.map((card) => (
                <div key={card.label} className="rounded-xl border border-[var(--color-bordure)] p-5 bg-[var(--color-surface)]">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-[var(--color-texte-muted)]">{card.label}</span>
                        <card.icon className="h-4 w-4 text-[var(--color-texte-muted)]" />
                    </div>
                    <div className="text-3xl font-bold text-[var(--color-texte)]">
                        {loading ? '...' : card.value ?? '-'}
                    </div>
                </div>
            ))}
        </div>
    );
}

// =============================================
// GoldenSignalsSection
// =============================================

export function GoldenSignalsSection({ data, loading }: { data: GoldenSignals | undefined; loading: boolean }) {
    const { t } = useTranslation('admin');

    return (
        <div className="rounded-xl border border-[var(--color-bordure)] p-5 space-y-4 bg-[var(--color-surface)]">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-[var(--color-texte)]">
                <BarChart3 className="h-5 w-5 text-[var(--color-texte-muted)]" />
                {t('monitoring.goldenSignals.titre')}
            </h2>

            {loading ? (
                <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-[var(--color-texte-muted)]" />
                </div>
            ) : data ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Latency */}
                    <div className="rounded-lg border border-[var(--color-bordure)] p-4 space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-info-600)' }}>
                            <Clock className="h-4 w-4" />
                            {t('monitoring.goldenSignals.latence')}
                        </div>
                        <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                                <span className="text-[var(--color-texte-muted)]">p50</span>
                                <span className="font-mono font-semibold text-[var(--color-texte)]">{data.latency.p50}ms</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[var(--color-texte-muted)]">p95</span>
                                <span className="font-mono font-semibold" style={{ color: data.latency.p95 > 500 ? 'var(--color-warning-600)' : 'var(--color-texte)' }}>{data.latency.p95}ms</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[var(--color-texte-muted)]">p99</span>
                                <span className="font-mono font-semibold" style={{ color: data.latency.p99 > 2000 ? 'var(--color-danger-600)' : 'var(--color-texte)' }}>{data.latency.p99}ms</span>
                            </div>
                            <div className="flex justify-between border-t border-[var(--color-bordure)] pt-1">
                                <span className="text-[var(--color-texte-muted)]">{t('monitoring.goldenSignals.moyenne')}</span>
                                <span className="font-mono text-[var(--color-texte)]">{data.latency.mean}ms</span>
                            </div>
                        </div>
                    </div>

                    {/* Traffic */}
                    <div className="rounded-lg border border-[var(--color-bordure)] p-4 space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-success-500)' }}>
                            <Wifi className="h-4 w-4" />
                            {t('monitoring.goldenSignals.trafic')}
                        </div>
                        <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                                <span className="text-[var(--color-texte-muted)]">{t('monitoring.goldenSignals.reqSec')}</span>
                                <span className="font-mono font-semibold text-[var(--color-texte)]">{data.traffic.requestsPerSecond}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[var(--color-texte-muted)]">{t('monitoring.goldenSignals.usersActifs')}</span>
                                <span className="font-mono font-semibold text-[var(--color-texte)]">{data.traffic.activeUsers}</span>
                            </div>
                        </div>
                    </div>

                    {/* Errors */}
                    <div className="rounded-lg border border-[var(--color-bordure)] p-4 space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-danger-500)' }}>
                            <AlertTriangle className="h-4 w-4" />
                            {t('monitoring.goldenSignals.erreurs')}
                        </div>
                        <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                                <span className="text-[var(--color-texte-muted)]">5xx</span>
                                <span className="font-mono font-semibold" style={{ color: data.errors.rate5xx > 5 ? 'var(--color-danger-600)' : 'var(--color-texte)' }}>{data.errors.rate5xx}%</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[var(--color-texte-muted)]">4xx</span>
                                <span className="font-mono font-semibold text-[var(--color-texte)]">{data.errors.rate4xx}%</span>
                            </div>
                            <div className="flex justify-between border-t border-[var(--color-bordure)] pt-1">
                                <span className="text-[var(--color-texte-muted)]">{t('monitoring.goldenSignals.total5xx')}</span>
                                <span className="font-mono text-[var(--color-texte)]">{data.errors.total5xx}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[var(--color-texte-muted)]">{t('monitoring.goldenSignals.total4xx')}</span>
                                <span className="font-mono text-[var(--color-texte)]">{data.errors.total4xx}</span>
                            </div>
                        </div>
                    </div>

                    {/* Saturation */}
                    <div className="rounded-lg border border-[var(--color-bordure)] p-4 space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-warning-600)' }}>
                            <Cpu className="h-4 w-4" />
                            {t('monitoring.goldenSignals.saturation')}
                        </div>
                        <div className="space-y-1 text-xs">
                            <SaturationBar label={t('monitoring.goldenSignals.cpu')} percent={data.saturation.cpuPercent} colorHigh="var(--color-warning-500)" colorNormal="var(--color-success-500)" />
                            <SaturationBar label={t('monitoring.goldenSignals.memoire')} percent={data.saturation.memoryPercent} colorHigh="var(--color-danger-500)" colorNormal="var(--color-success-500)" threshold={85} />
                            <SaturationBar label={t('monitoring.goldenSignals.dbConn')} percent={data.saturation.dbConnectionsPercent} colorHigh="var(--color-danger-500)" colorNormal="var(--color-info-500)" threshold={80} />
                            <div className="flex justify-between">
                                <span className="text-[var(--color-texte-muted)]">Redis</span>
                                <span className="font-mono text-[var(--color-texte)]">{data.saturation.redisConnectionsPercent}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-4 text-sm text-[var(--color-texte-muted)]">
                    {t('monitoring.goldenSignals.nonDisponible')}
                </div>
            )}
        </div>
    );
}

function SaturationBar({ label, percent, colorHigh, colorNormal, threshold = 80 }: { label: string; percent: number; colorHigh: string; colorNormal: string; threshold?: number }) {
    const barColor = percent > threshold ? colorHigh : colorNormal;
    return (
        <div className="flex justify-between">
            <span className="text-[var(--color-texte-muted)]">{label}</span>
            <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-surface-hover)' }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, percent)}%`, backgroundColor: barColor }} />
                </div>
                <span className="font-mono text-[var(--color-texte)]">{percent}%</span>
            </div>
        </div>
    );
}

// =============================================
// AlertesSection
// =============================================

export function AlertesSection({ alerts, loading, onAcknowledge, acknowledging }: {
    alerts: Alert[] | undefined;
    loading: boolean;
    onAcknowledge: (id: string) => void;
    acknowledging: boolean;
}) {
    const { t } = useTranslation('admin');

    return (
        <div className="rounded-xl border border-[var(--color-bordure)] p-5 bg-[var(--color-surface)]">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-[var(--color-texte)]">
                <AlertTriangle className="h-5 w-5" style={{ color: 'var(--color-warning-600)' }} />
                {t('monitoring.alertes.titre')}
                {alerts && alerts.length > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--color-danger-100)', color: 'var(--color-danger-700)' }}>
                        {alerts.length}
                    </span>
                )}
            </h2>

            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-[var(--color-texte-muted)]" />
                </div>
            ) : !alerts || alerts.length === 0 ? (
                <div className="text-center py-6 text-[var(--color-texte-muted)]">
                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2" style={{ color: 'var(--color-success-500)' }} />
                    <p>{t('monitoring.alertes.aucune')}</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {alerts.map((alert) => {
                        const sc = severityBorder(alert.severity);
                        return (
                            <div
                                key={alert.id}
                                className="flex items-center justify-between rounded-lg border p-3"
                                style={{ backgroundColor: sc.bg, borderColor: sc.border, color: sc.text }}
                            >
                                <div className="flex items-center gap-3">
                                    <AlertTriangle className="h-4 w-4" />
                                    <div>
                                        <p className="text-sm font-medium">{alert.message}</p>
                                        <p className="text-xs opacity-75">
                                            {t('monitoring.alertes.valeur')}: {alert.value} | {t('monitoring.alertes.seuil')}: {alert.threshold} | {t('monitoring.alertes.regle')}: {alert.rule}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => onAcknowledge(alert.id)}
                                    disabled={acknowledging}
                                    className="text-xs px-2 py-1 rounded transition-colors hover:opacity-80"
                                    style={{ backgroundColor: 'rgba(255,255,255,0.5)' }}
                                >
                                    <BellOff className="h-3 w-3" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// =============================================
// NoisyNeighborSection
// =============================================

export function NoisyNeighborSection() {
    const { t } = useTranslation('admin');
    const { data: tenantUsage, isLoading } = useQuery({
        queryKey: ['monitoring-tenants-usage'],
        queryFn: async () => {
            const res = await apiClient.get<TenantUsageRow[]>('/api/platform/monitoring/tenants/usage');
            return res.data;
        },
        refetchInterval: 60_000,
    });

    const { data: nnAlerts } = useQuery({
        queryKey: ['monitoring-tenants-alerts'],
        queryFn: async () => {
            const res = await apiClient.get<TenantAlertRow[]>('/api/platform/monitoring/tenants/alerts');
            return res.data;
        },
        refetchInterval: 30_000,
    });

    return (
        <div className="rounded-xl border border-[var(--color-bordure)] p-5 space-y-4 bg-[var(--color-surface)]">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-[var(--color-texte)]">
                <UsersIcon className="h-5 w-5 text-[var(--color-texte-muted)]" />
                {t('monitoring.noisyNeighbor.titre')}
                {nnAlerts && nnAlerts.length > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--color-warning-100)', color: 'var(--color-warning-700)' }}>
                        {t('monitoring.noisyNeighbor.alertes', { count: nnAlerts.length })}
                    </span>
                )}
            </h2>

            {isLoading ? (
                <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-[var(--color-texte-muted)]" />
                </div>
            ) : !tenantUsage || tenantUsage.length === 0 ? (
                <div className="text-center py-6 text-[var(--color-texte-muted)]">
                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2" style={{ color: 'var(--color-success-500)' }} />
                    <p>{t('monitoring.noisyNeighbor.aucuneDonnee')}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[var(--color-bordure)]">
                                    <th className="text-left py-2 px-3 font-medium text-[var(--color-texte-muted)]">{t('monitoring.noisyNeighbor.etablissement')}</th>
                                    <th className="text-right py-2 px-3 font-medium text-[var(--color-texte-muted)]">{t('monitoring.noisyNeighbor.eleves')}</th>
                                    <th className="text-right py-2 px-3 font-medium text-[var(--color-texte-muted)]">{t('monitoring.noisyNeighbor.volume')}</th>
                                    <th className="text-right py-2 px-3 font-medium text-[var(--color-texte-muted)]">{t('monitoring.noisyNeighbor.charge')}</th>
                                    <th className="text-center py-2 px-3 font-medium text-[var(--color-texte-muted)]">{t('monitoring.noisyNeighbor.statut')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tenantUsage.slice(0, 10).map((tenant) => {
                                    const barColor = tenant.scoreCharge >= 80 ? 'var(--color-danger-500)' : tenant.scoreCharge >= 50 ? 'var(--color-warning-500)' : 'var(--color-success-500)';
                                    const statColor = tenant.statut === 'critique' ? { bg: 'var(--color-danger-100)', text: 'var(--color-danger-700)' } : tenant.statut === 'warning' ? { bg: 'var(--color-warning-100)', text: 'var(--color-warning-700)' } : { bg: 'var(--color-success-100)', text: 'var(--color-success-700)' };
                                    return (
                                        <tr key={tenant.etablissementId} className="border-b border-[var(--color-bordure)] last:border-0 transition-colors hover:bg-[var(--color-surface-hover)]">
                                            <td className="py-2 px-3 font-medium text-[var(--color-texte)]">
                                                {tenant.nomEtablissement || tenant.etablissementId.substring(0, 8)}
                                            </td>
                                            <td className="py-2 px-3 text-right font-mono text-[var(--color-texte)]">
                                                {tenant.nombreEleves.toLocaleString('fr-FR')}
                                            </td>
                                            <td className="py-2 px-3 text-right font-mono text-[var(--color-texte)]">
                                                {tenant.volumeDonnees.toLocaleString('fr-FR')}
                                            </td>
                                            <td className="py-2 px-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <div className="w-16 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-surface-hover)' }}>
                                                        <div className="h-full rounded-full" style={{ width: `${tenant.scoreCharge}%`, backgroundColor: barColor }} />
                                                    </div>
                                                    <span className="font-mono text-xs text-[var(--color-texte)]">{tenant.scoreCharge}%</span>
                                                </div>
                                            </td>
                                            <td className="py-2 px-3 text-center">
                                                <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: statColor.bg, color: statColor.text }}>
                                                    {tenant.statut}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {nnAlerts && nnAlerts.length > 0 && (
                        <div className="space-y-2 mt-4">
                            <h3 className="text-sm font-semibold text-[var(--color-texte-muted)]">{t('monitoring.noisyNeighbor.alertesActives')}</h3>
                            {nnAlerts.filter(a => !a.resolved).map((alert) => (
                                <div
                                    key={alert.id}
                                    className="flex items-center justify-between rounded-lg border p-3"
                                    style={{
                                        backgroundColor: alert.severity === 'critical' ? 'var(--color-danger-50)' : 'var(--color-warning-50)',
                                        borderColor: alert.severity === 'critical' ? 'var(--color-danger-200)' : 'var(--color-warning-200)',
                                    }}
                                >
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4" />
                                        <div>
                                            <p className="text-sm font-medium text-[var(--color-texte)]">{alert.message}</p>
                                            <p className="text-xs text-[var(--color-texte-muted)]">
                                                {alert.nomEtablissement || alert.etablissementId.substring(0, 8)} — {alert.type}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// =============================================
// RealtimeSection
// =============================================

export function RealtimeSection() {
    const { t } = useTranslation('admin');
    const [wsAlerts] = useState<Array<{ id: string; severity: string; message: string; rule: string; timestamp: string }>>([]);
    const [connected] = useState(false);

    return (
        <div className="rounded-xl border border-[var(--color-bordure)] p-5 bg-[var(--color-surface)]">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-[var(--color-texte)]">
                <Wifi className="h-5 w-5 text-[var(--color-texte-muted)]" />
                {t('monitoring.tempsReel.titre')}
                <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                        backgroundColor: connected ? 'var(--color-success-100)' : 'var(--color-surface-hover)',
                        color: connected ? 'var(--color-success-700)' : 'var(--color-texte-muted)',
                    }}
                >
                    {connected ? t('monitoring.tempsReel.connecte') : t('monitoring.tempsReel.polling')}
                </span>
            </h2>

            <div className="space-y-3">
                <div className="text-sm text-[var(--color-texte-muted)]">
                    {t('monitoring.tempsReel.modeActuel')} <span className="font-medium text-[var(--color-texte)]">{t('monitoring.tempsReel.pollingHttp')}</span>
                    <br />
                    <span className="text-xs">{t('monitoring.tempsReel.wsIndisponible')}</span>
                </div>

                {wsAlerts.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-[var(--color-texte)]">{t('monitoring.tempsReel.dernieresAlertes')}</h3>
                        {wsAlerts.slice(0, 5).map(alert => (
                            <div key={alert.id} className="flex items-center gap-2 text-sm rounded-lg border p-2" style={{ borderColor: 'var(--color-bordure)' }}>
                                <AlertTriangle className="h-3 w-3" />
                                <span className="text-[var(--color-texte)]">{alert.message}</span>
                                <span className="ml-auto text-xs text-[var(--color-texte-muted)]">
                                    {new Date(alert.timestamp).toLocaleTimeString('fr-FR')}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {wsAlerts.length === 0 && (
                    <div className="text-center py-4 text-sm text-[var(--color-texte-muted)]">
                        {t('monitoring.tempsReel.aucuneAlerte')}
                    </div>
                )}
            </div>
        </div>
    );
}

// =============================================
// ExportButton
// =============================================

export function ExportButton({ label, type, format }: { label: string; type: string; format: string }) {
    const [loading, setLoading] = useState(false);

    const handleExport = async () => {
        setLoading(true);
        try {
            if (format === 'pdf') {
                window.open(`/api/platform/monitoring/export/rapport?type=${type}&format=pdf&print=1`, '_blank');
            } else {
                const res = await fetch(`/api/platform/monitoring/export/rapport?type=${type}&format=${format}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                });
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `rapport-${type}.${format}`;
                a.click();
                URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleExport}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-lg border border-[var(--color-bordure)] p-3 bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] transition-colors text-sm font-medium disabled:opacity-50"
            style={{ color: 'var(--color-texte)' }}
        >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 text-[var(--color-texte-muted)]" />}
            {label}
        </button>
    );
}

// =============================================
// AlertRulesSection — Gestion des règles d'alerte
// =============================================

export interface AlertRule {
    name: string;
    metric: string;
    condition: 'gt' | 'lt' | 'eq';
    threshold: number;
    severity: 'info' | 'warning' | 'critical';
    duration?: number;
    message: string;
    enabled?: boolean;
    channels?: string[];
    combinedWith?: { metric: string; condition: string; threshold: number }[];
}

const RULE_METRICS = [
    'http_request_duration_ms',
    'http_errors_5xx_total',
    'http_requests_total',
    'resource_database_percent',
    'resource_memory_percent',
];

const RULE_CONDITIONS = [
    { value: 'gt', label: '>' },
    { value: 'lt', label: '<' },
    { value: 'eq', label: '=' },
];

const RULE_SEVERITIES = [
    { value: 'info', label: 'info' },
    { value: 'warning', label: 'warning' },
    { value: 'critical', label: 'critical' },
];

export function AlertRulesSection() {
    const { t } = useTranslation('admin');
    const queryClient = useQueryClient();

    const [openCreate, setOpenCreate] = useState(false);
    const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
    const [toDelete, setToDelete] = useState<AlertRule | null>(null);

    const [name, setName] = useState('');
    const [metric, setMetric] = useState(RULE_METRICS[0]);
    const [condition, setCondition] = useState('gt');
    const [threshold, setThreshold] = useState('');
    const [severity, setSeverity] = useState('warning');
    const [duration, setDuration] = useState('');
    const [message, setMessage] = useState('');
    const [enabled, setEnabled] = useState(true);

    useEffect(() => {
        if (editingRule) {
            setName(editingRule.name);
            setMetric(editingRule.metric);
            setCondition(editingRule.condition);
            setThreshold(String(editingRule.threshold));
            setSeverity(editingRule.severity);
            setDuration(editingRule.duration ? String(editingRule.duration) : '');
            setMessage(editingRule.message ?? '');
            setEnabled(editingRule.enabled !== false);
        } else if (openCreate) {
            setName('');
            setMetric(RULE_METRICS[0]);
            setCondition('gt');
            setThreshold('');
            setSeverity('warning');
            setDuration('');
            setMessage('');
            setEnabled(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [openCreate, editingRule]);

    const { data: rules, isLoading } = useQuery({
        queryKey: ['monitoring-alert-rules'],
        queryFn: async () => {
            const res = await apiClient.get<AlertRule[]>('/api/platform/monitoring/alerts/rules');
            return res.data;
        },
        refetchInterval: 30_000,
    });

    const createMutation = useMutation({
        mutationFn: async (payload: Record<string, unknown>) => {
            const res = await apiClient.post('/api/platform/monitoring/alerts/rules', payload);
            return res;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['monitoring-alert-rules'] });
            setOpenCreate(false);
            setName('');
            setThreshold('');
            setDuration('');
            setMessage('');
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (payload: Record<string, unknown>) => {
            const res = await apiClient.patch(`/api/platform/monitoring/alerts/rules/${encodeURIComponent(editingRule?.name ?? '')}`, payload);
            return res;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['monitoring-alert-rules'] });
            setOpenCreate(false);
            setEditingRule(null);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (ruleName: string) => {
            const res = await apiClient.delete(`/api/platform/monitoring/alerts/rules/${encodeURIComponent(ruleName)}`);
            return res;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['monitoring-alert-rules'] });
            setToDelete(null);
        },
    });

    const handleSubmit = () => {
        if (!name.trim() || threshold === '') return;
        const payload: Record<string, unknown> = {
            name: name.trim(),
            metric,
            condition,
            threshold: Number(threshold),
            severity,
            message,
            duration: duration ? Number(duration) : undefined,
            enabled,
        };
        if (editingRule) updateMutation.mutate(payload);
        else createMutation.mutate(payload);
    };

    const closeModal = () => {
        setOpenCreate(false);
        setEditingRule(null);
    };

    return (
        <div className="rounded-xl border border-[var(--color-bordure)] p-5 bg-[var(--color-surface)]">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-[var(--color-texte)]">
                    <Settings2 className="h-5 w-5" style={{ color: 'var(--color-info-600)' }} />
                    {t('monitoring.rules.titre')}
                    {rules && rules.length > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--color-info-100)', color: 'var(--color-info-700)' }}>
                            {rules.length}
                        </span>
                    )}
                </h2>
                <ElisaButton variant="primary" size="sm" onClick={() => setOpenCreate(true)}>
                    <Plus className="h-4 w-4" />
                    {t('monitoring.rules.nouvelle')}
                </ElisaButton>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-[var(--color-texte-muted)]" />
                </div>
            ) : !rules || rules.length === 0 ? (
                <div className="text-center py-6 text-[var(--color-texte-muted)]">
                    <Settings2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>{t('monitoring.rules.aucune')}</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {rules.map((rule) => (
                        <div
                            key={rule.name}
                            className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-bordure)] p-3 bg-[var(--color-surface-hover)]/50"
                        >
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-sm font-semibold text-[var(--color-texte)]">{rule.name}</p>
                                    <span
                                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                                        style={{ backgroundColor: rule.enabled === false ? 'var(--color-surface-hover)' : 'var(--color-success-100)', color: rule.enabled === false ? 'var(--color-texte-muted)' : 'var(--color-success-700)' }}
                                    >
                                        {rule.enabled === false ? t('monitoring.rules.desactive') : t('monitoring.rules.actif')}
                                    </span>
                                </div>
                                <p className="text-xs text-[var(--color-texte-muted)] mt-0.5 truncate">
                                    {rule.metric} {RULE_CONDITIONS.find((c) => c.value === rule.condition)?.label ?? rule.condition} {rule.threshold}
                                    {rule.duration ? ` · ${t('monitoring.rules.duree')}: ${rule.duration}min` : ''}
                                    {rule.message ? ` · ${rule.message}` : ''}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <span
                                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                                    style={{ backgroundColor: severityBorder(rule.severity).bg, color: severityBorder(rule.severity).text }}
                                >
                                    {rule.severity.toUpperCase()}
                                </span>
                                <button
                                    onClick={() => setEditingRule(rule)}
                                    className="p-1.5 rounded-lg transition-colors hover:bg-[var(--color-info-100)]"
                                    aria-label={t('monitoring.rules.modifier')}
                                    style={{ color: 'var(--color-info-600)' }}
                                >
                                    <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => setToDelete(rule)}
                                    disabled={deleteMutation.isPending}
                                    className="p-1.5 rounded-lg transition-colors hover:bg-[var(--color-danger-100)]"
                                    aria-label={t('monitoring.rules.supprimer')}
                                    style={{ color: 'var(--color-danger-600)' }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal création / édition */}
            <CustomModal
                open={openCreate || editingRule !== null}
                onOpenChange={(open) => { if (!open) closeModal(); }}
                title={editingRule ? t('monitoring.rules.modifier') : t('monitoring.rules.nouvelle')}
                size="md"
                footer={
                    <div className="flex justify-end gap-2">
                        <ElisaButton variant="ghost" size="sm" onClick={closeModal}>
                            {t('monitoring.rules.annuler')}
                        </ElisaButton>
                        <ElisaButton
                            variant="primary"
                            size="sm"
                            onClick={handleSubmit}
                            disabled={!name.trim() || threshold === '' || createMutation.isPending || updateMutation.isPending}
                        >
                            {createMutation.isPending || updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            {editingRule ? t('monitoring.rules.enregistrer') : t('monitoring.rules.creer')}
                        </ElisaButton>
                    </div>
                }
            >
                <div className="space-y-4" style={{ minWidth: 'clamp(320px, 30vw, 420px)' }}>
                    <ElisaInput
                        label={t('monitoring.rules.nom')}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t('monitoring.rules.nomPlaceholder')}
                        disabled={Boolean(editingRule)}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <ElisaSelect
                            label={t('monitoring.rules.metrique')}
                            value={metric}
                            onValueChange={setMetric}
                            options={RULE_METRICS.map((m) => ({ value: m, label: t(`monitoring.rules.metric.${m}`) }))}
                        />
                        <ElisaSelect
                            label={t('monitoring.rules.condition')}
                            value={condition}
                            onValueChange={setCondition}
                            options={RULE_CONDITIONS.map((c) => ({ value: c.value, label: c.label }))}
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <ElisaInput
                            label={t('monitoring.rules.seuil')}
                            type="number"
                            value={threshold}
                            onChange={(e) => setThreshold(e.target.value)}
                            placeholder="10"
                        />
                        <ElisaSelect
                            label={t('monitoring.rules.severite')}
                            value={severity}
                            onValueChange={setSeverity}
                            options={RULE_SEVERITIES.map((s) => ({ value: s.value, label: s.label }))}
                        />
                        <ElisaInput
                            label={t('monitoring.rules.duree')}
                            type="number"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            placeholder="5"
                        />
                    </div>
                    <ElisaInput
                        label={t('monitoring.rules.message')}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={t('monitoring.rules.messagePlaceholder')}
                    />
                    <label
                        className="flex items-center gap-2 text-sm cursor-pointer select-none"
                        style={{ color: 'var(--color-texte)' }}
                    >
                        <input
                            type="checkbox"
                            checked={enabled}
                            onChange={(e) => setEnabled(e.target.checked)}
                            className="h-4 w-4 rounded"
                            style={{ accentColor: 'var(--color-dominant-600)' }}
                        />
                        {t('monitoring.rules.activer')}
                    </label>
                    <p className="text-xs text-[var(--color-texte-muted)]">{t('monitoring.rules.aide')}</p>
                </div>
            </CustomModal>

            {/* Confirmation suppression */}
            <ConfirmDialog
                open={toDelete !== null}
                onOpenChange={(open) => { if (!open) setToDelete(null); }}
                onConfirm={() => toDelete && deleteMutation.mutate(toDelete.name)}
                title={t('monitoring.rules.suppressionTitre')}
                description={t('monitoring.rules.suppressionConfirm', { nom: toDelete?.name ?? '' })}
                variant="danger"
                confirmText={t('monitoring.rules.supprimer')}
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
}
