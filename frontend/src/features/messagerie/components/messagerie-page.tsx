import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Plus, Mail, MailOpen, Eye, Trash2 } from 'lucide-react';
import { useMessages, useSupprimerMessage } from '../hooks/use-messagerie';
import { DataTable } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { usePermissions } from '@/hooks';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import type { Message, MessageFiltres } from '../types/messagerie.types';
import type { Column } from '@/components/ui/DataTable';

export function MessageriePage() {
    const { t } = useTranslation('messagerie');
    const { hasPermission } = usePermissions();
    const [filtres, setFiltres] = useState<MessageFiltres>({ page: 1, limit: 20 });

    const { data, isLoading, error } = useMessages(filtres);
    const supprimer = useSupprimerMessage();

    const colonnes: Column<Message>[] = [
        {
            key: 'statut',
            header: '',
            className: 'text-center w-10',
            render: (m) => (
                m.estLu ? (
                    <MailOpen className="h-4 w-4 text-gray-400" />
                ) : (
                    <Mail className="h-4 w-4 text-blue-600" />
                )
            ),
        },
        {
            key: 'expediteur',
            header: t('expediteur'),
            render: (m) => (
                <div>
                    <p className={`font-medium ${!m.estLu ? 'text-blue-600' : ''}`}>
                        {m.expediteur?.prenom} {m.expediteur?.nom}
                    </p>
                    <p className="text-xs text-gray-500">{m.expediteur?.role}</p>
                </div>
            ),
        },
        {
            key: 'sujet',
            header: t('sujet'),
            render: (m) => (
                <p className={`font-medium ${!m.estLu ? 'font-bold' : ''}`}>{m.sujet}</p>
            ),
        },
        {
            key: 'date',
            header: t('date'),
            className: 'text-right',
            render: (m) => (
                <span className="text-sm text-gray-500">
                    {new Date(m.createdAt).toLocaleDateString('fr-FR')}
                </span>
            ),
        },
        {
            key: 'actions',
            header: t('actions'),
            className: 'text-right',
            renderActions: (m) => [
                {
                    key: 'lire',
                    icon: Eye,
                    label: t('lire'),
                    onClick: () => {},
                    variant: 'info' as const,
                },
                {
                    key: 'supprimer',
                    icon: Trash2,
                    label: t('supprimer'),
                    onClick: () => supprimer.mutateAsync(m.id),
                    permission: 'messagerie:delete',
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
                icon={Mail}
                title={t('titre')}
                subtitle={`${data?.meta?.totalItems || 0} ${t('messages')}`}
                actions={hasPermission('messagerie:create') && (
                    <ElisaButton variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
                        {t('nouveauMessage')}
                    </ElisaButton>
                )}
            />

            <DataTable
                data={data?.items || []}
                columns={colonnes}
                isLoading={isLoading}
                searchPlaceholder={t('rechercher')}
                enableRowHeight
                enableReordering
                enablePinning
                enableColumnVisibility
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
