/**
 * ==================================
 * eLISAschool - Page Matières
 * ==================================
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useMatieres, useSupprimerMatiere } from '../hooks/use-matieres';
import { MatiereFormModal } from './matiere-form-modal';
import { DataTable } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { usePermissions } from '@/hooks';
import type { Matiere, MatiereFiltres } from '../types/matiere.types';
import type { Column } from '@/components/ui/DataTable';

export function MatieresPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const [filtres, setFiltres] = useState<MatiereFiltres>({ page: 1, limit: 50 });
    const [modalOpen, setModalOpen] = useState(false);
    const [matiereSelected, setMatiereSelected] = useState<Matiere | undefined>();
    const [modeFormulaire, setModeFormulaire] = useState<'creation' | 'edition'>('creation');
    const [matiereToDelete, setMatiereToDelete] = useState<Matiere | null>(null);

    const { data, isLoading, error, refetch } = useMatieres(filtres);
    const supprimer = useSupprimerMatiere();

    const handleCreation = () => {
        setModeFormulaire('creation');
        setMatiereSelected(undefined);
        setModalOpen(true);
    };

    const handleEdition = (matiere: Matiere) => {
        setModeFormulaire('edition');
        setMatiereSelected(matiere);
        setModalOpen(true);
    };

    const handleSuccess = () => {
        setModalOpen(false);
        setMatiereSelected(undefined);
    };

    const colonnes: Column<Matiere>[] = [
        {
            key: 'code',
            header: 'Code',
            sortable: true,
            render: (m) => <span className="font-mono text-sm font-semibold text-[var(--color-dominant-600)]">{m.code}</span>,
        },
        {
            key: 'nom',
            pinned: 'left' as const,
            header: t('commun.nom'),
            sortable: true,
            render: (m) => (
                <button
                    onClick={() => navigate({ to: '/matieres/$id', params: { id: m.id } })}
                    className="hover:underline cursor-pointer text-left"
                >
                    <div>
                        <p className="font-medium">{m.nom}</p>
                        {m.description && <p className="text-xs text-[var(--color-text-muted)] line-clamp-1">{m.description}</p>}
                    </div>
                </button>
            ),
        },
        {
            key: 'coefficient',
            header: 'Coeff.',
            sortable: true,
            className: 'text-center',
            render: (m) => <span className="rounded bg-[var(--color-accent-100)] px-2 py-1 text-sm font-semibold">{m.coefficient || '-'}</span>,
        },
        {
            key: 'nombreHeures',
            header: 'Heures',
            sortable: true,
            className: 'text-center',
            render: (m) => <span className="font-medium">{m.nombreHeures || '-'}</span>,
        },
        {
            key: 'statut',
            header: t('commun.statut'),
            sortable: true,
            className: 'text-center',
            render: (m) => (
                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${m.statut === 'actif' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {m.statut === 'actif' ? 'Actif' : 'Inactif'}
                </span>
            ),
        },
        {
            key: 'actions',
            pinned: 'right' as const,
            header: t('commun.actions'),
            className: 'text-right',
            render: (m) => (
                <div className="flex justify-end gap-1">
                    <button
                        onClick={() => navigate({ to: '/matieres/$id', params: { id: m.id } })}
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Voir détails"
                    >
                        <Eye className="h-4 w-4" />
                    </button>
                    {hasPermission('matieres:edit') && (
                        <button
                            onClick={() => handleEdition(m)}
                            className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                            title="Modifier"
                        >
                            <Edit className="h-4 w-4" />
                        </button>
                    )}
                    {hasPermission('matieres:delete') && (
                        <button
                            onClick={() => setMatiereToDelete(m)}
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

    // Affichage skeleton pendant le chargement
    if (isLoading) {
        return <PageSkeleton showStats showTable />;
    }

    // Affichage message d'erreur
    if (error) {
        return (
            <div className="p-6">
                <ErrorMessage
                    title="Erreur de chargement"
                    message={error.message || "Impossible de charger les matières"}
                    onRetry={() => refetch()}
                    retryLabel="Réessayer"
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

            {modalOpen && (
                <MatiereFormModal
                    mode={modeFormulaire}
                    matiere={matiereSelected}
                    onSuccess={handleSuccess}
                    onCancel={() => setModalOpen(false)}
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
