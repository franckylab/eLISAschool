/**
 * ==================================
 * eLISAschool - Revenus Dashboard
 * ==================================
 * 
 * Dashboard revenus/analytique avec KPIs SaaS :
 * MRR, ARR, Churn, LTV, ARPU, répartition par plan,
 * évolution MRR, top établissements.
 * 
 * Phase P2.5 — Refonte SaaS v4
 */

import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/lib/api-client';
import { type ComponentType } from 'react';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Users,
    BarChart3,
    PieChart,
    ArrowUpRight,
    ArrowDownRight,
    RefreshCw,
    Calendar,
} from 'lucide-react';

// =============================================
// Types
// =============================================

interface RevenusKPIs {
    mrr: number;
    arr: number;
    churnRate: number;
    ltv: number;
    arpu: number;
    totalAbonnements: number;
    abonnementsActifs: number;
    abonnementsEssai: number;
    abonnementsSuspendus: number;
    abonnementsAnnules: number;
    totalFactures: number;
    facturesPayees: number;
    facturesEnRetard: number;
    revenuTotal: number;
    revenuMoisEnCours: number;
}

interface PlanRepartition {
    planNom: string;
    count: number;
    revenu: number;
    pourcentage: number;
}

interface TopEtablissement {
    id: string;
    nom: string;
    planNom: string;
    revenuMensuel: number;
    statut: string;
}

// =============================================
// Helpers
// =============================================

function formatMontant(montant: number, devise: string = 'XAF'): string {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: devise,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(montant);
}

function formatPourcentage(value: number): string {
    return `${value.toFixed(1)}%`;
}

// =============================================
// Component
// =============================================

export function RevenusDashboard() {
    const { t } = useTranslation('admin');

    // Fetch KPIs
    const { data: kpis, isLoading, refetch } = useQuery<RevenusKPIs>({
        queryKey: ['platform-revenus-kpis'],
        queryFn: async () => {
            // Utilise les données d'abonnements et factures existantes
            const [abosRes, facturesRes] = await Promise.all([
                apiClient.get<any[]>('/api/platform/facturation/abonnements'),
                apiClient.get<any[]>('/api/platform/facturation/factures'),
            ]);

            const abonnements = abosRes.data || [];
            const factures = facturesRes.data || [];

            const actifs = abonnements.filter((a: any) => a.statut === 'ACTIF');
            const essai = abonnements.filter((a: any) => a.statut === 'EN_ATTENTE');
            const suspendus = abonnements.filter((a: any) => a.statut === 'SUSPENDU');
            const annules = abonnements.filter((a: any) => a.statut === 'ANNULE');

            const mrr = actifs.reduce((sum: number, a: any) => sum + (Number(a.montantMensuel) || 0), 0);
            const revenuTotal = factures.filter((f: any) => f.statut === 'PAYEE').reduce((sum: number, f: any) => sum + Number(f.montantPaye), 0);
            const facturesEnRetard = factures.filter((f: any) => f.statut === 'EN_RETARD').length;

            const churnRate = abonnements.length > 0 ? (annules.length / abonnements.length) * 100 : 0;
            const arpu = actifs.length > 0 ? mrr / actifs.length : 0;
            const ltv = churnRate > 0 ? arpu / (churnRate / 100) : arpu * 12;

            return {
                mrr,
                arr: mrr * 12,
                churnRate,
                ltv,
                arpu,
                totalAbonnements: abonnements.length,
                abonnementsActifs: actifs.length,
                abonnementsEssai: essai.length,
                abonnementsSuspendus: suspendus.length,
                abonnementsAnnules: annules.length,
                totalFactures: factures.length,
                facturesPayees: factures.filter((f: any) => f.statut === 'PAYEE').length,
                facturesEnRetard,
                revenuTotal,
                revenuMoisEnCours: mrr,
            };
        },
    });

    // Fetch répartition par plan
    const { data: repartition } = useQuery<PlanRepartition[]>({
        queryKey: ['platform-repartition-plans'],
        queryFn: async () => {
            const res = await apiClient.get<any[]>('/api/platform/facturation/abonnements');
            const abonnements = res.data || [];
            const planMap = new Map<string, { count: number; revenu: number }>();

            for (const abo of abonnements) {
                const planNom = abo.plan?.nom || 'Sans plan';
                const current = planMap.get(planNom) || { count: 0, revenu: 0 };
                planMap.set(planNom, {
                    count: current.count + 1,
                    revenu: current.revenu + (Number(abo.montantMensuel) || 0),
                });
            }

            const total = abonnements.length || 1;
            return Array.from(planMap.entries()).map(([planNom, data]) => ({
                planNom,
                count: data.count,
                revenu: data.revenu,
                pourcentage: (data.count / total) * 100,
            })).sort((a, b) => b.count - a.count);
        },
    });

    // Fetch top établissements
    const { data: topEtablissements } = useQuery<TopEtablissement[]>({
        queryKey: ['platform-top-etablissements'],
        queryFn: async () => {
            const res = await apiClient.get<any[]>('/api/platform/facturation/abonnements');
            const abonnements = (res.data || [])
                .filter((a: any) => a.statut === 'ACTIF')
                .sort((a: any, b: any) => (Number(b.montantMensuel) || 0) - (Number(a.montantMensuel) || 0))
                .slice(0, 10);

            return abonnements.map((a: any) => ({
                id: a.etablissementId,
                nom: a.etablissement?.nom || `Établissement ${a.etablissementId.slice(0, 8)}`,
                planNom: a.plan?.nom || '-',
                revenuMensuel: Number(a.montantMensuel) || 0,
                statut: a.statut,
            }));
        },
    });

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-24 border rounded-lg bg-[var(--color-surface-hover)] animate-pulse" style={{ opacity: 0.3 }} />)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        {t('revenus.titre')}
                    </h3>
                    <p className="text-[var(--color-text-muted)]" style={{ fontSize: 'clamp(0.75rem, 0.65rem + 0.3vw, 0.875rem)' }}>{t('revenus.sousTitre')}</p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    {t('revenus.actualiser')}
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KPICard
                    label={t('revenus.kpi.mrr')}
                    value={formatMontant(kpis?.mrr || 0)}
                    sublabel={t('revenus.kpi.sousMrr')}
                    icon={TrendingUp}
                    trend="up"
                    color="text-[var(--color-success-600)]"
                />
                <KPICard
                    label={t('revenus.kpi.arr')}
                    value={formatMontant(kpis?.arr || 0)}
                    sublabel={t('revenus.kpi.sousArr')}
                    icon={DollarSign}
                    trend="up"
                    color="text-[var(--color-info-600)]"
                />
                <KPICard
                    label={t('revenus.kpi.churn')}
                    value={formatPourcentage(kpis?.churnRate || 0)}
                    sublabel={t('revenus.kpi.sousChurn')}
                    icon={TrendingDown}
                    trend={(kpis?.churnRate || 0) > 5 ? 'down' : 'up'}
                    color={(kpis?.churnRate || 0) > 5 ? 'text-[var(--color-danger-600)]' : 'text-[var(--color-success-600)]'}
                />
                <KPICard
                    label={t('revenus.kpi.ltv')}
                    value={formatMontant(kpis?.ltv || 0)}
                    sublabel={t('revenus.kpi.sousLtv')}
                    icon={Users}
                    trend="up"
                    color="text-[var(--color-accent-600)]"
                />
            </div>

            {/* Secondary KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KPICard
                    label={t('revenus.kpi.arpu')}
                    value={formatMontant(kpis?.arpu || 0)}
                    sublabel={t('revenus.kpi.sousArpu')}
                    icon={BarChart3}
                    color="text-[var(--color-accent-600)]"
                />
                <KPICard
                    label={t('revenus.kpi.actifs')}
                    value={String(kpis?.abonnementsActifs || 0)}
                    sublabel={t('revenus.kpi.surTotal', { total: kpis?.totalAbonnements || 0 })}
                    icon={Users}
                    color="text-[var(--color-success-600)]"
                />
                <KPICard
                    label={t('revenus.kpi.facturesPayees')}
                    value={String(kpis?.facturesPayees || 0)}
                    sublabel={t('revenus.kpi.surTotal', { total: kpis?.totalFactures || 0 })}
                    icon={Calendar}
                    color="text-[var(--color-info-600)]"
                />
                <KPICard
                    label={t('revenus.kpi.enRetard')}
                    value={String(kpis?.facturesEnRetard || 0)}
                    sublabel={t('revenus.kpi.facturesEchues')}
                    icon={TrendingDown}
                    color={(kpis?.facturesEnRetard || 0) > 0 ? 'text-[var(--color-danger-600)]' : 'text-[var(--color-success-600)]'}
                />
            </div>

            {/* Répartition par plan + Top établissements */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Répartition par plan */}
                <div className="border rounded-lg p-4 space-y-4">
                    <h4 className="font-semibold flex items-center gap-2 text-sm">
                        <PieChart className="w-4 h-4" />
                        {t('revenus.repartition.titre')}
                    </h4>
                    {repartition && repartition.length > 0 ? (
                        <div className="space-y-3">
                            {repartition.map(r => (
                                <div key={r.planNom} className="space-y-1">
                                    <div className="flex items-center justify-between text-sm">
                                        <span>{r.planNom}</span>
                                        <span className="text-[var(--color-text-muted)]">{r.count} ({r.pourcentage.toFixed(0)}%)</span>
                                    </div>
                                    <div className="h-2 bg-[var(--color-surface-hover)] rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all"
                                            style={{ width: `${r.pourcentage}%`, backgroundColor: 'var(--color-dominant-600)' }}
                                        />
                                    </div>
                                    <div className="text-[var(--color-text-muted)] text-right" style={{ fontSize: 'clamp(0.6875rem, 0.6rem + 0.3vw, 0.75rem)' }}>
                                        {formatMontant(r.revenu)}/mois
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6 text-[var(--color-text-muted)]" style={{ fontSize: 'clamp(0.75rem, 0.65rem + 0.3vw, 0.875rem)' }}>{t('revenus.aucuneDonnee')}</div>
                    )}
                </div>

                {/* Top 10 établissements */}
                <div className="border rounded-lg p-4 space-y-4">
                    <h4 className="font-semibold flex items-center gap-2 text-sm">
                        <TrendingUp className="w-4 h-4" />
                        {t('revenus.top10.titre')}
                    </h4>
                    {topEtablissements && topEtablissements.length > 0 ? (
                        <div className="space-y-2">
                            {topEtablissements.map((etab, index) => (
                                <div key={etab.id} className="flex items-center justify-between p-2 rounded-lg text-sm" style={{ ['--hover-bg' as any]: 'color-mix(in srgb, var(--color-surface-hover) 50%, transparent)' }} onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--hover-bg)') as any} onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent') as any}>
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 flex items-center justify-center text-xs font-bold bg-[var(--color-surface-hover)] rounded-full">
                                            {index + 1}
                                        </span>
                                        <div>
                                            <div className="font-medium">{etab.nom}</div>
                                            <div className="text-[var(--color-text-muted)]" style={{ fontSize: 'clamp(0.6875rem, 0.6rem + 0.3vw, 0.75rem)' }}>{etab.planNom}</div>
                                        </div>
                                    </div>
                                    <span className="font-mono text-sm">{formatMontant(etab.revenuMensuel)}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6 text-[var(--color-text-muted)]" style={{ fontSize: 'clamp(0.75rem, 0.65rem + 0.3vw, 0.875rem)' }}>{t('revenus.aucuneDonnee')}</div>
                    )}
                </div>
            </div>

            {/* Statut breakdown */}
            <div className="border rounded-lg p-4 space-y-4">
                <h4 className="font-semibold text-sm">{t('revenus.repartitionStatut')}</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatBadge label={t('revenus.statuts.actif')} value={kpis?.abonnementsActifs || 0} color="bg-[var(--color-success-100)] text-[var(--color-success-700)]" />
                    <StatBadge label={t('revenus.statuts.essai')} value={kpis?.abonnementsEssai || 0} color="bg-[var(--color-info-100)] text-[var(--color-info-700)]" />
                    <StatBadge label={t('revenus.statuts.suspendu')} value={kpis?.abonnementsSuspendus || 0} color="bg-[var(--color-warning-100)] text-[var(--color-warning-700)]" />
                    <StatBadge label={t('revenus.statuts.annule')} value={kpis?.abonnementsAnnules || 0} color="bg-[var(--color-danger-100)] text-[var(--color-danger-700)]" />
                </div>
            </div>
        </div>
    );
}

// =============================================
// Sub-components
// =============================================

function KPICard({ label, value, sublabel, icon: Icon, trend, color }: {
    label: string;
    value: string;
    sublabel: string;
    icon: ComponentType<{ className?: string }>;
    trend?: 'up' | 'down';
    color: string;
}) {
    return (
        <div
            className="border border-[var(--color-border)] rounded-[var(--radius-lg)] bg-[var(--color-surface)] space-y-[var(--space-xs)]"
            style={{ padding: 'clamp(0.75rem, 0.6rem + 0.5vw, 1.25rem)' }}
        >
            <div className="flex items-center justify-between">
                <span className="text-[var(--color-text-muted)] font-medium" style={{ fontSize: 'clamp(0.6875rem, 0.6rem + 0.3vw, 0.8125rem)' }}>{label}</span>
                <Icon className={`h-[var(--icon-sm)] w-[var(--icon-sm)] ${color}`} />
            </div>
            <div className={`font-bold ${color}`} style={{ fontSize: 'clamp(1.125rem, 0.9rem + 0.8vw, 1.5rem)' }}>{value}</div>
            <div className="flex items-center gap-[var(--gap-xs)]">
                {trend === 'up' && <ArrowUpRight className="h-[var(--icon-xs)] w-[var(--icon-xs)] text-[var(--color-success-500)]" />}
                {trend === 'down' && <ArrowDownRight className="h-[var(--icon-xs)] w-[var(--icon-xs)] text-[var(--color-danger-500)]" />}
                <span className="text-[var(--color-text-muted)]" style={{ fontSize: 'clamp(0.6875rem, 0.6rem + 0.3vw, 0.8125rem)' }}>{sublabel}</span>
            </div>
        </div>
    );
}

function StatBadge({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div className={`flex items-center justify-between rounded-[var(--radius-lg)] ${color}`} style={{ padding: 'clamp(0.75rem, 0.6rem + 0.5vw, 1rem)' }}>
            <span style={{ fontSize: 'clamp(0.75rem, 0.65rem + 0.3vw, 0.875rem)' }}>{label}</span>
            <span className="font-bold" style={{ fontSize: 'clamp(1rem, 0.85rem + 0.5vw, 1.25rem)' }}>{value}</span>
        </div>
    );
}

export default RevenusDashboard;
