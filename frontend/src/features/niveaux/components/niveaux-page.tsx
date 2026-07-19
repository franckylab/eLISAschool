import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Eye, Gauge } from 'lucide-react';
import { useNiveaux, useSupprimerNiveau, useCreerNiveau, useModifierNiveau } from '../hooks/use-niveaux';
import { NiveauFormModal } from './niveau-form-modal';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { usePermissions } from '@/hooks';
import type { Niveau, NiveauFiltres } from '../types/niveau.types';
import type { Column } from '@/components/ui/DataTable';

export function NiveauxPage() {
    const { t } = useTranslation('niveaux');
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const [filtres, setFiltres] = useState<NiveauFiltres>({ page: 1, limit: 20, recherche: '' });
    const [showFormModal, setShowFormModal] = useState(false);
    const [niveauToEdit, setNiveauToEdit] = useState<Niveau | null>(null);
    const [niveauToDelete, setNiveauToDelete] = useState<Niveau | null>(null);

    const { data, isLoading, isFetching, error, refetch } = useNiveaux(filtres);
    const supprimer = useSupprimerNiveau();
    const creer = useCreerNiveau();
    const modifier = useModifierNiveau();

    const colonnes: Column<Niveau>[] = [
        {
            key: 'code',
            header: t('code'),
            sortable: true,
            render: (n) => (
                <span className="font-mono text-sm font-semibold text-[var(--color-dominant-600)]">{n.code}</span>
            ),
        },
        {
            key: 'nom',
            pinned: 'left' as const,
            header: t('nom'),
            sortable: true,
            render: (n) => (
                <div>
                    <span className="font-medium">{n.nom}</span>
                    {n.cycle && (
                        <p className="text-xs text-[var(--color-text-muted)]">{n.cycle.nom}</p>
                    )}
                </div>
            ),
        },
        {
            key: 'ordre',
            header: t('ordre'),
            sortable: true,
            className: 'text-center',
            render: (n) => (
                <span className="inline-flex items-center justify-center rounded-full bg-[var(--color-dominant-100)] px-3 py-1 text-sm font-semibold text-[var(--color-dominant-800)]">{n.ordre}</span>
            ),
        },
        {
            key: 'actif',
            header: t('statut'),
            render: (n) => (
                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${n.actif ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {n.actif ? t('actif') : t('inactif')}
                </span>
            ),
        },
        {
            key: 'actions',
            header: t('actions'),
            className: 'text-right',
            renderActions: (n) => [
                {
                    key: 'voir',
                    icon: Eye,
                    label: t('voir'),
                    onClick: () => navigate({ to: '/niveaux/$id', params: { id: n.id } }),
                    variant: 'info' as const,
                },
                {
                    key: 'modifier',
                    icon: Edit,
                    label: t('modifier'),
                    onClick: () => { setNiveauToEdit(n); setShowFormModal(true); },
                    permission: 'niveaux:edit',
                },
                {
                    key: 'supprimer',
                    icon: Trash2,
                    label: t('supprimer'),
                    onClick: () => setNiveauToDelete(n),
                    permission: 'niveaux:delete',
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
                subtitle={t('compteurNiveaux', { count: data?.meta?.totalItems || 0 })}
                icon={Gauge}
                variant="gradient"
                actions={hasPermission('niveaux:create') ? (
                    <ElisaButton
                        variant="primary"
                        size="sm"
                        icon={<Plus className="h-4 w-4" />}
                        onClick={() => {
                            setNiveauToEdit(null);
                            setShowFormModal(true);
                        }}
                    >
                        {t('nouveauNiveau')}
                    </ElisaButton>
                ) : undefined}
            />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <DataTable
                    tableId="niveaux"
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
                    pagination={data?.meta ? { page: data.meta.currentPage, limit: data.meta.itemsPerPage, total: data.meta.totalItems, totalPages: data.meta.totalPages, hasNext: data.meta.currentPage < data.meta.totalPages, hasPrev: data.meta.currentPage > 1 } : undefined}
                    onPageChange={(page) => setFiltres((prev) => ({ ...prev, page }))}
                    onLimitChange={(limit) => setFiltres((prev) => ({ ...prev, limit, page: 1 }))}
                    emptyMessage={t('aucunNiveauTrouve') || 'Aucun niveau trouvé'}
                />
            </motion.div>

            {showFormModal && (
                <NiveauFormModal
                    open={showFormModal}
                    onOpenChange={(open) => {
                        if (!open) {
                            setShowFormModal(false);
                            setNiveauToEdit(null);
                        }
                    }}
                    niveau={niveauToEdit}
                    onSave={async (formData) => {
                        try {
                            if (niveauToEdit) {
                                await modifier.mutateAsync({ id: niveauToEdit.id, ...formData });
                            } else {
                                await creer.mutateAsync(formData);
                            }
                            setShowFormModal(false);
                            setNiveauToEdit(null);
                        } catch (error) {
                            // handled by hook
                        }
                    }}
                    isLoading={creer.isPending || modifier.isPending}
                />
            )}

            {niveauToDelete && (
                <ConfirmDialog
                    open={!!niveauToDelete}
                    onOpenChange={(open) => { if (!open) setNiveauToDelete(null); }}
                    title={t('supprimer')}
                    description={t('confirmDeleteMessage', { nom: niveauToDelete.nom })}
                    confirmText={t('supprimer')}
                    variant="danger"
                    onConfirm={async () => {
                        await supprimer.mutateAsync(niveauToDelete.id);
                        setNiveauToDelete(null);
                    }}
                    isLoading={supprimer.isPending}
                />
            )}
        </div>
    );
}
