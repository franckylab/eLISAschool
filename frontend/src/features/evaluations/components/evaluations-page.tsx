/**
 * ==================================
 * eLISAschool - Page Évaluations
 * ==================================
 */

import { motion } from 'framer-motion';
import { Star, TrendingUp, Award, AlertCircle, Plus } from 'lucide-react';
import { useEvaluations, useStatistiquesEvaluations } from '../hooks/use-evaluations';
import { DataTable } from '@/components/ui/DataTable';

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
        { key: 'periode', header: 'Période', className: 'w-28', render: (e: any) => <span className="text-sm font-medium">{e.periode}</span> },
        { key: 'date', header: 'Date', className: 'w-28', render: (e: any) => <span className="text-sm">{new Date(e.dateEvaluation).toLocaleDateString('fr-FR')}</span> },
        { key: 'note', header: 'Note', className: 'w-24', render: (e: any) => <span className="text-lg font-bold">{e.noteGlobale}/20</span> },
        { key: 'statut', header: 'Statut', className: 'w-28', render: (e: any) => { const s = statuts[e.statut] || { label: e.statut, color: 'gray' }; return <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${s.color}-100 text-${s.color}-700`}>{s.label}</span>; } },
        { key: 'criteres', header: 'Critères', className: 'w-20', render: (e: any) => <span className="text-sm text-gray-600">{e.criteres?.length || 0}</span> },
        { key: 'actions',
            pinned: 'right' as const, header: 'Actions', className: 'w-32', render: (_e: any) => <button className="text-blue-600 hover:underline text-sm">Voir détails</button> },
    ];

    if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Évaluations du Personnel</h1>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Plus className="w-4 h-4" />
                    Nouvelle évaluation
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <motion.div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
                    <div className="flex items-center gap-3 mb-2">
                        <Star className="w-5 h-5 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-700">Moyenne générale</span>
                    </div>
                    <p className="text-3xl font-bold text-yellow-800">{stats?.moyenneGenerale ? `${stats.moyenneGenerale.toFixed(1)}/20` : '-'}</p>
                </motion.div>

                <motion.div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center gap-3 mb-2">
                        <Award className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-green-700">Excellent (≥16)</span>
                    </div>
                    <p className="text-3xl font-bold text-green-800">{stats?.distribution?.excellent || 0}</p>
                </motion.div>

                <motion.div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center gap-3 mb-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">Total évaluations</span>
                    </div>
                    <p className="text-3xl font-bold text-blue-800">{stats?.totalEvaluations || 0}</p>
                </motion.div>

                <motion.div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center gap-3 mb-2">
                        <AlertCircle className="w-5 h-5 text-purple-600" />
                        <span className="text-sm font-medium text-purple-700">Insuffisant (&lt;8)</span>
                    </div>
                    <p className="text-3xl font-bold text-purple-800">{stats?.distribution?.insuffisant || 0}</p>
                </motion.div>
            </div>

            <DataTable
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
