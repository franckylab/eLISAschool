import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { FileSignature, Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { formatDate } from '@/lib/date-utils';
import { usePermissions } from '@/hooks';
import type { Column } from '@/components/ui/DataTable';
import type { ContratPersonnel, ContratFilters } from '../types/contrat.types';
import {
    useContrats,
    useSupprimerContrat,
} from '../hooks/use-contrats';
import { ContratWizardModal } from './contrat-wizard-modal';

const STATUT_CLASSES: Record<string, string> = {
    EN_ATTENTE_VALIDATION: 'bg-warning/10 text-warning',
    ACTIF: 'bg-success/10 text-success',
    EXPIRE: 'bg-muted text-muted-foreground',
    ROMPU: 'bg-destructive/10 text-destructive',
    RENEGOCIE: 'bg-primary/10 text-primary',
};

export function ContratsPage() {
    const navigate = useNavigate();
    const { t } = useTranslation('contrats');
    const { hasPermission } = usePermissions();
    const [filtres, setFiltres] = useState<ContratFilters>({ page: 1, limit: 20 });
    const [contratToDelete, setContratToDelete] = useState<ContratPersonnel | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<ContratPersonnel | null>(null);

    const { data, isLoading, isError, error, refetch } = useContrats(filtres);
    const supprimer = useSupprimerContrat();

    const contrats = data?.items || [];
    const meta = data?.meta;

    const colonnes: Column<ContratPersonnel>[] = [
        {
            key: 'membrePersonnel',
            header: t('colonne.membre'),
            render: (c: ContratPersonnel) => (
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                        {c.membrePersonnel?.utilisateur?.profil
                            ? `${c.membrePersonnel.utilisateur.profil.prenom} ${c.membrePersonnel.utilisateur.profil.nom}`
                            : c.membrePersonnel?.matricule || '-'}
                    </span>
                </div>
            ),
        },
        {
            key: 'typeContrat',
            header: t('colonne.typeContrat'),
            render: (c: ContratPersonnel) => (
                <span className="text-sm">{c.typeContrat}</span>
            ),
        },
        {
            key: 'salaireBase',
            header: t('colonne.salaireBase'),
            render: (c: ContratPersonnel) => (
                <span className="text-sm font-medium">{c.salaireBase.toLocaleString()} FCFA</span>
            ),
        },
        {
            key: 'dateDebut',
            header: t('colonne.dateDebut'),
            render: (c: ContratPersonnel) => (
                <span className="text-sm">{formatDate(c.dateDebut, 'dd/MM/yyyy')}</span>
            ),
        },
        {
            key: 'dateFin',
            header: t('colonne.dateFin'),
            render: (c: ContratPersonnel) => (
                <span className="text-sm">{c.dateFin ? formatDate(c.dateFin, 'dd/MM/yyyy') : '-'}</span>
            ),
        },
        {
            key: 'statut',
            header: t('colonne.statut'),
            render: (c: ContratPersonnel) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUT_CLASSES[c.statut] || 'bg-muted text-muted-foreground'}`}>
                    {t(`statut.${c.statut}`)}
                </span>
            ),
        },
        {
            key: 'actions',
            header: t('colonne.actions'),
            className: 'text-right',
            renderActions: (c) => [
                {
                    key: 'voir',
                    icon: Eye,
                    label: t('actions.voir'),
                    onClick: () => navigate({ to: '/contrats/$id', params: { id: c.id } }),
                    variant: 'info' as const,
                },
                {
                    key: 'modifier',
                    icon: Edit,
                    label: t('actions.modifier'),
                    onClick: () => { setEditing(c); setShowModal(true); },
                    permission: 'contrats:edit',
                },
                {
                    key: 'supprimer',
                    icon: Trash2,
                    label: t('actions.supprimer'),
                    onClick: () => setContratToDelete(c),
                    permission: 'contrats:delete',
                    variant: 'danger' as const,
                },
            ],
        },
    ];

    const handleDelete = async () => {
        if (contratToDelete) {
            await supprimer.mutateAsync(contratToDelete.id);
            setContratToDelete(null);
        }
    };

    if (isLoading && !data) return <PageSkeleton />;
    if (isError) return <ErrorMessage message={error?.message} onRetry={() => refetch()} />;

    return (
        <div className="flex flex-col gap-[var(--gap-lg)]" style={{ padding: 'clamp(0.5rem, 0.4rem + 0.5vw, 1.5rem)' }}>
            <PageHeader
                variant="gradient"
                title={t('titre')}
                description={t('description')}
                icon={FileSignature}
                onBack={() => navigate({ to: '/' })}
                actions={
                    hasPermission('contrats:create') ? (
                        <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-2">
                            <ElisaButton variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => { setEditing(null); setShowModal(true); }}>
                                {t('nouveauContrat')}
                            </ElisaButton>
                        </div>
                    ) : undefined
                }
            />

            <DataTable
                tableId="contrats"
                columns={colonnes}
                data={contrats}
                isLoading={isLoading}
                enableReordering
                enablePinning
                enableColumnVisibility
                disableClientSearch
                pagination={meta ? {
                    page: meta.currentPage,
                    limit: meta.itemsPerPage,
                    total: meta.totalItems,
                    totalPages: meta.totalPages,
                    hasNext: meta.currentPage < meta.totalPages,
                    hasPrev: meta.currentPage > 1,
                    onPageChange: (page) => setFiltres((prev) => ({ ...prev, page })),
                } : undefined}
                emptyMessage={t('aucunContrat')}
                searchable
                searchPlaceholder={t('rechercher')}
                onSearchChange={(v) => setFiltres((prev) => ({ ...prev, recherche: v, page: 1 }))}
            />

            <ContratWizardModal
                open={showModal}
                onOpenChange={(v) => { setShowModal(v); if (!v) setEditing(null); }}
                editing={editing}
            />

            <ConfirmDialog
                open={!!contratToDelete}
                onOpenChange={(open) => { if (!open) setContratToDelete(null); }}
                title={t('confirmerSupprimerTitre')}
                description={t('confirmerSupprimerMessage')}
                confirmText={t('actions.supprimer')}
                variant="danger"
                onConfirm={handleDelete}
                isLoading={supprimer.isPending}
            />
        </div>
    );
}
