/**
 * ==================================
 * eLISAschool - Page Cycles Complète
 * ==================================
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Eye, AlertTriangle, ToggleLeft, ToggleRight, Calendar, Award } from 'lucide-react';
import { useCycles, useSupprimerCycle, useCreerCycle, useModifierCycle } from '../hooks/use-cycles';
import { DataTable } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { CycleFormModal } from './cycle-form-modal';
import { usePermissions } from '@/hooks';
import type { Cycle, CycleFiltres, CreerCycleDto } from '../types/cycle.types';
import type { Column } from '@/components/ui/DataTable';

export function CyclesPage() {
    const { hasPermission } = usePermissions();
    const [filtres, setFiltres] = useState<CycleFiltres>({ page: 1, limit: 20, recherche: '' });
    const [showFormModal, setShowFormModal] = useState(false);
    const [cycleToEdit, setCycleToEdit] = useState<Cycle | null>(null);
    const [cycleToDelete, setCycleToDelete] = useState<Cycle | null>(null);

    const { data, isLoading } = useCycles(filtres);
    const supprimer = useSupprimerCycle();
    const creer = useCreerCycle();
    const modifier = useModifierCycle();

    const colonnes: Column<Cycle>[] = [
        {
            key: 'code',
            header: 'Code',
            sortable: true,
            render: (c) => (
                <span className="font-mono text-sm font-semibold text-[var(--color-dominant-600)]">{c.code}</span>
            ),
        },
        {
            key: 'nom',
            pinned: 'left' as const,
            header: 'Nom',
            sortable: true,
            render: (c) => <span className="font-medium">{c.nom}</span>,
        },
        {
            key: 'description',
            header: 'Description',
            render: (c) => (
                <span className="text-sm text-gray-600 line-clamp-1">
                    {c.description || <span className="text-gray-400 italic">—</span>}
                </span>
            ),
        },
        {
            key: 'dureeAnnees',
            header: 'Durée',
            sortable: true,
            className: 'text-center',
            render: (c) => (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-800">
                    <Calendar className="h-3 w-3" />
                    {c.dureeAnnees} an{c.dureeAnnees > 1 ? 's' : ''}
                </span>
            ),
        },
        {
            key: 'diplomeSanctionnant',
            header: 'Diplôme',
            render: (c) => (
                <span className="inline-flex items-center gap-1 text-sm">
                    {c.diplomeSanctionnant ? (
                        <>
                            <Award className="h-3.5 w-3.5 text-orange-600" />
                            <span className="font-semibold text-orange-700">{c.diplomeSanctionnant}</span>
                        </>
                    ) : (
                        <span className="text-gray-400 italic">—</span>
                    )}
                </span>
            ),
        },
        {
            key: 'ordre',
            header: 'Ordre',
            sortable: true,
            className: 'text-center',
            render: (c) => (
                <span className="inline-flex items-center justify-center rounded-full bg-[var(--color-dominant-100)] px-3 py-1 text-sm font-semibold text-[var(--color-dominant-800)]">
                    {c.ordre}
                </span>
            ),
        },
        {
            key: 'actif',
            header: 'Statut',
            sortable: true,
            className: 'text-center',
            render: (c) => (
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                    c.actif ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                    {c.actif
                        ? <><ToggleRight className="h-3.5 w-3.5" /> Actif</>
                        : <><ToggleLeft className="h-3.5 w-3.5" /> Inactif</>
                    }
                </span>
            ),
        },
        {
            key: 'actions',
            pinned: 'right' as const,
            header: 'Actions',
            className: 'text-right',
            render: (c) => (
                <div className="flex justify-end gap-1">
                    <button
                        onClick={() => {/* Voir détails */}}
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Voir détails"
                    >
                        <Eye className="h-4 w-4" />
                    </button>
                    {hasPermission('cycles:edit') && (
                        <button
                            onClick={() => {
                                setCycleToEdit(c);
                                setShowFormModal(true);
                            }}
                            className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                            title="Modifier"
                        >
                            <Edit className="h-4 w-4" />
                        </button>
                    )}
                    {hasPermission('cycles:delete') && (
                        <button
                            onClick={() => setCycleToDelete(c)}
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
                    <h1 className="text-3xl font-bold">Cycles</h1>
                    <p className="text-sm text-gray-600">{data?.meta?.totalItems || 0} cycle(s)</p>
                </div>
                {hasPermission('cycles:create') && (
                    <ElisaButton
                        variant="primary"
                        size="sm"
                        icon={<Plus className="h-4 w-4" />}
                        onClick={() => {
                            setCycleToEdit(null);
                            setShowFormModal(true);
                        }}
                    >
                        Nouveau cycle
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
                searchPlaceholder="Rechercher un cycle..."
                onSearchChange={(recherche) =>
                    setFiltres({ ...filtres, recherche, page: 1 })
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
                onPageChange={(page) => setFiltres({ ...filtres, page })}
                onLimitChange={(limit) => setFiltres({ ...filtres, limit, page: 1 })}
            />

            {/* Modal Formulaire */}
            <CycleFormModal
                open={showFormModal}
                onOpenChange={(open) => {
                    if (!open) {
                        setShowFormModal(false);
                        setCycleToEdit(null);
                    }
                }}
                cycle={cycleToEdit}
                onSave={async (formData) => {
                    try {
                        if (cycleToEdit) {
                            await modifier.mutateAsync({ id: cycleToEdit.id, ...formData });
                        } else {
                            await creer.mutateAsync(formData);
                        }
                        setShowFormModal(false);
                        setCycleToEdit(null);
                    } catch (error) {
                        console.error('Erreur sauvegarde cycle:', error);
                    }
                }}
                isLoading={creer.isPending || modifier.isPending}
            />

            {cycleToDelete && (
                <ConfirmDialog
                    open={!!cycleToDelete}
                    onOpenChange={(open) => { if (!open) setCycleToDelete(null); }}
                    title="Supprimer le cycle"
                    description={`Êtes-vous sûr de vouloir supprimer le cycle "${cycleToDelete.nom}" ?`}
                    confirmText="Supprimer"
                    variant="danger"
                    onConfirm={async () => {
                        await supprimer.mutateAsync(cycleToDelete.id);
                        setCycleToDelete(null);
                    }}
                />
            )}
        </div>
    );
}


