/**
 * ==================================
 * eLISAschool - Page Courriers
 * ==================================
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Plus, Trash2, MailOpen, AlertCircle, Clock } from 'lucide-react';
import { DataTable, Column } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { CardGrid, StatCard } from '@/components/ui';
import { useCourriers, useMarquerCommeLu, useSupprimerCourrier, useStatistiquesCourriers } from '../hooks/use-courriers';
import type { Courrier } from '../types/courriers.types';

export function CourriersPage() {
    const { t } = useTranslation('courriers');
    const [page, setPage] = useState(1);
    const limit = 20;
    const [recherche, setRecherche] = useState('');
    const [filtreType, setFiltreType] = useState('');
    const [filtreStatut, setFiltreStatut] = useState('');

    const { data, isLoading, meta, isError, error, refetch } = useCourriers({
        recherche: recherche || undefined,
        type: filtreType || undefined,
        statut: filtreStatut || undefined,
    });

    const { data: stats } = useStatistiquesCourriers();
    const marquerLu = useMarquerCommeLu();
    const supprimer = useSupprimerCourrier();

    const types: any = {
        entrant: { label: 'Entrant', color: 'blue' },
        sortant: { label: 'Sortant', color: 'green' },
        interne: { label: 'Interne', color: 'purple' },
    };

    const statuts: any = {
        nouveau: { label: 'Nouveau', color: 'blue' },
        lu: { label: 'Lu', color: 'gray' },
        traite: { label: 'Traité', color: 'green' },
        archive: { label: 'Archivé', color: 'orange' },
    };

    const priorites: any = {
        basse: { label: 'Basse', color: 'gray' },
        normale: { label: 'Normale', color: 'blue' },
        haute: { label: 'Haute', color: 'orange' },
        urgente: { label: 'Urgente', color: 'red' },
    };

    const colonnes: Column<Courrier>[] = [
        {
            key: 'type',
            header: 'Type',
            className: 'text-center w-24',
            render: (c) => {
                const type = types[c.type];
                return (
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-${type?.color}-100 text-${type?.color}-800`}>
                        {type?.label}
                    </span>
                );
            },
        },
        {
            key: 'objet',
            header: 'Objet',
            render: (c) => (
                <div>
                    <p className="font-medium text-gray-900">{c.objet}</p>
                    {c.reference && <p className="text-xs text-gray-500">Ref: {c.reference}</p>}
                </div>
            ),
        },
        {
            key: 'priorite',
            header: 'Priorité',
            className: 'text-center w-24',
            render: (c) => {
                const priorite = priorites[c.priorite];
                return (
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-${priorite?.color}-100 text-${priorite?.color}-800`}>
                        {priorite?.label}
                    </span>
                );
            },
        },
        {
            key: 'date',
            header: 'Date',
            className: 'w-28',
            render: (c) => (
                <span className="text-sm text-gray-700">
                    {new Date(c.dateCourrier).toLocaleDateString('fr-FR')}
                </span>
            ),
        },
        {
            key: 'destinataire',
            header: 'Destinataire',
            className: 'w-40',
            render: (c) => (
                <p className="text-sm text-gray-700">{c.destinataire}</p>
            ),
        },
        {
            key: 'statut',
            header: 'Statut',
            className: 'text-center w-24',
            render: (c) => {
                const statut = statuts[c.statut];
                return (
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-${statut?.color}-100 text-${statut?.color}-800`}>
                        {statut?.label}
                    </span>
                );
            },
        },
        {
            key: 'actions',
            header: 'Actions',
            className: 'text-right',
            renderActions: (c) => [
                {
                    key: 'marquer-lu',
                    icon: MailOpen,
                    label: 'Marquer comme lu',
                    onClick: () => marquerLu.mutateAsync(c.id),
                    hidden: c.statut !== 'nouveau',
                },
                {
                    key: 'supprimer',
                    icon: Trash2,
                    label: 'Supprimer',
                    onClick: () => supprimer.mutateAsync(c.id),
                    variant: 'danger' as const,
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
                icon={Mail}
                title={t('titre')}
                subtitle={t('description')}
                showBreadcrumbs={false}
                actions={
                    <ElisaButton variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => window.alert('Nouveau courrier')}>
                        {t('creer')}
                    </ElisaButton>
                }
            />

            {stats && (
                <CardGrid columns={{ default: 1, md: 4 }}>
                    <StatCard icon={Mail} label="Total courriers" value={stats.totalCourriers} tone="accent" />
                    <StatCard icon={AlertCircle} label="Non lus" value={stats.nonLus} tone="orange" />
                    <StatCard icon={MailOpen} label="Traités" value={stats.parStatut?.find(s => s.statut === 'traite')?.nombre || 0} tone="success" />
                    <StatCard icon={Clock} label="Urgents" value={stats.parPriorite?.find(p => p.priorite === 'urgente')?.nombre || 0} tone="danger" />
                </CardGrid>
            )}



            <DataTable
                columns={colonnes}
                data={data || []}
                isLoading={isLoading}
                enableReordering
                enableRowHeight
                enablePinning
                enableColumnVisibility
                pagination={{ page, limit, total: meta?.total || 0, onPageChange: setPage }}
                searchPlaceholder={t('rechercher')}
                onSearchChange={(valeur) => setRecherche(valeur)}
                disableClientSearch
                filtres={[
                    {
                        key: 'type',
                        label: 'Type',
                        options: [
                            { value: 'entrant', label: 'Entrant' },
                            { value: 'sortant', label: 'Sortant' },
                            { value: 'interne', label: 'Interne' },
                        ],
                    },
                    {
                        key: 'statut',
                        label: 'Statut',
                        options: [
                            { value: 'nouveau', label: 'Nouveau' },
                            { value: 'lu', label: 'Lu' },
                            { value: 'traite', label: 'Traité' },
                            { value: 'archive', label: 'Archivé' },
                        ],
                    },
                ]}
                onFilterChange={(key, valeur) => {
                    if (key === 'type') setFiltreType(valeur);
                    if (key === 'statut') setFiltreStatut(valeur);
                }}
            />
        </div>
    );
}
