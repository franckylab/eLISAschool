import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Eye, Calendar, Award, IterationCcw } from 'lucide-react';
import { useCycles, useSupprimerCycle, useCreerCycle, useModifierCycle } from '../hooks/use-cycles';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { CycleFormModal } from './cycle-form-modal';
import { usePermissions } from '@/hooks';
import type { Cycle, CycleFiltres } from '../types/cycle.types';
import type { Column } from '@/components/ui/DataTable';

export function CyclesPage() {
    const { t } = useTranslation('cycles');
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const [filtres, setFiltres] = useState<CycleFiltres>({ page: 1, limit: 20, recherche: '' });
    const [showFormModal, setShowFormModal] = useState(false);
    const [cycleToEdit, setCycleToEdit] = useState<Cycle | null>(null);
    const [cycleToDelete, setCycleToDelete] = useState<Cycle | null>(null);

    const { data, isLoading, isFetching, error, refetch } = useCycles(filtres);
    const supprimer = useSupprimerCycle();
    const creer = useCreerCycle();
    const modifier = useModifierCycle();

    const colonnes: Column<Cycle>[] = [
        {
            key: 'code',
            header: t('code'),
            sortable: true,
            render: (c) => (
                <span className="font-mono text-sm font-semibold text-[var(--color-dominant-600)]">{c.code}</span>
            ),
        },
        {
            key: 'nom',
            pinned: 'left' as const,
            header: t('nom'),
            sortable: true,
            render: (c) => <span className="font-medium">{c.nom}</span>,
        },
        {
            key: 'dureeAnnees',
            header: t('duree'),
            sortable: true,
            className: 'text-center',
            render: (c) => (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-800">
                    <Calendar className="h-3 w-3" />
                    {c.dureeAnnees ?? 0} an{(c.dureeAnnees ?? 0) > 1 ? 's' : ''}
                </span>
            ),
        },
        {
            key: 'diplomeSanctionnant',
            header: t('diplome'),
            render: (c) => (
                <span className="inline-flex items-center gap-1 text-sm">
                    {c.diplomeSanctionnant ? (
                        <>
                            <Award className="h-3.5 w-3.5 text-orange-600" />
                            <span className="font-semibold text-orange-700">{c.diplomeSanctionnant}</span>
                        </>
                    ) : (
                        <span className="text-gray-400 italic">—</span>
                    )}
                </span>
            ),
        },
        {
            key: 'ordre',
            header: t('ordre'),
            sortable: true,
            className: 'text-center',
            render: (c) => (
                <span className="inline-flex items-center justify-center rounded-full bg-[var(--color-dominant-100)] px-3 py-1 text-sm font-semibold text-[var(--color-dominant-800)]">
                    {c.ordre}
                </span>
            ),
        },
        {
            key: 'actif',
            header: t('statut'),
            sortable: true,
            className: 'text-center',
            render: (c) => (
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                    c.actif ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                    {c.actif ? t('actif') : t('inactif')}
                </span>
            ),
        },
        {
            key: 'actions',
            header: t('actions'),
            className: 'text-right',
            renderActions: (c) => [
                {
                    key: 'voir',
                    icon: Eye,
                    label: t('voir'),
                    onClick: () => navigate({ to: '/cycles/$id', params: { id: c.id } }),
                    variant: 'info' as const,
                },
                {
                    key: 'modifier',
                    icon: Edit,
                    label: t('modifier'),
                    onClick: () => { setCycleToEdit(c); setShowFormModal(true); },
                    permission: 'cycles:edit',
                },
                {
                    key: 'supprimer',
                    icon: Trash2,
                    label: t('supprimer'),
                    onClick: () => setCycleToDelete(c),
                    permission: 'cycles:delete',
                    variant: 'danger' as const,
                },
            ],
        },
    ];

    if (isLoading && !data) {
        return <PageSkeleton showStats={false} showTable />;
    }

    if (error) {
        return (
            <div className="p-6">
                <ErrorMessage
                    title={t('erreurChargement')}
                    message={error.message}
                    onRetry={() => refetch()}
                    retryLabel={t('reessayer')}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <PageHeader
                title={t('titrePage')}
                subtitle={t('compteurCycles', { count: data?.meta?.totalItems || 0 })}
                icon={IterationCcw}
                variant="gradient"
                actions={hasPermission('cycles:create') ? (
                    <ElisaButton
                        variant="primary"
                        size="sm"
                        icon={<Plus className="h-4 w-4" />}
                        onClick={() => { setCycleToEdit(null); setShowFormModal(true); }}
                    >
                        {t('nouveauCycle')}
                    </ElisaButton>
                ) : undefined}
            />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <DataTable
                    tableId="cycles"
                    data={data?.items || []}
                    columns={colonnes}
                    isLoading={isLoading}
                    isFetching={isFetching}
                    enableReordering
                    enablePinning
                    enableColumnVisibility
                    enableCollapsibleFilters
                    filtres={[
                        {
                            key: 'actif',
                            label: t('statut'),
                            options: [
                                { value: 'true', label: t('actifsUniquement') },
                                { value: 'false', label: t('inactifsUniquement') },
                            ],
                            allOptionLabel: t('tousStatuts'),
                        },
                    ]}
                    searchPlaceholder={t('rechercherPlaceholder')}
                    onSearchChange={(recherche) =>
                        setFiltres((prev) => ({ ...prev, recherche, page: 1 }))
                    }
                    onFilterChange={(key, valeur) => {
                        if (key === 'actif') {
                            setFiltres((prev) => ({ ...prev, actif: valeur === 'true' ? true : valeur === 'false' ? false : undefined, page: 1 }));
                        }
                    }}
                    onClearFilters={() => setFiltres((prev) => ({ ...prev, actif: undefined, page: 1 }))}
                    disableClientSearch
                    pagination={data?.meta ? {
                        page: data.meta.currentPage, limit: data.meta.itemsPerPage,
                        total: data.meta.totalItems, totalPages: data.meta.totalPages,
                        hasNext: data.meta.currentPage < data.meta.totalPages,
                        hasPrev: data.meta.currentPage > 1,
                    } : undefined}
                    onPageChange={(page) => setFiltres((prev) => ({ ...prev, page }))}
                    onLimitChange={(limit) => setFiltres((prev) => ({ ...prev, limit, page: 1 }))}
                />
            </motion.div>

            <CycleFormModal
                open={showFormModal}
                onOpenChange={(open) => { if (!open) { setShowFormModal(false); setCycleToEdit(null); } }}
                cycle={cycleToEdit}
                onSave={async (formData) => {
                    try {
                        if (cycleToEdit) {
                            await modifier.mutateAsync({ id: cycleToEdit.id, ...formData });
                        } else {
                            await creer.mutateAsync(formData);
                        }
                        setShowFormModal(false);
                        setCycleToEdit(null);
                    } catch (_error) {
                        // handled by hook
                    }
                }}
                isLoading={creer.isPending || modifier.isPending}
            />

            {cycleToDelete && (
                <ConfirmDialog
                    open={!!cycleToDelete}
                    onOpenChange={(open) => { if (!open) setCycleToDelete(null); }}
                    title={t('supprimer')}
                    description={t('confirmDeleteMessage', { nom: cycleToDelete.nom })}
                    confirmText={t('supprimer')}
                    variant="danger"
                    onConfirm={async () => {
                        await supprimer.mutateAsync(cycleToDelete.id);
                        setCycleToDelete(null);
                    }}
                />
            )}
        </div>
    );
}
