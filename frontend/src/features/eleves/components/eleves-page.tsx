/**
 * ==================================
 * eLISAschool - Page Élèves
 * ==================================
 * Version: 3.0.0
 * Auteur: franck arlos chendjou
 * 
 * Page liste complète avec filtres avancés, modales, import/export
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Plus, Download, Upload, Eye, Edit, Trash2, Users, UserCheck, UserX, GraduationCap } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useEleves, useSupprimerEleve, useExporterEleves } from '../hooks/use-eleves';
import { EleveFormModal } from './eleve-form-modal';
import { DataTable } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { CardGrid } from '@/components/ui/CardGrid';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { SchoolLoading, ErrorState } from '@/components/feedback';
import { usePermissions, useKeyboardShortcuts } from '@/hooks';
import { useToutesClasses } from '@/features/classes/hooks/use-toutes-classes';
import { useToutesAnneesScolaires } from '@/features/annees-scolaires/hooks/use-toutes-annees-scolaires';
import type { Eleve, EleveFiltres, StatutEleve } from '../types/eleve.types';
import type { Column } from '@/components/ui/DataTable';

const STATUT_STYLES: Record<StatutEleve, string> = {
    ACTIF: 'bg-success/15 text-success',
    EXCLU: 'bg-destructive/15 text-destructive',
    ABANDON: 'bg-muted text-muted-foreground',
    DIPLOME: 'bg-primary/15 text-primary',
};

const SEXE_STYLES: Record<string, string> = {
    M: 'bg-primary/15 text-primary',
    F: 'bg-accent/15 text-accent',
};

export function ElevesPage() {
    const { t } = useTranslation('eleves');
    const { hasPermission } = usePermissions();
    const navigate = useNavigate();
    
    const [modalOpen, setModalOpen] = useState(false);
    const [modeModal, setModeModal] = useState<'creation' | 'edition'>('creation');
    const [eleveEdition, setEleveEdition] = useState<Eleve | null>(null);
    const [eleveToDelete, setEleveToDelete] = useState<Eleve | null>(null);
    
    const [filtres, setFiltres] = useState<EleveFiltres>({
        page: 1,
        limit: 20,
    });

    const { data, isLoading, isFetching, error, refetch } = useEleves(filtres);
    const supprimerEleve = useSupprimerEleve();
    const exporterEleves = useExporterEleves();
    
    const { data: classes } = useToutesClasses();
    const { data: anneesScolaires } = useToutesAnneesScolaires();

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
            header: t('detail.matricule'),
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
                        <button
                            type="button"
                            className="font-medium text-left text-foreground hover:text-primary transition-colors"
                            onClick={() => navigate({ to: '/eleves/$id', params: { id: eleve.id } })}
                        >
                            {eleve.prenom} {eleve.nom}
                        </button>
                        <p className="text-xs text-muted-foreground">
                            {eleve.utilisateur?.email || eleve.utilisateur?.telephone || '—'}
                        </p>
                    </div>
                </div>
            ),
        },
        {
            key: 'sexe',
            header: t('detail.sexe'),
            sortable: true,
            className: 'text-center',
            render: (eleve) => (
                <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${SEXE_STYLES[eleve.sexe] ?? 'bg-muted text-muted-foreground'}`}
                >
                    {eleve.sexe === 'M' ? t('formulaire.masculin') : t('formulaire.feminin')}
                </span>
            ),
        },
        {
            key: 'classe',
            header: t('formulaire.classe'),
            sortable: true,
            render: (eleve) => (
                eleve.classe ? (
                    <button
                        type="button"
                        className="rounded bg-[var(--color-secondary-100)] px-2 py-1 text-xs font-medium text-[var(--color-secondary-700)] hover:bg-[var(--color-secondary-200)] transition-colors"
                        onClick={() => navigate({ to: '/classes/$id', params: { id: eleve.classe!.id } })}
                    >
                        {eleve.classe.nom}
                    </button>
                ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                )
            ),
        },
        {
            key: 'statut',
            header: t('commun.statut'),
            sortable: true,
            className: 'text-center',
            render: (eleve) => {
                const statut = eleve.statut || 'ACTIF';
                return (
                    <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${STATUT_STYLES[statut]}`}
                    >
                        {t(`statut.${statut.toLowerCase()}`)}
                    </span>
                );
            },
        },
        {
            key: 'actions',
            header: t('commun.actions'),
            className: 'text-right',
            renderActions: (eleve) => [
                {
                    key: 'voir',
                    icon: Eye,
                    label: t('actions.voir'),
                    onClick: () => handleVoir(eleve),
                    variant: 'info' as const,
                },
                {
                    key: 'modifier',
                    icon: Edit,
                    label: t('actions.modifier'),
                    onClick: () => handleModifier(eleve),
                    permission: 'eleves:edit',
                },
                {
                    key: 'supprimer',
                    icon: Trash2,
                    label: t('actions.supprimer'),
                    onClick: () => setEleveToDelete(eleve),
                    permission: 'eleves:delete',
                    variant: 'danger' as const,
                },
            ],
        },
    ];

    if (isLoading && !data) {
        return (
            <div className="p-6">
                <SchoolLoading message={t('chargement')} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <ErrorState
                    message={error.message || t('chargement')}
                    onRetry={() => refetch()}
                />
            </div>
        );
    }

    const totalActifs = data?.items?.filter((e) => e.statut === 'ACTIF').length || 0;
    const totalExclus = data?.items?.filter((e) => e.statut === 'EXCLU').length || 0;
    const totalDiplomes = data?.items?.filter((e) => e.statut === 'DIPLOME').length || 0;

    return (
        <div className="flex flex-col gap-6 p-6">
            <PageHeader
                title={t('titre')}
                description={t('statistiques.total') + ': ' + (data?.meta?.totalItems || 0)}
                icon={Users}
                variant="gradient"
                actions={
                    <div className="flex flex-wrap gap-2">
                        {hasPermission('eleves:export') && (
                            <ElisaButton
                                variant="outline"
                                size="sm"
                                leftIcon={<Download className="h-4 w-4" />}
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
                                leftIcon={<Upload className="h-4 w-4" />}
                            >
                                {t('actions.importer')}
                            </ElisaButton>
                        )}
                        {hasPermission('eleves:create') && (
                            <ElisaButton
                                variant="primary"
                                size="sm"
                                leftIcon={<Plus className="h-4 w-4" />}
                                onClick={handleNouveau}
                            >
                                {t('actions.nouveau')}
                            </ElisaButton>
                        )}
                    </div>
                }
            />

            <CardGrid>
                <StatCard label={t('statistiques.total')} value={data?.meta?.totalItems || 0} icon={Users} tone="dominant" />
                <StatCard label={t('statistiques.actifs')} value={totalActifs} icon={UserCheck} tone="success" />
                <StatCard label={t('statistiques.exclus')} value={totalExclus} icon={UserX} tone="danger" />
                <StatCard label={t('statistiques.diplomes')} value={totalDiplomes} icon={GraduationCap} tone="info" />
            </CardGrid>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <DataTable
                    tableId="eleves-liste"
                    data={data?.items || []}
                    columns={colonnes}
                    isLoading={isLoading}
                    isFetching={isFetching}
                    searchPlaceholder={t('filtres.recherche')}
                    enableReordering
                    enablePinning
                    enableCollapsibleFilters
                    filtres={[
                        {
                            key: 'classeId',
                            label: t('filtres.classe'),
                            options: (classes || []).map((c) => ({ value: c.id, label: c.nom })),
                            allOptionLabel: t('filtres.toutesClasses'),
                        },
                        {
                            key: 'anneeScolaireId',
                            label: t('filtres.annee'),
                            options: (anneesScolaires || []).map((a) => ({ value: a.id, label: a.libelle })),
                            allOptionLabel: t('filtres.toutesAnnees'),
                        },
                        {
                            key: 'sexe',
                            label: t('filtres.sexe'),
                            options: [
                                { value: 'M', label: t('formulaire.masculin') },
                                { value: 'F', label: t('formulaire.feminin') },
                            ],
                            allOptionLabel: t('filtres.tousSexes'),
                        },
                        {
                            key: 'statut',
                            label: t('filtres.statut'),
                            options: [
                                { value: 'ACTIF', label: t('statut.actif') },
                                { value: 'EXCLU', label: t('statut.exclu') },
                                { value: 'ABANDON', label: t('statut.abandon') },
                                { value: 'DIPLOME', label: t('statut.diplome') },
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

            <EleveFormModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                mode={modeModal}
                eleve={eleveEdition || undefined}
            />

            <ConfirmationModal
                isOpen={!!eleveToDelete}
                title={t('confirmation.supprimerTitre')}
                message={t('confirmation.supprimerMessage', { prenom: eleveToDelete?.prenom, nom: eleveToDelete?.nom })}
                details={t('confirmation.supprimerDetails')}
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
