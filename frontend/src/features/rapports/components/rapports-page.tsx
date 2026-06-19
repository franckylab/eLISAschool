/**
 * ==================================
 * eLISAschool - Page Rapports
 * ==================================
 */

import { motion } from 'framer-motion';
import { FileText, Download, Archive, Plus, FileSpreadsheet, File } from 'lucide-react';
import { useRapports, useStatistiquesRapports } from '../hooks/use-rapports';
import { DataTable } from '@/components/ui/DataTable';

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
            renderActions: (r: any) => [
                {
                    key: 'telecharger',
                    icon: Download,
                    label: 'Télécharger',
                    onClick: () => {/* Télécharger */},
                },
            ],
        },
    ];

    if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Gestion des Rapports</h1>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Plus className="w-4 h-4" />
                    Nouveau rapport
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <motion.div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center gap-3 mb-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">Total rapports</span>
                    </div>
                    <p className="text-3xl font-bold text-blue-800">{stats?.totalRapports || 0}</p>
                </motion.div>

                <motion.div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center gap-3 mb-2">
                        <Archive className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-green-700">Générés</span>
                    </div>
                    <p className="text-3xl font-bold text-green-800">{stats?.parStatut?.find((s: any) => s.statut === 'genere')?.nombre || 0}</p>
                </motion.div>

                <motion.div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
                    <div className="flex items-center gap-3 mb-2">
                        <Download className="w-5 h-5 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-700">Formats</span>
                    </div>
                    <p className="text-3xl font-bold text-yellow-800">{stats?.parFormat?.length || 0}</p>
                </motion.div>

                <motion.div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center gap-3 mb-2">
                        <FileText className="w-5 h-5 text-purple-600" />
                        <span className="text-sm font-medium text-purple-700">Taille totale</span>
                    </div>
                    <p className="text-3xl font-bold text-purple-800">{stats?.tailleTotale ? `${(stats.tailleTotale / 1024 / 1024).toFixed(1)} Mo` : '-'}</p>
                </motion.div>
            </div>

            <DataTable
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
