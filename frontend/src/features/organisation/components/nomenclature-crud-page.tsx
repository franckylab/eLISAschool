/**
 * ==================================
 * eLISAschool - Page CRUD générique pour nomenclatures
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Composant générique réutilisable pour les 4 nomenclatures :
 * échelons structurels, niveaux responsabilité, modes rémunération, templates.
 * Supporte mode embedded (onglets) et standalone (PageHeader).
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Copy, Shield, type LucideIcon } from 'lucide-react';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage, EmptyState } from '@/components/ui/ErrorMessage';
import { usePermissions } from '@/hooks';
import type { UseMutationResult } from '@tanstack/react-query';
import type { ActionConfig } from '@/components/ui/RowActions';

interface EntityWithId {
    id: string;
    estSysteme?: boolean;
    [key: string]: unknown;
}

interface NomenclatureCrudConfig<T extends EntityWithId> {
    tableId: string;
    titleKey: string;
    icon: LucideIcon;
    permission: string;
    columns: Column<T>[];
    useData: () => { data?: T[]; isLoading: boolean; error?: Error | null; refetch: () => void };
    useCreate: () => UseMutationResult<T, unknown, Partial<T>>;
    useUpdate?: () => unknown;
    useDelete: () => UseMutationResult<void, unknown, string>;
    formComponent: (props: {
        initialData?: T;
        onSuccess: () => void;
        onCancel: () => void;
    }) => React.ReactElement;
    noSearch?: boolean;
    /** Rendu compact pour intégration dans un onglet (sans PageHeader ni padding). */
    embedded?: boolean;
}

export function NomenclatureCrudPage<T extends EntityWithId>({
    tableId,
    titleKey,
    icon: Icon,
    permission,
    columns,
    useData,
    useCreate,
    useDelete,
    formComponent: FormComponent,
    noSearch = false,
    embedded = false,
}: NomenclatureCrudConfig<T>) {
    const { t } = useTranslation('organisation');
    const { hasPermission } = usePermissions();
    const canEdit = hasPermission(`${permission}:write`);

    const { data, isLoading, error, refetch } = useData();
    const create = useCreate();
    const del = useDelete();

    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const editingItem = editingId ? data?.find((d) => d.id === editingId) : undefined;

    const allColumns: Column<T>[] = [
        ...columns,
        {
            key: 'estSysteme',
            header: '',
            render: (item) =>
                item.estSysteme ? (
                    <Badge variant="secondary" title={t('entiteSystemeProtegee')}>
                        <Shield className="h-3 w-3 mr-1" />
                        {t('systeme')}
                    </Badge>
                ) : null,
        },
        {
            key: 'actions',
            header: t('colActions'),
            renderActions: (item): ActionConfig[] => {
                if (!canEdit) return [];
                const actions: ActionConfig[] = [
                    {
                        key: 'edit',
                        icon: Edit,
                        label: t('modifier'),
                        onClick: () => { setEditingId(item.id); setModalOpen(true); },
                        variant: 'default',
                    },
                ];
                if (item.estSysteme) {
                    actions.push({
                        key: 'duplicate',
                        icon: Copy,
                        label: t('dupliquer'),
                        onClick: async () => {
                            const { id, estSysteme, createdAt, updatedAt, ...rest } = item;
                            await create.mutateAsync({ ...rest, estSysteme: false } as unknown as Partial<T>);
                            refetch();
                        },
                        variant: 'default',
                    });
                } else {
                    actions.push({
                        key: 'delete',
                        icon: Trash2,
                        label: t('supprimer'),
                        onClick: () => setDeleteId(item.id),
                        variant: 'danger',
                    });
                }
                return actions;
            },
        },
    ];

    if (isLoading && !data) return <PageSkeleton showHeader showTable />;
    if (error) return <ErrorMessage message={error.message || t('erreurGenerique')} onRetry={refetch} />;

    const isEmpty = !isLoading && !error && (data?.length ?? 0) === 0;

    const addButton = canEdit ? (
        <ElisaButton
            variant="outline"
            size="sm"
            leftIcon={<Plus />}
            onClick={() => { setEditingId(null); setModalOpen(true); }}
        >
            {t('ajouter')}
        </ElisaButton>
    ) : null;

    return (
        <div className={embedded ? 'flex flex-col gap-4' : 'flex flex-col'} style={embedded ? undefined : { gap: 'var(--gap-lg)', padding: 'var(--space-lg)' }}>
            {embedded ? (
                addButton && <div className="flex justify-end">{addButton}</div>
            ) : (
                <PageHeader
                    title={t(titleKey)}
                    icon={Icon}
                    variant="gradient"
                    actions={addButton}
                />
            )}

            {isEmpty ? (
                <EmptyState
                    icon={Icon}
                    title={t('aucuneDonnee')}
                    description={t('aucuneDonneeIndication')}
                    actionLabel={canEdit ? t('ajouter') : undefined}
                    actionIcon={canEdit ? <Plus className="h-4 w-4" /> : undefined}
                    onAction={canEdit ? () => { setEditingId(null); setModalOpen(true); } : undefined}
                />
            ) : (
                <DataTable
                    tableId={tableId}
                    columns={allColumns}
                    data={data || []}
                    isLoading={isLoading}
                    enableReordering
                    enablePinning
                    enableColumnVisibility
                    searchable={!noSearch}
                    disableClientSearch
                    emptyMessage={t('aucuneDonnee')}
                />
            )}

            {modalOpen && (
                <FormComponent
                    initialData={editingItem}
                    onSuccess={() => { setModalOpen(false); setEditingId(null); refetch(); }}
                    onCancel={() => { setModalOpen(false); setEditingId(null); }}
                />
            )}

            <ConfirmDialog
                open={!!deleteId}
                onOpenChange={(open) => { if (!open) setDeleteId(null); }}
                onConfirm={async () => {
                    if (!deleteId) return;
                    try {
                        await del.mutateAsync(deleteId);
                        toast.success(t('suppressionSucces', 'Supprimé avec succès'));
                        setDeleteId(null);
                        refetch();
                    } catch {
                        // handleError already shows toast, just don't close the dialog
                    }
                }}
                title={t('supprimer')}
                description={t('confirmerSuppression')}
                confirmText={t('supprimer')}
                variant="danger"
            />
        </div>
    );
}
