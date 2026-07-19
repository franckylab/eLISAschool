import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Archive, Plus, Download, Trash2, FileText, Image, Video, Music } from 'lucide-react';
import { DataTable, Column } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { CardGrid } from '@/components/ui/CardGrid';
import { StatCard } from '@/components/ui/StatCard';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useArchives, useTelechargerArchive, useSupprimerArchive, useStatistiquesArchives } from '../hooks/use-archives';
import type { Archive as ArchiveType } from '../types/archives.types';

export function ArchivesPage() {
    const { t } = useTranslation('archives');
    const [page, setPage] = useState(1);
    const [recherche, setRecherche] = useState('');
    const [filtreCategorie, setFiltreCategorie] = useState('');

    const { data, isLoading, error, meta } = useArchives({ recherche: recherche || undefined, categorie: filtreCategorie || undefined });
    const { data: stats } = useStatistiquesArchives();
    const telecharger = useTelechargerArchive();
    const supprimer = useSupprimerArchive();

    const categories: any = {
        document: { label: t('document'), color: 'blue', icone: FileText },
        photo: { label: t('photo'), color: 'purple', icone: Image },
        video: { label: t('video'), color: 'red', icone: Video },
        audio: { label: t('audio'), color: 'green', icone: Music },
        autre: { label: t('autre'), color: 'gray', icone: FileText },
    };

    const formatTaille = (octets?: number): string => {
        if (!octets) return '-';
        const ko = octets / 1024;
        if (ko < 1024) return `${ko.toFixed(1)} Ko`;
        const mo = ko / 1024;
        return `${mo.toFixed(1)} Mo`;
    };

    const colonnes: Column<ArchiveType>[] = [
        { key: 'categorie', header: t('categorie'), className: 'text-center w-28', render: (a) => { const cat = categories[a.categorie]; const Icone = cat?.icone || FileText; return (<span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium bg-${cat?.color}-100 text-${cat?.color}-800`}><Icone className="h-3 w-3" />{cat?.label}</span>); }},
        { key: 'titre', header: t('titre'), render: (a) => (<div><p className="font-medium text-gray-900">{a.titre}</p>{a.anneeScolaire && <p className="text-xs text-gray-500">{a.anneeScolaire}</p>}</div>)},
        { key: 'taille', header: t('taille'), className: 'w-24', render: (a) => <span className="text-sm text-gray-700">{formatTaille(a.tailleFichier)}</span>},
        { key: 'archivePar', header: t('archivePar'), className: 'w-40', render: (a) => (a.archivePar ? <p className="text-sm text-gray-700">{a.archivePar.prenom} {a.archivePar.nom}</p> : <span className="text-gray-400">-</span>)},
        { key: 'date', header: t('date'), className: 'w-28', render: (a) => <span className="text-sm text-gray-700">{new Date(a.createdAt).toLocaleDateString('fr-FR')}</span>},
        { key: 'actions',
            header: t('actions'), className: 'text-right',
            renderActions: (a) => [
                { key: 'telecharger', icon: Download, label: t('telecharger'), onClick: () => telecharger.mutateAsync(a.id) },
                { key: 'supprimer', icon: Trash2, label: t('supprimer'), onClick: () => supprimer.mutateAsync(a.id), variant: 'danger' as const },
            ],
        },
    ];

    if (isLoading && !data) return <PageSkeleton />;
    if (error) return <ErrorMessage message={error?.message || t('uneErreurEstSurvenue')} onRetry={() => window.location.reload()} />;

    return (
        <div className="space-y-6">
            <PageHeader
                variant="gradient"
                icon={Archive}
                title={t('titre')}
                subtitle={t('description')}
                actions={
                    <ElisaButton variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => window.alert(t('archiver'))}>{t('archiver')}</ElisaButton>
                }
            />

            {stats && (
                <CardGrid columns={{ default: 1, md: 4 }}>
                    <StatCard icon={Archive} label={t('totalArchives')} value={stats.totalArchives} tone="accent" />
                    <StatCard icon={FileText} label={t('tailleTotale')} value={formatTaille(stats.tailleTotale)} tone="success" />
                    <StatCard icon={Image} label={t('categories')} value={stats.parCategorie?.length || 0} tone="purple" />
                    <StatCard icon={FileText} label={t('documents')} value={stats.parCategorie?.find(c => c.categorie === 'document')?.nombre || 0} tone="orange" />
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
                        label: t('categorie'),
                        options: [
                            { value: 'document', label: t('document') },
                            { value: 'photo', label: t('photo') },
                            { value: 'video', label: t('video') },
                            { value: 'audio', label: t('audio') },
                            { value: 'autre', label: t('autre') },
                        ],
                        allOptionLabel: t('toutesCategories'),
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
