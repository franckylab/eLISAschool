/**
 * ==================================
 * eLISAschool - Page Classes (Liste)
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * Corrections :
 * - Responsive design complet (mobile → desktop)
 * - i18n complet (toutes les chaînes traduites)
 * - Variables CSS pour l'adaptabilité
 * - Ultra-responsivité (clamp, variables CSS)
 */

import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Plus, Users, Edit, Trash2, Eye, Power } from 'lucide-react';
import { useClasses, useSupprimerClasse, useToggleActifClasse } from '../hooks/use-classes';
import { ClasseFormModal } from './classe-form-modal';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { LoadingState, ErrorState } from '@/components/feedback';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { usePermissions } from '@/hooks';
import { useMediaQuery } from '@/hooks/use-media-query';
import type { Classe, ClasseFiltres } from '../types/classe.types';

export function ClassesPage() {
    const { t } = useTranslation('classes');
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const estMobile = useMediaQuery('(max-width: 767px)');

    const [filtres, setFiltres] = useState<ClasseFiltres>({ page: 1, limit: 20 });
    const [modalOpen, setModalOpen] = useState(false);
    const [classeSelected, setClasseSelected] = useState<Classe | undefined>();
    const [modeFormulaire, setModeFormulaire] = useState<'creation' | 'edition'>('creation');
    const [classeToDelete, setClasseToDelete] = useState<Classe | null>(null);
    const [classeToToggle, setClasseToToggle] = useState<Classe | null>(null);

    const { data, isLoading, error, refetch } = useClasses(filtres);
    const supprimer = useSupprimerClasse();
    const toggleActif = useToggleActifClasse();

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

    const handleVoirDetail = (classe: Classe) => {
        navigate({ to: '/classes/$id', params: { id: classe.id } });
    };

    const handleToggleActif = (classe: Classe) => {
        setClasseToToggle(classe);
    };

    const confirmToggleActif = async () => {
        if (classeToToggle) {
            await toggleActif.mutateAsync({ id: classeToToggle.id, actif: !classeToToggle.actif });
            setClasseToToggle(null);
        }
    };

    const handleSuccess = () => {
        setModalOpen(false);
        setClasseSelected(undefined);
    };

    // Colonnes du tableau
    const colonnes: Column<Classe>[] = [
        {
            key: 'code',
            header: t('colonnes.code'),
            sortable: true,
            render: (classe) => (
                <button
                    onClick={() => handleVoirDetail(classe)}
                    className="font-mono font-semibold text-[var(--color-dominant-600)] hover:underline cursor-pointer"
                    style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}
                >
                    {classe.code}
                </button>
            ),
        },
        {
            key: 'nom',
            pinned: 'left' as const,
            header: t('colonnes.nom'),
            sortable: true,
            render: (classe) => (
                <button
                    onClick={() => handleVoirDetail(classe)}
                    className="hover:underline cursor-pointer text-left"
                >
                    <p className="font-medium" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.25vw, 0.9375rem)' }}>
                        {classe.nom}
                    </p>
                    <p className="text-[var(--color-text-muted)]" style={{ fontSize: 'clamp(0.625rem, 0.58rem + 0.2vw, 0.75rem)' }}>
                        {classe.niveau?.nom}
                        {classe.filiere && ` - ${classe.filiere.code}`}
                    </p>
                </button>
            ),
        },
        {
            key: 'effectif',
            header: t('colonnes.effectif'),
            sortable: true,
            className: 'text-center',
            render: (classe) => (
                <div className="flex items-center justify-center gap-1">
                    <Users className="h-[var(--icon-xs)] w-[var(--icon-xs)] text-[var(--color-text-muted)]" />
                    <span className="font-medium" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}>
                        {classe.effectifActuel || 0} / {classe.effectifMax || '∞'}
                    </span>
                </div>
            ),
        },
        {
            key: 'salle',
            header: t('colonnes.salle'),
            render: (classe) => (
                <span style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}>
                    {classe.salle?.nom || classe.salleId?.substring(0, 8) || '-'}
                </span>
            ),
        },
        {
            key: 'principal',
            header: t('colonnes.principal'),
            render: (classe) => (
                <span style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}>
                    {classe.professeurPrincipal
                        ? `${classe.professeurPrincipal.prenom} ${classe.professeurPrincipal.nom}`
                        : '-'}
                </span>
            ),
        },
        {
            key: 'typeClasse',
            header: t('colonnes.type'),
            className: 'text-center',
            render: (classe) => {
                const typeColors: Record<string, string> = {
                    NORMALE: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
                    BILINGUE: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
                    RENFORCEE: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
                    INTERNATIONALE: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
                };
                const typeLabels: Record<string, string> = {
                    NORMALE: t('types.normale'),
                    BILINGUE: t('types.bilingue'),
                    RENFORCEE: t('types.renforcee'),
                    INTERNATIONALE: t('types.internationale'),
                };
                return (
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${typeColors[classe.typeClasse] || 'bg-gray-100 text-gray-800'}`}>
                        {typeLabels[classe.typeClasse] || classe.typeClasse}
                    </span>
                );
            },
        },
        {
            key: 'creneauHoraire',
            header: t('colonnes.creneau'),
            className: 'text-center',
            render: (classe) => {
                const creneauLabels: Record<string, string> = {
                    MATIN: t('creneaux.matin'),
                    APRES_MIDI: t('creneaux.apresMidi'),
                    JOURNEE_COMPLETE: t('creneaux.journeeComplete'),
                };
                return (
                    <span className="text-[var(--color-text-secondary)]" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}>
                        {creneauLabels[classe.creneauHoraire] || classe.creneauHoraire}
                    </span>
                );
            },
        },
        {
            key: 'statut',
            header: t('colonnes.statut'),
            sortable: true,
            className: 'text-center',
            render: (classe) => (
                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                    classe.actif
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                }`}>
                    {classe.actif ? t('statut.actif') : t('statut.inactif')}
                </span>
            ),
        },
        {
            key: 'actions',
            header: t('colonnes.actions'),
            className: 'text-right',
            renderActions: (classe) => [
                {
                    key: 'voir',
                    icon: Eye,
                    label: t('actions.voir'),
                    onClick: () => handleVoirDetail(classe),
                    variant: 'info' as const,
                },
                {
                    key: 'toggleActif',
                    icon: Power,
                    label: classe.actif ? t('actions.desactiver') : t('actions.activer'),
                    onClick: () => handleToggleActif(classe),
                    permission: 'classes:edit',
                    variant: classe.actif ? 'warning' as const : 'success' as const,
                },
                {
                    key: 'modifier',
                    icon: Edit,
                    label: t('actions.modifier'),
                    onClick: () => handleEdition(classe),
                    permission: 'classes:edit',
                },
                {
                    key: 'supprimer',
                    icon: Trash2,
                    label: t('actions.supprimer'),
                    onClick: () => setClasseToDelete(classe),
                    permission: 'classes:delete',
                    variant: 'danger' as const,
                },
            ],
        },
    ];

    // États de chargement et erreur
    if (isLoading) {
        return (
            <div className="p-6">
                <LoadingState message={t('chargement.liste')} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <ErrorState
                    message={error.message || t('erreurs.chargement')}
                    onRetry={() => refetch()}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-[var(--gap-lg)] p-[var(--space-md)] sm:p-[var(--space-lg)]">
            {/* Header responsive */}
            <motion.div
                className={`flex ${estMobile ? 'flex-col gap-3' : 'flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div>
                    <h1
                        className="font-bold text-[var(--color-text-primary)]"
                        style={{ fontSize: 'clamp(1.5rem, 1.3rem + 0.8vw, 1.875rem)' }}
                    >
                        {t('titre')}
                    </h1>
                    <p
                        className="text-[var(--color-text-secondary)] mt-1"
                        style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}
                    >
                        {data?.meta?.totalItems || 0} {t('sousTitre.classesActives')}
                    </p>
                </div>
                {hasPermission('classes:create') && (
                    <ElisaButton
                        variant="primary"
                        size="sm"
                        icon={<Plus className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                        onClick={handleCreation}
                    >
                        {t('boutons.nouveau')}
                    </ElisaButton>
                )}
            </motion.div>

            {/* Tableau des classes */}
            <DataTable
                tableId="classes"
                data={data?.items || []}
                columns={colonnes}
                isLoading={isLoading}
                enableReordering
                enablePinning
                enableColumnVisibility
                searchPlaceholder={t('filtres.recherchePlaceholder')}
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

            {/* Modal Formulaire */}
            {modalOpen && (
                <ClasseFormModal
                    mode={modeFormulaire}
                    classe={classeSelected}
                    onSuccess={handleSuccess}
                    onCancel={() => setModalOpen(false)}
                />
            )}

            {/* Modal Confirmation Suppression */}
            <ConfirmationModal
                isOpen={!!classeToDelete}
                title={t('confirmations.supprimerTitre')}
                message={t('confirmations.supprimerMessage', { nom: classeToDelete?.nom || '' })}
                details={t('confirmations.supprimerDetails')}
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

            {/* Modal Confirmation Toggle Actif */}
            <ConfirmationModal
                isOpen={!!classeToToggle}
                title={classeToToggle?.actif ? t('confirmations.desactiverTitre') : t('confirmations.activerTitre')}
                message={classeToToggle?.actif
                    ? t('confirmations.desactiverMessage', { nom: classeToToggle?.nom || '' })
                    : t('confirmations.activerMessage', { nom: classeToToggle?.nom || '' })
                }
                variant={classeToToggle?.actif ? 'warning' : 'info'}
                onConfirm={confirmToggleActif}
                onCancel={() => setClasseToToggle(null)}
                isLoading={toggleActif.isPending}
            />
        </div>
    );
}
