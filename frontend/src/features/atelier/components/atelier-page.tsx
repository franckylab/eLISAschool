/**
 * ==================================
 * eLISAschool - Page Atelier
 * ==================================
 */

import { Users, Star, TrendingUp, Activity } from 'lucide-react';
import { useAteliers, useInscriptions, useStatistiquesAtelier } from '../hooks/use-atelier';
import { DataTable } from '@/components/ui/DataTable';
import { CardGrid, StatCard } from '@/components/ui';

const typesAtelier: any = {
    manuel: { label: 'Manuel', color: 'blue' },
    artistique: { label: 'Artistique', color: 'purple' },
    technique: { label: 'Technique', color: 'green' },
    sportif: { label: 'Sportif', color: 'orange' },
    musical: { label: 'Musical', color: 'pink' },
    cuisine: { label: 'Cuisine', color: 'yellow' },
    autre: { label: 'Autre', color: 'gray' },
};

export function AtelierPage() {
    const { data: ateliers } = useAteliers();
    useInscriptions(); // inscriptionsData non utilisé
    const { data: stats } = useStatistiquesAtelier();

    const ateliersList = ateliers || [];

    const colonnes = [
        { key: 'nom',
            pinned: 'left' as const, header: 'Nom', render: (a: any) => <span className="font-medium">{a.nom}</span> },
        { key: 'type', header: 'Type', className: 'w-28', render: (a: any) => { const t = typesAtelier[a.type] || { label: a.type, color: 'gray' }; return <span className={`px-2 py-1 rounded text-xs font-medium bg-${t.color}-100 text-${t.color}-700`}>{t.label}</span>; } },
        { key: 'responsable', header: 'Responsable', render: (a: any) => <span className="text-sm">{a.responsable ? `${a.responsable.nom} ${a.responsable.prenom}` : '-'}</span> },
        { key: 'capacite', header: 'Capacité', className: 'w-20', render: (a: any) => <span className="text-sm font-medium">{a.capacite}</span> },
        { key: 'lieu', header: 'Lieu', className: 'w-32', render: (a: any) => <span className="text-sm text-gray-600">{a.lieu || '-'}</span> },
        { key: 'tarif', header: 'Tarif', className: 'w-24', render: (a: any) => <span className="text-sm">{a.tarif ? `${a.tarif.toLocaleString('fr-FR')} FCFA` : 'Gratuit'}</span> },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Gestion des Ateliers</h1>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Activity className="w-4 h-4" />
                    Nouvel atelier
                </button>
            </div>

            <CardGrid columns={{ default: 1, md: 4 }}>
                <StatCard icon={Activity} label="Ateliers" value={stats?.totalAteliers || 0} tone="accent" />
                <StatCard icon={Users} label="Inscriptions" value={stats?.totalInscriptions || 0} tone="success" />
                <StatCard icon={TrendingUp} label="Participation" value={stats?.tauxParticipation ? `${stats.tauxParticipation.toFixed(1)}%` : '-'} tone="warning" />
                <StatCard icon={Star} label="Types" value={stats?.parType?.length || 0} tone="purple" />
            </CardGrid>

            <DataTable
                tableId="ateliers"
                data={ateliersList}
                columns={colonnes}
                enableReordering
                enablePinning
                enableColumnVisibility
                searchable
                searchPlaceholder="Rechercher un atelier..." />
        </div>
    );
}
