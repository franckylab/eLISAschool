/**
 * ==================================
 * eLISAschool - Page Laboratoire
 * ==================================
 */

import { Beaker, Calendar, Clock, CheckCircle, XCircle, FlaskConical } from 'lucide-react';
import { useReservations, useStatistiquesLaboratoire } from '../hooks/use-laboratoire';
import { DataTable } from '@/components/ui/DataTable';
import { CardGrid, StatCard } from '@/components/ui';

const statuts: any = {
    en_attente: { label: 'En attente', color: 'yellow', icon: Clock },
    confirmee: { label: 'Confirmée', color: 'green', icon: CheckCircle },
    annulee: { label: 'Annulée', color: 'red', icon: XCircle },
    terminee: { label: 'Terminée', color: 'blue', icon: CheckCircle },
};

export function LaboratoirePage() {
    const { data: reservationsData, isLoading } = useReservations();
    const { data: stats } = useStatistiquesLaboratoire();

    const reservations = reservationsData?.data || [];

    const colonnes = [
        { key: 'laboratoire', header: 'Laboratoire', render: (r: any) => <span className="font-medium">{r.laboratoire?.nom || '-'}</span> },
        { key: 'demandeur', header: 'Demandeur', render: (r: any) => <span className="text-sm">{r.demandeur ? `${r.demandeur.nom} ${r.demandeur.prenom}` : '-'}</span> },
        { key: 'dates', header: 'Période', render: (r: any) => <span className="text-sm">{new Date(r.dateDebut).toLocaleDateString('fr-FR')} - {new Date(r.dateFin).toLocaleDateString('fr-FR')}</span> },
        { key: 'eleves', header: 'Élèves', className: 'w-20', render: (r: any) => <span className="text-sm font-medium">{r.nombreEleves}</span> },
        { key: 'motif', header: 'Motif', className: 'max-w-xs', render: (r: any) => <span className="text-sm text-gray-600 truncate">{r.motif}</span> },
        { key: 'statut', header: 'Statut', className: 'w-28', render: (r: any) => { const s = statuts[r.statut] || { label: r.statut, color: 'gray', icon: Clock }; return <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${s.color}-100 text-${s.color}-700 flex items-center gap-1 w-fit`}><s.icon className="w-3 h-3" />{s.label}</span>; } },
    ];

    if (isLoading && !reservationsData) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Gestion des Laboratoires</h1>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Calendar className="w-4 h-4" />
                    Nouvelle réservation
                </button>
            </div>

            <CardGrid columns={{ default: 1, md: 4 }}>
                <StatCard icon={FlaskConical} label="Laboratoires" value={stats?.totalLaboratoires || 0} tone="accent" />
                <StatCard icon={Calendar} label="Réservations" value={stats?.totalReservations || 0} tone="success" />
                <StatCard icon={Clock} label="Actives" value={stats?.reservationsActives || 0} tone="warning" />
                <StatCard icon={Beaker} label="Taux occupation" value={stats?.tauxOccupation ? `${stats.tauxOccupation.toFixed(1)}%` : '-'} tone="purple" />
            </CardGrid>

            <DataTable
                data={reservations}
                columns={colonnes}
                enableReordering
                enablePinning
                enableColumnVisibility
                searchable
                searchPlaceholder="Rechercher une réservation..." />
        </div>
    );
}
