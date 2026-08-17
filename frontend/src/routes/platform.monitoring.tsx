/**
 * ==================================
 * eLISAschool - Platform Monitoring Dashboard v2
 * ==================================
 *
 * Refonte v4.1 : 9 sections séquentielles → 4 onglets organisés.
 * Onglets : Health, Signaux, Alertes, Export.
 * Lazy loading des sections lourdes.
 *
 * Phase 7.3 — Refonte SaaS
 * Phase F.1 — Golden Signals (p50/p95/p99, saturation)
 * Phase F.3 — Export rapports CSV/JSON
 * Phase v6 — Refactor sous-composants + CSS vars + i18n
 *
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 */

import { createFileRoute } from '@tanstack/react-router';
import { useState, lazy, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/lib/api-client';
import { Activity, Heart, BarChart3, Bell, Download } from 'lucide-react';
import { cn } from '@/lib/cn';
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
} from '@/features/platform/components/monitoring-sections';

// Lazy load : ModuleAnalyticsDashboard (lourd, utilisé uniquement dans Signaux)
const ModuleAnalyticsDashboard = lazy(() =>
    import('@/features/platform/components/module-analytics-dashboard').then(m => ({
        default: m.ModuleAnalyticsDashboard,
    }))
);

// =============================================
// Types
// =============================================

type MonitoringTab = 'health' | 'signaux' | 'alertes' | 'export';

interface TabDef {
    key: MonitoringTab;
    labelKey: string;
    icon: typeof Activity;
}

const TABS: TabDef[] = [
    { key: 'health', labelKey: 'monitoring.tabs.health', icon: Heart },
    { key: 'signaux', labelKey: 'monitoring.tabs.signaux', icon: BarChart3 },
    { key: 'alertes', labelKey: 'monitoring.tabs.alertes', icon: Bell },
    { key: 'export', labelKey: 'monitoring.tabs.export', icon: Download },
];

// =============================================
// PAGE
// =============================================

function PlatformMonitoringPage() {
    const { t } = useTranslation('admin');
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<MonitoringTab>('health');
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[var(--gap-md)]">
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

            {/* Onglets */}
            <div className="flex items-center gap-[var(--gap-xs)] border-b border-[var(--color-bordure)] overflow-x-auto scrollbar-hide">
                {TABS.map((tab) => {
                    const isActive = activeTab === tab.key;
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={cn(
                                'flex items-center gap-[var(--gap-xs)] px-[var(--space-md)] py-[var(--space-sm)] border-b-2 transition-colors whitespace-nowrap',
                                isActive
                                    ? 'border-[var(--color-dominant-600)] text-[var(--color-dominant-600)] font-medium'
                                    : 'border-transparent text-[var(--color-texte-muted)] hover:text-[var(--color-texte)] hover:border-[var(--color-bordure)]'
                            )}
                            style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)' }}
                        >
                            <Icon className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />
                            {t(tab.labelKey)}
                        </button>
                    );
                })}
            </div>

            {/* Contenu des onglets */}
            <div className="space-y-[var(--space-lg)]">
                {/* ─── Health : HealthChecks + Métriques ─── */}
                {activeTab === 'health' && (
                    <>
                        <HealthChecksSection healthData={healthData} loading={loadingHealth} />
                        <MetricsCards metrics={metrics} loading={loadingMetrics} />
                    </>
                )}

                {/* ─── Signaux : Golden Signals + Module Analytics ─── */}
                {activeTab === 'signaux' && (
                    <>
                        <GoldenSignalsSection data={goldenSignals} loading={loadingGolden} />
                        <Suspense fallback={
                            <div className="animate-pulse text-[var(--color-texte-muted)] text-center py-8">
                                {t('monitoring.chargementAnalytics', 'Chargement des analytics modules...')}
                            </div>
                        }>
                            <ModuleAnalyticsDashboard />
                        </Suspense>
                    </>
                )}

                {/* ─── Alertes : Alertes + Règles + Noisy Neighbor ─── */}
                {activeTab === 'alertes' && (
                    <>
                        <AlertesSection
                            alerts={alerts}
                            loading={loadingAlerts}
                            onAcknowledge={(id) => acknowledgeMutation.mutate(id)}
                            acknowledging={acknowledgeMutation.isPending}
                        />
                        <AlertRulesSection />
                        <NoisyNeighborSection />
                    </>
                )}

                {/* ─── Export : Rapports + Temps réel ─── */}
                {activeTab === 'export' && (
                    <>
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
                        <RealtimeSection />
                    </>
                )}
            </div>

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

export default PlatformMonitoringPage;
