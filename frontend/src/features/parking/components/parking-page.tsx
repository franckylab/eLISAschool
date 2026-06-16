/**
 * ==================================
 * eLISAschool - Page Parking
 * ==================================
 */

import { motion } from 'framer-motion';
import { Car, CheckCircle, DollarSign, TrendingUp } from 'lucide-react';
import { usePlaces, useStatistiquesParking } from '../hooks/use-parking';
import { DataTable } from '@/components/ui/DataTable';

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

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <motion.div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center gap-3 mb-2">
                        <Car className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">Places totales</span>
                    </div>
                    <p className="text-3xl font-bold text-blue-800">{stats?.totalPlaces || 0}</p>
                </motion.div>

                <motion.div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center gap-3 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-green-700">Places libres</span>
                    </div>
                    <p className="text-3xl font-bold text-green-800">{stats?.placesLibres || 0}</p>
                </motion.div>

                <motion.div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
                    <div className="flex items-center gap-3 mb-2">
                        <TrendingUp className="w-5 h-5 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-700">Taux occupation</span>
                    </div>
                    <p className="text-3xl font-bold text-yellow-800">{stats?.tauxOccupation ? `${stats.tauxOccupation.toFixed(1)}%` : '-'}</p>
                </motion.div>

                <motion.div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center gap-3 mb-2">
                        <DollarSign className="w-5 h-5 text-purple-600" />
                        <span className="text-sm font-medium text-purple-700">Revenus mensuels</span>
                    </div>
                    <p className="text-3xl font-bold text-purple-800">{stats?.revenusMensuels ? `${stats.revenusMensuels.toLocaleString('fr-FR')} FCFA` : '-'}</p>
                </motion.div>
            </div>

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
