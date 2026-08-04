/**
 * ==================================
 * eLISAschool - Page Évaluations
 * ==================================
 */

import { Star, TrendingUp, Award, AlertCircle, Plus, Eye } from 'lucide-react';
import { useEvaluations, useStatistiquesEvaluations } from '../hooks/use-evaluations';
import { DataTable } from '@/components/ui/DataTable';
import { SchoolLoading } from '@/components/feedback';
import { CardGrid } from '@/components/ui/CardGrid';
import { StatCard } from '@/components/ui/StatCard';

const statuts: any = {
    brouillon: { label: 'Brouillon', color: 'gray' },
    finalisee: { label: 'Finalisée', color: 'blue' },
    partagee: { label: 'Partagée', color: 'green' },
};

export function EvaluationsPage() {
    const { data: evaluationsData, isLoading } = useEvaluations();
    const { data: stats } = useStatistiquesEvaluations();

    const evaluations = evaluationsData?.data || [];

    const colonnes = [
        { key: 'personnel', header: 'Personnel', render: (e: any) => <span className="font-medium">{e.personnel ? `${e.personnel.nom} ${e.personnel.prenom}` : '-'}</span> },
        { key: 'periode', header: 'Période', className: 'w-28', render: (e: any) => <span className="text-sm font-medium">{e.periodeObj?.nom || e.periode}</span> },
        { key: 'date', header: 'Date', className: 'w-28', render: (e: any) => <span className="text-sm">{new Date(e.dateEvaluation).toLocaleDateString('fr-FR')}</span> },
        { key: 'note', header: 'Note', className: 'w-24', render: (e: any) => <span className="text-lg font-bold">{e.noteGlobale}/20</span> },
        { key: 'statut', header: 'Statut', className: 'w-28', render: (e: any) => { const s = statuts[e.statut] || { label: e.statut, color: 'gray' }; return <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${s.color}-100 text-${s.color}-700`}>{s.label}</span>; } },
        { key: 'criteres', header: 'Critères', className: 'w-20', render: (e: any) => <span className="text-sm text-gray-600">{e.criteres?.length || 0}</span> },
        { key: 'actions', header: 'Actions', className: 'w-32',
            renderActions: (_e: any) => [
                { key: 'voir', icon: Eye, label: 'Voir détails', onClick: () => {}, variant: 'info' as const },
            ],
        },
    ];

    if (isLoading && !evaluationsData) return <SchoolLoading message="Chargement des évaluations..." />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Évaluations du Personnel</h1>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Plus className="w-4 h-4" />
                    Nouvelle évaluation
                </button>
            </div>

            <CardGrid columns={{ default: 1, md: 4 }}>
                <StatCard icon={Star} label="Moyenne générale" value={stats?.moyenneGenerale ? `${stats.moyenneGenerale.toFixed(1)}/20` : '-'} tone="warning" />
                <StatCard icon={Award} label="Excellent (≥16)" value={stats?.distribution?.excellent || 0} tone="success" />
                <StatCard icon={TrendingUp} label="Total évaluations" value={stats?.totalEvaluations || 0} tone="accent" />
                <StatCard icon={AlertCircle} label="Insuffisant (<8)" value={stats?.distribution?.insuffisant || 0} tone="purple" />
            </CardGrid>

            <DataTable
                tableId="evaluations"
                data={evaluations}
                columns={colonnes}
                enableReordering
                enablePinning
                enableColumnVisibility
                searchable
                searchPlaceholder="Rechercher une évaluation..." />
        </div>
    );
}
