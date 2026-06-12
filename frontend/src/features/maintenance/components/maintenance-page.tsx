/**
 * ==================================
 * eLISAschool - Page Maintenance
 * ==================================
 */

import { motion } from 'framer-motion';
import { Wrench, Clock, CheckCircle, AlertCircle, DollarSign } from 'lucide-react';
import { useInterventions, useStatistiquesMaintenance } from '../hooks/use-maintenance';
import { DataTable } from '@/components/ui/DataTable';

const priorites: any = {
    basse: { label: 'Basse', color: 'gray' },
    moyenne: { label: 'Moyenne', color: 'blue' },
    haute: { label: 'Haute', color: 'orange' },
    urgente: { label: 'Urgente', color: 'red' },
};

const statuts: any = {
    planifiee: { label: 'Planifiée', color: 'blue' },
    en_cours: { label: 'En cours', color: 'yellow' },
    terminee: { label: 'Terminée', color: 'green' },
    annulee: { label: 'Annulée', color: 'gray' },
};

export function MaintenancePage() {
    const { data: interventionsData, isLoading } = useInterventions();
    const { data: stats } = useStatistiquesMaintenance();

    const interventions = interventionsData?.data || [];

    const colonnes = [
        { key: 'titre', header: 'Titre', render: (i: any) => <span className="font-medium">{i.titre}</span> },
        { key: 'type', header: 'Type', className: 'w-28', render: (i: any) => <span className="text-sm capitalize">{i.type}</span> },
        { key: 'priorite', header: 'Priorité', className: 'w-24', render: (i: any) => { const p = priorites[i.priorite] || { label: i.priorite, color: 'gray' }; return <span className={`px-2 py-1 rounded text-xs font-medium bg-${p.color}-100 text-${p.color}-700`}>{p.label}</span>; } },
        { key: 'technicien', header: 'Technicien', render: (i: any) => <span className="text-sm">{i.technicien ? `${i.technicien.nom} ${i.technicien.prenom}` : '-'}</span> },
        { key: 'date', header: 'Date', className: 'w-28', render: (i: any) => <span className="text-sm">{new Date(i.datePlanification).toLocaleDateString('fr-FR')}</span> },
        { key: 'statut', header: 'Statut', className: 'w-28', render: (i: any) => { const s = statuts[i.statut] || { label: i.statut, color: 'gray' }; return <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${s.color}-100 text-${s.color}-700`}>{s.label}</span>; } },
        { key: 'cout', header: 'Coût', className: 'w-24', render: (i: any) => <span className="text-sm">{i.cout ? `${i.cout.toLocaleString('fr-FR')} FCFA` : '-'}</span> },
    ];

    if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Gestion de la Maintenance</h1>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Wrench className="w-4 h-4" />
                    Nouvelle intervention
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <motion.div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center gap-3 mb-2">
                        <Wrench className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">Interventions</span>
                    </div>
                    <p className="text-3xl font-bold text-blue-800">{stats?.totalInterventions || 0}</p>
                </motion.div>

                <motion.div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
                    <div className="flex items-center gap-3 mb-2">
                        <Clock className="w-5 h-5 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-700">En cours</span>
                    </div>
                    <p className="text-3xl font-bold text-yellow-800">{stats?.interventionsEnCours || 0}</p>
                </motion.div>

                <motion.div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center gap-3 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-green-700">Terminées</span>
                    </div>
                    <p className="text-3xl font-bold text-green-800">{stats?.parStatut?.find((s: any) => s.statut === 'terminee')?.nombre || 0}</p>
                </motion.div>

                <motion.div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center gap-3 mb-2">
                        <DollarSign className="w-5 h-5 text-purple-600" />
                        <span className="text-sm font-medium text-purple-700">Coût total</span>
                    </div>
                    <p className="text-3xl font-bold text-purple-800">{stats?.coutTotal ? `${stats.coutTotal.toLocaleString('fr-FR')} FCFA` : '-'}</p>
                </motion.div>
            </div>

            {interventions}<DataTable
                data={interventions}
                columns={colonnes}
                enableReordering
                enablePinning
                enableColumnVisibility
                searchable
                searchPlaceholder="Rechercher une intervention..." />
        </div>
    );
}
