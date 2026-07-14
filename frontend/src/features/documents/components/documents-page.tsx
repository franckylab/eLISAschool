/**
 * ==================================
 * eLISAschool - Page Documents
 * ==================================
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FileText, Plus, Download, Eye, Edit, Trash2, HardDrive, TrendingDown } from 'lucide-react';
import { DataTable, Column } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { useDocuments, useSupprimerDocument, useTelechargerDocument, useStatistiquesDocuments } from '../hooks/use-documents';
import type { Document } from '../types/document.types';
import { CardGrid, StatCard } from '@/components/ui';

export function DocumentsPage() {
    const { t } = useTranslation('documents');
    const [page, setPage] = useState(1);
    const limit = 20;
    const [recherche, setRecherche] = useState('');
    const [filtreCategorie, setFiltreCategorie] = useState<string>('');

    const { data, isLoading, meta } = useDocuments({
        page,
        limit,
        recherche: recherche || undefined,
        categorie: filtreCategorie || undefined,
    });

    const { data: stats } = useStatistiquesDocuments();
    const supprimer = useSupprimerDocument();
    const telecharger = useTelechargerDocument();

    const categories: any = {
        pedagogique: { label: 'Pédagogique', color: 'blue', icone: FileText },
        administratif: { label: 'Administratif', color: 'purple', icone: FileText },
        financier: { label: 'Financier', color: 'green', icone: FileText },
        medical: { label: 'Médical', color: 'red', icone: FileText },
        personnel: { label: 'Personnel', color: 'orange', icone: FileText },
        autre: { label: 'Autre', color: 'gray', icone: FileText },
    };

    const formatTaille = (octets: number | undefined): string => {
        if (!octets) return '-';
        const ko = octets / 1024;
        if (ko < 1024) return `${ko.toFixed(1)} Ko`;
        const mo = ko / 1024;
        return `${mo.toFixed(1)} Mo`;
    };

    const colonnes: Column<Document>[] = [
        {
            key: 'categorie',
            header: 'Catégorie',
            className: 'text-center w-32',
            render: (d) => {
                const cat = categories[d.categorie];
                const Icone = cat?.icone || FileText;
                return (
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium bg-${cat?.color}-100 text-${cat?.color}-800`}>
                        <Icone className="h-3 w-3" />
                        {cat?.label}
                    </span>
                );
            },
        },
        {
            key: 'titre',
            header: 'Document',
            sortable: true,
            render: (d) => (
                <div>
                    <p className="font-medium text-gray-900">{d.titre}</p>
                    {d.description && <p className="text-xs text-gray-500 line-clamp-1">{d.description}</p>}
                    <p className="text-xs text-gray-400 mt-1">{d.typeFichier} • v{d.version || '1.0'}</p>
                </div>
            ),
        },
        {
            key: 'taille',
            header: 'Taille',
            className: 'text-center w-20',
            render: (d) => (
                <span className="text-sm font-medium text-gray-700">
                    {formatTaille(d.tailleFichier)}
                </span>
            ),
        },
        {
            key: 'uploadPar',
            header: 'Uploadé par',
            render: (d) => (
                d.uploadPar ? (
                    <div>
                        <p className="text-sm font-medium">{d.uploadPar.prenom} {d.uploadPar.nom}</p>
                        <p className="text-xs text-gray-500">{d.uploadPar.role}</p>
                    </div>
                ) : (
                    <span className="text-gray-400 text-sm">-</span>
                )
            ),
        },
        {
            key: 'telechargements',
            header: 'Téléchargements',
            className: 'text-center w-28',
            render: (d) => (
                <div className="flex items-center justify-center gap-1 text-sm text-gray-700">
                    <TrendingDown className="h-3 w-3" />
                    <span className="font-medium">{d.telechargements || 0}</span>
                </div>
            ),
        },
        {
            key: 'date',
            header: 'Date',
            className: 'w-28',
            render: (d) => (
                <span className="text-sm text-gray-700">
                    {new Date(d.createdAt).toLocaleDateString('fr-FR')}
                </span>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            className: 'text-right w-40',
            renderActions: (d) => [
                {
                    key: 'apercu',
                    icon: Eye,
                    label: 'Aperçu',
                    onClick: () => window.alert(`Aperçu: ${d.titre}`),
                    variant: 'info' as const,
                },
                {
                    key: 'telecharger',
                    icon: Download,
                    label: 'Télécharger',
                    onClick: () => telecharger.mutateAsync(d.id),
                    variant: 'success' as const,
                },
                {
                    key: 'modifier',
                    icon: Edit,
                    label: 'Modifier',
                    onClick: () => window.alert(`Modifier: ${d.titre}`),
                },
                {
                    key: 'supprimer',
                    icon: Trash2,
                    label: 'Supprimer',
                    onClick: () => supprimer.mutateAsync(d.id),
                    variant: 'danger' as const,
                },
            ],
        },
    ];

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('titre')}</h1>
                    <p className="text-sm text-gray-500 mt-1">{t('description')}</p>
                </div>
                <ElisaButton
                    variant="primary"
                    size="sm"
                    icon={<Plus className="h-4 w-4" />}
                    onClick={() => window.alert('Uploader document')}
                >
                    {t('uploader')}
                </ElisaButton>
            </motion.div>

            {stats && (
                <CardGrid columns={{ default: 1, md: 4 }}>
                    <StatCard icon={FileText} label="Total documents" value={stats.total} tone="accent" />
                    <StatCard icon={HardDrive} label="Taille totale" value={formatTaille(stats.tailleTotale)} tone="success" />
                    <StatCard icon={Download} label="Téléchargements" value={stats.totalTelechargements} tone="orange" />
                    <StatCard icon={FileText} label="Catégories" value={stats.parCategorie?.length || 0} tone="purple" />
                </CardGrid>
            )}



            <DataTable
                colonnes={colonnes}
                donnees={data || []}
                isLoading={isLoading}
                searchPlaceholder={t('rechercher')}
                enableRowHeight
                enableReordering
                enablePinning
                enableColumnVisibility
                onSearchChange={(valeur) => setRecherche(valeur)}
                disableClientSearch
                filtres={[
                    {
                        key: 'categorie',
                        label: 'Catégorie',
                        options: [
                            { value: 'pedagogique', label: 'Pédagogique' },
                            { value: 'administratif', label: 'Administratif' },
                            { value: 'financier', label: 'Financier' },
                            { value: 'medical', label: 'Médical' },
                            { value: 'personnel', label: 'Personnel' },
                            { value: 'autre', label: 'Autre' },
                        ],
                    },
                ]}
                onFilterChange={(key, valeur) => {
                    if (key === 'categorie') setFiltreCategorie(valeur);
                }}
                pagination={{
                    page,
                    limit,
                    total: meta?.total || 0,
                    onPageChange: setPage,
                }}
            />
        </div>
    );
}
