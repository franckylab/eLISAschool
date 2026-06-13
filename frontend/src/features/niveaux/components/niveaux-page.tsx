/**
 * ==================================
 * eLISAschool - Page Niveaux
 * ==================================
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { useNiveaux, useSupprimerNiveau } from '../hooks/use-niveaux';
import { NiveauFormModal } from './niveau-form-modal';
import { DataTable } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { usePermissions } from '@/hooks';
import type { Niveau, NiveauFiltres } from '../types/niveau.types';
import type { Column } from '@/components/ui/DataTable';

export function NiveauxPage() {
    const { hasPermission } = usePermissions();
    const [filtres, setFiltres] = useState<NiveauFiltres>({ page: 1, limit: 20, recherche: '' });
    const [showFormModal, setShowFormModal] = useState(false);
    const [niveauToEdit, setNiveauToEdit] = useState<Niveau | null>(null);
    const [niveauToDelete, setNiveauToDelete] = useState<Niveau | null>(null);

    const { data, isLoading } = useNiveaux(filtres);
    const supprimer = useSupprimerNiveau();

    const colonnes: Column<Niveau>[] = [
        {
            key: 'code',
            header: 'Code',
            sortable: true,
            render: (n) => (
                <span className="font-mono text-sm font-semibold text-[var(--color-dominant-600)]">{n.code}</span>
            ),
        },
        {
            key: 'nom',
            pinned: 'left' as const,
            header: 'Nom',
            sortable: true,
            render: (n) => (
                <div>
                    <span className="font-medium">{n.nom}</span>
                    {n.cycle && (
                        <p className="text-xs text-[var(--color-text-muted)]">{n.cycle.nom}</p>
                    )}
                </div>
            ),
        },
        {
            key: 'ordre',
            header: 'Ordre',
            sortable: true,
            className: 'text-center',
            render: (n) => (
                <span className="inline-flex items-center justify-center rounded-full bg-[var(--color-dominant-100)] px-3 py-1 text-sm font-semibold text-[var(--color-dominant-800)]">{n.ordre}</span>
            ),
        },
        {
            key: 'actif',
            header: 'Statut',
            render: (n) => (
                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${n.actif ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {n.actif ? 'Actif' : 'Inactif'}
                </span>
            ),
        },
        {
            key: 'actions',
            pinned: 'right' as const,
            header: 'Actions',
            className: 'text-right',
            render: (n) => (
                <div className="flex justify-end gap-1">
                    <button
                        onClick={() => {/* Voir détails */}}
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Voir détails"
                    >
                        <Eye className="h-4 w-4" />
                    </button>
                    {hasPermission('niveaux:edit') && (
                        <button
                            onClick={() => {
                                setNiveauToEdit(n);
                                setShowFormModal(true);
                            }}
                            className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                            title="Modifier"
                        >
                            <Edit className="h-4 w-4" />
                        </button>
                    )}
                    {hasPermission('niveaux:delete') && (
                        <button
                            onClick={() => setNiveauToDelete(n)}
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                            title="Supprimer"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="flex flex-col gap-6 p-6">
            <motion.div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <div>
                    <h1 className="text-3xl font-bold">Niveaux</h1>
                    <p className="text-sm text-[var(--color-text-secondary)]">{data?.meta?.totalItems || 0} niveau(x)</p>
                </div>
                {hasPermission('niveaux:create') && (
                    <ElisaButton
                        variant="primary"
                        size="sm"
                        icon={<Plus className="h-4 w-4" />}
                        onClick={() => {
                            setNiveauToEdit(null);
                            setShowFormModal(true);
                        }}
                    >
                        Nouveau niveau
                    </ElisaButton>
                )}
            </motion.div>

            <DataTable
                data={data?.items || []}
                columns={colonnes}
                isLoading={isLoading}
                enableReordering
                enablePinning
                enableColumnVisibility
                searchPlaceholder="Rechercher..."
                onSearchChange={(recherche) =>
                    setFiltres((prev) => ({ ...prev, recherche, page: 1 }))
                }
                disableClientSearch
                pagination={data?.meta ? { page: data.meta.currentPage, limit: data.meta.itemsPerPage, total: data.meta.totalItems, totalPages: data.meta.totalPages, hasNext: data.meta.currentPage < data.meta.totalPages, hasPrev: data.meta.currentPage > 1 } : undefined}
                onPageChange={(page) => setFiltres((prev) => ({ ...prev, page }))}
                onLimitChange={(limit) => setFiltres((prev) => ({ ...prev, limit, page: 1 }))}
            />

            {showFormModal && (
                <NiveauFormModal
                    niveau={niveauToEdit}
                    onClose={() => {
                        setShowFormModal(false);
                        setNiveauToEdit(null);
                    }}
                />
            )}

            {niveauToDelete && (
                <ConfirmDialog
                    open={!!niveauToDelete}
                    onOpenChange={(open) => { if (!open) setNiveauToDelete(null); }}
                    title="Supprimer le niveau"
                    description={`Êtes-vous sûr de vouloir supprimer le niveau "${niveauToDelete.nom}" ?`}
                    confirmText="Supprimer"
                    variant="danger"
                    onConfirm={async () => {
                        await supprimer.mutateAsync(niveauToDelete.id);
                        setNiveauToDelete(null);
                    }}
                    isLoading={supprimer.isPending}
                />
            )}
        </div>
    );
}
