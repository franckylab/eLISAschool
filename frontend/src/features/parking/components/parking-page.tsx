/**
 * ==================================
 * eLISAschool - Page Parking
 * ==================================
 */

import { Car, CheckCircle, DollarSign, TrendingUp } from 'lucide-react';
import { usePlaces, useStatistiquesParking } from '../hooks/use-parking';
import { DataTable } from '@/components/ui/DataTable';
import { CardGrid, StatCard } from '@/components/ui';

const types: any = {
    standard: { label: 'Standard', color: 'blue' },
    pmr: { label: 'PMR', color: 'purple' },
    visiteur: { label: 'Visiteur', color: 'green' },
    reservation: { label: 'Réservation', color: 'yellow' },
};

const statuts: any = {
    libre: { label: 'Libre', color: 'green' },
    occupee: { label: 'Occupée', color: 'red' },
    reservee: { label: 'Réservée', color: 'yellow' },
    maintenance: { label: 'Maintenance', color: 'gray' },
};

export function ParkingPage() {
    const { data: places, isLoading } = usePlaces();
    const { data: stats } = useStatistiquesParking();

    const placesList = places || [];

    const colonnes = [
        { key: 'numero', header: 'N° Place', render: (p: any) => <span className="font-bold text-lg">{p.numero}</span> },
        { key: 'type', header: 'Type', className: 'w-28', render: (p: any) => { const t = types[p.type] || { label: p.type, color: 'gray' }; return <span className={`px-2 py-1 rounded text-xs font-medium bg-${t.color}-100 text-${t.color}-700`}>{t.label}</span>; } },
        { key: 'statut', header: 'Statut', className: 'w-28', render: (p: any) => { const s = statuts[p.statut] || { label: p.statut, color: 'gray' }; return <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${s.color}-100 text-${s.color}-700`}>{s.label}</span>; } },
        { key: 'tarif', header: 'Tarif horaire', className: 'w-28', render: (p: any) => <span className="text-sm">{p.tarifHoraire ? `${p.tarifHoraire.toLocaleString('fr-FR')} FCFA` : '-'}</span> },
    ];

    if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Gestion du Parking</h1>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Car className="w-4 h-4" />
                    Nouvel abonnement
                </button>
            </div>

            <CardGrid columns={{ default: 1, md: 4 }}>
                <StatCard icon={Car} label="Places totales" value={stats?.totalPlaces || 0} tone="accent" />
                <StatCard icon={CheckCircle} label="Places libres" value={stats?.placesLibres || 0} tone="success" />
                <StatCard icon={TrendingUp} label="Taux occupation" value={stats?.tauxOccupation ? `${stats.tauxOccupation.toFixed(1)}%` : '-'} tone="warning" />
                <StatCard icon={DollarSign} label="Revenus mensuels" value={stats?.revenusMensuels ? `${stats.revenusMensuels.toLocaleString('fr-FR')} FCFA` : '-'} tone="purple" />
            </CardGrid>

            <DataTable
                data={placesList}
                columns={colonnes}
                enableReordering
                enablePinning
                enableColumnVisibility
                searchable
                searchPlaceholder="Rechercher une place..." />
        </div>
    );
}
