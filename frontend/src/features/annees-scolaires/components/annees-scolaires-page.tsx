/**
 * ==================================
 * eLISAschool - Page Années Scolaires
 * ==================================
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Calendar, CheckCircle, Edit, Trash2, Eye, Power, Lock, Unlock } from 'lucide-react';
import { useAnneesScolaires, useActiverAnneeScolaire, useSupprimerAnneeScolaire, useCloturerAnneeScolaire, useReouvrirAnneeScolaire } from '../hooks/use-annees-scolaires';
import { AnneeScolaireFormModal } from './annee-scolaire-form-modal';
import { DataTable, Column } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { LoadingState, ErrorState } from '@/components/feedback';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { usePermissions } from '@/hooks';
import type { AnneeScolaire, AnneeScolaireFiltres } from '../types/annee-scolaire.types';

export function AnneesScolairesPage() {
    const { hasPermission } = usePermissions();
    const [filtres, setFiltres] = useState<AnneeScolaireFiltres>({ page: 1, limit: 20 });
    const [modalOpen, setModalOpen] = useState(false);
    const [anneeSelected, setAnneeSelected] = useState<AnneeScolaire | undefined>();
    const [modeFormulaire, setModeFormulaire] = useState<'creation' | 'edition'>('creation');
    const [anneeToDelete, setAnneeToDelete] = useState<AnneeScolaire | null>(null);
    const [anneeToCloturer, setAnneeToCloturer] = useState<AnneeScolaire | null>(null);
    const [anneeToReouvrir, setAnneeToReouvrir] = useState<AnneeScolaire | null>(null);

    const { data, isLoading, error, refetch } = useAnneesScolaires(filtres);
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
            header: 'Code',
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
            header: 'Libellé',
            sortable: true,
            render: (a) => (
                <button
                    onClick={() => { window.location.href = `/annees-scolaires/${a.id}`; }}
                    className="hover:underline cursor-pointer text-left"
                >
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[var(--color-text-muted)]" />
                        <span className="font-medium">{a.libelle}</span>
                        {a.estActuelle && (
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                                Actuelle
                            </span>
                        )}
                    </div>
                </button>
            ),
        },
        {
            key: 'periode',
            header: 'Période',
            sortable: true,
            render: (a) => (
                <div className="text-sm">
                    <p>{new Date(a.dateDebut).toLocaleDateString('fr-FR')}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                        → {new Date(a.dateFin).toLocaleDateString('fr-FR')}
                    </p>
                </div>
            ),
        },
        {
            key: 'duree',
            header: 'Durée',
            className: 'text-center',
            render: (a) => {
                const debut = new Date(a.dateDebut);
                const fin = new Date(a.dateFin);
                const mois = Math.round((fin.getTime() - debut.getTime()) / (1000 * 60 * 60 * 24 * 30));
                return <span className="font-medium">{mois} mois</span>;
            },
        },
        {
            key: 'statut',
            header: 'Statut',
            sortable: true,
            className: 'text-center',
            render: (a) => {
                const statuts: Record<string, { label: string; color: string; icone?: typeof CheckCircle }> = {
                    active: { label: 'Active', color: 'green', icone: CheckCircle },
                    inactive: { label: 'Inactive', color: 'gray' },
                    future: { label: 'Future', color: 'blue' },
                    archivee: { label: 'Archivée', color: 'purple' },
                };
                const s = statuts[a.statut] || statuts.inactive;
                return (
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium bg-${s.color}-100 text-${s.color}-800`}>
                        {s.icone && <s.icone className="h-3 w-3" />}
                        {s.label}
                    </span>
                );
            },
        },
        {
            key: 'actions',
            header: 'Actions',
            className: 'text-right',
            renderActions: (a) => [
                {
                    key: 'voir',
                    icon: Eye,
                    label: 'Voir détails',
                    onClick: () => { window.location.href = `/annees-scolaires/${a.id}`; },
                    variant: 'info' as const,
                },
                {
                    key: 'activer',
                    icon: Power,
                    label: 'Activer',
                    onClick: () => activer.mutateAsync(a.id),
                    permission: 'annees-scolaires:activer',
                    hidden: a.estActuelle || a.statut === 'archivee',
                    variant: 'success' as const,
                },
                {
                    key: 'cloturer',
                    icon: Lock,
                    label: 'Clôturer',
                    onClick: () => setAnneeToCloturer(a),
                    permission: 'annees-scolaires:cloturer',
                    hidden: a.statut === 'archivee',
                    variant: 'warning' as const,
                },
                {
                    key: 'reouvrir',
                    icon: Unlock,
                    label: 'Réouvrir',
                    onClick: () => setAnneeToReouvrir(a),
                    permission: 'annees-scolaires:reouvrir',
                    hidden: a.statut !== 'archivee',
                    variant: 'info' as const,
                },
                {
                    key: 'modifier',
                    icon: Edit,
                    label: 'Modifier',
                    onClick: () => handleEdition(a),
                    permission: 'annees-scolaires:edit',
                },
                {
                    key: 'supprimer',
                    icon: Trash2,
                    label: 'Supprimer',
                    onClick: () => setAnneeToDelete(a),
                    permission: 'annees-scolaires:delete',
                    hidden: a.estActuelle,
                    variant: 'danger' as const,
                },
            ],
        },
    ];

    // Affichage loading pendant le chargement
    if (isLoading) {
        return (
            <div className="p-6">
                <LoadingState message="Chargement des années scolaires..." />
            </div>
        );
    }

    // Affichage message d'erreur
    if (error) {
        return (
            <div className="p-6">
                <ErrorState
                    message={error.message || "Impossible de charger les années scolaires"}
                    onRetry={() => refetch()}
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
                    <h1 className="text-3xl font-bold">Années Scolaires</h1>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                        {data?.meta?.totalItems || 0} année(s) scolaire(s)
                    </p>
                </div>
                {hasPermission('annees-scolaires:create') && (
                    <ElisaButton
                        variant="primary"
                        size="sm"
                        icon={<Plus className="h-4 w-4" />}
                        onClick={handleCreation}
                    >
                        Nouvelle année
                    </ElisaButton>
                )}
            </motion.div>

            <DataTable
                tableId="annees-scolaires"
                data={data?.items || []}
                columns={colonnes}
                isLoading={isLoading}
                enableReordering
                enablePinning
                enableColumnVisibility
                searchPlaceholder="Rechercher..."
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
                <AnneeScolaireFormModal
                    mode={modeFormulaire}
                    annee={anneeSelected}
                    onSuccess={handleSuccess}
                    onCancel={() => setModalOpen(false)}
                />
            )}

            <ConfirmationModal
                isOpen={!!anneeToDelete}
                title="Supprimer cette année scolaire"
                message={`Êtes-vous sûr de vouloir supprimer l'année "${anneeToDelete?.libelle}" ?`}
                details="Cette action est irréversible. Assurez-vous qu'aucune donnée n'est associée à cette année."
                variant="danger"
                onConfirm={async () => {
                    if (anneeToDelete) {
                        await supprimer.mutateAsync(anneeToDelete.id);
                        setAnneeToDelete(null);
                    }
                }}
                onCancel={() => setAnneeToDelete(null)}
                isLoading={supprimer.isPending}
            />

            <ConfirmationModal
                isOpen={!!anneeToCloturer}
                title="Clôturer cette année scolaire"
                message={`Êtes-vous sûr de vouloir clôturer l'année "${anneeToCloturer?.libelle}" ?`}
                details="Cette action marquera l'année comme terminée. Les opérations de notes et bulletins pourraient être restreintes."
                variant="warning"
                confirmLabel="Clôturer"
                onConfirm={async () => {
                    if (anneeToCloturer) {
                        await cloturer.mutateAsync(anneeToCloturer.id);
                        setAnneeToCloturer(null);
                    }
                }}
                onCancel={() => setAnneeToCloturer(null)}
                isLoading={cloturer.isPending}
            />

            <ConfirmationModal
                isOpen={!!anneeToReouvrir}
                title="Réouvrir cette année scolaire"
                message={`Êtes-vous sûr de vouloir réouvrir l'année "${anneeToReouvrir?.libelle}" ?`}
                details="L'année sera à nouveau disponible pour les opérations courantes."
                variant="info"
                confirmLabel="Réouvrir"
                onConfirm={async () => {
                    if (anneeToReouvrir) {
                        await reouvrir.mutateAsync(anneeToReouvrir.id);
                        setAnneeToReouvrir(null);
                    }
                }}
                onCancel={() => setAnneeToReouvrir(null)}
                isLoading={reouvrir.isPending}
            />
        </div>
    );
}
