/**
 * ==================================
 * eLISAschool - Page Maintenance
 * ==================================
 */

import { Wrench, Clock, CheckCircle, DollarSign } from 'lucide-react';
import { useInterventions, useStatistiquesMaintenance } from '../hooks/use-maintenance';
import { DataTable } from '@/components/ui/DataTable';
import { CardGrid } from '@/components/ui/CardGrid';
import { StatCard } from '@/components/ui/StatCard';

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

            <CardGrid columns={{ default: 1, md: 4 }}>
                <StatCard icon={Wrench} label="Interventions" value={stats?.totalInterventions || 0} tone="accent" />
                <StatCard icon={Clock} label="En cours" value={stats?.interventionsEnCours || 0} tone="warning" />
                <StatCard icon={CheckCircle} label="Terminées" value={stats?.parStatut?.find((s: any) => s.statut === 'terminee')?.nombre || 0} tone="success" />
                <StatCard icon={DollarSign} label="Coût total" value={stats?.coutTotal ? `${stats.coutTotal.toLocaleString('fr-FR')} FCFA` : '-'} tone="purple" />
            </CardGrid>

            <DataTable
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
