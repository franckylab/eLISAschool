/**
 * ==================================
 * eLISAschool - Page Pointages
 * ==================================
 */

import { Clock, CheckCircle, XCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { usePointages, useStatistiquesPointages } from '../hooks/use-pointages';
import { DataTable } from '@/components/ui/DataTable';
import { CardGrid } from '@/components/ui/CardGrid';
import { StatCard } from '@/components/ui/StatCard';

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

            <CardGrid columns={{ default: 1, md: 4 }}>
                <StatCard icon={CheckCircle} label="Présents" value={stats?.presents || 0} tone="success" />
                <StatCard icon={AlertCircle} label="Retards" value={stats?.retards || 0} tone="warning" />
                <StatCard icon={TrendingUp} label="Taux présence" value={stats?.tauxPresence ? `${stats.tauxPresence.toFixed(1)}%` : '-'} tone="accent" />
                <StatCard icon={Clock} label="Moy. heures" value={stats?.moyenneHeures ? `${stats.moyenneHeures.toFixed(1)}h` : '-'} tone="purple" />
            </CardGrid>

            <DataTable
                data={pointages}
                columns={colonnes}
                enableReordering
                enablePinning
                enableColumnVisibility
                searchable
                searchPlaceholder="Rechercher un pointage..." />
        </div>
    );
}
