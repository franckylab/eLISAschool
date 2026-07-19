/**
 * ==================================
 * eLISAschool - Page Discipline
 * ==================================
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Plus, Eye, Trash2, Shield, AlertCircle } from 'lucide-react';
import { DataTable, Column } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { CardGrid, StatCard } from '@/components/ui';
import { useSanctions, useSupprimerSanction, useAmnistierSanction, useStatistiquesDiscipline } from '../hooks/use-discipline';
import type { Sanction } from '../types/discipline.types';

export function DisciplinePage() {
    const { t } = useTranslation('discipline');
    const [page] = useState(1);
    const limit = 20;
    const [recherche, setRecherche] = useState('');
    const [filtreType, setFiltreType] = useState<string>('');
    const [filtreGravite, setFiltreGravite] = useState<string>('');

    const { data: result, isLoading, isError, error, refetch } = useSanctions({
        page,
        limit,
        recherche: recherche || undefined,
        type: filtreType || undefined,
        gravite: filtreGravite || undefined,
    });
    const data = result?.data;

    const { data: stats } = useStatistiquesDiscipline();
    const supprimer = useSupprimerSanction();
    const amnistier = useAmnistierSanction();

    const types: any = {
        avertissement: { label: 'Avertissement', color: 'yellow', icone: AlertCircle },
        remontrance: { label: 'Réprimande', color: 'orange', icone: AlertTriangle },
        exclusion_temporaire: { label: 'Exclusion temp.', color: 'red', icone: Shield },
        exclusion_definitive: { label: 'Exclusion déf.', color: 'red', icone: Shield },
        conseil_discipline: { label: 'Conseil discipline', color: 'purple', icone: Shield },
        autre: { label: 'Autre', color: 'gray', icone: AlertTriangle },
    };

    const gravites: any = {
        legere: { label: 'Légère', color: 'yellow' },
        moyenne: { label: 'Moyenne', color: 'orange' },
        grave: { label: 'Grave', color: 'red' },
        tres_grave: { label: 'Très grave', color: 'red' },
    };

    const statuts: any = {
        active: { label: 'Active', color: 'red' },
        amnistiee: { label: 'Amnistiée', color: 'green' },
        archivee: { label: 'Archivée', color: 'gray' },
    };

    const colonnes: Column<Sanction>[] = [
        {
            key: 'type',
            header: 'Type',
            className: 'text-center w-36',
            render: (s) => {
                const type = types[s.type];
                const Icone = type?.icone || AlertTriangle;
                return (
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium bg-${type?.color}-100 text-${type?.color}-800`}>
                        <Icone className="h-3 w-3" />
                        {type?.label}
                    </span>
                );
            },
        },
        {
            key: 'eleve',
            pinned: 'left' as const,
            header: 'Élève',
            sortable: true,
            render: (s) => (
                <div>
                    <p className="font-medium text-gray-900">{s.eleve?.prenom} {s.eleve?.nom}</p>
                    <p className="text-xs text-gray-500">{s.eleve?.matricule}</p>
                    {s.eleve?.classe && (
                        <p className="text-xs text-gray-400">{s.eleve.classe.code}</p>
                    )}
                </div>
            ),
        },
        {
            key: 'gravite',
            header: 'Gravité',
            className: 'text-center w-24',
            render: (s) => {
                const gravite = gravites[s.gravite];
                return (
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-${gravite?.color}-100 text-${gravite?.color}-800`}>
                        {gravite?.label}
                    </span>
                );
            },
        },
        {
            key: 'motif',
            header: 'Motif',
            render: (s) => (
                <div>
                    <p className="text-sm font-medium text-gray-900">{s.motif}</p>
                    {s.description && <p className="text-xs text-gray-500 line-clamp-1">{s.description}</p>}
                </div>
            ),
        },
        {
            key: 'date',
            header: 'Date',
            className: 'w-28',
            render: (s) => (
                <span className="text-sm text-gray-700">
                    {new Date(s.dateSanction).toLocaleDateString('fr-FR')}
                </span>
            ),
        },
        {
            key: 'statut',
            header: 'Statut',
            className: 'text-center w-24',
            render: (s) => {
                const statut = statuts[s.statut || 'active'];
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
            className: 'text-right w-40',
            renderActions: (s) => [
                {
                    key: 'voir',
                    icon: Eye,
                    label: 'Voir détails',
                    onClick: () => window.alert(`Détail: ${s.eleve?.nom}`),
                    variant: 'info' as const,
                },
                {
                    key: 'amnistier',
                    icon: Shield,
                    label: 'Amnistier',
                    onClick: () => amnistier.mutateAsync(s.id),
                    variant: 'success' as const,
                    hidden: s.statut !== 'active',
                },
                {
                    key: 'supprimer',
                    icon: Trash2,
                    label: 'Supprimer',
                    onClick: () => supprimer.mutateAsync(s.id),
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
                icon={Shield}
                title={t('titre')}
                subtitle={t('description')}
                showBreadcrumbs={false}
                actions={
                    <ElisaButton
                        variant="primary"
                        size="sm"
                        leftIcon={<Plus className="h-4 w-4" />}
                        onClick={() => window.alert('Enregistrer sanction')}
                    >
                        {t('enregistrer')}
                    </ElisaButton>
                }
            />

            {stats && (
                <CardGrid columns={{ default: 1, md: 4 }}>
                    <StatCard icon={AlertTriangle} label="Total sanctions" value={stats.totalItemsSanctions} tone="danger" />
                    <StatCard icon={AlertCircle} label="Graves" value={stats.parGravite?.find(g => g.gravite === 'grave' || g.gravite === 'tres_grave')?.nombre || 0} tone="orange" />
                    <StatCard icon={Shield} label="Amnistiées" value={stats.parStatut?.find(s => s.statut === 'amnistiee')?.nombre || 0} tone="success" />
                    <StatCard icon={AlertTriangle} label="Types" value={stats.parType?.length || 0} tone="accent" />
                </CardGrid>
            )}

            <DataTable
                tableId="discipline"
                data={data?.items || []}
                columns={colonnes}
                isLoading={isLoading}
                enableReordering
                enableRowHeight
                enablePinning
                enableColumnVisibility
                searchPlaceholder={t('rechercher')}
                filtres={[
                    {
                        key: 'type',
                        label: 'Type',
                        options: [
                            { value: 'avertissement', label: 'Avertissement' },
                            { value: 'remontrance', label: 'Réprimande' },
                            { value: 'exclusion_temporaire', label: 'Exclusion temp.' },
                            { value: 'exclusion_definitive', label: 'Exclusion déf.' },
                            { value: 'conseil_discipline', label: 'Conseil discipline' },
                            { value: 'autre', label: 'Autre' },
                        ],
                        allOptionLabel: 'Tous les types',
                    },
                    {
                        key: 'gravite',
                        label: 'Gravité',
                        options: [
                            { value: 'leger', label: 'Léger' },
                            { value: 'moyen', label: 'Moyen' },
                            { value: 'grave', label: 'Grave' },
                            { value: 'tres_grave', label: 'Très grave' },
                        ],
                        allOptionLabel: 'Toutes gravités',
                    },
                ]}
                onSearchChange={setRecherche}
                onFilterChange={(key, valeur) => {
                    if (key === 'type') setFiltreType(valeur);
                    if (key === 'gravite') setFiltreGravite(valeur);
                }}
                disableClientSearch
                pagination={data ? {
                    page,
                    limit,
                    total: data.meta.total,
                    totalPages: data.meta.totalPages,
                } : undefined}
            />
        </div>
    );
}
