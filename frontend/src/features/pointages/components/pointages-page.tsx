/**
 * ==================================
 * eLISAschool - Page Pointages
 * ==================================
 */

import { motion } from 'framer-motion';
import { Clock, CheckCircle, XCircle, AlertCircle, Users, TrendingUp, Calendar } from 'lucide-react';
import { usePointages, useStatistiquesPointages } from '../hooks/use-pointages';
import { DataTable } from '@/components/ui/DataTable';

const statuts: any = {
    present: { label: 'Présent', color: 'green', icon: CheckCircle },
    absent: { label: 'Absent', color: 'red', icon: XCircle },
    retard: { label: 'Retard', color: 'yellow', icon: AlertCircle },
    absence_justifiee: { label: 'Abs. justifiée', color: 'blue', icon: AlertCircle },
};

export function PointagesPage() {
    const { data: pointagesData, isLoading } = usePointages();
    const { data: stats } = useStatistiquesPointages();

    const pointages = pointagesData?.data || [];

    const colonnes = [
        { key: 'personnel', header: 'Personnel', render: (p: any) => <span className="font-medium">{p.personnel ? `${p.personnel.nom} ${p.personnel.prenom}` : '-'}</span> },
        { key: 'date', header: 'Date', className: 'w-28', render: (p: any) => <span className="text-sm">{new Date(p.date).toLocaleDateString('fr-FR')}</span> },
        { key: 'arrivee', header: 'Arrivée', className: 'w-24', render: (p: any) => <span className="text-sm">{p.heureArrivee || '-'}</span> },
        { key: 'depart', header: 'Départ', className: 'w-24', render: (p: any) => <span className="text-sm">{p.heureDepart || '-'}</span> },
        { key: 'heures', header: 'Heures', className: 'w-20', render: (p: any) => <span className="text-sm font-medium">{p.heuresTravaillees}h</span> },
        { key: 'statut', header: 'Statut', className: 'w-32', render: (p: any) => { const s = statuts[p.statut] || { label: p.statut, color: 'gray', icon: AlertCircle }; return <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${s.color}-100 text-${s.color}-700 flex items-center gap-1 w-fit`}><s.icon className="w-3 h-3" />{s.label}</span>; } },
    ];

    if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Gestion des Pointages</h1>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Clock className="w-4 h-4" />
                    Nouveau pointage
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <motion.div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center gap-3 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-green-700">Présents</span>
                    </div>
                    <p className="text-3xl font-bold text-green-800">{stats?.presents || 0}</p>
                </motion.div>

                <motion.div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
                    <div className="flex items-center gap-3 mb-2">
                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-700">Retards</span>
                    </div>
                    <p className="text-3xl font-bold text-yellow-800">{stats?.retards || 0}</p>
                </motion.div>

                <motion.div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center gap-3 mb-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">Taux présence</span>
                    </div>
                    <p className="text-3xl font-bold text-blue-800">{stats?.tauxPresence ? `${stats.tauxPresence.toFixed(1)}%` : '-'}</p>
                </motion.div>

                <motion.div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center gap-3 mb-2">
                        <Clock className="w-5 h-5 text-purple-600" />
                        <span className="text-sm font-medium text-purple-700">Moy. heures</span>
                    </div>
                    <p className="text-3xl font-bold text-purple-800">{stats?.moyenneHeures ? `${stats.moyenneHeures.toFixed(1)}h` : '-'}</p>
                </motion.div>
            </div>

            <DataTable data={pointages} columns={colonnes} searchable searchPlaceholder="Rechercher un pointage..." />
        </div>
    );
}
