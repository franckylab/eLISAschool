/**
 * ==================================
 * eLISAschool - Platform Monitoring Dashboard
 * ==================================
 *
 * Métriques temps réel, health checks, alertes actives.
 * Charts avec agrégation par période (1h, 24h, 7d).
 *
 * Phase 7.3 — Refonte SaaS
 * Phase F.1 — Golden Signals (p50/p95/p99, saturation)
 * Phase F.3 — Export rapports CSV/JSON
 * Phase v6 — Refactor sous-composants + CSS vars + i18n
 */

import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/lib/api-client';
import { Activity, Download } from 'lucide-react';
import {
    HealthChecksSection,
    MetricsCards,
    GoldenSignalsSection,
    AlertesSection,
    AlertRulesSection,
    NoisyNeighborSection,
    RealtimeSection,
    ExportButton,
    type HealthCheck,
    type AggregatedMetrics,
    type Alert,
    type GoldenSignals,
} from '@/features/admin/components/monitoring-sections';

// =============================================
// PAGE
// =============================================

function PlatformMonitoringPage() {
    const { t } = useTranslation('admin');
    const queryClient = useQueryClient();
    const [period, setPeriod] = useState<'1h' | '24h' | '7d'>('24h');

    // Health checks détaillés
    const { data: healthData, isLoading: loadingHealth } = useQuery({
        queryKey: ['monitoring-health'],
        queryFn: async () => {
            const res = await apiClient.get<{ status: string; checks: HealthCheck[]; timestamp: string }>('/api/platform/monitoring/health/detail');
            return res.data;
        },
        refetchInterval: 30_000,
    });

    // Métriques agrégées
    const { data: metrics, isLoading: loadingMetrics } = useQuery({
        queryKey: ['monitoring-metrics', period],
        queryFn: async () => {
            const res = await apiClient.get<AggregatedMetrics>(`/api/platform/monitoring/metrics/aggregated?period=${period}`);
            return res.data;
        },
    });

    // Alertes actives
    const { data: alerts, isLoading: loadingAlerts } = useQuery({
        queryKey: ['monitoring-alerts'],
        queryFn: async () => {
            const res = await apiClient.get<Alert[]>('/api/platform/monitoring/alerts');
            return res.data;
        },
        refetchInterval: 15_000,
    });

    // Golden Signals
    const { data: goldenSignals, isLoading: loadingGolden } = useQuery({
        queryKey: ['monitoring-golden-signals'],
        queryFn: async () => {
            const res = await apiClient.get<GoldenSignals>('/api/platform/monitoring/golden-signals');
            return res.data;
        },
        refetchInterval: 30_000,
    });

    // Acquitter une alerte
    const acknowledgeMutation = useMutation({
        mutationFn: async (alertId: string) => {
            await apiClient.post(`/api/platform/monitoring/alerts/${alertId}/acknowledge`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['monitoring-alerts'] });
        },
    });

    const periods: { key: '1h' | '24h' | '7d'; label: string }[] = [
        { key: '1h', label: t('monitoring.periodes.1h') },
        { key: '24h', label: t('monitoring.periodes.24h') },
        { key: '7d', label: t('monitoring.periodes.7d') },
    ];

    return (
        <div className="p-[var(--space-lg)] space-y-[var(--space-lg)]">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-[var(--gap-sm)]">
                    <Activity className="h-[var(--icon-md)] w-[var(--icon-md)] text-[var(--color-texte-muted)]" />
                    <div>
                        <h1 className="font-bold text-[var(--color-texte)]" style={{ fontSize: 'clamp(1.25rem, 1.1rem + 0.5vw, 1.5rem)' }}>{t('monitoring.titre')}</h1>
                        <p style={{ fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)', color: 'var(--color-texte-muted)' }}>
                            {t('monitoring.sousTitre')}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-[var(--gap-sm)]">
                    {periods.map((p) => {
                        const isActive = period === p.key;
                        return (
                            <button
                                key={p.key}
                                onClick={() => setPeriod(p.key)}
                                className="px-3 py-1.5 rounded-md transition-colors"
                                style={isActive
                                    ? { backgroundColor: 'var(--color-dominant-600)', color: '#fff', fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)' }
                                    : { backgroundColor: 'var(--color-surface-hover)', color: 'var(--color-texte)', fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)' }
                                }
                            >
                                {p.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Health Checks */}
            <HealthChecksSection healthData={healthData} loading={loadingHealth} />

            {/* Métriques plateforme */}
            <MetricsCards metrics={metrics} loading={loadingMetrics} />

            {/* Golden Signals */}
            <GoldenSignalsSection data={goldenSignals} loading={loadingGolden} />

            {/* Export Rapports */}
            <div className="rounded-xl border border-[var(--color-bordure)] p-[var(--space-lg)] space-y-[var(--space-sm)] bg-[var(--color-surface)]">
                <h2 className="font-semibold flex items-center gap-[var(--gap-sm)] text-[var(--color-texte)]" style={{ fontSize: 'clamp(1rem, 0.9rem + 0.4vw, 1.125rem)' }}>
                    <Download className="h-[var(--icon-md)] w-[var(--icon-md)] text-[var(--color-texte-muted)]" />
                    {t('monitoring.export.titre')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-[var(--gap-sm)]">
                    <ExportButton label={t('monitoring.export.activiteCsv')} type="activite" format="csv" />
                    <ExportButton label={t('monitoring.export.facturationCsv')} type="facturation" format="csv" />
                    <ExportButton label={t('monitoring.export.securiteCsv')} type="securite" format="csv" />
                    <ExportButton label={t('monitoring.export.completJson')} type="complet" format="json" />
                    <ExportButton label={t('monitoring.export.completPdf')} type="complet" format="pdf" />
                </div>
            </div>

            {/* Alertes actives */}
            <AlertesSection
                alerts={alerts}
                loading={loadingAlerts}
                onAcknowledge={(id) => acknowledgeMutation.mutate(id)}
                acknowledging={acknowledgeMutation.isPending}
            />

            {/* Règles d'alerte */}
            <AlertRulesSection />

            {/* Noisy Neighbor Detection */}
            <NoisyNeighborSection />

            {/* Temps réel */}
            <RealtimeSection />

            {/* Timestamp */}
            {healthData && (
                <p className="text-xs text-[var(--color-texte-muted)] text-right">
                    {t('monitoring.derniereMaj')} {new Date(healthData.timestamp).toLocaleString('fr-FR')}
                </p>
            )}
        </div>
    );
}

export const Route = createFileRoute('/platform/monitoring')({
    component: PlatformMonitoringPage,
});
