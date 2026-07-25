/**
 * ==================================
 * eLISAschool - Page Notes
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * Liste paginée serveur des notes avec filtres collapsibles,
 * badges type/statut, colorisation par ratio valeur/barème et actions gated.
 */

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Plus, ClipboardList, ListPlus, Eye, Edit, Trash2 } from 'lucide-react';
import { useNotes, useSupprimerNote } from '../hooks/use-notes';
import { getNoteBadgeClass, formatNote } from '../utils/note-couleur';
import { DataTable } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { PageHeader } from '@/components/layout/PageHeader';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { NoteFormModal } from './note-form-modal';
import { usePermissions } from '@/hooks';
import { useClasses } from '@/features/classes/hooks/use-classes';
import { useMatieres } from '@/features/matieres/hooks/use-matieres';
import { usePeriodes } from '@/features/periodes/hooks/use-periodes';
import { useAnneeScolaireActive } from '@/features/annees-scolaires/hooks/use-annees-scolaires';
import type { Note, NoteFiltres, StatutNote, TypeEvaluation } from '../types/note.types';
import type { Column } from '@/components/ui/DataTable';

const STATUT_BADGES: Record<StatutNote, string> = {
    BROUILLON: 'bg-warning/10 text-warning',
    VALIDEE: 'bg-success/10 text-success',
    PUBLIEE: 'bg-primary/10 text-primary',
};

const TYPE_BADGES: Record<TypeEvaluation, string> = {
    DEVOIR: 'bg-primary/10 text-primary',
    INTERROGATION: 'bg-dominant-500/10 text-dominant-500',
    EXAMEN: 'bg-warning/10 text-warning',
    PROJET: 'bg-success/10 text-success',
    PARTICIPATION: 'bg-muted text-muted-foreground',
    AUTRE: 'bg-muted text-muted-foreground',
};

export function NotesPage() {
    const { t, i18n } = useTranslation('notes');
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const [filtres, setFiltres] = useState<NoteFiltres>({ page: 1, limit: 20 });
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const [editNote, setEditNote] = useState<Note | null>(null);

    const { data, isLoading, isFetching, error, refetch } = useNotes(filtres);
    const supprimer = useSupprimerNote();

    const { data: classesData } = useClasses({ limit: 100 });
    const { data: matieresData } = useMatieres({ limit: 100 });
    const { data: anneeActive } = useAnneeScolaireActive();
    const { data: periodes } = usePeriodes({ anneeId: anneeActive?.id || '' });

    const typeLabels: Record<TypeEvaluation, string> = useMemo(() => ({
        DEVOIR: t('devoir'),
        INTERROGATION: t('interrogation'),
        EXAMEN: t('examen'),
        PROJET: t('projet'),
        PARTICIPATION: t('participation'),
        AUTRE: t('autre'),
    }), [t]);

    const statutLabels: Record<StatutNote, string> = useMemo(() => ({
        BROUILLON: t('statutBrouillon'),
        VALIDEE: t('statutValidee'),
        PUBLIEE: t('statutPubliee'),
    }), [t]);

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
            key: 'matiereId',
            label: t('matiere'),
            allOptionLabel: t('toutesMatieres'),
            options: (matieresData?.items ?? []).map((m) => ({ value: m.id, label: m.nom })),
        },
        {
            key: 'periodeId',
            label: t('periode'),
            allOptionLabel: t('toutesPeriodes'),
            options: (periodes ?? []).map((p) => ({ value: p.id, label: p.nom })),
        },
        {
            key: 'typeEvaluation',
            label: t('type'),
            allOptionLabel: t('tousTypes'),
            options: (Object.keys(typeLabels) as TypeEvaluation[]).map((type) => ({
                value: type,
                label: typeLabels[type],
            })),
        },
        {
            key: 'statut',
            label: t('statut'),
            allOptionLabel: t('tousStatuts'),
            options: (Object.keys(statutLabels) as StatutNote[]).map((statut) => ({
                value: statut,
                label: statutLabels[statut],
            })),
        },
    ], [t, classesData, matieresData, periodes, typeLabels, statutLabels]);

    const handleDelete = async () => {
        if (!noteToDelete) return;
        await supprimer.mutateAsync(noteToDelete.id);
        setDeleteConfirmOpen(false);
        setNoteToDelete(null);
    };

    const formatDate = (d: string): string =>
        new Date(d).toLocaleDateString(i18n.language, { year: 'numeric', month: 'short', day: 'numeric' });

    if (isLoading && !data) {
        return <PageSkeleton showHeader showTable />;
    }

    if (error) {
        return (
            <div className="p-[clamp(0.75rem,2vw,1.5rem)]">
                <ErrorMessage message={t('chargement')} onRetry={() => refetch()} />
            </div>
        );
    }

    const colonnes: Column<Note>[] = [
        {
            key: 'eleve',
            pinned: 'left' as const,
            header: t('eleve'),
            sortable: true,
            render: (n) => (
                <div>
                    <button
                        type="button"
                        className="font-medium text-left text-foreground hover:text-primary transition-colors"
                        onClick={() => navigate({ to: '/notes/$id', params: { id: n.id } })}
                    >
                        {n.eleve?.prenom} {n.eleve?.nom}
                    </button>
                    <p className="text-xs font-mono text-muted-foreground">{n.eleve?.matricule}</p>
                </div>
            ),
        },
        {
            key: 'matiere',
            header: t('matiere'),
            sortable: true,
            render: (n) => (
                <div>
                    <p className="font-medium">{n.matiere?.nom}</p>
                    <p className="text-xs text-muted-foreground">{n.matiere?.code}</p>
                </div>
            ),
        },
        {
            key: 'classe',
            header: t('classe'),
            render: (n) => (
                <span className="text-sm font-medium">{n.classeAnnee?.classe?.nom ?? '—'}</span>
            ),
        },
        {
            key: 'periode',
            header: t('periode'),
            render: (n) => (
                <span className="text-sm">{n.periode?.nom ?? '—'}</span>
            ),
        },
        {
            key: 'typeEvaluation',
            header: t('type'),
            render: (n) => (
                <span className={`rounded-full px-[clamp(0.375rem,1vw,0.625rem)] py-0.5 text-xs font-medium ${TYPE_BADGES[n.typeEvaluation] ?? 'bg-muted text-muted-foreground'}`}>
                    {typeLabels[n.typeEvaluation] ?? n.typeEvaluation}
                </span>
            ),
        },
        {
            key: 'valeur',
            header: t('valeur'),
            sortable: true,
            className: 'text-center',
            render: (n) => (
                <span className={`inline-flex items-center justify-center rounded-[var(--radius-lg)] px-[clamp(0.5rem,1vw,0.75rem)] py-1 text-[clamp(0.875rem,1.2vw,1.125rem)] font-bold ${getNoteBadgeClass(n.valeur, n.bareme ?? 20)}`}>
                    {formatNote(n.valeur, n.bareme ?? 20)}
                </span>
            ),
        },
        {
            key: 'coefficient',
            header: t('coefficient'),
            className: 'text-center',
            render: (n) => <span className="font-medium">{n.coefficient ?? 1}</span>,
        },
        {
            key: 'statut',
            header: t('statut'),
            render: (n) => {
                const statut = n.statut ?? 'BROUILLON';
                return (
                    <span className={`rounded-full px-[clamp(0.375rem,1vw,0.625rem)] py-0.5 text-xs font-medium ${STATUT_BADGES[statut]}`}>
                        {statutLabels[statut]}
                    </span>
                );
            },
        },
        {
            key: 'date',
            header: t('dateEvaluation'),
            render: (n) => (
                <span className="text-sm text-muted-foreground">
                    {formatDate(n.dateEvaluation ?? n.createdAt)}
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
                    onClick: () => navigate({ to: '/notes/$id', params: { id: n.id } }),
                    permission: 'notes:view',
                },
                {
                    key: 'modifier',
                    icon: Edit,
                    label: t('modifier'),
                    onClick: () => { setEditNote(n); setFormOpen(true); },
                    permission: 'notes:edit',
                },
                {
                    key: 'supprimer',
                    icon: Trash2,
                    label: t('supprimer'),
                    onClick: () => {
                        setNoteToDelete(n);
                        setDeleteConfirmOpen(true);
                    },
                    permission: 'notes:delete',
                    variant: 'danger' as const,
                },
            ],
        },
    ];

    return (
        <div className="flex flex-col gap-[var(--gap-sm)] p-[clamp(0.75rem,2vw,1.5rem)]">
            <PageHeader
                variant="gradient"
                icon={ClipboardList}
                title={t('titre')}
                subtitle={t('noteCount', { count: data?.meta?.totalItems || 0 })}
                actions={
                    <div className="flex flex-wrap gap-2">
                        {hasPermission('notes:create') && (
                            <ElisaButton
                                variant="primary"
                                size="sm"
                                icon={<Plus className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                                onClick={() => { setEditNote(null); setFormOpen(true); }}
                            >
                                {t('nouvelleNote')}
                            </ElisaButton>
                        )}
                        {hasPermission('notes:bulk:create') && (
                            <ElisaButton
                                variant="outline"
                                size="sm"
                                icon={<ListPlus className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                                onClick={() => navigate({ to: '/notes/saisie' })}
                            >
                                {t('saisieMasse')}
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
                    tableId="notes"
                />
            </motion.div>

            <NoteFormModal
                open={formOpen}
                onOpenChange={setFormOpen}
                note={editNote}
            />

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
