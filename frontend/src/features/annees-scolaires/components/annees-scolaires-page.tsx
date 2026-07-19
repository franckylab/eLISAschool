/**
 * ==================================
 * eLISAschool - Page Années Scolaires
 * ==================================
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Plus, Calendar, ClockArrowUp, CheckCircle, Edit, Trash2, Eye, Power, Lock, Unlock } from 'lucide-react';
import { useAnneesScolaires, useActiverAnneeScolaire, useSupprimerAnneeScolaire, useCloturerAnneeScolaire, useReouvrirAnneeScolaire } from '../hooks/use-annees-scolaires';
import { AnneeScolaireFormModal } from './annee-scolaire-form-modal';
import { DataTable, Column } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/layout/PageHeader';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { useNavigate } from '@tanstack/react-router';
import { usePermissions } from '@/hooks';
import type { AnneeScolaire, AnneeScolaireFiltres } from '../types/annee-scolaire.types';

export function AnneesScolairesPage() {
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const { t, i18n } = useTranslation('annees-scolaires');
    const [filtres, setFiltres] = useState<AnneeScolaireFiltres>({ page: 1, limit: 20 });
    const [modalOpen, setModalOpen] = useState(false);
    const [anneeSelected, setAnneeSelected] = useState<AnneeScolaire | undefined>();
    const [modeFormulaire, setModeFormulaire] = useState<'creation' | 'edition'>('creation');
    const [anneeToDelete, setAnneeToDelete] = useState<AnneeScolaire | null>(null);
    const [anneeToCloturer, setAnneeToCloturer] = useState<AnneeScolaire | null>(null);
    const [anneeToReouvrir, setAnneeToReouvrir] = useState<AnneeScolaire | null>(null);

    const { data, isLoading, isFetching, error, refetch } = useAnneesScolaires(filtres);
    const activer = useActiverAnneeScolaire();
    const supprimer = useSupprimerAnneeScolaire();
    const cloturer = useCloturerAnneeScolaire();
    const reouvrir = useReouvrirAnneeScolaire();

    const handleCreation = () => {
        setModeFormulaire('creation');
        setAnneeSelected(undefined);
        setModalOpen(true);
    };

    const handleEdition = (annee: AnneeScolaire) => {
        setModeFormulaire('edition');
        setAnneeSelected(annee);
        setModalOpen(true);
    };

    const handleSuccess = () => {
        setModalOpen(false);
        setAnneeSelected(undefined);
    };

    const colonnes: Column<AnneeScolaire>[] = [
        {
            key: 'code',
            header: t('colonne.code'),
            sortable: true,
            render: (a) => (
                <span className="font-mono text-sm font-semibold text-[var(--color-dominant-600)]">
                    {a.code}
                </span>
            ),
        },
        {
            key: 'libelle',
            pinned: 'left' as const,
            header: t('colonne.libelle'),
            sortable: true,
            render: (a) => (
                <button
                    onClick={() => navigate({ to: '/annees-scolaires/$id', params: { id: a.id } })}
                    className="hover:underline cursor-pointer text-left"
                >
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[var(--color-text-muted)]" />
                        <span className="font-medium">{a.libelle}</span>
                        {a.estActuelle && (
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                                {t('statut.actuelle')}
                            </span>
                        )}
                    </div>
                </button>
            ),
        },
        {
            key: 'periode',
            header: t('colonne.periode'),
            sortable: true,
            render: (a) => (
                <div className="text-sm">
                    <p>{new Date(a.dateDebut).toLocaleDateString(i18n.language)}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                        → {new Date(a.dateFin).toLocaleDateString(i18n.language)}
                    </p>
                </div>
            ),
        },
        {
            key: 'duree',
            header: t('colonne.duree'),
            className: 'text-center',
            render: (a) => {
                const debut = new Date(a.dateDebut);
                const fin = new Date(a.dateFin);
                const mois = Math.round((fin.getTime() - debut.getTime()) / (1000 * 60 * 60 * 24 * 30));
                return <span className="font-medium">{t('colonne.mois', { count: mois })}</span>;
            },
        },
        {
            key: 'statut',
            header: t('colonne.statut'),
            sortable: true,
            className: 'text-center',
            render: (a) => {
                const couleurs: Record<string, string> = {
                    active: 'bg-green-100 text-green-800',
                    inactive: 'bg-gray-100 text-gray-800',
                    future: 'bg-blue-100 text-blue-800',
                    archivee: 'bg-purple-100 text-purple-800',
                };
                return (
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${couleurs[a.statut] || couleurs.inactive}`}>
                        {a.statut === 'active' && <CheckCircle className="h-3 w-3" />}
                        {t(`statut.${a.statut}`)}
                    </span>
                );
            },
        },
        {
            key: 'actions',
            header: t('colonne.actions'),
            className: 'text-right',
            renderActions: (a) => [
                {
                    key: 'voir',
                    icon: Eye,
                    label: t('actions.voir'),
                    onClick: () => navigate({ to: '/annees-scolaires/$id', params: { id: a.id } }),
                    variant: 'info' as const,
                },
                {
                    key: 'activer',
                    icon: Power,
                    label: t('actions.activer'),
                    onClick: () => activer.mutateAsync(a.id),
                    permission: 'annees-scolaires:activer',
                    hidden: a.estActuelle || a.statut === 'archivee',
                    variant: 'success' as const,
                },
                {
                    key: 'cloturer',
                    icon: Lock,
                    label: t('actions.cloturer'),
                    onClick: () => setAnneeToCloturer(a),
                    permission: 'annees-scolaires:cloturer',
                    hidden: a.statut === 'archivee',
                    variant: 'warning' as const,
                },
                {
                    key: 'reouvrir',
                    icon: Unlock,
                    label: t('actions.reouvrir'),
                    onClick: () => setAnneeToReouvrir(a),
                    permission: 'annees-scolaires:reouvrir',
                    hidden: a.statut !== 'archivee',
                    variant: 'info' as const,
                },
                {
                    key: 'modifier',
                    icon: Edit,
                    label: t('actions.modifier'),
                    onClick: () => handleEdition(a),
                    permission: 'annees-scolaires:edit',
                },
                {
                    key: 'supprimer',
                    icon: Trash2,
                    label: t('actions.supprimer'),
                    onClick: () => setAnneeToDelete(a),
                    permission: 'annees-scolaires:delete',
                    hidden: a.estActuelle,
                    variant: 'danger' as const,
                },
            ],
        },
    ];

    if (isLoading && !data) {
        return <PageSkeleton />;
    }

    if (error) {
        return <ErrorMessage message={error.message} onRetry={() => refetch()} />;
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <PageHeader
                title={t('titre')}
                subtitle={t('stats', { count: data?.meta?.totalItems || 0 })}
                icon={ClockArrowUp}
                variant="gradient"
                actions={
                    hasPermission('annees-scolaires:create') ? (
                        <ElisaButton
                            variant="primary"
                            size="sm"
                            icon={<Plus className="h-4 w-4" />}
                            onClick={handleCreation}
                        >
                            {t('nouvelleAnnee')}
                        </ElisaButton>
                    ) : undefined
                }
            />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <DataTable
                    tableId="annees-scolaires"
                    data={data?.items || []}
                    columns={colonnes}
                    isLoading={isLoading}
                    isFetching={isFetching}
                    enableReordering
                    enablePinning
                    enableColumnVisibility
                    enableCollapsibleFilters
                    filtres={[
                        {
                            key: 'statut',
                            label: t('colonne.statut'),
                            options: [
                                { value: 'active', label: t('statut.active') },
                                { value: 'inactive', label: t('statut.inactive') },
                                { value: 'future', label: t('statut.future') },
                                { value: 'archivee', label: t('statut.archivee') },
                            ],
                            allOptionLabel: t('colonne.tousStatuts') || 'Tous',
                        },
                    ]}
                    searchPlaceholder={t('rechercher')}
                    onSearchChange={(recherche) =>
                        setFiltres((prev) => ({ ...prev, recherche, page: 1 }))
                    }
                    onFilterChange={(key, valeur) => {
                        if (key === 'statut') {
                            setFiltres((prev) => ({ ...prev, statut: valeur as AnneeScolaireFiltres['statut'], page: 1 }));
                        }
                    }}
                    onClearFilters={() => setFiltres((prev) => ({ ...prev, statut: undefined, page: 1 }))}
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
                    emptyMessage={t('aucuneAnneeTrouvee') || 'Aucune année scolaire trouvée'}
                />
            </motion.div>

            {modalOpen && (
                <AnneeScolaireFormModal
                    open={modalOpen}
                    mode={modeFormulaire}
                    annee={anneeSelected}
                    onOpenChange={(v) => { if (!v) setModalOpen(false); }}
                    onSuccess={handleSuccess}
                />
            )}

            {anneeToDelete && (
                <ConfirmDialog
                    open={!!anneeToDelete}
                    onOpenChange={(open) => { if (!open) setAnneeToDelete(null); }}
                    title={t('confirmerSupprimerTitre')}
                    description={t('confirmerSupprimerMessage', { libelle: anneeToDelete.libelle })}
                    confirmText={t('actions.supprimer')}
                    variant="danger"
                    onConfirm={async () => {
                        await supprimer.mutateAsync(anneeToDelete.id);
                        setAnneeToDelete(null);
                    }}
                    isLoading={supprimer.isPending}
                />
            )}

            {anneeToCloturer && (
                <ConfirmDialog
                    open={!!anneeToCloturer}
                    onOpenChange={(open) => { if (!open) setAnneeToCloturer(null); }}
                    title={t('confirmerCloturerTitre')}
                    description={t('confirmerCloturerMessage', { libelle: anneeToCloturer.libelle })}
                    confirmText={t('actions.cloturer')}
                    variant="warning"
                    onConfirm={async () => {
                        await cloturer.mutateAsync(anneeToCloturer.id);
                        setAnneeToCloturer(null);
                    }}
                    isLoading={cloturer.isPending}
                />
            )}

            {anneeToReouvrir && (
                <ConfirmDialog
                    open={!!anneeToReouvrir}
                    onOpenChange={(open) => { if (!open) setAnneeToReouvrir(null); }}
                    title={t('confirmerReouvrirTitre')}
                    description={t('confirmerReouvrirMessage', { libelle: anneeToReouvrir.libelle })}
                    confirmText={t('actions.reouvrir')}
                    variant="info"
                    onConfirm={async () => {
                        await reouvrir.mutateAsync(anneeToReouvrir.id);
                        setAnneeToReouvrir(null);
                    }}
                    isLoading={reouvrir.isPending}
                />
            )}
        </div>
    );
}
