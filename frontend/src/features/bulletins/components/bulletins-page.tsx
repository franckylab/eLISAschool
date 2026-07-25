/**
 * ==================================
 * eLISAschool - Page Bulletins
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * Liste paginée serveur des bulletins : filtres collapsibles,
 * moyenne colorée, rang, mention, badge de publication et actions gated.
 */

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { FileText, Download, Award, Trash2, Sparkles, Eye } from 'lucide-react';
import { useBulletins, useSupprimerBulletin, useExporterBulletin } from '../hooks/use-bulletins';
import { getMentionKey } from '../utils/bulletin-mention';
import { getNoteBadgeClass, formatNote } from '@/features/notes/utils/note-couleur';
import { DataTable } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { PageHeader } from '@/components/layout/PageHeader';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { BulletinGenerateModal } from './bulletin-generate-modal';
import { usePermissions } from '@/hooks';
import { useClasses } from '@/features/classes/hooks/use-classes';
import { usePeriodes } from '@/features/periodes/hooks/use-periodes';
import { useAnneeScolaireActive } from '@/features/annees-scolaires/hooks/use-annees-scolaires';
import type { Bulletin, BulletinFiltres } from '../types/bulletin.types';
import type { Column } from '@/components/ui/DataTable';
import type { ActionConfig } from '@/components/ui';

export function BulletinsPage() {
    const { t, i18n } = useTranslation('bulletins');
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const [filtres, setFiltres] = useState<BulletinFiltres>({ page: 1, limit: 20 });
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [bulletinToDelete, setBulletinToDelete] = useState<Bulletin | null>(null);
    const [generateOpen, setGenerateOpen] = useState(false);

    const { data, isLoading, isFetching, error, refetch } = useBulletins(filtres);
    const supprimer = useSupprimerBulletin();
    const exporter = useExporterBulletin();

    const { data: classesData } = useClasses({ limit: 100 });
    const { data: anneeActive } = useAnneeScolaireActive();
    const { data: periodes } = usePeriodes({ anneeId: anneeActive?.id || '' });

    const filtresTable = useMemo(() => [
        {
            key: 'classeAnneeId',
            label: t('classe'),
            allOptionLabel: t('toutesClasses'),
            options: (classesData?.items ?? [])
                .filter((c) => !!c.classeAnneeId)
                .map((c) => ({ value: c.classeAnneeId as string, label: c.nom })),
        },
        {
            key: 'periodeId',
            label: t('periode'),
            allOptionLabel: t('toutesPeriodes'),
            options: (periodes ?? []).map((p) => ({ value: p.id, label: p.nom })),
        },
        {
            key: 'publie',
            label: t('statut'),
            allOptionLabel: t('tousStatuts'),
            options: [
                { value: 'true', label: t('publie') },
                { value: 'false', label: t('nonPublie') },
            ],
        },
    ], [t, classesData, periodes]);

    const handleDelete = async () => {
        if (!bulletinToDelete) return;
        await supprimer.mutateAsync(bulletinToDelete.id);
        setDeleteConfirmOpen(false);
        setBulletinToDelete(null);
    };

    const formatDate = (d: string): string =>
        new Date(d).toLocaleDateString(i18n.language, { year: 'numeric', month: 'short', day: 'numeric' });

    if (isLoading && !data) {
        return <div className="p-[clamp(0.75rem,2vw,1.5rem)]"><PageSkeleton showHeader showTable /></div>;
    }

    if (error) {
        return (
            <div className="p-[clamp(0.75rem,2vw,1.5rem)]">
                <ErrorMessage message={t('chargement')} onRetry={() => refetch()} />
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
                    <button
                        type="button"
                        className="font-medium text-left text-foreground hover:text-primary transition-colors"
                        onClick={() => navigate({ to: '/bulletins/$id', params: { id: b.id } })}
                    >
                        {b.eleve?.prenom} {b.eleve?.nom}
                    </button>
                    <p className="text-xs font-mono text-muted-foreground">{b.eleve?.matricule}</p>
                </div>
            ),
        },
        {
            key: 'classe',
            header: t('classe'),
            sortable: true,
            render: (b) => (
                <div>
                    <p className="font-medium">{b.classeAnnee?.classe?.nom ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">{b.classeAnnee?.classe?.code}</p>
                </div>
            ),
        },
        {
            key: 'periode',
            header: t('periode'),
            render: (b) => (
                <span className="text-sm font-medium">{b.periode?.nom ?? '—'}</span>
            ),
        },
        {
            key: 'moyenne',
            header: t('moyenne'),
            sortable: true,
            className: 'text-center',
            render: (b) => (
                <div className="flex flex-col items-center gap-1">
                    <span className={`inline-flex items-center justify-center rounded-[var(--radius-lg)] px-[clamp(0.5rem,1vw,0.75rem)] py-1 text-[clamp(0.875rem,1.2vw,1.125rem)] font-bold ${getNoteBadgeClass(b.moyenneGenerale, 20)}`}>
                        {formatNote(b.moyenneGenerale, 20)}
                    </span>
                    {typeof b.rang === 'number' && (
                        <div className="flex items-center gap-1">
                            <Award className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs font-medium">{t('rang', { rang: b.rang })}</span>
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: 'mention',
            header: t('mention'),
            render: (b) => (
                <span className="text-sm font-medium">{t(getMentionKey(b.moyenneGenerale))}</span>
            ),
        },
        {
            key: 'publie',
            header: t('statut'),
            render: (b) => (
                <span className={`rounded-full px-[clamp(0.375rem,1vw,0.625rem)] py-0.5 text-xs font-medium ${b.publie ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                    {b.publie ? t('publie') : t('nonPublie')}
                </span>
            ),
        },
        {
            key: 'date',
            header: t('dateGeneration'),
            render: (b) => (
                <span className="text-sm text-muted-foreground">{formatDate(b.createdAt)}</span>
            ),
        },
        {
            key: 'actions',
            header: t('actions'),
            className: 'text-right',
            renderActions: (b) => {
                const actions: ActionConfig[] = [
                    {
                        key: 'voir',
                        icon: Eye,
                        label: t('voir'),
                        onClick: () => navigate({ to: '/bulletins/$id', params: { id: b.id } }),
                        permission: 'bulletins:view',
                    },
                    {
                        key: 'exporter',
                        icon: Download,
                        label: t('exporter'),
                        onClick: () => { void exporter.mutateAsync(b.id); },
                        permission: 'bulletins:export',
                    },
                ];
                if (!b.publie) {
                    actions.push({
                        key: 'supprimer',
                        icon: Trash2,
                        label: t('supprimer'),
                        onClick: () => {
                            setBulletinToDelete(b);
                            setDeleteConfirmOpen(true);
                        },
                        permission: 'bulletins:delete',
                        variant: 'danger' as const,
                    });
                }
                return actions;
            },
        },
    ];

    return (
        <div className="flex flex-col gap-[var(--gap-sm)] p-[clamp(0.75rem,2vw,1.5rem)]">
            <PageHeader
                variant="gradient"
                icon={FileText}
                title={t('titre')}
                subtitle={t('bulletinCount', { count: data?.meta?.totalItems || 0 })}
                actions={
                    <div className="flex flex-wrap gap-2">
                        {hasPermission('bulletins:generate') && (
                            <ElisaButton
                                variant="primary"
                                size="sm"
                                icon={<Sparkles className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                                onClick={() => setGenerateOpen(true)}
                            >
                                {t('generer')}
                            </ElisaButton>
                        )}
                    </div>
                }
            />

            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
            >
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
                    filtres={filtresTable}
                    enableCollapsibleFilters
                    onFilterChange={(key, valeur) =>
                        setFiltres((prev) => ({ ...prev, [key]: valeur || undefined, page: 1 }))
                    }
                    onClearFilters={() =>
                        setFiltres((prev) => ({ page: 1, limit: prev.limit, recherche: prev.recherche }))
                    }
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
            </motion.div>

            <BulletinGenerateModal open={generateOpen} onOpenChange={setGenerateOpen} />

            <ConfirmDialog
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
                onConfirm={handleDelete}
                title={t('confirmerSupprimerTitre')}
                description={t('confirmerSupprimerMessage')}
                confirmText={t('supprimer')}
                variant="danger"
                isLoading={supprimer.isPending}
            />
        </div>
    );
}
