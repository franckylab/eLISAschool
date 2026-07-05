/**
 * ==================================
 * eLISAschool - Page Matières
 * ==================================
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { useMatieres, useSupprimerMatiere, useCreerMatiere, useModifierMatiere } from '../hooks/use-matieres';
import { MatiereFormModal } from './matiere-form-modal';
import { DataTable } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { LoadingState, ErrorState } from '@/components/feedback';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { usePermissions } from '@/hooks';
import type { Matiere, MatiereFiltres } from '../types/matiere.types';
import type { Column } from '@/components/ui/DataTable';

export function MatieresPage() {
    const { t } = useTranslation();
    const { hasPermission } = usePermissions();
    const [filtres, setFiltres] = useState<MatiereFiltres>({ page: 1, limit: 50 });
    const [formOpen, setFormOpen] = useState(false);
    const [matiereToEdit, setMatiereToEdit] = useState<Matiere | null>(null);
    const [matiereToDelete, setMatiereToDelete] = useState<Matiere | null>(null);

    const { data, isLoading, error, refetch } = useMatieres(filtres);
    const creer = useCreerMatiere();
    const modifier = useModifierMatiere();
    const supprimer = useSupprimerMatiere();

    const handleSave = async (data: any) => {
        if (matiereToEdit) {
            await modifier.mutateAsync({ id: matiereToEdit.id, ...data });
        } else {
            await creer.mutateAsync(data);
        }
        setFormOpen(false);
        setMatiereToEdit(null);
    };

    const handleEdition = (matiere: Matiere) => {
        setMatiereToEdit(matiere);
        setFormOpen(true);
    };

    const handleCreation = () => {
        setMatiereToEdit(null);
        setFormOpen(true);
    };

    const sousSystemeLabel = (v: string | null) => {
        if (!v) return 'Commun';
        return v === 'FRANCOPHONE' ? 'Francophone' : 'Anglophone';
    };

    const colonnes: Column<Matiere>[] = [
        {
            key: 'code',
            header: 'Code',
            sortable: true,
            render: (m) => <span className="font-mono text-sm font-semibold text-[var(--color-dominant-600)]">{m.code  || '-'}</span>,
        },
        {
            key: 'nom',
            pinned: 'left' as const,
            header: t('commun.nom'),
            sortable: true,
            render: (m) => (
                <button
                    onClick={() => window.location.href = `/matieres/${m.id}`}
                    className="hover:underline cursor-pointer text-left"
                >
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: m.couleur }} />
                        <p className="font-medium">{m.nom}</p>
                        {m.nomAnglais && <span className="text-xs text-gray-400">({m.nomAnglais})</span>}
                    </div>
                </button>
            ),
        },
        {
            key: 'sousSysteme',
            header: 'Système',
            sortable: false,
            className: 'text-center',
            render: (m) => (
                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                    !m.sousSysteme ? 'bg-gray-100 text-gray-700' :
                    m.sousSysteme === 'FRANCOPHONE' ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                }`}>
                    {sousSystemeLabel(m.sousSysteme)}
                </span>
            ),
        },
        {
            key: 'actif',
            header: t('commun.statut'),
            sortable: true,
            className: 'text-center',
            render: (m) => (
                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${m.actif ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {m.actif ? 'Actif' : 'Inactif'}
                </span>
            ),
        },
        {
            key: 'actions',
            header: t('commun.actions'),
            className: 'text-right',
            renderActions: (m) => [
                {
                    key: 'voir',
                    icon: Eye,
                    label: 'Voir détails',
                    onClick: () => window.location.href = `/matieres/${m.id}`,
                    variant: 'info' as const,
                },
                {
                    key: 'modifier',
                    icon: Edit,
                    label: 'Modifier',
                    onClick: () => handleEdition(m),
                    permission: 'matieres:edit',
                },
                {
                    key: 'supprimer',
                    icon: Trash2,
                    label: 'Supprimer',
                    onClick: () => setMatiereToDelete(m),
                    permission: 'matieres:delete',
                    variant: 'danger' as const,
                },
            ],
        },
    ];

    // Affichage skeleton pendant le chargement
    if (isLoading) {
        return (
            <div className="p-6">
                <LoadingState message="Chargement des matières..." />
            </div>
        );
    }

    // Affichage message d'erreur
    if (error) {
        return (
            <div className="p-6">
                <ErrorState
                    message={error.message || "Impossible de charger les matières"}
                    onRetry={() => refetch()}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <motion.div className="flex justify-between" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <div>
                    <h1 className="text-3xl font-bold">{t('matieres.titre', { defaultValue: 'Matières' })}</h1>
                    <p className="text-sm text-[var(--color-text-secondary)]">{data?.meta?.totalItems || 0} matière(s)</p>
                </div>
                {hasPermission('matieres:create') && (
                    <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={handleCreation}>{t('boutons.nouveau')}</ElisaButton>
                )}
            </motion.div>

            <DataTable
                data={data?.items || []}
                columns={colonnes}
                isLoading={isLoading}
                enableReordering
                enablePinning
                enableColumnVisibility
                searchPlaceholder={t('filtres.recherche')}
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

            {formOpen && (
                <MatiereFormModal
                    open={formOpen}
                    onOpenChange={(v) => { if (!v) { setFormOpen(false); setMatiereToEdit(null); } }}
                    matiere={matiereToEdit}
                    onSave={handleSave}
                    isLoading={creer.isPending || modifier.isPending}
                />
            )}

            <ConfirmationModal
                isOpen={!!matiereToDelete}
                title="Supprimer cette matière"
                message={`Êtes-vous sûr de vouloir supprimer la matière "${matiereToDelete?.nom}" ?`}
                details="Cette action est irréversible et supprimera toutes les données associées."
                variant="danger"
                onConfirm={async () => {
                    if (matiereToDelete) {
                        await supprimer.mutateAsync(matiereToDelete.id);
                        setMatiereToDelete(null);
                    }
                }}
                onCancel={() => setMatiereToDelete(null)}
                isLoading={supprimer.isPending}
            />
        </div>
    );
}
