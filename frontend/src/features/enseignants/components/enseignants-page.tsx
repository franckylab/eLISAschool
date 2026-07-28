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

const STATUT_CLASSES: Record<string, string> = {
    ACTIF: 'bg-success/10 text-success',
    actif: 'bg-success/10 text-success',
    INACTIF: 'bg-muted text-muted-foreground',
    inactif: 'bg-muted text-muted-foreground',
    CONGE: 'bg-primary/10 text-primary',
    en_conge: 'bg-primary/10 text-primary',
    demission: 'bg-destructive/10 text-destructive',
};

const STATUT_LABELS: Record<string, string> = {
    ACTIF: 'statuts.actif',
    actif: 'statuts.actif',
    INACTIF: 'statuts.inactif',
    inactif: 'statuts.inactif',
    CONGE: 'statuts.en_conge',
    en_conge: 'statuts.en_conge',
    demission: 'statuts.demission',
};

export function EnseignantsPage() {
    const { t } = useTranslation(['personnel', 'common']);
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const [filtres, setFiltres] = useState<EnseignantFiltres>({ page: 1, limit: 20 });
    const [modalOpen, setModalOpen] = useState(false);
    const [enseignantSelected, setEnseignantSelected] = useState<Enseignant | undefined>();
    const [modeFormulaire, setModeFormulaire] = useState<'creation' | 'edition'>('creation');
    const [modalKey, setModalKey] = useState(0);
    const [enseignantToDelete, setEnseignantToDelete] = useState<Enseignant | null>(null);

    const { data, isLoading, isFetching, error, refetch } = useListeEnseignants(filtres);
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
            header: t('liste.colMatricule'),
            sortable: true,
            render: (p) => <span className="font-mono text-sm font-medium text-primary">{p.matricule}</span>,
        },
        {
            key: 'nomComplet',
            header: t('commun.nom'),
            sortable: true,
            render: (p) => {
                const prenom = p.utilisateur?.profil?.prenom ?? '';
                const nom = p.utilisateur?.profil?.nom ?? '';
                const email = p.utilisateur?.email ?? '';
                const tel = p.utilisateur?.profil?.telephone ?? '';
                return (
                    <button
                        onClick={() => navigate({ to: '/enseignants/$id', params: { id: p.id } })}
                        className="hover:underline cursor-pointer text-left"
                    >
                        <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4 text-primary" />
                            <div>
                                <p className="font-medium">{prenom} {nom}</p>
                                <p className="text-xs text-muted-foreground">{email || tel || '-'}</p>
                            </div>
                        </div>
                    </button>
                );
            },
        },
        {
            key: 'specialite',
            header: t('liste.colSpecialite'),
            sortable: true,
            render: (p) => (
                <span className="text-sm">{p.specialites?.[0] ?? '-'}</span>
            ),
        },
        {
            key: 'dateEntree',
            header: t('liste.colDateEntree'),
            sortable: true,
            render: (p) => {
                const d = p.dateEmbauche;
                return d ? new Date(d).toLocaleDateString('fr-FR') : '-';
            },
        },
        {
            key: 'statut',
            header: t('commun.statut'),
            sortable: true,
            className: 'text-center',
            render: (p) => {
                const classes = STATUT_CLASSES[p.statut] ?? STATUT_CLASSES.ACTIF;
                const labelKey = STATUT_LABELS[p.statut] ?? 'statuts.actif';
                return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${classes}`}>{t(labelKey)}</span>;
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

    if (isLoading && !data) {
        return (
            <div className="p-6">
                <LoadingState message={t('liste.chargement')} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <ErrorState
                    message={error.message || t('liste.erreurChargement')}
                    onRetry={() => refetch()}
                />
            </div>
        );
    }

    const totalEnseignants = data?.meta?.totalItems || 0;

    return (
        <div className="flex flex-col gap-6 p-6">
            <motion.div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <div>
                    <h1 className="text-3xl font-bold">{t('liste.titre')}</h1>
                    <p className="text-sm text-secondary">{t('liste.enseignantCount', { count: totalEnseignants })}</p>
                </div>
                {hasPermission('personnel:create') && (
                    <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={handleCreation}>{t('liste.ajouter')}</ElisaButton>
                )}
            </motion.div>

            <DataTable
                tableId="enseignants"
                data={data?.items || []}
                columns={colonnes}
                isLoading={isLoading}
                isFetching={isFetching}
                enableReordering
                enablePinning
                enableColumnVisibility
                searchPlaceholder={t('liste.rechercher')}
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
                title={t('liste.titreSuppression')}
                message={t('liste.confirmSuppression', { nom: `${enseignantToDelete?.utilisateur?.profil?.prenom || ''} ${enseignantToDelete?.utilisateur?.profil?.nom || ''}`.trim() })}
                details={t('liste.confirmSuppressionDetails')}
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
