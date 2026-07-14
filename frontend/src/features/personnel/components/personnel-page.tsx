/**
 * ==================================
 * eLISAschool - Page Personnel
 * ==================================
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2, Eye, Users } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { usePersonnel, useSupprimerPersonnel } from '../hooks/use-personnel';
import { useTypesPersonnel } from '../hooks/use-types-personnel';
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
    const { data: typesData } = useTypesPersonnel();
    const typeOptions = (typesData || []).map((tp: any) => ({ value: tp.id, label: `${tp.nom} (${tp.code})` }));
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
                const prenom = p.utilisateur?.profil?.prenom ?? '';
                const nom = p.utilisateur?.profil?.nom ?? '';
                const email = p.utilisateur?.email ?? '';
                const tel = p.utilisateur?.profil?.telephone ?? '';
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
            <PageHeader
                title={t('personnel.titre', { defaultValue: 'Personnel' })}
                subtitle={`${data?.meta?.totalItems || 0} membre(s)`}
                icon={Users}
                variant="gradient"
                actions={hasPermission('personnel:create') ? (
                    <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />}
                        onClick={handleCreation}>{t('boutons.nouveau')}</ElisaButton>
                ) : undefined}
            />

            {/* Filtre par type de personnel */}
            <div className="flex items-center gap-3">
                <div className="relative w-64">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                        value={filtres.typePersonnelId || ''}
                        onChange={(e) => setFiltres((prev) => ({ ...prev, typePersonnelId: e.target.value || undefined, page: 1 }))}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 appearance-none cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">Tous les types</option>
                        {typeOptions.map((opt: { value: string; label: string }) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            </div>

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
                message={`Êtes-vous sûr de vouloir supprimer ${membreToDelete?.utilisateur?.profil?.prenom || ''} ${membreToDelete?.utilisateur?.profil?.nom || ''} ?`}
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
