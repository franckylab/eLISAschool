/**
 * ==================================
 * eLISAschool - Page Matières
 * ==================================
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Plus, Search } from 'lucide-react';
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
            header: t('commun.actions'),
            className: 'text-right',
            render: (m) => (
                <div className="flex justify-end gap-2">
                    {hasPermission('matieres:edit') && (
                        <ElisaButton variant="ghost" size="sm" onClick={() => handleEdition(m)}>{t('boutons.modifier')}</ElisaButton>
                    )}
                    {hasPermission('matieres:delete') && (
                        <ElisaButton
                            variant="danger"
                            size="sm"
                            isLoading={supprimer.isPending}
                            onClick={() => setMatiereToDelete(m)}
                        >
                            {t('boutons.supprimer')}
                        </ElisaButton>
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

            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input
                    type="text"
                    placeholder={t('filtres.recherche')}
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pl-10 pr-4 text-sm focus:border-[var(--color-dominant-500)] focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)]/20"
                    value={filtres.recherche || ''}
                    onChange={(e) => setFiltres((prev) => ({ ...prev, recherche: e.target.value, page: 1 }))}
                />
            </div>

            <DataTable
                data={data?.items || []}
                columns={colonnes}
                isLoading={isLoading}
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
