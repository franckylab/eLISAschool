import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Plus, Bus, Edit, Trash2 } from 'lucide-react';
import { useInscriptionsTransport, useSupprimerLigneTransport } from '../hooks/use-transport';
import { DataTable } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { usePermissions } from '@/hooks';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import type { InscriptionTransport, InscriptionTransportFiltres } from '../types/transport.types';
import type { Column } from '@/components/ui/DataTable';

export function TransportPage() {
    const { t } = useTranslation('transport');
    const { hasPermission } = usePermissions();
    const [filtres, setFiltres] = useState<InscriptionTransportFiltres>({ page: 1, limit: 20 });

    const { data, isLoading, error } = useInscriptionsTransport(filtres);
    const supprimer = useSupprimerLigneTransport();

    const colonnes: Column<InscriptionTransport>[] = [
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
            key: 'ligne',
            header: t('ligne'),
            render: (i) => (
                <div>
                    <p className="font-medium">{i.ligne?.nom}</p>
                    <p className="text-xs text-gray-500">{i.ligne?.code}</p>
                </div>
            ),
        },
        {
            key: 'trajet',
            header: t('trajet'),
            render: (i) => (
                <div className="text-sm">
                    <p>↑ {i.pointMontee}</p>
                    <p className="text-xs text-gray-500">↓ {i.pointDescente}</p>
                </div>
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
                    onClick: () => {/* Modifier */},
                    permission: 'transport:edit',
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
                    permission: 'transport:delete',
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
                icon={Bus}
                title={t('titre')}
                subtitle={`${data?.meta?.totalItems || 0} ${t('inscriptions')}`}
                actions={hasPermission('transport:create') && (
                    <ElisaButton variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
                        {t('nouvelleInscription')}
                    </ElisaButton>
                )}
            />

            <DataTable
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
                pagination={data?.meta ? { page: data.meta.currentPage, limit: data.meta.itemsPerPage, total: data.meta.totalItems, totalPages: data.meta.totalPages, hasNext: data.meta.currentPage < data.meta.totalPages, hasPrev: data.meta.currentPage > 1 } : undefined}
                onPageChange={(page) => setFiltres((prev) => ({ ...prev, page }))}
                onLimitChange={(limit) => setFiltres((prev) => ({ ...prev, limit, page: 1 }))}
            />
        </div>
    );
}
