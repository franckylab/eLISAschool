import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import { FileText, Download, Award, Trash2, Plus } from 'lucide-react';
import { useBulletins, useSupprimerBulletin, useExporterBulletin } from '../hooks/use-bulletins';
import { DataTable } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { PageHeader } from '@/components/layout/PageHeader';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import type { Bulletin, BulletinFiltres } from '../types/bulletin.types';
import type { Column } from '@/components/ui/DataTable';

export function BulletinsPage() {
    const { t } = useTranslation('bulletins');
    const navigate = useNavigate();
    const [filtres, setFiltres] = useState<BulletinFiltres>({ page: 1, limit: 20 });
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [bulletinToDelete, setBulletinToDelete] = useState<Bulletin | null>(null);

    const { data, isLoading, isFetching, error, refetch } = useBulletins(filtres);
    const supprimer = useSupprimerBulletin();
    const exporter = useExporterBulletin();

    const handleDelete = async () => {
        if (!bulletinToDelete) return;
        await supprimer.mutateAsync(bulletinToDelete.id);
        setDeleteConfirmOpen(false);
        setBulletinToDelete(null);
    };

    if (isLoading && !data) {
        return <div className="p-6"><PageSkeleton showHeader showTable /></div>;
    }

    if (error) {
        return (
            <div className="p-6">
                <ErrorMessage
                    message={t('chargement')}
                    onRetry={() => refetch()}
                />
            </div>
        );
    }

    const colonnes: Column<Bulletin>[] = [
        {
            key: 'eleve',
            pinned: 'left' as const,
            header: t('eleve'),
            sortable: true,
            render: (b) => (
                <div>
                    <button className="font-medium text-left hover:text-primary transition-colors" onClick={() => navigate({ to: '/bulletins/$id', params: { id: b.id } })}>
                        {b.eleve?.prenom} {b.eleve?.nom}
                    </button>
                    <p className="text-xs font-mono text-[var(--color-text-muted)]">{b.eleve?.matricule}</p>
                </div>
            ),
        },
        {
            key: 'classe',
            header: t('classe'),
            sortable: true,
            render: (b) => (
                <div>
                    <p className="font-medium">{b.classeAnnee?.classe?.nom}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{b.classeAnnee?.classe?.code}</p>
                </div>
            ),
        },
        {
            key: 'periode',
            header: t('periode'),
            render: (b) => (
                <span className="text-sm font-medium">{b.periode?.nom}</span>
            ),
        },
        {
            key: 'moyenne',
            header: t('moyenne'),
            sortable: true,
            className: 'text-center',
            render: (b) => (
                <div className="flex flex-col items-center gap-1">
                    <span className={`inline-flex items-center justify-center rounded-lg px-3 py-1 text-lg font-bold ${
                        b.moyenneGenerale >= 16 ? 'bg-green-100 text-green-800' :
                        b.moyenneGenerale >= 14 ? 'bg-blue-100 text-blue-800' :
                        b.moyenneGenerale >= 12 ? 'bg-indigo-100 text-indigo-800' :
                        b.moyenneGenerale >= 10 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                    }`}>
                        {b.moyenneGenerale.toFixed(2)}/20
                    </span>
                    <div className="flex items-center gap-1">
                        <Award className="h-3 w-3 text-[var(--color-text-muted)]" />
                        <span className="text-xs font-medium">{t('rang', { rang: b.rang })}</span>
                    </div>
                </div>
            ),
        },
        {
            key: 'actions',
            header: t('actions'),
            className: 'text-right',
            renderActions: (b) => [
                {
                    key: 'exporter',
                    icon: Download,
                    label: t('exporterPdf'),
                    onClick: () => exporter.mutateAsync(b.id),
                },
                {
                    key: 'supprimer',
                    icon: Trash2,
                    label: t('supprimer'),
                    onClick: () => {
                        setBulletinToDelete(b);
                        setDeleteConfirmOpen(true);
                    },
                    permission: 'bulletins:delete',
                    variant: 'danger' as const,
                },
            ],
        },
    ];

    return (
        <div className="flex flex-col gap-6 p-6">
            <PageHeader
                variant="gradient"
                icon={FileText}
                title={t('titre')}
                subtitle={t('bulletinCount', { count: data?.meta?.totalItems || 0 })}
                actions={
                    <div className="flex gap-2">
                        <ElisaButton variant="outline" size="sm" icon={<Plus className="h-4 w-4" />}>
                            {t('generer')}
                        </ElisaButton>
                    </div>
                }
            />

            <DataTable
                data={data?.items || []}
                columns={colonnes}
                isLoading={isLoading}
                isFetching={isFetching}
                searchPlaceholder={t('rechercher')}
                enableReordering
                enablePinning
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
                tableId="bulletins"
            />

            <ConfirmDialog
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
                onConfirm={handleDelete}
                title={t('confirmerSupprimerTitre')}
                description={t('confirmerSupprimerMessage')}
                variant="danger"
                isLoading={supprimer.isPending}
            />
        </div>
    );
}