/**
 * ==================================
 * eLISAschool - Page Archives
 * ==================================
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Archive, Plus, Download, Trash2, FileText, Image, Video, Music } from 'lucide-react';
import { DataTable, Column } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { CardGrid } from '@/components/ui/CardGrid';
import { StatCard } from '@/components/ui/StatCard';
import { useArchives, useTelechargerArchive, useSupprimerArchive, useStatistiquesArchives } from '../hooks/use-archives';
import type { Archive as ArchiveType } from '../types/archives.types';

export function ArchivesPage() {
    const { t } = useTranslation('archives');
    const [page, setPage] = useState(1);
    const [recherche, setRecherche] = useState('');
    const [filtreCategorie, setFiltreCategorie] = useState('');

    const { data, isLoading, meta } = useArchives({ recherche: recherche || undefined, categorie: filtreCategorie || undefined });
    const { data: stats } = useStatistiquesArchives();
    const telecharger = useTelechargerArchive();
    const supprimer = useSupprimerArchive();

    const categories: any = {
        document: { label: 'Document', color: 'blue', icone: FileText },
        photo: { label: 'Photo', color: 'purple', icone: Image },
        video: { label: 'Vidéo', color: 'red', icone: Video },
        audio: { label: 'Audio', color: 'green', icone: Music },
        autre: { label: 'Autre', color: 'gray', icone: FileText },
    };

    const formatTaille = (octets?: number): string => {
        if (!octets) return '-';
        const ko = octets / 1024;
        if (ko < 1024) return `${ko.toFixed(1)} Ko`;
        const mo = ko / 1024;
        return `${mo.toFixed(1)} Mo`;
    };

    const colonnes: Column<ArchiveType>[] = [
        { key: 'categorie', header: 'Type', className: 'text-center w-28', render: (a) => { const cat = categories[a.categorie]; const Icone = cat?.icone || FileText; return (<span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium bg-${cat?.color}-100 text-${cat?.color}-800`}><Icone className="h-3 w-3" />{cat?.label}</span>); }},
        { key: 'titre', header: 'Titre', render: (a) => (<div><p className="font-medium text-gray-900">{a.titre}</p>{a.anneeScolaire && <p className="text-xs text-gray-500">{a.anneeScolaire}</p>}</div>)},
        { key: 'taille', header: 'Taille', className: 'w-24', render: (a) => <span className="text-sm text-gray-700">{formatTaille(a.tailleFichier)}</span>},
        { key: 'archivePar', header: 'Archivé par', className: 'w-40', render: (a) => (a.archivePar ? <p className="text-sm text-gray-700">{a.archivePar.prenom} {a.archivePar.nom}</p> : <span className="text-gray-400">-</span>)},
        { key: 'date', header: 'Date', className: 'w-28', render: (a) => <span className="text-sm text-gray-700">{new Date(a.createdAt).toLocaleDateString('fr-FR')}</span>},
        { key: 'actions',
            header: 'Actions', className: 'text-right',
            renderActions: (a) => [
                { key: 'telecharger', icon: Download, label: 'Télécharger', onClick: () => telecharger.mutateAsync(a.id) },
                { key: 'supprimer', icon: Trash2, label: 'Supprimer', onClick: () => supprimer.mutateAsync(a.id), variant: 'danger' as const },
            ],
        },
    ];

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
                <div><h1 className="text-2xl font-bold text-gray-900">{t('titre')}</h1><p className="text-sm text-gray-500 mt-1">{t('description')}</p></div>
                <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => window.alert('Nouvelle archive')}>{t('archiver')}</ElisaButton>
            </motion.div>

            {stats && (
                <CardGrid columns={{ default: 1, md: 4 }}>
                    <StatCard icon={Archive} label="Total archives" value={stats.totalArchives} tone="accent" />
                    <StatCard icon={FileText} label="Taille totale" value={formatTaille(stats.tailleTotale)} tone="success" />
                    <StatCard icon={Image} label="Catégories" value={stats.parCategorie?.length || 0} tone="purple" />
                    <StatCard icon={FileText} label="Documents" value={stats.parCategorie?.find(c => c.categorie === 'document')?.nombre || 0} tone="orange" />
                </CardGrid>
            )}

            <DataTable
                colonnes={colonnes}
                donnees={data || []}
                isLoading={isLoading}
                enableReordering
                enableRowHeight
                enablePinning
                enableColumnVisibility
                searchPlaceholder={t('rechercher')}
                filtres={[
                    {
                        key: 'categorie',
                        label: 'Catégorie',
                        options: [
                            { value: 'document', label: 'Document' },
                            { value: 'photo', label: 'Photo' },
                            { value: 'video', label: 'Vidéo' },
                            { value: 'audio', label: 'Audio' },
                            { value: 'autre', label: 'Autre' },
                        ],
                        allOptionLabel: 'Toutes catégories',
                    },
                ]}
                onSearchChange={setRecherche}
                onFilterChange={(key, valeur) => {
                    if (key === 'categorie') setFiltreCategorie(valeur);
                }}
                disableClientSearch
                pagination={{ page, limit: 20, total: meta?.total || 0, onPageChange: setPage }}
            />
        </div>
    );
}
