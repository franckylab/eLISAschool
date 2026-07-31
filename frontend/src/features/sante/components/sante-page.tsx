/**
 * ==================================
 * eLISAschool - Page Santé
 * ==================================
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, Plus, Eye, FileText, Activity, Thermometer } from 'lucide-react';
import { DataTable, Column } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { CardGrid } from '@/components/ui/CardGrid';
import { StatCard } from '@/components/ui/StatCard';
import { useVisitesInfirmerie, useStatistiquesSante } from '../hooks/use-sante';
import type { VisiteInfirmerie } from '../types/sante.types';

export function SantePage() {
    const { t } = useTranslation('sante');
    const [page, setPage] = useState(1);
    const limit = 20;
    const [recherche, setRecherche] = useState('');
    const [filtreOrientation, setFiltreOrientation] = useState<string>('');

    const { data, isLoading, meta, isError, error, refetch } = useVisitesInfirmerie({
        page,
        limit,
        recherche: recherche || undefined,
        orientation: filtreOrientation || undefined,
    });

    const { data: stats } = useStatistiquesSante();

    const orientations: any = {
        retour_classe: { label: 'Retour classe', color: 'green' },
        renvoi_domicile: { label: 'Renvoi domicile', color: 'orange' },
        hopital: { label: 'Hôpital', color: 'red' },
        autre: { label: 'Autre', color: 'gray' },
    };

    const colonnes: Column<VisiteInfirmerie>[] = [
        {
            key: 'eleve',
            pinned: 'left' as const,
            header: 'Élève',
            sortable: true,
            render: (v) => (
                <div>
                    <p className="font-medium text-gray-900">{v.eleve?.prenom} {v.eleve?.nom}</p>
                    <p className="text-xs text-gray-500">{v.eleve?.matricule}</p>
                </div>
            ),
        },
        {
            key: 'date',
            header: 'Date',
            className: 'w-28',
            render: (v) => (
                <span className="text-sm text-gray-700">
                    {new Date(v.dateVisite).toLocaleDateString('fr-FR')}
                </span>
            ),
        },
        {
            key: 'motif',
            header: 'Motif',
            render: (v) => (
                <div>
                    <p className="text-sm font-medium text-gray-900">{v.motif}</p>
                    {v.diagnostic && <p className="text-xs text-gray-500 line-clamp-1">Diag: {v.diagnostic}</p>}
                </div>
            ),
        },
        {
            key: 'soins',
            header: 'Soins',
            className: 'w-48',
            render: (v) => (
                <p className="text-sm text-gray-700 line-clamp-2">{v.soinsProdigues || '-'}</p>
            ),
        },
        {
            key: 'orientation',
            header: 'Orientation',
            className: 'text-center w-32',
            render: (v) => {
                if (!v.orientation) return <span className="text-gray-400">-</span>;
                const orientation = orientations[v.orientation];
                return (
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-${orientation?.color}-100 text-${orientation?.color}-800`}>
                        {orientation?.label}
                    </span>
                );
            },
        },
        {
            key: 'infirmier',
            header: 'Infirmier(e)',
            className: 'w-32',
            render: (v) => (
                v.infirmier ? (
                    <p className="text-sm text-gray-700">{v.infirmier.prenom} {v.infirmier.nom}</p>
                ) : (
                    <span className="text-gray-400 text-sm">-</span>
                )
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            className: 'text-right',
            renderActions: (v) => [
                {
                    key: 'detail',
                    icon: Eye,
                    label: 'Détail visite',
                    onClick: () => window.alert(`Détail visite: ${v.eleve?.nom}`),
                },
            ],
        },
    ];

    if (isLoading && !data) return <PageSkeleton />;
    if (isError) return <ErrorMessage message={error?.message || t('erreurChargement')} onRetry={refetch} />;

    return (
        <div className="space-y-6">
            <PageHeader
                variant="gradient"
                icon={Heart}
                title={t('titre')}
                subtitle={t('description')}
                showBreadcrumbs={false}
                actions={
                    <ElisaButton
                        variant="primary"
                        size="sm"
                        leftIcon={<Plus className="h-4 w-4" />}
                        onClick={() => window.alert('Enregistrer visite')}
                    >
                        {t('enregistrer')}
                    </ElisaButton>
                }
            />

            {stats && (
                <CardGrid columns={{ default: 1, md: 4 }}>
                    <StatCard icon={Heart} label="Total visites" value={stats.totalVisites} tone="danger" />
                    <StatCard icon={FileText} label="Dossiers médicaux" value={stats.totalDossiers} tone="accent" />
                    <StatCard icon={Thermometer} label="Motif fréquent" value={stats.motifsFrequents?.[0]?.motif || '-'} tone="orange" />
                    <StatCard icon={Activity} label="Retour classe" value={stats.parOrientation?.find(o => o.orientation === 'retour_classe')?.nombre || 0} tone="success" />
                </CardGrid>
            )}

            <DataTable
                colonnes={colonnes}
                donnees={data || []}
                isLoading={isLoading}
                enableReordering
                enablePinning
                enableColumnVisibility
                searchPlaceholder={t('rechercher')}
                enableCollapsibleFilters
                filtres={[
                    {
                        key: 'orientation',
                        label: 'Orientation',
                        options: [
                            { value: 'retour_classe', label: 'Retour classe' },
                            { value: 'renvoi_domicile', label: 'Renvoi domicile' },
                            { value: 'hopital', label: 'Hôpital' },
                            { value: 'autre', label: 'Autre' },
                        ],
                        allOptionLabel: 'Toutes orientations',
                    },
                ]}
                onSearchChange={setRecherche}
                onFilterChange={(key, valeur) => {
                    if (key === 'orientation') setFiltreOrientation(valeur);
                }}
                disableClientSearch
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
