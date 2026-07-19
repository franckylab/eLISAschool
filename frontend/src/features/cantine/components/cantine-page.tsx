import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Plus, UtensilsCrossed, Edit, Trash2 } from 'lucide-react';
import { useInscriptionsCantine, useSupprimerInscriptionCantine } from '../hooks/use-cantine';
import { DataTable } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { usePermissions } from '@/hooks';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import type { InscriptionCantine, InscriptionCantineFiltres } from '../types/cantine.types';
import type { Column } from '@/components/ui/DataTable';

export function CantinePage() {
    const { t } = useTranslation('cantine');
    const { hasPermission } = usePermissions();
    const [filtres, setFiltres] = useState<InscriptionCantineFiltres>({ page: 1, limit: 20 });

    const { data, isLoading, error } = useInscriptionsCantine(filtres);
    const supprimer = useSupprimerInscriptionCantine();

    const typesInscription: any = {
        quotidien: t('quotidien'),
        hebdomadaire: t('hebdomadaire'),
        mensuel: t('mensuel'),
        trimestriel: t('trimestriel'),
        annuel: t('annuel'),
    };

    const colonnes: Column<InscriptionCantine>[] = [
        {
            key: 'eleve',
            pinned: 'left' as const,
            header: t('eleve'),
            render: (i) => (
                <div>
                    <p className="font-medium">{i.eleve?.prenom} {i.eleve?.nom}</p>
                    <p className="text-xs font-mono text-gray-500">{i.eleve?.matricule}</p>
                </div>
            ),
        },
        {
            key: 'typeInscription',
            header: t('type'),
            className: 'text-center',
            render: (i) => (
                <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800">
                    {typesInscription[i.typeInscription]}
                </span>
            ),
        },
        {
            key: 'statut',
            header: t('statut'),
            className: 'text-center',
            render: (i) => (
                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    i.statut === 'actif' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                    {i.statut === 'actif' ? t('actif') : t('inactif')}
                </span>
            ),
        },
        {
            key: 'actions',
            header: t('actions'),
            className: 'text-right',
            renderActions: (i) => [
                {
                    key: 'modifier',
                    icon: Edit,
                    label: t('modifier'),
                    onClick: () => {/* Modifier inscription cantine */},
                    permission: 'cantine:edit',
                },
                {
                    key: 'supprimer',
                    icon: Trash2,
                    label: t('supprimer'),
                    onClick: () => {
                        if (confirm(t('confirmSuppression'))) {
                            supprimer.mutateAsync(i.id);
                        }
                    },
                    permission: 'cantine:delete',
                    variant: 'danger' as const,
                },
            ],
        },
    ];

    if (isLoading && !data) return <PageSkeleton />;
    if (error) return <ErrorMessage message={error?.message || t('uneErreurEstSurvenue')} onRetry={() => window.location.reload()} />;

    return (
        <div className="flex flex-col gap-6 p-6">
            <PageHeader
                variant="gradient"
                icon={UtensilsCrossed}
                title={t('titre')}
                subtitle={`${data?.meta?.totalItems || 0} ${t('inscriptions')}`}
                actions={hasPermission('cantine:create') && (
                    <ElisaButton variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
                        {t('nouvelleInscription')}
                    </ElisaButton>
                )}
            />

            <DataTable
                tableId="cantine"
                data={data?.items || []}
                columns={colonnes}
                isLoading={isLoading}
                enableReordering
                enablePinning
                enableColumnVisibility
                searchPlaceholder={t('rechercher')}
                onSearchChange={(recherche) =>
                    setFiltres((prev) => ({ ...prev, recherche, page: 1 }))
                }
                disableClientSearch
                pagination={data?.meta ? {
                    page: data.meta.currentPage,
                    limit: data.meta.itemsPerPage,
                    total: data.meta.totalItems,
                    totalPages: data.meta.totalPages,
                    hasNext: data.meta.currentPage < data.meta.totalPages,
                    hasPrev: data.meta.currentPage > 1,
                } : undefined}
                onPageChange={(page) => setFiltres((prev) => ({ ...prev, page }))}
                onLimitChange={(limit) => setFiltres((prev) => ({ ...prev, limit, page: 1 }))}
            />
        </div>
    );
}
