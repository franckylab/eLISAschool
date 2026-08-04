/**
 * ==================================
 * eLISAschool - Page Rapports
 * ==================================
 */

import { FileText, Download, Archive, Plus, FileSpreadsheet, File } from 'lucide-react';
import { useRapports, useStatistiquesRapports } from '../hooks/use-rapports';
import { DataTable } from '@/components/ui/DataTable';
import { SchoolLoading } from '@/components/feedback';
import { CardGrid } from '@/components/ui/CardGrid';
import { StatCard } from '@/components/ui/StatCard';

const formats: any = {
    pdf: { label: 'PDF', icon: FileText, color: 'red' },
    excel: { label: 'Excel', icon: FileSpreadsheet, color: 'green' },
    csv: { label: 'CSV', icon: File, color: 'blue' },
    html: { label: 'HTML', icon: FileText, color: 'purple' },
};

const statuts: any = {
    en_cours: { label: 'En cours', color: 'yellow' },
    genere: { label: 'Généré', color: 'green' },
    echec: { label: 'Échec', color: 'red' },
    archive: { label: 'Archivé', color: 'gray' },
};

export function RapportsPage() {
    const { data: rapportsData, isLoading } = useRapports();
    const { data: stats } = useStatistiquesRapports();

    const rapports = rapportsData?.data || [];

    const colonnes = [
        { key: 'titre', header: 'Titre', render: (r: any) => <span className="font-medium">{r.titre}</span> },
        { key: 'type', header: 'Type', className: 'w-32', render: (r: any) => <span className="text-sm capitalize">{r.type}</span> },
        { key: 'format', header: 'Format', className: 'w-24', render: (r: any) => { const f = formats[r.format] || { label: r.format, icon: FileText, color: 'gray' }; return <span className={`px-2 py-1 rounded text-xs font-medium bg-${f.color}-100 text-${f.color}-700`}>{f.label}</span>; } },
        { key: 'statut', header: 'Statut', className: 'w-28', render: (r: any) => { const s = statuts[r.statut] || { label: r.statut, color: 'gray' }; return <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${s.color}-100 text-${s.color}-700`}>{s.label}</span>; } },
        { key: 'date', header: 'Date', className: 'w-28', render: (r: any) => <span className="text-sm">{new Date(r.dateGeneration).toLocaleDateString('fr-FR')}</span> },
        { key: 'taille', header: 'Taille', className: 'w-20', render: (r: any) => <span className="text-sm text-gray-600">{r.taille ? `${(r.taille / 1024).toFixed(1)} Ko` : '-'}</span> },
        { key: 'actions',
            header: 'Actions', className: 'w-32',
            renderActions: (_r: any) => [
                {
                    key: 'telecharger',
                    icon: Download,
                    label: 'Télécharger',
                    onClick: () => {/* Télécharger */},
                },
            ],
        },
    ];

    if (isLoading && !rapportsData) return <SchoolLoading message="Chargement des rapports..." />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Gestion des Rapports</h1>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Plus className="w-4 h-4" />
                    Nouveau rapport
                </button>
            </div>

            <CardGrid columns={{ default: 1, md: 4 }}>
                <StatCard icon={FileText} label="Total rapports" value={stats?.totalRapports || 0} tone="accent" />
                <StatCard icon={Archive} label="Générés" value={stats?.parStatut?.find((s: any) => s.statut === 'genere')?.nombre || 0} tone="success" />
                <StatCard icon={Download} label="Formats" value={stats?.parFormat?.length || 0} tone="warning" />
                <StatCard icon={FileText} label="Taille totale" value={stats?.tailleTotale ? `${(stats.tailleTotale / 1024 / 1024).toFixed(1)} Mo` : '-'} tone="purple" />
            </CardGrid>

            <DataTable
                tableId="rapports"
                data={rapports}
                columns={colonnes}
                enableReordering
                enableRowHeight
                enablePinning
                enableColumnVisibility
                searchable
                searchPlaceholder="Rechercher un rapport..." />
        </div>
    );
}
