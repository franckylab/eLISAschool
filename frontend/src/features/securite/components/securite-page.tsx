/**
 * ==================================
 * eLISAschool - Page Sécurité
 * ==================================
 */

import { Shield, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useIncidents, useStatistiquesSecurite } from '../hooks/use-securite';
import { DataTable } from '@/components/ui/DataTable';
import { CardGrid } from '@/components/ui/CardGrid';
import { StatCard } from '@/components/ui/StatCard';

const gravites: any = {
    mineure: { label: 'Mineure', color: 'yellow' },
    moderee: { label: 'Modérée', color: 'orange' },
    grave: { label: 'Grave', color: 'red' },
    critique: { label: 'Critique', color: 'purple' },
};

const statuts: any = {
    signale: { label: 'Signalé', color: 'yellow' },
    en_cours: { label: 'En cours', color: 'blue' },
    resolu: { label: 'Résolu', color: 'green' },
    archive: { label: 'Archivé', color: 'gray' },
};

export function SecuritePage() {
    const { data: incidentsData, isLoading } = useIncidents();
    const { data: stats } = useStatistiquesSecurite();

    const incidents = incidentsData?.data || [];

    const colonnes = [
        { key: 'titre', header: 'Titre', render: (i: any) => <span className="font-medium">{i.titre}</span> },
        { key: 'type', header: 'Type', className: 'w-28', render: (i: any) => <span className="text-sm capitalize">{i.type}</span> },
        { key: 'gravite', header: 'Gravité', className: 'w-24', render: (i: any) => { const g = gravites[i.gravite] || { label: i.gravite, color: 'gray' }; return <span className={`px-2 py-1 rounded text-xs font-medium bg-${g.color}-100 text-${g.color}-700`}>{g.label}</span>; } },
        { key: 'lieu', header: 'Lieu', className: 'w-32', render: (i: any) => <span className="text-sm text-gray-600">{i.lieu}</span> },
        { key: 'date', header: 'Date', className: 'w-28', render: (i: any) => <span className="text-sm">{new Date(i.dateIncident).toLocaleDateString('fr-FR')}</span> },
        { key: 'statut', header: 'Statut', className: 'w-28', render: (i: any) => { const s = statuts[i.statut] || { label: i.statut, color: 'gray' }; return <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${s.color}-100 text-${s.color}-700`}>{s.label}</span>; } },
    ];

    if (isLoading && !incidentsData) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Gestion de la Sécurité</h1>
                <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                    <AlertTriangle className="w-4 h-4" />
                    Signaler incident
                </button>
            </div>

            <CardGrid columns={{ default: 1, md: 4 }}>
                <StatCard icon={Shield} label="Incidents" value={stats?.totalIncidents || 0} tone="accent" />
                <StatCard icon={Clock} label="En cours" value={stats?.incidentsEnCours || 0} tone="warning" />
                <StatCard icon={CheckCircle} label="Résolus" value={stats?.parStatut?.find((s: any) => s.statut === 'resolu')?.nombre || 0} tone="success" />
                <StatCard icon={AlertTriangle} label="Délai moyen" value={stats?.delaiMoyenResolution ? `${stats.delaiMoyenResolution.toFixed(1)}h` : '-'} tone="purple" />
            </CardGrid>

            <DataTable
                data={incidents}
                columns={colonnes}
                enableReordering
                enablePinning
                enableColumnVisibility
                searchable
                searchPlaceholder="Rechercher un incident..." />
        </div>
    );
}
