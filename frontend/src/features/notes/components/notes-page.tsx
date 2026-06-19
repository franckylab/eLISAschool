/**
 * ==================================
 * eLISAschool - Page Notes
 * ==================================
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Plus, TrendingUp, ClipboardList, Edit, Trash2 } from 'lucide-react';
import { useNotes, useSupprimerNote } from '../hooks/use-notes';
import { DataTable } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { LoadingState, ErrorState } from '@/components/feedback';
import { usePermissions } from '@/hooks';
import type { Note, NoteFiltres } from '../types/note.types';
import type { Column } from '@/components/ui/DataTable';

export function NotesPage() {
    useTranslation();
    const { hasPermission } = usePermissions();
    const [filtres, setFiltres] = useState<NoteFiltres>({ page: 1, limit: 20 });

    const { data, isLoading, error } = useNotes(filtres);
    const supprimer = useSupprimerNote();

    if (isLoading) {
        return (
            <div className="p-6">
                <LoadingState message="Chargement des notes..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <ErrorState
                    message={error.message || "Impossible de charger les notes"}
                    onRetry={() => window.location.reload()}
                />
            </div>
        );
    }

    const typesNote: any = {
        composition: { label: 'Composition', color: 'red' },
        interrogation: { label: 'Interrogation', color: 'blue' },
        exercice: { label: 'Exercice', color: 'green' },
        projet: { label: 'Projet', color: 'purple' },
        autre: { label: 'Autre', color: 'gray' },
    };

    const colonnes: Column<Note>[] = [
        {
            key: 'eleve',
            pinned: 'left' as const,
            header: 'Élève',
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
            header: 'Matière',
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
            header: 'Note',
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
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium bg-${typesNote[n.type]?.color}-100 text-${typesNote[n.type]?.color}-800`}>
                        {typesNote[n.type]?.label}
                    </span>
                </div>
            ),
        },
        {
            key: 'coefficient',
            header: 'Coef.',
            className: 'text-center',
            render: (n) => <span className="font-medium">{n.coefficient || 1}</span>,
        },
        {
            key: 'enseignant',
            header: 'Enseignant',
            render: (n) => (
                <span className="text-sm">{n.enseignant?.nom} {n.enseignant?.prenom}</span>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            className: 'text-right',
            renderActions: (n) => [
                {
                    key: 'modifier',
                    icon: Edit,
                    label: 'Modifier',
                    onClick: () => {},
                    permission: 'notes:edit',
                },
                {
                    key: 'supprimer',
                    icon: Trash2,
                    label: 'Supprimer',
                    onClick: () => supprimer.mutateAsync(n.id),
                    permission: 'notes:delete',
                    variant: 'danger' as const,
                },
            ],
        },
    ];

    return (
        <div className="flex flex-col gap-6 p-6">
            <motion.div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <div>
                    <h1 className="text-3xl font-bold">Notes</h1>
                    <p className="text-sm text-[var(--color-text-secondary)]">{data?.meta?.totalItems || 0} note(s)</p>
                </div>
                <div className="flex gap-2">
                    {hasPermission('notes:create') && (
                        <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />}>
                            Nouvelle note
                        </ElisaButton>
                    )}
                    {hasPermission('notes:create') && (
                        <ElisaButton variant="outline" size="sm" icon={<TrendingUp className="h-4 w-4" />}>
                            Saisie en masse
                        </ElisaButton>
                    )}
                </div>
            </motion.div>

            <DataTable
                data={data?.data || []}
                columns={colonnes}
                isLoading={false}
                searchPlaceholder="Rechercher..."
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
            />
        </div>
    );
}
