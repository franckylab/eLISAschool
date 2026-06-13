/**
 * ==================================
 * eLISAschool - Page Classes
 * ==================================
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Plus, Users, Edit, Trash2, Eye } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useClasses, useSupprimerClasse } from '../hooks/use-classes';
import { ClasseFormModal } from './classe-form-modal';
import { DataTable } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { usePermissions } from '@/hooks';
import type { Classe, ClasseFiltres } from '../types/classe.types';
import type { Column } from '@/components/ui/DataTable';

export function ClassesPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const [filtres, setFiltres] = useState<ClasseFiltres>({ page: 1, limit: 20 });
    const [modalOpen, setModalOpen] = useState(false);
    const [classeSelected, setClasseSelected] = useState<Classe | undefined>();
    const [modeFormulaire, setModeFormulaire] = useState<'creation' | 'edition'>('creation');
    const [classeToDelete, setClasseToDelete] = useState<Classe | null>(null);

    const { data, isLoading, error, refetch } = useClasses(filtres);
    const supprimer = useSupprimerClasse();

    const handleCreation = () => {
        setModeFormulaire('creation');
        setClasseSelected(undefined);
        setModalOpen(true);
    };

    const handleEdition = (classe: Classe) => {
        setModeFormulaire('edition');
        setClasseSelected(classe);
        setModalOpen(true);
    };

    const handleSuccess = () => {
        setModalOpen(false);
        setClasseSelected(undefined);
    };

    const colonnes: Column<Classe>[] = [
        {
            key: 'code',
            header: 'Code',
            sortable: true,
            render: (classe) => (
                <button
                    onClick={() => navigate({ to: '/classes/$id', params: { id: classe.id } })}
                    className="font-mono text-sm font-semibold text-[var(--color-dominant-600)] hover:underline cursor-pointer"
                >
                    {classe.code}
                </button>
            ),
        },
        {
            key: 'nom',
            pinned: 'left' as const,
            header: 'Nom',
            sortable: true,
            render: (classe) => (
                <button
                    onClick={() => navigate({ to: '/classes/$id', params: { id: classe.id } })}
                    className="hover:underline cursor-pointer text-left"
                >
                    <p className="font-medium">{classe.nom}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                        {classe.niveau?.nom}
                        {classe.filiere && ` - ${classe.filiere.code}`}
                    </p>
                </button>
            ),
        },
        {
            key: 'effectif',
            header: 'Effectif',
            sortable: true,
            className: 'text-center',
            render: (classe) => (
                <div className="flex items-center justify-center gap-1">
                    <Users className="h-4 w-4 text-[var(--color-text-muted)]" />
                    <span className="font-medium">
                        {classe.effectifActuel || 0} / {classe.effectifMax || '∞'}
                    </span>
                </div>
            ),
        },
        {
            key: 'salle',
            header: 'Salle',
            render: (classe) => classe.sallePrincipale || '-',
        },
        {
            key: 'principal',
            header: 'Principal',
            render: (classe) => (
                classe.professeurPrincipal ? `${classe.professeurPrincipal.prenom} ${classe.professeurPrincipal.nom}` : '-'
            ),
        },
        {
            key: 'typeClasse',
            header: 'Type',
            className: 'text-center',
            render: (classe) => {
                const typeColors: Record<string, string> = {
                    NORMALE: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
                    BILINGUE: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
                    RENFORCEE: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
                    INTERNATIONALE: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
                };
                return (
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${typeColors[classe.typeClasse] || 'bg-gray-100 text-gray-800'}`}>
                        {classe.typeClasse}
                    </span>
                );
            },
        },
        {
            key: 'creneauHoraire',
            header: 'Créneau',
            className: 'text-center',
            render: (classe) => {
                const creneauLabels: Record<string, string> = {
                    MATIN: 'Matin',
                    APRES_MIDI: 'Après-midi',
                    JOURNEE_COMPLETE: 'Journée',
                };
                return (
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        {creneauLabels[classe.creneauHoraire] || classe.creneauHoraire}
                    </span>
                );
            },
        },
        {
            key: 'statut',
            header: t('commun.statut'),
            sortable: true,
            className: 'text-center',
            render: (classe) => (
                <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        classe.actif
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}
                >
                    {classe.actif ? 'Actif' : 'Inactif'}
                </span>
            ),
        },
        {
            key: 'actions',
            pinned: 'right' as const,
            header: t('commun.actions'),
            className: 'text-right',
            render: (classe) => (
                <div className="flex justify-end gap-1">
                    <button
                        onClick={() => navigate({ to: '/classes/$id', params: { id: classe.id } })}
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Voir détails"
                    >
                        <Eye className="h-4 w-4" />
                    </button>
                    {hasPermission('classes:edit') && (
                        <button
                            onClick={() => handleEdition(classe)}
                            className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                            title="Modifier"
                        >
                            <Edit className="h-4 w-4" />
                        </button>
                    )}
                    {hasPermission('classes:delete') && (
                        <button
                            onClick={() => setClasseToDelete(classe)}
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
                    message={error.message || "Impossible de charger les classes"}
                    onRetry={() => refetch()}
                    retryLabel="Réessayer"
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <motion.div
                className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div>
                    <h1 className="text-3xl font-bold">{t('classes.titre', { defaultValue: 'Classes' })}</h1>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                        {data?.meta?.totalItems || 0} classe(s) active(s)
                    </p>
                </div>
                {hasPermission('classes:create') && (
                    <ElisaButton
                        variant="primary"
                        size="sm"
                        icon={<Plus className="h-4 w-4" />}
                        onClick={handleCreation}
                    >
                        {t('boutons.nouveau')}
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
                <ClasseFormModal
                    mode={modeFormulaire}
                    classe={classeSelected}
                    onSuccess={handleSuccess}
                    onCancel={() => setModalOpen(false)}
                />
            )}

            <ConfirmationModal
                isOpen={!!classeToDelete}
                title="Supprimer cette classe"
                message={`Êtes-vous sûr de vouloir supprimer la classe "${classeToDelete?.nom}" ?`}
                details="Cette action est irréversible et supprimera toutes les données associées."
                variant="danger"
                onConfirm={async () => {
                    if (classeToDelete) {
                        await supprimer.mutateAsync(classeToDelete.id);
                        setClasseToDelete(null);
                    }
                }}
                onCancel={() => setClasseToDelete(null)}
                isLoading={supprimer.isPending}
            />
        </div>
    );
}
