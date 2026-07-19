import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Eye, Building2, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useGroupesEtablissements, useCreerGroupeEtablissement, useModifierGroupeEtablissement, useSupprimerGroupeEtablissement, useEtablissementsDisponibles, useUtilisateursDisponibles, useListerEtablissementsGroupe, useListerAdmins, useTousEtablissementsAssignesIds } from '../hooks/use-groupes-etablissements';
import { GroupeEtablissementFormModal } from './groupe-etablissement-form-modal';
import { GroupeEtablissementDetailModal } from './groupe-etablissement-detail-modal';
import { GestionEtablissementsModal } from './gestion-etablissements-modal';
import { GestionAdminsModal } from './gestion-admins-modal';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { CardGrid } from '@/components/ui/CardGrid';
import { StatCard } from '@/components/ui/StatCard';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { usePermissions } from '@/hooks';
import type { Column } from '@/components/ui/DataTable';
import type { GroupeEtablissement, GroupeEtablissementFiltres } from '../types/groupe-etablissement.types';

export function GroupesEtablissementsPage() {
    const { t } = useTranslation('groupes-etablissements');
    const { hasPermission } = usePermissions();
    const queryClient = useQueryClient();

    const [filtres, setFiltres] = useState<GroupeEtablissementFiltres>({
        page: 1,
        limit: 20,
        recherche: ''
    });
    const [showFormModal, setShowFormModal] = useState(false);
    const [groupeToEdit, setGroupeToEdit] = useState<GroupeEtablissement | null>(null);
    const [groupeToDelete, setGroupeToDelete] = useState<GroupeEtablissement | null>(null);
    const [groupeToView, setGroupeToView] = useState<GroupeEtablissement | null>(null);
    const [groupeToManageEtabs, setGroupeToManageEtabs] = useState<GroupeEtablissement | null>(null);
    const [groupeToManageAdmins, setGroupeToManageAdmins] = useState<GroupeEtablissement | null>(null);

    const { data: dataGroupes, isLoading, isFetching, error, refetch } = useGroupesEtablissements(filtres);
    const { data: dataEtablissements } = useEtablissementsDisponibles();
    const { data: dataUtilisateurs } = useUtilisateursDisponibles();
    const { data: dataEtablissementsAssignes } = useListerEtablissementsGroupe(groupeToManageEtabs?.id || '', !!groupeToManageEtabs);
    const { data: dataAdminsActuels } = useListerAdmins(groupeToManageAdmins?.id || '', !!groupeToManageAdmins);
    const { data: tousEtablissementsAssignesIds } = useTousEtablissementsAssignesIds();

    const creer = useCreerGroupeEtablissement();
    const modifier = useModifierGroupeEtablissement();
    const supprimer = useSupprimerGroupeEtablissement();

    const groupes = dataGroupes?.items || [];
    const etablissementsDisponibles = (dataEtablissements || []).filter(
        e => !tousEtablissementsAssignesIds?.has(e.id)
    );
    const utilisateursDisponibles = dataUtilisateurs || [];
    const etablissementsAssignes = dataEtablissementsAssignes || [];
    const adminsActuels = dataAdminsActuels || [];
    const total = dataGroupes?.meta?.totalItems || 0;
    const actifsCount = groupes.filter((g: GroupeEtablissement) => g.actif).length;

    const colonnes: Column<GroupeEtablissement>[] = [
        {
            key: 'nom',
            pinned: 'left' as const,
            header: t('colonnes.groupe'),
            sortable: true,
            render: (g) => (
                <div>
                    <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-[var(--color-dominante)]" />
                        <span className="font-semibold">{g.nom}</span>
                    </div>
                    {g.description && (
                        <p className="text-xs text-[var(--color-texte-secondaire)] mt-1">{g.description}</p>
                    )}
                </div>
            ),
        },
        {
            key: 'code',
            header: t('colonnes.code'),
            render: (g) => (
                <code className="px-2.5 py-1 bg-[var(--color-surface-50)] dark:bg-[var(--color-surface-200)] border border-[var(--color-dominant-200)] dark:border-[var(--color-dominant-800)] rounded-md text-xs font-mono font-semibold text-[var(--color-dominante)]">
                    {g.code}
                </code>
            ),
        },
        {
            key: 'nbEtablissements',
            header: t('colonnes.etablissements'),
            render: (g) => (
                <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-[var(--color-dominante)]" />
                    <span className="text-sm font-bold text-[var(--color-texte)] dark:text-white tabular-nums">
                        {g.nbEtablissements || 0}
                    </span>
                </div>
            ),
        },
        {
            key: 'actif',
            header: t('colonnes.statut'),
            render: (g) => (
                <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        g.actif
                            ? 'bg-green-50 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
                            : 'bg-gray-50 dark:bg-gray-800/40 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                    }`}
                >
                    {g.actif ? t('champs.actif') : t('champs.inactif')}
                </span>
            ),
        },
        {
            key: 'actions',
            header: t('colonnes.actions'),
            className: 'text-right',
            renderActions: (g) => [
                {
                    key: 'voir',
                    icon: Eye,
                    label: t('boutons.voirDetails'),
                    onClick: () => setGroupeToView(g),
                    variant: 'info' as const,
                },
                {
                    key: 'etablissements',
                    icon: Building2,
                    label: t('boutons.gererEtablissements'),
                    onClick: () => setGroupeToManageEtabs(g),
                    permission: 'groupes-etablissements:edit',
                    variant: 'success' as const,
                },
                {
                    key: 'admins',
                    icon: Users,
                    label: t('boutons.gererAdmins'),
                    onClick: () => setGroupeToManageAdmins(g),
                    permission: 'groupes-etablissements:edit',
                },
                {
                    key: 'modifier',
                    icon: Edit,
                    label: t('boutons.modifier'),
                    onClick: () => { setGroupeToEdit(g); setShowFormModal(true); },
                    permission: 'groupes-etablissements:edit',
                },
                {
                    key: 'supprimer',
                    icon: Trash2,
                    label: t('boutons.supprimer'),
                    onClick: () => setGroupeToDelete(g),
                    permission: 'groupes-etablissements:delete',
                    variant: 'danger' as const,
                },
            ],
        },
    ];

    if (isLoading && groupes.length === 0) {
        return <PageSkeleton showStats showTable />;
    }

    if (error) {
        return (
            <div className="p-6">
                <ErrorMessage
                    title={t('messages.chargement')}
                    message={error.message}
                    onRetry={() => refetch()}
                    retryLabel={t('reessayer')}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <PageHeader
                title={t('titre')}
                subtitle={t('sousTitre')}
                icon={Building2}
                variant="gradient"
                actions={hasPermission('groupes-etablissements:create') ? (
                    <ElisaButton
                        variant="primary"
                        size="sm"
                        icon={<Plus className="h-4 w-4" />}
                        onClick={() => {
                            setGroupeToEdit(null);
                            setShowFormModal(true);
                        }}
                    >
                        {t('boutons.nouveau')}
                    </ElisaButton>
                ) : undefined}
            />

            <CardGrid columns={{ default: 1, sm: 2, lg: 4, xl: 4 }}>
                <StatCard
                    icon={Building2}
                    label={t('indicateurs.total')}
                    value={total}
                    tone="accent"
                    delay={0}
                />
                <StatCard
                    icon={Users}
                    label={t('indicateurs.actifs')}
                    value={actifsCount}
                    tone="success"
                    delay={0.05}
                />
                <StatCard
                    icon={Building2}
                    label={t('indicateurs.inactifs')}
                    value={total - actifsCount}
                    tone="muted"
                    delay={0.1}
                />
                <StatCard
                    icon={Building2}
                    label={t('indicateurs.totalEtablissements')}
                    value={groupes.reduce((sum: number, g: GroupeEtablissement) => sum + (g.nbEtablissements || 0), 0)}
                    tone="purple"
                    delay={0.15}
                />
            </CardGrid>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <DataTable
                    tableId="groupes-etablissements"
                    data={groupes}
                    columns={colonnes}
                    isLoading={isLoading}
                    isFetching={isFetching}
                    enableReordering
                    enablePinning
                    enableColumnVisibility
                    enableCollapsibleFilters
                    filtres={[
                        {
                            key: 'actif',
                            label: t('colonnes.statut'),
                            options: [
                                { value: 'true', label: t('champs.actif') },
                                { value: 'false', label: t('champs.inactif') },
                            ],
                            allOptionLabel: t('tous'),
                        },
                    ]}
                    searchPlaceholder={t('search.placeholder')}
                    onSearchChange={(recherche) =>
                        setFiltres((prev) => ({ ...prev, recherche, page: 1 }))
                    }
                    onFilterChange={(key, valeur) => {
                        if (key === 'actif') {
                            setFiltres((prev) => ({ ...prev, actif: valeur === 'true' ? true : valeur === 'false' ? false : undefined, page: 1 }));
                        }
                    }}
                    onClearFilters={() => setFiltres((prev) => ({ ...prev, actif: undefined, page: 1 }))}
                    disableClientSearch
                    pagination={dataGroupes?.meta ? {
                        page: dataGroupes.meta.currentPage,
                        limit: dataGroupes.meta.itemsPerPage,
                        total: dataGroupes.meta.totalItems,
                        totalPages: dataGroupes.meta.totalPages,
                        hasNext: dataGroupes.meta.currentPage < dataGroupes.meta.totalPages,
                        hasPrev: dataGroupes.meta.currentPage > 1,
                    } : undefined}
                    onPageChange={(page) => setFiltres((prev) => ({ ...prev, page }))}
                    onLimitChange={(limit) => setFiltres((prev) => ({ ...prev, limit, page: 1 }))}
                    emptyMessage={t('messages.aucunGroupe')}
                    aria-label={t('titre')}
                />
            </motion.div>

            {showFormModal && (
                <GroupeEtablissementFormModal
                    open={showFormModal}
                    groupe={groupeToEdit}
                    onOpenChange={(open) => {
                        if (!open) { setShowFormModal(false); setGroupeToEdit(null); }
                    }}
                    onSubmit={async (dto) => {
                        if (groupeToEdit) {
                            await modifier.mutateAsync({ id: groupeToEdit.id, ...dto });
                        } else {
                            await creer.mutateAsync(dto);
                        }
                    }}
                />
            )}

            <ConfirmDialog
                open={!!groupeToDelete}
                onOpenChange={(open) => { if (!open) setGroupeToDelete(null); }}
                onConfirm={async () => {
                    if (groupeToDelete) {
                        await supprimer.mutateAsync(groupeToDelete.id);
                        setGroupeToDelete(null);
                    }
                }}
                title={t('confirmation.titreSuppression')}
                description={t('confirmation.messageSuppression', { nom: groupeToDelete?.nom })}
                confirmText={t('confirmation.confirmText')}
                variant="danger"
                isLoading={supprimer.isPending}
            />

            {groupeToView && (
                <GroupeEtablissementDetailModal
                    open={!!groupeToView}
                    onOpenChange={(open) => { if (!open) setGroupeToView(null); }}
                    groupe={groupeToView}
                />
            )}

            {groupeToManageEtabs && (
                <GestionEtablissementsModal
                    open={!!groupeToManageEtabs}
                    onOpenChange={(open) => { if (!open) setGroupeToManageEtabs(null); }}
                    groupe={groupeToManageEtabs}
                    etablissementsDisponibles={etablissementsDisponibles}
                    etablissementsAssignes={etablissementsAssignes}
                    onRefresh={() => {
                        queryClient.invalidateQueries({
                            queryKey: ['groupes-etablissements', groupeToManageEtabs?.id, 'etablissements']
                        });
                    }}
                />
            )}

            {groupeToManageAdmins && (
                <GestionAdminsModal
                    open={!!groupeToManageAdmins}
                    onOpenChange={(open) => { if (!open) setGroupeToManageAdmins(null); }}
                    groupe={groupeToManageAdmins}
                    utilisateursDisponibles={utilisateursDisponibles}
                    adminsActuels={adminsActuels}
                    onRefresh={() => {
                        queryClient.invalidateQueries({
                            queryKey: ['groupes-etablissements', groupeToManageAdmins?.id, 'admins']
                        });
                    }}
                />
            )}
        </div>
    );
}
