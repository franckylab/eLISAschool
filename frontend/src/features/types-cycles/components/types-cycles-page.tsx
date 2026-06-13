/**
 * ==================================
 * eLISAschool - Page Types de Cycles
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Eye, BookOpen, Calendar, Hash } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { usePermissions } from '@/hooks';
import type { Column } from '@/components/ui/DataTable';
import type { TypeCycle } from '../types/type-cycle.types';
import {
    useTypesCycles,
    useCreerTypeCycle,
    useModifierTypeCycle,
    useSupprimerTypeCycle,
} from '../hooks/use-types-cycles';
import { TypeCycleFormModal } from './type-cycle-form-modal';

export function TypesCyclesPage() {
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [showFormModal, setShowFormModal] = useState(false);
    const [typeToEdit, setTypeToEdit] = useState<TypeCycle | null>(null);
    const [typeToDelete, setTypeToDelete] = useState<TypeCycle | null>(null);

    const { hasPermission } = usePermissions();
    const { data, isLoading } = useTypesCycles({
        page,
        limit,
    });

    const creer = useCreerTypeCycle();
    const modifier = useModifierTypeCycle();
    const supprimer = useSupprimerTypeCycle();

    const types = data?.items || [];
    const meta = data?.meta;
    const total = meta?.totalItems || 0;
    const totalPages = meta?.totalPages || 1;
    const currentPage = meta?.currentPage || page;

    const colonnes: Column<TypeCycle>[] = [
        {
            key: 'nom',
            header: 'Type de Cycle',
            sortable: true,
            render: (t) => (
                <div>
                    <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-[var(--color-dominante)]" />
                        <span className="font-semibold">{t.nom}</span>
                    </div>
                    {t.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{t.description}</p>
                    )}
                </div>
            ),
        },
        {
            key: 'code',
            header: 'Code',
            render: (t) => (
                <code className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">
                    {t.code}
                </code>
            ),
        },
        {
            key: 'ordre',
            header: 'Ordre',
            render: (t) => (
                <div className="flex items-center gap-1">
                    <Hash className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">{t.ordre}</span>
                </div>
            ),
        },
        {
            key: 'dureeAnnees',
            header: 'Durée',
            render: (t) => (
                t.dureeAnnees ? (
                    <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{t.dureeAnnees} an(s)</span>
                    </div>
                ) : (
                    <span className="text-gray-400">-</span>
                )
            ),
        },
        {
            key: 'actif',
            header: 'Statut',
            render: (t) => (
                <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        t.actif
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                    }`}
                >
                    {t.actif ? 'Actif' : 'Inactif'}
                </span>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            className: 'text-right',
            render: (t) => (
                <div className="flex justify-end gap-1">
                    <button
                        onClick={() => {/* Voir détails */}}
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Voir détails"
                    >
                        <Eye className="h-4 w-4" />
                    </button>
                    {hasPermission('types-cycles:edit') && (
                        <button
                            onClick={() => {
                                setTypeToEdit(t);
                                setShowFormModal(true);
                            }}
                            className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                            title="Modifier"
                        >
                            <Edit className="h-4 w-4" />
                        </button>
                    )}
                    {hasPermission('types-cycles:delete') && (
                        <button
                            onClick={() => setTypeToDelete(t)}
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

    const handleDelete = async () => {
        if (!typeToDelete) return;

        try {
            await supprimer.mutateAsync(typeToDelete.id);
            setTypeToDelete(null);
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
        }
    };

    return (
        <div className="space-y-6">
            {/* En-tête */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--color-texte)]">
                            Types de Cycles
                        </h1>
                        <p className="text-sm text-[var(--color-texte-secondaire)] mt-1">
                            Gérez les catégories de cycles pédagogiques
                        </p>
                    </div>
                    {hasPermission('types-cycles:create') && (
                        <ElisaButton
                            variant="primary"
                            size="md"
                            onClick={() => {
                                setTypeToEdit(null);
                                setShowFormModal(true);
                            }}
                            leftIcon={<Plus className="h-4 w-4" />}
                        >
                            Nouveau type de cycle
                        </ElisaButton>
                    )}
                </div>
            </motion.div>

            {/* Indicateurs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="bg-white rounded-lg p-4 border border-gray-200"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Types</p>
                            <p className="text-2xl font-bold text-[var(--color-dominante)] mt-1">
                                {total}
                            </p>
                        </div>
                        <BookOpen className="h-8 w-8 text-[var(--color-dominante)]/20" />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="bg-white rounded-lg p-4 border border-gray-200"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Actifs</p>
                            <p className="text-2xl font-bold text-green-600 mt-1">
                                {types.filter((t) => t.actif).length}
                            </p>
                        </div>
                        <Calendar className="h-8 w-8 text-green-600/20" />
                    </div>
                </motion.div>
            </div>

            {/* Tableau */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
            >
                <DataTable
                    columns={colonnes}
                    data={types}
                    isLoading={isLoading}
                    pagination={meta ? {
                        page: currentPage,
                        limit: meta.itemsPerPage,
                        total,
                        totalPages,
                        hasNext: currentPage < totalPages,
                        hasPrev: currentPage > 1,
                        onPageChange: setPage,
                    } : undefined}
                    emptyMessage="Aucun type de cycle trouvé"
                />
            </motion.div>

            {/* Modal Formulaire */}
            <TypeCycleFormModal
                open={showFormModal}
                typeCycle={typeToEdit}
                onClose={() => {
                    setShowFormModal(false);
                    setTypeToEdit(null);
                }}
                onSubmit={async (dto) => {
                    if (typeToEdit) {
                        await modifier.mutateAsync({ id: typeToEdit.id, ...dto });
                    } else {
                        await creer.mutateAsync(dto);
                    }
                }}
            />

            {/* Dialog Confirmation Suppression */}
            <ConfirmDialog
                open={!!typeToDelete}
                onOpenChange={(open) => { if (!open) setTypeToDelete(null); }}
                title="Supprimer le type de cycle"
                description={`Êtes-vous sûr de vouloir supprimer "${typeToDelete?.nom}" ? Cette action est irréversible.`}
                confirmText="Supprimer"
                variant="danger"
                onConfirm={handleDelete}
                isLoading={supprimer.isPending}
            />
        </div>
    );
}
