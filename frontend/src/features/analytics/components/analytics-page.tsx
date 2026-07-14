/**
 * ==================================
 * eLISAschool - Page Analytics
 * ==================================
 */

import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Plus, Activity } from 'lucide-react';
import { useDashboardAnalytics, useStatistiquesAnalytics } from '../hooks/use-analytics';
import { CardGrid } from '@/components/ui/CardGrid';
import { StatCard } from '@/components/ui/StatCard';

const statutsKPI: any = {
    bon: { label: 'Bon', color: 'green', icon: CheckCircle },
    attention: { label: 'Attention', color: 'yellow', icon: AlertTriangle },
    critique: { label: 'Critique', color: 'red', icon: AlertTriangle },
};

const tendances: any = {
    hausse: { label: '↗ Hausse', color: 'green' },
    baisse: { label: '↘ Baisse', color: 'red' },
    stable: { label: '→ Stable', color: 'gray' },
};

export function AnalyticsPage() {
    const { data: dashboard, isLoading } = useDashboardAnalytics();
    const { data: stats } = useStatistiquesAnalytics();

    const kpis = dashboard?.kpis || [];
    const alertes = dashboard?.alertes || [];

    if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-200">Analytics & KPIs</h1>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Plus className="w-4 h-4" />
                    Nouveau KPI
                </button>
            </div>

            {/* Alertes */}
            {alertes.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">Alertes actives ({alertes.length})</h3>
                    <div className="space-y-2">
                        {alertes.slice(0, 3).map((alerte: any) => (
                            <div key={alerte.id} className="flex items-center gap-2 text-sm">
                                <AlertTriangle className="w-4 h-4 text-red-600" />
                                <span className="font-medium">{alerte.kpiNom}</span>
                                <span className="text-red-700 dark:text-red-400">{alerte.message}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Stats */}
            <CardGrid columns={{ default: 1, md: 4 }}>
                <StatCard icon={Activity} label="Total KPIs" value={stats?.totalKPIs || 0} tone="accent" />
                <StatCard icon={CheckCircle} label="KPIs bons" value={stats?.parStatut?.find((s: any) => s.statut === 'bon')?.nombre || 0} tone="success" />
                <StatCard icon={AlertTriangle} label="Alertes" value={stats?.alertesActives || 0} tone="warning" />
                <StatCard icon={AlertTriangle} label="Critiques" value={stats?.kpisCritiques || 0} tone="danger" />
            </CardGrid>

            {/* KPIs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {kpis.slice(0, 9).map((kpi: any) => {
                    const statut = statutsKPI[kpi.statut] || { label: kpi.statut, color: 'gray', icon: Activity };
                    const tendance = tendances[kpi.tendance] || { label: kpi.tendance, color: 'gray' };

                    return (
                        <motion.div key={kpi.id} className={`bg-white dark:bg-gray-800 rounded-lg p-4 border border-${statut.color}-200`}>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-gray-900 dark:text-gray-200">{kpi.nom}</h3>
                                <statut.icon className={`w-5 h-5 text-${statut.color}-600`} />
                            </div>
                            <p className="text-3xl font-bold text-gray-900 dark:text-gray-200 mb-1">
                                {kpi.valeur}{kpi.unite}
                            </p>
                            {kpi.objectif && (
                                <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">Objectif: {kpi.objectif}{kpi.unite}</p>
                            )}
                            <div className="flex items-center justify-between">
                                <span className={`text-xs text-${tendance.color}-600`}>{tendance.label} ({kpi.evolution > 0 ? '+' : ''}{kpi.evolution}%)</span>
                                <span className={`px-2 py-1 rounded text-xs font-medium bg-${statut.color}-100 text-${statut.color}-700`}>{statut.label}</span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
