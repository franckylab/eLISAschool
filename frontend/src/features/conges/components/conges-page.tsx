/**
 * ==================================
 * eLISAschool - Page Congés
 * ==================================
 */

import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Plus, Eye } from 'lucide-react';
import { useConges, useStatistiquesConges } from '../hooks/use-conges';
import { DataTable } from '@/components/ui/DataTable';
import { CardGrid, StatCard } from '@/components/ui';

const typesConges: any = {
    annuel: { label: 'Annuel', color: 'blue' },
    maladie: { label: 'Maladie', color: 'red' },
    maternite: { label: 'Maternité', color: 'pink' },
    paternite: { label: 'Paternité', color: 'purple' },
    deuil: { label: 'Deuil', color: 'gray' },
    formation: { label: 'Formation', color: 'green' },
    sans_solde: { label: 'Sans solde', color: 'orange' },
    autre: { label: 'Autre', color: 'yellow' },
};

const statuts: any = {
    en_attente: { label: 'En attente', color: 'yellow', icon: AlertCircle },
    accepte: { label: 'Accepté', color: 'green', icon: CheckCircle },
    refuse: { label: 'Refusé', color: 'red', icon: XCircle },
    annule: { label: 'Annulé', color: 'gray', icon: XCircle },
};

export function CongesPage() {
    const { data: congesData, isLoading } = useConges();
    const { data: stats } = useStatistiquesConges();
    

    const conges = congesData?.data || [];

    const colonnes = [
        { key: 'demandeur', header: 'Demandeur', render: (c: any) => <span className="font-medium">{c.demandeur ? `${c.demandeur.nom} ${c.demandeur.prenom}` : '-'}</span> },
        { key: 'type', header: 'Type', className: 'w-32', render: (c: any) => { const t = typesConges[c.type] || { label: c.type, color: 'gray' }; return <span className={`px-2 py-1 rounded text-xs font-medium bg-${t.color}-100 text-${t.color}-700`}>{t.label}</span>; } },
        { key: 'dates', header: 'Période', render: (c: any) => <span className="text-sm">{new Date(c.dateDebut).toLocaleDateString('fr-FR')} - {new Date(c.dateFin).toLocaleDateString('fr-FR')} ({c.nombreJours}j)</span> },
        { key: 'motif', header: 'Motif', className: 'max-w-xs', render: (c: any) => <span className="text-sm text-gray-600 truncate">{c.motif}</span> },
        { key: 'statut', header: 'Statut', className: 'w-28', render: (c: any) => { const s = statuts[c.statut] || { label: c.statut, color: 'gray', icon: AlertCircle }; return <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${s.color}-100 text-${s.color}-700 flex items-center gap-1 w-fit`}><s.icon className="w-3 h-3" />{s.label}</span>; } },
        { key: 'actions',
            header: 'Actions', className: 'text-right',
            renderActions: (_c: any) => [
                { key: 'voir', icon: Eye, label: 'Voir détails', onClick: () => {/* Voir détails */}, variant: 'info' as const },
            ],
        },
    ];

    if (isLoading && !congesData) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Gestion des Congés</h1>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Plus className="w-4 h-4" />
                    Nouvelle demande
                </button>
            </div>

            <CardGrid columns={{ default: 1, md: 4 }}>
                <StatCard icon={AlertCircle} label="En attente" value={stats?.enAttente || 0} tone="warning" />
                <StatCard icon={CheckCircle} label="Acceptés" value={stats?.acceptes || 0} tone="success" />
                <StatCard icon={Calendar} label="Total demandes" value={stats?.totalDemandes || 0} tone="accent" />
                <StatCard icon={Clock} label="Jours total" value={conges.reduce((sum, c) => sum + c.nombreJours, 0)} tone="purple" />
            </CardGrid>

            <DataTable
                data={conges}
                columns={colonnes}
                enableReordering
                enablePinning
                enableColumnVisibility
                searchable
                searchPlaceholder="Rechercher un congé..." />
        </div>
    );
}
