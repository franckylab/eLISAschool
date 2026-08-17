/**
 * ==================================
 * eLISAschool - Module Analytics Dashboard
 * ==================================
 * Refonte SaaS — Fusion P6.2
 *
 * Dashboard analytics d'utilisation des modules.
 * Graphiques : top/bottom modules, taux d'activation,
 * détection sous-utilisés / sur-utilisés.
 *
 * Dark mode, responsive, design épuré.
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Activity,
    Package,
    Shield,
    Star,
    Puzzle,
    AlertTriangle,
    Loader2,
    CheckCircle,
    Clock,
    XCircle,
} from 'lucide-react';

// =============================================
// TYPES
// =============================================

interface ModuleUsageStats {
    code: string;
    nom: string;
    categorie: string;
    totalAccess: number;
    dernierAcces: string | null;
    accesJour: number;
    accesSemaine: number;
    accesMois: number;
    tauxActivation: number;
}

interface GlobalAnalytics {
    modules: ModuleUsageStats[];
    totalModules: number;
    modulesActifs: number;
    modulesSousUtilises: number;
    topModules: ModuleUsageStats[];
    bottomModules: ModuleUsageStats[];
}

// =============================================
// COMPONENT
// =============================================

export function ModuleAnalyticsDashboard() {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['module-analytics-global'],
        queryFn: async () => {
            const res = await apiClient.get<{ data: GlobalAnalytics }>('/api/monitoring/analytics/modules');
            return res.data?.data;
        },
        staleTime: 60_000,
        refetchInterval: 5 * 60_000, // 5 min
    });

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--color-dominant-600)]" />
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-center">
                <AlertTriangle className="h-8 w-8 text-amber-500" />
                <p className="text-sm text-[var(--color-text-secondary)]">
                    Impossible de charger les analytics
                </p>
            </div>
        );
    }

    const categorieIcon = (cat: string) => {
        switch (cat) {
            case 'GRATUIT': return Shield;
            case 'PAYANT': return Star;
            default: return Puzzle;
        }
    };

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    icon={Package}
                    label="Total modules"
                    value={data.totalModules}
                    color="var(--color-dominant-600)"
                />
                <StatCard
                    icon={Activity}
                    label="Modules actifs aujourd'hui"
                    value={data.modulesActifs}
                    color="var(--color-dominant-600)"
                />
                <StatCard
                    icon={AlertTriangle}
                    label="Sous-utilisés"
                    value={data.modulesSousUtilises}
                    color="var(--color-warning, #f59e0b)"
                />
                <StatCard
                    icon={BarChart3}
                    label="Taux d'activation"
                    value={`${data.totalModules > 0 ? Math.round((data.modulesActifs / data.totalModules) * 100) : 0}%`}
                    color="var(--color-secondary-600)"
                />
            </div>

            {/* Top & Bottom modules */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Top 5 */}
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
                        <TrendingUp size={16} className="text-emerald-500" />
                        Top 5 — Plus utilisés (30j)
                    </h3>
                    <div className="space-y-3">
                        {data.topModules.map((m, i) => {
                            const Icon = categorieIcon(m.categorie);
                            return (
                                <div key={m.code} className="flex items-center gap-3">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-400">
                                        {i + 1}
                                    </span>
                                    <Icon size={14} className="text-[var(--color-text-muted)]" />
                                    <span className="flex-1 truncate text-sm text-[var(--color-text-primary)]">
                                        {m.nom}
                                    </span>
                                    <span className="text-xs font-medium text-emerald-500">
                                        {m.accesMois} accès
                                    </span>
                                </div>
                            );
                        })}
                        {data.topModules.length === 0 && (
                            <p className="text-center text-xs text-[var(--color-text-muted)]">
                                Aucune donnée disponible
                            </p>
                        )}
                    </div>
                </div>

                {/* Bottom 5 */}
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
                        <TrendingDown size={16} className="text-red-500" />
                        Bottom 5 — Moins utilisés (30j)
                    </h3>
                    <div className="space-y-3">
                        {data.bottomModules.map((m, i) => {
                            const Icon = categorieIcon(m.categorie);
                            return (
                                <div key={m.code} className="flex items-center gap-3">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-400">
                                        {i + 1}
                                    </span>
                                    <Icon size={14} className="text-[var(--color-text-muted)]" />
                                    <span className="flex-1 truncate text-sm text-[var(--color-text-primary)]">
                                        {m.nom}
                                    </span>
                                    <span className="text-xs font-medium text-red-500">
                                        {m.accesMois} accès
                                    </span>
                                </div>
                            );
                        })}
                        {data.bottomModules.length === 0 && (
                            <p className="text-center text-xs text-[var(--color-text-muted)]">
                                Aucune donnée disponible
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Modules table */}
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
                <div className="border-b border-[var(--color-border)] px-5 py-3">
                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                        Tous les modules
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-text-muted)]">
                                <th className="px-5 py-3 font-medium">Module</th>
                                <th className="px-5 py-3 font-medium">Catégorie</th>
                                <th className="px-5 py-3 font-medium text-right">Jour</th>
                                <th className="px-5 py-3 font-medium text-right">Semaine</th>
                                <th className="px-5 py-3 font-medium text-right">Mois</th>
                                <th className="px-5 py-3 font-medium">Statut</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.modules.map((m) => {
                                const Icon = categorieIcon(m.categorie);
                                const statut = m.accesJour > 0
                                    ? { label: 'Actif', icon: CheckCircle, color: 'text-emerald-500' }
                                    : m.accesSemaine > 0
                                        ? { label: 'Récent', icon: Clock, color: 'text-amber-500' }
                                        : { label: 'Inactif', icon: XCircle, color: 'text-red-500' };
                                const StatutIcon = statut.icon;
                                return (
                                    <tr key={m.code} className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-bg)]/50">
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-2">
                                                <Icon size={14} className="text-[var(--color-text-muted)]" />
                                                <span className="font-medium text-[var(--color-text-primary)]">{m.nom}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className={`rounded-full border px-2 py-0.5 text-xs ${
                                                m.categorie === 'GRATUIT' ? 'border-emerald-500/30 text-emerald-500' :
                                                m.categorie === 'PAYANT' ? 'border-amber-500/30 text-amber-500' :
                                                'border-sky-500/30 text-sky-500'
                                            }`}>
                                                {m.categorie}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-right text-[var(--color-text-secondary)]">{m.accesJour}</td>
                                        <td className="px-5 py-3 text-right text-[var(--color-text-secondary)]">{m.accesSemaine}</td>
                                        <td className="px-5 py-3 text-right text-[var(--color-text-secondary)]">{m.accesMois}</td>
                                        <td className="px-5 py-3">
                                            <span className={`flex items-center gap-1 text-xs ${statut.color}`}>
                                                <StatutIcon size={12} />
                                                {statut.label}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// =============================================
// SUB-COMPONENTS
// =============================================

function StatCard({ icon: Icon, label, value, color }: {
    icon: typeof Package;
    label: string;
    value: string | number;
    color: string;
}) {
    return (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <div className="mb-2 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}15` }}>
                    <Icon size={16} style={{ color }} />
                </div>
                <span className="text-xs text-[var(--color-text-muted)]">{label}</span>
            </div>
            <p className="text-2xl font-bold text-[var(--color-text-primary)]">{value}</p>
        </div>
    );
}

export default ModuleAnalyticsDashboard;
