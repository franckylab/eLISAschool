/**
 * ==================================
 * eLISAschool - Page Personnel
 * ==================================
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { usePersonnel, useSupprimerPersonnel } from '../hooks/use-personnel';
import { PersonnelFormModal } from './personnel-form-modal';
import { DataTable } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { LoadingState, ErrorState } from '@/components/feedback';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { usePermissions } from '@/hooks';
import type { MembrePersonnel, PersonnelFiltres } from '../types/personnel.types';
import type { Column } from '@/components/ui/DataTable';

export function PersonnelPage() {
    const { t } = useTranslation();
    const { hasPermission } = usePermissions();
    const [filtres, setFiltres] = useState<PersonnelFiltres>({ page: 1, limit: 20 });
    const [modalOpen, setModalOpen] = useState(false);
    const [membreSelected, setMembreSelected] = useState<MembrePersonnel | undefined>();
    const [modeFormulaire, setModeFormulaire] = useState<'creation' | 'edition'>('creation');
    const [modalKey, setModalKey] = useState(0);
    const [membreToDelete, setMembreToDelete] = useState<MembrePersonnel | null>(null);

    const { data, isLoading, error, refetch } = usePersonnel(filtres);
    const supprimer = useSupprimerPersonnel();

    const handleCreation = () => {
        setModeFormulaire('creation');
        setMembreSelected(undefined);
        setModalKey(k => k + 1);
        setModalOpen(true);
    };

    const handleEdition = (membre: MembrePersonnel) => {
        setModeFormulaire('edition');
        setMembreSelected(membre);
        setModalKey(k => k + 1);
        setModalOpen(true);
    };

    const handleSuccess = () => {
        setModalOpen(false);
        setMembreSelected(undefined);
    };

    const colonnes: Column<MembrePersonnel>[] = [
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
                        onClick={() => window.location.href = `/personnel/${p.id}`}
                        className="hover:underline cursor-pointer text-left"
                    >
                        <div>
                            <p className="font-medium">{prenom} {nom}</p>
                            <p className="text-xs text-[var(--color-text-muted)]">{email || tel || '-'}</p>
                        </div>
                    </button>
                );
            },
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
                    key: 'voir',
                    icon: Eye,
                    label: 'Voir détails',
                    onClick: () => window.location.href = `/personnel/${p.id}`,
                    variant: 'info' as const,
                },
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
                    onClick: () => setMembreToDelete(p),
                    permission: 'personnel:delete',
                    variant: 'danger' as const,
                },
            ],
        },
    ];

    // Affichage loading pendant le chargement
    if (isLoading) {
        return (
            <div className="p-6">
                <LoadingState message="Chargement du personnel..." />
            </div>
        );
    }

    // Affichage message d'erreur
    if (error) {
        return (
            <div className="p-6">
                <ErrorState
                    message={error.message || "Impossible de charger les données du personnel"}
                    onRetry={() => refetch()}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <motion.div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <div>
                    <h1 className="text-3xl font-bold">{t('personnel.titre', { defaultValue: 'Personnel' })}</h1>
                    <p className="text-sm text-[var(--color-text-secondary)]">{data?.meta?.totalItems || 0} membre(s)</p>
                </div>
                {hasPermission('personnel:create') && (
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
                <PersonnelFormModal
                    key={modalKey}
                    mode={modeFormulaire}
                    membre={membreSelected}
                    onSuccess={handleSuccess}
                    onCancel={() => setModalOpen(false)}
                />
            )}

            <ConfirmationModal
                isOpen={!!membreToDelete}
                title="Supprimer ce membre du personnel"
                message={`Êtes-vous sûr de vouloir supprimer ${membreToDelete?.utilisateur?.profil?.prenom || membreToDelete?.prenom || ''} ${membreToDelete?.utilisateur?.profil?.nom || membreToDelete?.nom || ''} ?`}
                details="Cette action est irréversible et supprimera toutes les données associées."
                variant="danger"
                onConfirm={async () => {
                    if (membreToDelete) {
                        await supprimer.mutateAsync(membreToDelete.id);
                        setMembreToDelete(null);
                    }
                }}
                onCancel={() => setMembreToDelete(null)}
                isLoading={supprimer.isPending}
            />
        </div>
    );
}
