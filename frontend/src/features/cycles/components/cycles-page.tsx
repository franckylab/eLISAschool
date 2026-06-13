/**
 * ==================================
 * eLISAschool - Page Cycles Complète
 * ==================================
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Eye, AlertTriangle, ToggleLeft, ToggleRight } from 'lucide-react';
import { useCycles, useSupprimerCycle, useCreerCycle, useModifierCycle } from '../hooks/use-cycles';
import { DataTable } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { usePermissions } from '@/hooks';
import type { Cycle, CycleFiltres } from '../types/cycle.types';
import type { Column } from '@/components/ui/DataTable';

export function CyclesPage() {
    const { hasPermission } = usePermissions();
    const [filtres, setFiltres] = useState<CycleFiltres>({ page: 1, limit: 20, recherche: '' });
    const [showFormModal, setShowFormModal] = useState(false);
    const [cycleToEdit, setCycleToEdit] = useState<Cycle | null>(null);
    const [cycleToDelete, setCycleToDelete] = useState<Cycle | null>(null);

    const { data, isLoading } = useCycles(filtres);
    const supprimer = useSupprimerCycle();

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
            key: 'typeCycle',
            header: 'Type',
            render: (c) => (
                <span className="text-sm text-gray-600">
                    {c.typeCycle?.nom || <span className="text-gray-400 italic">—</span>}
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

            {showFormModal && (
                <CycleFormModal
                    cycle={cycleToEdit}
                    onClose={() => {
                        setShowFormModal(false);
                        setCycleToEdit(null);
                    }}
                />
            )}

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

// ─── Modal Formulaire Cycle ──────────────────────────────────────────────────
function CycleFormModal({ cycle, onClose }: { cycle: Cycle | null; onClose: () => void }) {
    const creer = useCreerCycle();
    const modifier = useModifierCycle();
    const isEditMode = !!cycle;

    const [nom, setNom] = useState(cycle?.nom || '');
    const [code, setCode] = useState(cycle?.code || '');
    const [ordre, setOrdre] = useState(cycle?.ordre || 1);
    const [actif, setActif] = useState(cycle?.actif ?? true);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!nom.trim()) newErrors.nom = 'Le nom est requis';
        if (!code.trim()) newErrors.code = 'Le code est requis';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        const dto = { nom, code, ordre, actif };

        try {
            if (isEditMode && cycle) {
                await modifier.mutateAsync({ id: cycle.id, ...dto });
            } else {
                await creer.mutateAsync(dto);
            }
            onClose();
        } catch {
            // Erreur déjà gérée par le hook (toast)
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-2xl font-bold">
                        {isEditMode ? 'Modifier le cycle' : 'Nouveau cycle'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <AlertTriangle className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                        <input
                            type="text"
                            value={nom}
                            onChange={(e) => setNom(e.target.value)}
                            className={`w-full px-4 py-2 rounded-lg border ${errors.nom ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)]`}
                            placeholder="Ex: Cycle Primaire"
                        />
                        {errors.nom && <p className="text-red-600 text-xs mt-1">{errors.nom}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                            className={`w-full px-4 py-2 rounded-lg border ${errors.code ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)]`}
                            placeholder="Ex: cycle_primaire"
                        />
                        {errors.code && <p className="text-red-600 text-xs mt-1">{errors.code}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ordre</label>
                            <input
                                type="number"
                                value={ordre}
                                onChange={(e) => setOrdre(parseInt(e.target.value) || 1)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)]"
                                min="1"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                            <button
                                type="button"
                                onClick={() => setActif(!actif)}
                                className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                                    actif
                                        ? 'border-green-300 bg-green-50 text-green-800'
                                        : 'border-gray-300 bg-gray-50 text-gray-800'
                                }`}
                            >
                                {actif
                                    ? <><ToggleRight className="h-5 w-5 text-green-600" /> Actif</>
                                    : <><ToggleLeft className="h-5 w-5 text-gray-500" /> Inactif</>
                                }
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-3 justify-end pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={creer.isPending || modifier.isPending}
                            className="px-4 py-2 rounded-lg bg-[var(--color-dominant-600)] text-white hover:bg-[var(--color-dominant-700)] disabled:opacity-50 transition-colors"
                        >
                            {creer.isPending || modifier.isPending ? 'Enregistrement...' : (isEditMode ? 'Enregistrer' : 'Créer')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
