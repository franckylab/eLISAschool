/**
 * ==================================
 * eLISAschool - Tenant Activity Dashboard
 * ==================================
 * [Phase 6.2] Vue de l'activité des tenants (établissements).
 * Affiche les KPIs : MRR, churn, LTV, ARPU, top consumers.
 * Utilisable dans le dashboard plateforme.
 */

import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/lib/api-client';
import {
    Users,
    Building2,
    GraduationCap,
    TrendingUp,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight,
    Loader2,
} from 'lucide-react';

// =============================================
// Types
// =============================================

interface TenantKPI {
    totalEtablissements: number;
    totalUtilisateurs: number;
    totalEleves: number;
    mrr: number;            // Monthly Recurring Revenue
    arr: number;            // Annual Recurring Revenue
    arpu: number;           // Average Revenue Per User
    churnRate: number;      // Taux de churn (%)
    ltv: number;            // Lifetime Value
}

interface TopTenant {
    etablissementId: string;
    nomEtablissement?: string;
    nombreEleves: number;
    nombreUtilisateurs: number;
    montantMensuel: number;
    scoreCharge: number;
    statut: string;
}

interface TenantActivityProps {
    refreshInterval?: number;
}

// =============================================
// Composant
// =============================================

export function TenantActivity({ refreshInterval = 60_000 }: TenantActivityProps) {
    const { t } = useTranslation('admin');
    const { data: kpis, isLoading: loadingKpis } = useQuery<TenantKPI | undefined>({
        queryKey: ['tenant-kpis'],
        queryFn: async () => {
            const res = await apiClient.get<{
                platform?: { totalEtablissements?: number; totalUtilisateurs?: number; totalEleves?: number };
                financial?: { mrr?: number; arr?: number; arpu?: number; churnRate?: number; ltv?: number };
            }>('/api/platform/monitoring/metrics/aggregated?period=24h');
            const d = res.data;
            return {
                totalEtablissements: d?.platform?.totalEtablissements ?? 0,
                totalUtilisateurs: d?.platform?.totalUtilisateurs ?? 0,
                totalEleves: d?.platform?.totalEleves ?? 0,
                mrr: d?.financial?.mrr ?? 0,
                arr: d?.financial?.arr ?? 0,
                arpu: d?.financial?.arpu ?? 0,
                churnRate: d?.financial?.churnRate ?? 0,
                ltv: d?.financial?.ltv ?? 0,
            };
        },
        refetchInterval: refreshInterval,
    });

    const { data: topTenants, isLoading: loadingTop } = useQuery<TopTenant[] | undefined>({
        queryKey: ['top-tenants'],
        queryFn: async () => {
            const res = await apiClient.get<TopTenant[]>('/api/platform/monitoring/tenants/top?limit=10');
            return res.data;
        },
        refetchInterval: refreshInterval,
    });

    return (
        <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                <KpiCard
                    label={t('tenant.etablissements', 'Établissements')}
                    value={kpis?.totalEtablissements ?? 0}
                    icon={<Building2 className="w-4 h-4" />}
                    loading={loadingKpis}
                />
                <KpiCard
                    label={t('tenant.utilisateurs', 'Utilisateurs')}
                    value={kpis?.totalUtilisateurs ?? 0}
                    icon={<Users className="w-4 h-4" />}
                    loading={loadingKpis}
                />
                <KpiCard
                    label={t('tenant.eleves', 'Élèves')}
                    value={kpis?.totalEleves ?? 0}
                    icon={<GraduationCap className="w-4 h-4" />}
                    loading={loadingKpis}
                />
                <KpiCard
                    label="MRR"
                    value={`${(kpis?.mrr ?? 0).toLocaleString()} XAF`}
                    icon={<DollarSign className="w-4 h-4" />}
                    loading={loadingKpis}
                    tone="success"
                />
                <KpiCard
                    label="ARPU"
                    value={`${(kpis?.arpu ?? 0).toLocaleString()} XAF`}
                    icon={<TrendingUp className="w-4 h-4" />}
                    loading={loadingKpis}
                />
                <KpiCard
                    label="Churn"
                    value={`${(kpis?.churnRate ?? 0).toFixed(1)}%`}
                    icon={kpis && kpis.churnRate > 5
                        ? <ArrowUpRight className="w-4 h-4 text-[var(--color-danger-500)]" />
                        : <ArrowDownRight className="w-4 h-4 text-[var(--color-success-500)]" />
                    }
                    loading={loadingKpis}
                    tone={kpis && kpis.churnRate > 5 ? 'danger' : 'success'}
                />
                <KpiCard
                    label="LTV"
                    value={`${(kpis?.ltv ?? 0).toLocaleString()} XAF`}
                    icon={<TrendingUp className="w-4 h-4" />}
                    loading={loadingKpis}
                    tone="info"
                />
            </div>

            {/* Top Tenants */}
            <div className="rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-5 space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[var(--color-texte-muted)]" />
                    Top 10 {t('tenant.etablissements', 'Établissements')}
                </h2>

                {loadingTop ? (
                    <div className="flex items-center justify-center py-6">
                        <Loader2 className="w-5 h-5 animate-spin text-[var(--color-texte-muted)]" />
                    </div>
                ) : !topTenants?.length ? (
                    <p className="text-sm text-[var(--color-texte-muted)] text-center py-4">
                        {t('tenant.aucuneDonnee', 'Aucune donnée disponible')}
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[var(--color-bordure)]">
                                    <th className="text-left py-2 px-3 font-medium text-[var(--color-texte-muted)]">#</th>
                                    <th className="text-left py-2 px-3 font-medium text-[var(--color-texte-muted)]">{t('tenant.etablissement', 'Établissement')}</th>
                                    <th className="text-right py-2 px-3 font-medium text-[var(--color-texte-muted)]">{t('tenant.eleves', 'Élèves')}</th>
                                    <th className="text-right py-2 px-3 font-medium text-[var(--color-texte-muted)]">{t('tenant.mensuel', 'Mensuel')}</th>
                                    <th className="text-right py-2 px-3 font-medium text-[var(--color-texte-muted)]">{t('tenant.charge', 'Charge')}</th>
                                    <th className="text-center py-2 px-3 font-medium text-[var(--color-texte-muted)]">{t('tenant.statut', 'Statut')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topTenants.map((tenant, i) => (
                                    <tr key={tenant.etablissementId} className="border-b border-[var(--color-bordure)] last:border-0 hover:bg-[var(--color-surface-hover)]">
                                        <td className="py-2 px-3 font-mono text-[var(--color-texte-muted)]">{i + 1}</td>
                                        <td className="py-2 px-3 font-medium">
                                            {tenant.nomEtablissement || tenant.etablissementId.substring(0, 8)}
                                        </td>
                                        <td className="py-2 px-3 text-right font-mono">
                                            {tenant.nombreEleves.toLocaleString('fr-FR')}
                                        </td>
                                        <td className="py-2 px-3 text-right font-mono">
                                            {tenant.montantMensuel?.toLocaleString() || 0} XAF
                                        </td>
                                        <td className="py-2 px-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <div className="w-14 h-1.5 bg-[var(--color-surface-hover)] rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${
                                                            tenant.scoreCharge >= 80 ? 'bg-[var(--color-danger-500)]' :
                                                            tenant.scoreCharge >= 50 ? 'bg-[var(--color-warning-500)]' :
                                                            'bg-[var(--color-success-500)]'
                                                        }`}
                                                        style={{ width: `${tenant.scoreCharge}%` }}
                                                    />
                                                </div>
                                                <span className="font-mono text-xs w-8 text-right">{tenant.scoreCharge}%</span>
                                            </div>
                                        </td>
                                        <td className="py-2 px-3 text-center">
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                                                tenant.statut === 'critique' ? 'bg-[var(--color-danger-100)] text-[var(--color-danger-700)]' :
                                                tenant.statut === 'warning' ? 'bg-[var(--color-warning-100)] text-[var(--color-warning-700)]' :
                                                'bg-[var(--color-success-100)] text-[var(--color-success-700)]'
                                            }`}>
                                                {tenant.statut}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

// =============================================
// Helpers
// =============================================

function KpiCard({
    label,
    value,
    icon,
    loading = false,
    tone = 'neutral',
}: {
    label: string;
    value: string | number;
    icon?: React.ReactNode;
    loading?: boolean;
    tone?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}) {
    const toneColors: Record<string, string> = {
        success: 'var(--color-success-500)',
        warning: 'var(--color-warning-500)',
        danger: 'var(--color-danger-500)',
        info: 'var(--color-info-500)',
        neutral: 'var(--color-texte-muted)',
    };

    return (
        <div className="rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-3 space-y-1.5">
            <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--color-texte-muted)] font-medium">{label}</span>
                {icon && <span style={{ color: toneColors[tone] }}>{icon}</span>}
            </div>
            <div
                className={`text-lg font-bold ${loading ? 'animate-pulse' : ''}`}
                style={{ color: toneColors[tone] }}
            >
                {loading ? '...' : typeof value === 'number' ? value.toLocaleString() : value}
            </div>
        </div>
    );
}

export default TenantActivity;
