/**
 * ==================================
 * eLISAschool - Page Analytics
 * ==================================
 */

import { motion } from 'framer-motion';
import { TrendingUp, AlertTriangle, CheckCircle, Activity, Plus } from 'lucide-react';
import { useDashboardAnalytics, useStatistiquesAnalytics } from '../hooks/use-analytics';

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
                <h1 className="text-2xl font-bold text-gray-900">Analytics & KPIs</h1>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Plus className="w-4 h-4" />
                    Nouveau KPI
                </button>
            </div>

            {/* Alertes */}
            {alertes.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-red-800 mb-2">Alertes actives ({alertes.length})</h3>
                    <div className="space-y-2">
                        {alertes.slice(0, 3).map((alerte: any) => (
                            <div key={alerte.id} className="flex items-center gap-2 text-sm">
                                <AlertTriangle className="w-4 h-4 text-red-600" />
                                <span className="font-medium">{alerte.kpiNom}</span>
                                <span className="text-red-700">{alerte.message}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <motion.div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center gap-3 mb-2">
                        <Activity className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">Total KPIs</span>
                    </div>
                    <p className="text-3xl font-bold text-blue-800">{stats?.totalKPIs || 0}</p>
                </motion.div>

                <motion.div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center gap-3 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-green-700">KPIs bons</span>
                    </div>
                    <p className="text-3xl font-bold text-green-800">{stats?.parStatut?.find((s: any) => s.statut === 'bon')?.nombre || 0}</p>
                </motion.div>

                <motion.div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
                    <div className="flex items-center gap-3 mb-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-700">Alertes</span>
                    </div>
                    <p className="text-3xl font-bold text-yellow-800">{stats?.alertesActives || 0}</p>
                </motion.div>

                <motion.div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
                    <div className="flex items-center gap-3 mb-2">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <span className="text-sm font-medium text-red-700">Critiques</span>
                    </div>
                    <p className="text-3xl font-bold text-red-800">{stats?.kpisCritiques || 0}</p>
                </motion.div>
            </div>

            {/* KPIs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {kpis.slice(0, 9).map((kpi: any) => {
                    const statut = statutsKPI[kpi.statut] || { label: kpi.statut, color: 'gray', icon: Activity };
                    const tendance = tendances[kpi.tendance] || { label: kpi.tendance, color: 'gray' };

                    return (
                        <motion.div key={kpi.id} className={`bg-white rounded-lg p-4 border border-${statut.color}-200`}>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-gray-900">{kpi.nom}</h3>
                                <statut.icon className={`w-5 h-5 text-${statut.color}-600`} />
                            </div>
                            <p className="text-3xl font-bold text-gray-900 mb-1">
                                {kpi.valeur}{kpi.unite}
                            </p>
                            {kpi.objectif && (
                                <p className="text-xs text-gray-600 mb-2">Objectif: {kpi.objectif}{kpi.unite}</p>
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
