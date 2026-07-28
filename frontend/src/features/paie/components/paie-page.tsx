import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Wallet, Plus, Eye, Edit, Trash2, FileDown, Settings } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { formatDate } from '@/lib/date-utils';
import { usePaiePermissions } from '../hooks/use-paie-permissions';
import { useBulletins, useSupprimerBulletin } from '../hooks/use-paie';
import { BulletinFormModal } from './bulletin-form-modal';
import type { BulletinPaie } from '../types/paie.types';
import type { Column } from '@/components/ui/DataTable';

export function PaiePage() {
    const navigate = useNavigate();
    const { t } = useTranslation('paie');
    const perms = usePaiePermissions();
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [showFormModal, setShowFormModal] = useState(false);
    const [bulletinToEdit, setBulletinToEdit] = useState<BulletinPaie | null>(null);
    const [bulletinToDelete, setBulletinToDelete] = useState<BulletinPaie | null>(null);

    const { data, isLoading, isError, error, refetch } = useBulletins({ page, limit });
    const supprimer = useSupprimerBulletin();

    const bulletins = data?.items || [];
    const meta = data?.meta;

    const getMembreLabel = (b: BulletinPaie): string => {
        const p = b.membrePersonnel?.utilisateur?.profil;
        if (p?.prenom && p?.nom) return `${p.prenom} ${p.nom}`;
        return b.membrePersonnel?.matricule || b.membrePersonnelId?.slice(0, 8) + '…';
    };

    const formatMoisAnnee = (mois: number, annee: number) => {
        const date = new Date(annee, mois - 1);
        return formatDate(date, 'MMMM yyyy');
    };

    const statutBadge = (statut: string) => {
        const variants: Record<string, string> = {
            GENERE: 'bg-muted text-muted-foreground',
            EN_ATTENTE_VALIDATION: 'bg-warning/10 text-warning',
            VALIDE: 'bg-success/10 text-success',
            PAYE: 'bg-primary/10 text-primary',
            ANNULE: 'bg-destructive/10 text-destructive',
        };
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[statut] || variants.GENERE}`}>
                {t(`statut.${statut}`, { defaultValue: statut })}
            </span>
        );
    };

    const colonnes: Column<BulletinPaie>[] = [
        {
            key: 'membre',
            header: t('colonne.membre'),
            render: (b) => (
                <button
                    onClick={() => navigate({ to: '/paie/bulletins/$id', params: { id: b.id } })}
                    className="hover:underline cursor-pointer text-left"
                >
                    <span className="font-medium text-sm">{getMembreLabel(b)}</span>
                </button>
            ),
        },
        {
            key: 'periode',
            header: t('colonne.periode'),
            render: (b) => <span className="text-sm font-medium capitalize">{formatMoisAnnee(b.mois, b.annee)}</span>,
        },
        {
            key: 'salaireBase',
            header: t('colonne.salaireBase'),
            className: 'text-right',
            render: (b) => <span className="text-sm">{b.salaireBase?.toLocaleString('fr-FR')} F</span>,
        },
        {
            key: 'salaireNet',
            header: t('colonne.salaireNet'),
            className: 'text-right',
            render: (b) => <span className="text-sm font-semibold">{b.salaireNet?.toLocaleString('fr-FR')} F</span>,
        },
        {
            key: 'statut',
            header: t('colonne.statut'),
            className: 'text-center',
            render: (b) => statutBadge(b.statut),
        },
        {
            key: 'datePaiement',
            header: t('colonne.datePaiement'),
            render: (b) => b.datePaiement ? formatDate(b.datePaiement, 'dd/MM/yyyy') : '-',
        },
        {
            key: 'actions',
            header: t('colonne.actions'),
            className: 'text-right',
            renderActions: (b) => [
                {
                    key: 'voir',
                    icon: Eye,
                    label: t('actions.voir'),
                    onClick: () => navigate({ to: '/paie/bulletins/$id', params: { id: b.id } }),
                    variant: 'info' as const,
                },
                {
                    key: 'editer',
                    icon: Edit,
                    label: t('actions.modifier'),
                    onClick: () => { setBulletinToEdit(b); setShowFormModal(true); },
                    permission: 'paie:edit',
                },
                {
                    key: 'pdf',
                    icon: FileDown,
                    label: t('actions.pdf'),
                    onClick: () => window.open(`/api/paie/bulletins/${b.id}/pdf`, '_blank'),
                    permission: 'paie:export',
                },
                {
                    key: 'supprimer',
                    icon: Trash2,
                    label: t('actions.supprimer'),
                    onClick: () => setBulletinToDelete(b),
                    permission: 'paie:delete',
                    variant: 'danger' as const,
                },
            ],
        },
    ];

    const handleCreate = () => {
        setBulletinToEdit(null);
        setShowFormModal(true);
    };

    const handleDelete = async () => {
        if (bulletinToDelete) {
            await supprimer.mutateAsync(bulletinToDelete.id);
            setBulletinToDelete(null);
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
                icon={Wallet}
                onBack={() => navigate({ to: '/' })}
                actions={
                    <div className="flex flex-wrap gap-2">
                        {perms.canCreate && (
                            <ElisaButton variant="primary" icon={<Plus className="h-4 w-4" />} onClick={handleCreate}>
                                {t('nouveauBulletin')}
                            </ElisaButton>
                        )}
                        {perms.hasAny(['config:view']) && (
                            <ElisaButton variant="outline" icon={<Settings className="h-4 w-4" />} onClick={() => navigate({ to: '/paie/configuration' })}>
                                {t('configuration')}
                            </ElisaButton>
                        )}
                    </div>
                }
            />

            <DataTable
                tableId="paie-bulletins"
                columns={colonnes}
                data={bulletins}
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
                    onPageChange: setPage,
                } : undefined}
                emptyMessage={t('aucunBulletin')}
                searchable
                searchPlaceholder={t('rechercher')}
                onSearchChange={undefined}
            />

            <BulletinFormModal
                open={showFormModal}
                onOpenChange={(v) => {
                    if (!v) {
                        setShowFormModal(false);
                        setBulletinToEdit(null);
                    }
                }}
                bulletin={bulletinToEdit}
                onSave={async () => {}}
                isLoading={false}
            />

            <ConfirmDialog
                open={!!bulletinToDelete}
                onOpenChange={(open) => { if (!open) setBulletinToDelete(null); }}
                title={t('confirmerSupprimerTitre')}
                description={t('confirmerSupprimerMessage', { refer: bulletinToDelete ? `${bulletinToDelete.mois}/${bulletinToDelete.annee}` : '' })}
                confirmText={t('actions.supprimer')}
                variant="danger"
                onConfirm={handleDelete}
                isLoading={supprimer.isPending}
            />
        </div>
    );
}
