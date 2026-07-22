import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2, Copy, Shield, type LucideIcon } from 'lucide-react';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { usePermissions } from '@/hooks';
import type { UseMutationResult } from '@tanstack/react-query';

interface EntityWithId {
    id: string;
    estSysteme?: boolean;
    [key: string]: any;
}

interface NomenclatureCrudConfig<T extends EntityWithId> {
    tableId: string;
    titleKey: string;
    icon: LucideIcon;
    permission: string;
    columns: Column<T>[];
    useData: () => { data?: T[]; isLoading: boolean; error?: any; refetch: () => void };
    useCreate: () => UseMutationResult<T, Error, any>;
    useUpdate: () => UseMutationResult<T, Error, { id: string; data: any }>;
    useDelete: () => UseMutationResult<void, Error, string>;
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
    useUpdate,
    useDelete,
    formComponent: FormComponent,
    noSearch = false,
    embedded = false,
}: NomenclatureCrudConfig<T>) {
    const { t } = useTranslation('organisation');
    const { hasPermission } = usePermissions();
    const canEdit = hasPermission(`${permission}:write`);
    const canDelete = hasPermission(`${permission}:delete`);

    const { data, isLoading, error, refetch } = useData();
    const create = useCreate();
    const update = useUpdate();
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
            header: t('actions'),
            renderActions: (item) => [
                ...(canEdit
                    ? [
                        {
                            key: 'edit',
                            icon: Edit,
                            label: t('modifier'),
                            onClick: () => { setEditingId(item.id); setModalOpen(true); },
                            variant: 'default',
                        },
                        ...(item.estSysteme
                            ? [
                                {
                                    key: 'duplicate',
                                    icon: Copy,
                                    label: t('dupliquer'),
                                    onClick: async () => {
                                        const { id, estSysteme, createdAt, updatedAt, ...rest } = item;
                                        await create.mutateAsync({ ...rest, estSysteme: false });
                                        refetch();
                                    },
                                    variant: 'default',
                                },
                            ]
                            : [
                                {
                                    key: 'delete',
                                    icon: Trash2,
                                    label: t('supprimer'),
                                    onClick: () => setDeleteId(item.id),
                                    variant: 'danger' as const,
                                    disabled: item.estSysteme,
                                },
                            ]),
                    ]
                    : []),
            ].filter(Boolean),
        },
    ];

    if (isLoading && !data) return <PageSkeleton showHeader showTable />;
    if (error) return <ErrorMessage message={error} onRetry={refetch} />;

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
        <div className={embedded ? 'flex flex-col gap-4' : 'flex flex-col gap-6 p-6'}>
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
                    if (deleteId) await del.mutateAsync(deleteId);
                    setDeleteId(null);
                    refetch();
                }}
                title={t('supprimer')}
                description={t('confirmerSuppression')}
                confirmText={t('supprimer')}
                variant="danger"
            />
        </div>
    );
}
