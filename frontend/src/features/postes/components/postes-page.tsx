/**
 * ==================================
 * eLISAschool - Page Postes
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * Liste des postes — pattern unifié (PageHeader gradient + DataTable serveur).
 */

import { useState, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Eye, Briefcase } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { usePermissions, useDocumentTitle } from '@/hooks';
import { usePostes, useSupprimerPoste } from '../hooks/use-postes';
import { PosteFormModal } from './poste-form-modal';
import { PosteCapaciteIndicator } from './PosteCapaciteIndicator';
import { STATUT_POSTE_OPTIONS } from '../types/poste.zod';
import type { Poste, PosteFiltres, StatutPoste } from '../types/poste.types';

const statutColors: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
    ACTIF: 'success',
    VACANT: 'warning',
    SUPPRIME: 'danger',
    EN_ATTENTE: 'default',
};

interface PostesFiltres {
    page: number;
    limit: number;
    search?: string;
    statut?: StatutPoste;
}

export function PostesPage() {
    const { t } = useTranslation('organisation');
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    useDocumentTitle('eLISAschool | Postes');

    const [filtres, setFiltres] = useState<PostesFiltres>({ page: 1, limit: 20 });
    const { data, isLoading, isFetching, isError, refetch } = usePostes(filtres as PosteFiltres);
    const supprimer = useSupprimerPoste();

    const postes = data?.items || [];
    const meta = data?.meta;

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editPoste, setEditPoste] = useState<Poste | null>(null);
    const [deletePosteId, setDeletePosteId] = useState<string | null>(null);

    const colonnes: Column<Poste>[] = useMemo(() => [
        {
            key: 'intitule',
            header: t('intitulePoste'),
            sortable: true,
            render: (p) => (
                <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-dominant-100)]">
                        <Briefcase className="h-5 w-5 text-[var(--color-dominant-600)]" />
                    </div>
                    <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{p.intitule}</p>
                        <p className="text-xs text-muted-foreground font-mono truncate">{p.code}</p>
                    </div>
                </div>
            ),
        },
        {
            key: 'fonction',
            header: t('fonction'),
            render: (p) => <span className="text-sm text-secondary">{p.fonction?.nom || '—'}</span>,
        },
        {
            key: 'unite',
            header: t('unites'),
            render: (p) => <span className="text-sm text-secondary">{p.uniteOrganisationnelle?.nom || '—'}</span>,
        },
        {
            key: 'typePersonnel',
            header: t('type'),
            render: (p) => <span className="text-sm text-secondary">{p.fonction?.typePersonnel?.nom || '—'}</span>,
        },
        {
            key: 'statut',
            header: t('statut'),
            className: 'text-center',
            render: (p) => (
                <Badge variant={statutColors[p.statut] || 'default'} size="sm">
                    {t(`statutPoste_${p.statut}`, p.statut)}
                </Badge>
            ),
        },
        {
            key: 'capacite',
            header: t('capacite'),
            className: 'text-center',
            render: (p) => (
                <PosteCapaciteIndicator occupantsCount={p.occupantsCount} nombrePostes={p.nombrePostes} size="sm" />
            ),
        },
        {
            key: 'actions',
            header: t('colActions'),
            className: 'text-right',
            renderActions: (p) => [
                {
                    key: 'voir', icon: Eye, label: t('voir'),
                    onClick: () => navigate({ to: '/organisation/postes/$id', params: { id: p.id } }),
                    permission: 'organisation:postes:read',
                    variant: 'info' as const,
                },
                {
                    key: 'modifier', icon: Edit, label: t('modifier'),
                    onClick: () => setEditPoste(p),
                    permission: 'organisation:postes:write',
                    variant: 'warning' as const,
                },
                {
                    key: 'supprimer', icon: Trash2, label: t('supprimer'),
                    onClick: () => setDeletePosteId(p.id),
                    permission: 'organisation:postes:delete',
                    variant: 'danger' as const,
                },
            ],
        },
    ], [navigate, t]);

    if (isLoading && !data) {
        return <PageSkeleton showTable />;
    }

    if (isError) {
        return (
            <div className="p-6">
                <ErrorMessage
                    title={t('erreurChargement')}
                    message={t('erreurChargement')}
                    onRetry={() => refetch()}
                    retryLabel={t('reessayer')}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <PageHeader
                title={t('postes')}
                subtitle={t('compteurPostes', { count: meta?.totalItems || 0 })}
                icon={Briefcase}
                variant="gradient"
                actions={hasPermission('organisation:postes:write') ? (
                    <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreateModal(true)}>
                        {t('nouveauPosteBtn')}
                    </ElisaButton>
                ) : undefined}
            />

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <DataTable
                    tableId="postes-list"
                    columns={colonnes}
                    data={postes}
                    isLoading={isLoading}
                    isFetching={isFetching}
                    enableReordering
                    enablePinning
                    enableColumnVisibility
                    enableCollapsibleFilters
                    disableClientSearch
                    searchPlaceholder={t('rechercherPoste')}
                    filtres={[
                        {
                            key: 'statut', label: t('statut'),
                            options: STATUT_POSTE_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
                            allOptionLabel: t('tousLesStatuts'),
                        },
                    ]}
                    onSearchChange={(search) => setFiltres((prev) => ({ ...prev, search, page: 1 }))}
                    onFilterChange={(key, value) => {
                        if (key === 'statut') setFiltres((prev) => ({ ...prev, statut: value || undefined, page: 1 }));
                    }}
                    onClearFilters={() => setFiltres((prev) => ({ ...prev, statut: undefined, page: 1 }))}
                    pagination={meta ? {
                        page: meta.currentPage,
                        limit: meta.itemsPerPage,
                        total: meta.totalItems,
                        totalPages: meta.totalPages,
                        hasNext: meta.currentPage < meta.totalPages,
                        hasPrev: meta.currentPage > 1,
                    } : undefined}
                    onPageChange={(page) => setFiltres((prev) => ({ ...prev, page }))}
                    onLimitChange={(limit) => setFiltres((prev) => ({ ...prev, limit, page: 1 }))}
                    emptyMessage={t('aucunPosteTrouve')}
                />
            </motion.div>

            <PosteFormModal open={showCreateModal} onOpenChange={setShowCreateModal} />
            {editPoste && (
                <PosteFormModal open={!!editPoste} onOpenChange={() => setEditPoste(null)} poste={editPoste} />
            )}

            <ConfirmDialog
                open={!!deletePosteId}
                onOpenChange={(open) => { if (!open) setDeletePosteId(null); }}
                title={t('supprimerPoste')}
                description={t('confirmerSuppressionPoste')}
                confirmText={t('supprimer')}
                variant="danger"
                onConfirm={async () => {
                    if (deletePosteId) { await supprimer.mutateAsync(deletePosteId); setDeletePosteId(null); }
                }}
                isLoading={supprimer.isPending}
            />
        </div>
    );
}
