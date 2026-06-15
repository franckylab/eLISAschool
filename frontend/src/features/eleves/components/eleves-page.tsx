/**
 * ==================================
 * eLISAschool - Page Élèves
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * Page liste complète avec filtres avancés, modales, import/export
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Plus, Download, Upload, Users } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useEleves, useSupprimerEleve, useExporterEleves } from '../hooks/use-eleves';
import { EleveFormModal } from './eleve-form-modal';
import { DataTable } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { usePermissions, useKeyboardShortcuts } from '@/hooks';
import { useToutesClasses } from '@/features/classes/hooks/use-toutes-classes';
import { useToutesAnneesScolaires } from '@/features/annees-scolaires/hooks/use-toutes-annees-scolaires';
import { LoadingState, ErrorState } from '@/components/feedback';
import type { Eleve, EleveFiltres, StatutEleve, Sexe } from '../types/eleve.types';
import type { Column } from '@/components/ui/DataTable';

export function ElevesPage() {
    const { t } = useTranslation('eleves');
    const { hasPermission } = usePermissions();
    const navigate = useNavigate();
    
    // States pour modales
    const [modalOpen, setModalOpen] = useState(false);
    const [modeModal, setModeModal] = useState<'creation' | 'edition'>('creation');
    const [eleveEdition, setEleveEdition] = useState<Eleve | null>(null);
    const [eleveToDelete, setEleveToDelete] = useState<Eleve | null>(null);
    
    // States pour filtres
    const [filtres, setFiltres] = useState<EleveFiltres>({
        page: 1,
        limit: 20,
    });

    const { data, isLoading, error, refetch } = useEleves(filtres);
    const supprimerEleve = useSupprimerEleve();
    const exporterEleves = useExporterEleves();
    
    // Données pour dropdowns
    const { data: classes } = useToutesClasses();
    const { data: anneesScolaires } = useToutesAnneesScolaires();

    // Raccourci clavier Ctrl+N pour nouveau
    useKeyboardShortcuts([
        {
            key: 'n',
            ctrl: true,
            action: () => {
                setModeModal('creation');
                setEleveEdition(null);
                setModalOpen(true);
            },
            enabled: hasPermission('eleves:create'),
        },
    ]);
    
    // Handlers
    const handleNouveau = () => {
        setModeModal('creation');
        setEleveEdition(null);
        setModalOpen(true);
    };
    
    const handleModifier = (eleve: Eleve) => {
        setModeModal('edition');
        setEleveEdition(eleve);
        setModalOpen(true);
    };
    
    const handleVoir = (eleve: Eleve) => {
        navigate({ to: '/eleves/$id', params: { id: eleve.id } });
    };
    
    const handleExporter = () => {
        exporterEleves.mutate(filtres);
    };
    


    const colonnes: Column<Eleve>[] = [
        {
            key: 'matricule',
            header: 'Matricule',
            sortable: true,
            render: (eleve) => (
                <span className="font-mono text-sm font-medium text-[var(--color-dominant-600)]">
                    {eleve.matricule}
                </span>
            ),
        },
        {
            key: 'nomComplet',
            header: t('commun.nom'),
            sortable: true,
            render: (eleve) => (
                <div className="flex items-center gap-3">
                    {eleve.photo ? (
                        <img
                            src={eleve.photo}
                            alt={`${eleve.prenom} ${eleve.nom}`}
                            className="h-8 w-8 rounded-full object-cover"
                        />
                    ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-dominant-100)] text-sm font-semibold text-[var(--color-dominant-700)]">
                            {eleve.prenom[0]}{eleve.nom[0]}
                        </div>
                    )}
                    <div>
                        <p className="font-medium text-[var(--color-text-primary)]">
                            {eleve.prenom} {eleve.nom}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)]">
                            {eleve.email || eleve.telephone || '-'}
                        </p>
                    </div>
                </div>
            ),
        },
        {
            key: 'sexe',
            header: 'Sexe',
            sortable: true,
            className: 'text-center',
            render: (eleve) => (
                <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        eleve.sexe === 'M'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'
                    }`}
                >
                    {eleve.sexe === 'M' ? 'Masculin' : 'Féminin'}
                </span>
            ),
        },
        {
            key: 'classe',
            header: 'Classe',
            sortable: true,
            render: (eleve) => (
                <span className="rounded bg-[var(--color-secondary-100)] px-2 py-1 text-xs font-medium text-[var(--color-secondary-700)] dark:bg-[var(--color-secondary-900)] dark:text-[var(--color-secondary-200)]">
                    {eleve.classe?.nom || '-'}
                </span>
            ),
        },
        {
            key: 'statut',
            header: t('commun.statut', { defaultValue: 'Statut' }),
            sortable: true,
            className: 'text-center',
            render: (eleve) => {
                const statuts: Record<StatutEleve, { label: string; color: string }> = {
                    ACTIF: { label: t('statut.actif'), color: 'green' },
                    EXCLU: { label: t('statut.exclu'), color: 'red' },
                    ABANDON: { label: t('statut.abandon'), color: 'gray' },
                    DIPLOME: { label: t('statut.diplome'), color: 'blue' },
                };
                const statut = statuts[eleve.statut || 'ACTIF'];
                return (
                    <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium bg-${statut.color}-100 text-${statut.color}-800 dark:bg-${statut.color}-900 dark:text-${statut.color}-200`}
                    >
                        {statut.label}
                    </span>
                );
            },
        },
        {
            key: 'actions',
            pinned: 'right' as const,
            header: t('commun.actions', { defaultValue: 'Actions' }),
            className: 'text-right',
            render: (eleve) => (
                <div className="flex justify-end gap-2">
                    <ElisaButton
                        variant="outline"
                        size="sm"
                        onClick={() => handleVoir(eleve)}
                    >
                        {t('actions.voir')}
                    </ElisaButton>
                    {hasPermission('eleves:edit') && (
                        <ElisaButton
                            variant="ghost"
                            size="sm"
                            onClick={() => handleModifier(eleve)}
                        >
                            {t('actions.modifier')}
                        </ElisaButton>
                    )}
                    {hasPermission('eleves:delete') && (
                        <ElisaButton
                            variant="danger"
                            size="sm"
                            isLoading={supprimerEleve.isPending}
                            onClick={() => setEleveToDelete(eleve)}
                        >
                            {t('actions.supprimer')}
                        </ElisaButton>
                    )}
                </div>
            ),
        },
    ];

    // Affichage skeleton pendant le chargement
    if (isLoading) {
        return (
            <div className="p-6">
                <LoadingState message="Chargement des élèves..." />
            </div>
        );
    }

    // Affichage message d'erreur
    if (error) {
        return (
            <div className="p-6">
                <ErrorState
                    message={error.message || "Impossible de charger les élèves"}
                    onRetry={() => refetch()}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* En-tête */}
            <motion.div
                className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div>
                    <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
                        {t('eleves.titre', { defaultValue: 'Élèves' })}
                    </h1>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                        {data?.meta?.totalItems || 0} élève(s) inscrit(s)
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    {hasPermission('eleves:export') && (
                        <ElisaButton
                            variant="outline"
                            size="sm"
                            icon={<Download className="h-4 w-4" />}
                            onClick={handleExporter}
                            isLoading={exporterEleves.isPending}
                        >
                            {t('actions.exporter')}
                        </ElisaButton>
                    )}
                    {hasPermission('eleves:import') && (
                        <ElisaButton
                            variant="outline"
                            size="sm"
                            icon={<Upload className="h-4 w-4" />}
                        >
                            {t('actions.importer')}
                        </ElisaButton>
                    )}
                    {hasPermission('eleves:create') && (
                        <ElisaButton
                            variant="primary"
                            size="sm"
                            icon={<Plus className="h-4 w-4" />}
                            onClick={handleNouveau}
                        >
                            {t('actions.nouveau')}
                        </ElisaButton>
                    )}
                </div>
            </motion.div>

            {/* Tableau */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <DataTable
                    data={data?.items || []}
                    columns={colonnes}
                    isLoading={isLoading}
                    searchPlaceholder={t('filtres.recherche')}
                    enableReordering
                enablePinning
                    filtres={[
                        {
                            key: 'classeId',
                            label: t('filtres.classe', { defaultValue: 'Classe' }),
                            options: (classes || []).map((c) => ({ value: c.id, label: c.nom })),
                            allOptionLabel: t('filtres.toutesClasses'),
                        },
                        {
                            key: 'anneeScolaireId',
                            label: t('filtres.annee', { defaultValue: 'Année' }),
                            options: (anneesScolaires || []).map((a) => ({ value: a.id, label: a.libelle })),
                            allOptionLabel: t('filtres.toutesAnnees'),
                        },
                        {
                            key: 'sexe',
                            label: t('filtres.sexe', { defaultValue: 'Sexe' }),
                            options: [
                                { value: 'M', label: 'Masculin' },
                                { value: 'F', label: 'Féminin' },
                            ],
                            allOptionLabel: t('filtres.tousSexes'),
                        },
                        {
                            key: 'statut',
                            label: t('filtres.statut', { defaultValue: 'Statut' }),
                            options: [
                                { value: 'ACTIF', label: 'Actif' },
                                { value: 'EXCLU', label: 'Exclu' },
                                { value: 'ABANDON', label: 'Abandon' },
                                { value: 'DIPLOME', label: 'Diplômé' },
                            ],
                            allOptionLabel: t('filtres.tousStatuts'),
                        },
                    ]}
                    onSearchChange={(recherche) =>
                        setFiltres((prev) => ({ ...prev, recherche, page: 1 }))
                    }
                    onFilterChange={(key, valeur) =>
                        setFiltres((prev) => ({ ...prev, [key]: valeur || undefined, page: 1 }))
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
                    onLimitChange={(limit) =>
                        setFiltres((prev) => ({ ...prev, limit, page: 1 }))
                    }
                    emptyMessage={t('messages.aucuneDonnee')}
                />
            </motion.div>

            {/* Modale Formulaire */}
            <EleveFormModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                mode={modeModal}
                eleve={eleveEdition || undefined}
            />

            {/* Modale Confirmation Suppression */}
            <ConfirmationModal
                isOpen={!!eleveToDelete}
                title="Supprimer cet élève"
                message={`Êtes-vous sûr de vouloir supprimer l'élève ${eleveToDelete?.prenom} ${eleveToDelete?.nom} ?`}
                details="Cette action est irréversible et supprimera toutes les données associées (notes, bulletins, présence, etc.)."
                variant="danger"
                onConfirm={async () => {
                    if (eleveToDelete) {
                        await supprimerEleve.mutateAsync(eleveToDelete.id);
                        setEleveToDelete(null);
                    }
                }}
                onCancel={() => setEleveToDelete(null)}
                isLoading={supprimerEleve.isPending}
            />
        </div>
    );
}
