import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, GraduationCap } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useListeEnseignants } from '../hooks/use-enseignants';
import { useSupprimerPersonnel } from '@/features/personnel/hooks/use-personnel';
import { EnseignantFormModal } from './enseignant-form-modal';
import { DataTable } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { LoadingState, ErrorState } from '@/components/feedback';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { usePermissions } from '@/hooks';
import type { Enseignant, EnseignantFiltres } from '../types/enseignant.types';
import type { Column } from '@/components/ui/DataTable';

export function EnseignantsPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const [filtres, setFiltres] = useState<EnseignantFiltres>({ page: 1, limit: 20 });
    const [modalOpen, setModalOpen] = useState(false);
    const [enseignantSelected, setEnseignantSelected] = useState<Enseignant | undefined>();
    const [modeFormulaire, setModeFormulaire] = useState<'creation' | 'edition'>('creation');
    const [modalKey, setModalKey] = useState(0);
    const [enseignantToDelete, setEnseignantToDelete] = useState<Enseignant | null>(null);

    const { data, isLoading, error, refetch } = useListeEnseignants(filtres);
    const supprimer = useSupprimerPersonnel();

    const handleCreation = () => {
        setModeFormulaire('creation');
        setEnseignantSelected(undefined);
        setModalKey(k => k + 1);
        setModalOpen(true);
    };

    const handleEdition = (enseignant: Enseignant) => {
        setModeFormulaire('edition');
        setEnseignantSelected(enseignant);
        setModalKey(k => k + 1);
        setModalOpen(true);
    };

    const handleSuccess = () => {
        setModalOpen(false);
        setEnseignantSelected(undefined);
        refetch();
    };

    const colonnes: Column<Enseignant>[] = [
        {
            key: 'matricule',
            header: 'Matricule',
            sortable: true,
            render: (p) => <span className="font-mono text-sm font-medium text-[var(--color-dominant-600)]">{p.matricule}</span>,
        },
        {
            key: 'nomComplet',
            header: t('commun.nom'),
            sortable: true,
            render: (p) => {
                const prenom = p.utilisateur?.profil?.prenom ?? p.prenom ?? '';
                const nom = p.utilisateur?.profil?.nom ?? p.nom ?? '';
                const email = p.utilisateur?.email ?? p.email ?? '';
                const tel = p.utilisateur?.profil?.telephone ?? p.telephone ?? '';
                return (
                    <button
                        onClick={() => navigate({ to: '/enseignants/$id', params: { id: p.id } })}
                        className="hover:underline cursor-pointer text-left"
                    >
                        <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4 text-blue-500" />
                            <div>
                                <p className="font-medium">{prenom} {nom}</p>
                                <p className="text-xs text-[var(--color-text-muted)]">{email || tel || '-'}</p>
                            </div>
                        </div>
                    </button>
                );
            },
        },
        {
            key: 'specialite',
            header: 'Spécialité',
            sortable: true,
            render: (p) => (
                <span className="text-sm">{p.specialites?.[0] ?? p.specialite ?? '-'}</span>
            ),
        },

        {
            key: 'dateEntree',
            header: 'Date entrée',
            sortable: true,
            render: (p) => {
                const d = p.dateEmbauche ?? p.dateEntree;
                return d ? new Date(d).toLocaleDateString('fr-FR') : '-';
            },
        },
        {
            key: 'statut',
            header: t('commun.statut'),
            sortable: true,
            className: 'text-center',
            render: (p) => {
                const statuts: any = {
                    ACTIF: { label: 'Actif', color: 'green' },
                    INACTIF: { label: 'Inactif', color: 'gray' },
                    CONGE: { label: 'En congé', color: 'blue' },
                    actif: { label: 'Actif', color: 'green' },
                    inactif: { label: 'Inactif', color: 'gray' },
                    en_conge: { label: 'En congé', color: 'blue' },
                    demission: { label: 'Démission', color: 'red' },
                };
                const s = statuts[p.statut] || statuts.ACTIF;
                return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium bg-${s.color}-100 text-${s.color}-800`}>{s.label}</span>;
            },
        },
        {
            key: 'actions',
            header: t('commun.actions'),
            className: 'text-right',
            renderActions: (p) => [
                {
                    key: 'modifier',
                    icon: Edit,
                    label: t('boutons.modifier'),
                    onClick: () => handleEdition(p),
                    permission: 'personnel:edit',
                },
                {
                    key: 'supprimer',
                    icon: Trash2,
                    label: t('boutons.supprimer'),
                    onClick: () => setEnseignantToDelete(p),
                    permission: 'personnel:delete',
                    variant: 'danger' as const,
                },
            ],
        },
    ];

    if (isLoading) {
        return (
            <div className="p-6">
                <LoadingState message="Chargement des enseignants..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <ErrorState
                    message={error.message || "Impossible de charger les enseignants"}
                    onRetry={() => refetch()}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <motion.div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <div>
                    <h1 className="text-3xl font-bold">Enseignants</h1>
                    <p className="text-sm text-[var(--color-text-secondary)]">{data?.meta?.totalItems || 0} enseignant(s)</p>
                </div>
                {hasPermission('personnel:create') && (
                    <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={handleCreation}>Ajouter un enseignant</ElisaButton>
                )}
            </motion.div>

            <DataTable
                data={data?.items || []}
                columns={colonnes}
                isLoading={isLoading}
                enableReordering
                enablePinning
                enableColumnVisibility
                searchPlaceholder="Rechercher un enseignant..."
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
                <EnseignantFormModal
                    key={modalKey}
                    mode={modeFormulaire}
                    enseignant={enseignantSelected}
                    onSuccess={handleSuccess}
                    onCancel={() => setModalOpen(false)}
                />
            )}

            <ConfirmationModal
                isOpen={!!enseignantToDelete}
                title="Supprimer cet enseignant"
                message={`Êtes-vous sûr de vouloir supprimer ${enseignantToDelete?.utilisateur?.profil?.prenom || enseignantToDelete?.prenom || ''} ${enseignantToDelete?.utilisateur?.profil?.nom || enseignantToDelete?.nom || ''} ?`}
                details="Cette action est irréversible et supprimera toutes les données associées."
                variant="danger"
                onConfirm={async () => {
                    if (enseignantToDelete) {
                        await supprimer.mutateAsync(enseignantToDelete.id);
                        setEnseignantToDelete(null);
                    }
                }}
                onCancel={() => setEnseignantToDelete(null)}
                isLoading={supprimer.isPending}
            />
        </div>
    );
}
