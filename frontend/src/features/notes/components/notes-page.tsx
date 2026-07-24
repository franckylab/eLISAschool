import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, TrendingUp, ClipboardList, Edit, Trash2 } from 'lucide-react';
import { useNotes, useSupprimerNote } from '../hooks/use-notes';
import { DataTable } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { PageHeader } from '@/components/layout/PageHeader';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { NoteFormModal } from './note-form-modal';
import { usePermissions } from '@/hooks';
import type { Note, NoteFiltres } from '../types/note.types';
import type { Column } from '@/components/ui/DataTable';

export function NotesPage() {
    const { t } = useTranslation('notes');
    const { hasPermission } = usePermissions();
    const [filtres, setFiltres] = useState<NoteFiltres>({ page: 1, limit: 20 });
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const [editNote, setEditNote] = useState<Note | null>(null);

    const { data, isLoading, isFetching, error, refetch } = useNotes(filtres);
    const supprimer = useSupprimerNote();

    const handleDelete = async () => {
        if (!noteToDelete) return;
        await supprimer.mutateAsync(noteToDelete.id);
        setDeleteConfirmOpen(false);
        setNoteToDelete(null);
    };

    if (isLoading && !data) {
        return <PageSkeleton showHeader showTable />;
    }

    if (error) {
        return (
            <div className="p-6">
                <ErrorMessage
                    message={t('chargement')}
                    onRetry={() => refetch()}
                />
            </div>
        );
    }

    const typesNote: Record<string, { label: string; color: string }> = {
        DEVOIR: { label: t('composition'), color: 'red' },
        INTERROGATION: { label: t('interrogation'), color: 'blue' },
        EXAMEN: { label: t('examen'), color: 'orange' },
        PROJET: { label: t('projet'), color: 'purple' },
        PARTICIPATION: { label: t('participation'), color: 'green' },
        AUTRE: { label: t('autre'), color: 'gray' },
    };

    const colonnes: Column<Note>[] = [
        {
            key: 'eleve',
            pinned: 'left' as const,
            header: t('eleve'),
            sortable: true,
            render: (n) => (
                <div>
                    <p className="font-medium">{n.eleve?.prenom} {n.eleve?.nom}</p>
                    <p className="text-xs font-mono text-[var(--color-text-muted)]">{n.eleve?.matricule}</p>
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
                    <p className="text-xs text-[var(--color-text-muted)]">Coef. {n.matiere?.coefficient || 1}</p>
                </div>
            ),
        },
        {
            key: 'valeur',
            header: t('valeur'),
            sortable: true,
            className: 'text-center',
            render: (n) => (
                <div className="flex flex-col items-center gap-1">
                    <span className={`inline-flex items-center justify-center rounded-lg px-3 py-1 text-lg font-bold ${
                        n.valeur >= 16 ? 'bg-green-100 text-green-800' :
                        n.valeur >= 14 ? 'bg-blue-100 text-blue-800' :
                        n.valeur >= 12 ? 'bg-indigo-100 text-indigo-800' :
                        n.valeur >= 10 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                    }`}>
                        {n.valeur}/20
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium bg-${typesNote[n.typeEvaluation]?.color}-100 text-${typesNote[n.typeEvaluation]?.color}-800`}>
                        {typesNote[n.typeEvaluation]?.label}
                    </span>
                </div>
            ),
        },
        {
            key: 'coefficient',
            header: t('coefficient'),
            className: 'text-center',
            render: (n) => <span className="font-medium">{n.coefficient || 1}</span>,
        },
        {
            key: 'enseignant',
            header: t('enseignant'),
            render: (n) => (
                <span className="text-sm">{n.enseignant?.nom} {n.enseignant?.prenom}</span>
            ),
        },
        {
            key: 'actions',
            header: t('actions'),
            className: 'text-right',
            renderActions: (n) => [
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
        <div className="flex flex-col gap-6 p-6">
            <PageHeader
                variant="gradient"
                icon={ClipboardList}
                title={t('titre')}
                subtitle={t('noteCount', { count: data?.meta?.totalItems || 0 })}
                actions={
                    <div className="flex gap-2">
                        {hasPermission('notes:create') && (
                            <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => { setEditNote(null); setFormOpen(true); }}>
                                {t('nouvelleNote')}
                            </ElisaButton>
                        )}
                        {hasPermission('notes:create') && (
                            <ElisaButton variant="outline" size="sm" icon={<TrendingUp className="h-4 w-4" />}>
                                {t('saisieMasse')}
                            </ElisaButton>
                        )}
                    </div>
                }
            />

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
                variant="danger"
                isLoading={supprimer.isPending}
            />
        </div>
    );
}
