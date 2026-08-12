/**
 * ==================================
 * eLISAschool - Page Rôles Plateforme
 * ==================================
 * Version: 3.0.0 — Refactorisation plateforme
 * Auteur: franck arlos chendjou
 *
 * Page complète de gestion des rôles et permissions plateforme.
 * Pattern aligné sur roles-page.tsx (tenant).
 *
 * ADR-005 — Auth unifiée (source unique de vérité)
 */

import { useState, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import {
    Plus, Shield, Users, Edit, Trash2, Lock, Unlock, Eye, Filter, Globe, Building2, Copy,
} from 'lucide-react';
import {
    usePlatformRoles,
    useStatsRolesPlateforme,
    useSupprimerRolePlateforme,
    useCreatePlatformRole,
    useModifierRolePlateforme,
    useDupliquerRolePlateforme,
    type PlatformRole,
    type PlatformRoleFiltres,
} from '../hooks/use-platform-roles';
import { DataTable } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { CustomModal } from '@/components/modals/CustomModal';
import { RoleEditModal } from './role-edit-modal';
import { useTranslation } from 'react-i18next';
import type { Column } from '@/components/ui/DataTable';

export function PlatformRolesPage() {
    const navigate = useNavigate();
    const { t } = useTranslation('admin');
    const [filtres, setFiltres] = useState<PlatformRoleFiltres>({});
    const [roleToDelete, setRoleToDelete] = useState<PlatformRole | null>(null);
    const [roleToDuplicate, setRoleToDuplicate] = useState<PlatformRole | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');
    const [newRoleDesc, setNewRoleDesc] = useState('');
    const [filtreType, setFiltreType] = useState<'all' | 'systeme' | 'personnalise'>('all');

    const [roleToEdit, setRoleToEdit] = useState<PlatformRole | null>(null);

    const { data: roles, isLoading, isFetching, error, refetch } = usePlatformRoles(filtres);
    const { data: stats } = useStatsRolesPlateforme();
    const supprimer = useSupprimerRolePlateforme();
    const creer = useCreatePlatformRole();
    const modifier = useModifierRolePlateforme();
    const dupliquer = useDupliquerRolePlateforme();

    // Filtrage côté client selon le type
    const dataFiltree = useMemo(() => {
        if (!roles) return [];
        if (filtreType === 'systeme') return roles.filter(r => r.estSysteme);
        if (filtreType === 'personnalise') return roles.filter(r => !r.estSysteme);
        return roles;
    }, [roles, filtreType]);

    const colonnes: Column<PlatformRole>[] = [
        {
            key: 'role',
            header: t('platformRoles.nom', 'Rôle'),
            sortable: true,
            render: (r) => (
                <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        r.estSysteme ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-purple-100 dark:bg-purple-900/30'
                    }`}>
                        <Shield className={`h-5 w-5 ${
                            r.estSysteme ? 'text-blue-600 dark:text-blue-400' : 'text-purple-600 dark:text-purple-400'
                        }`} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 dark:text-gray-200">
                                {r.libelle || r.nom}
                            </p>
                            {r.estSysteme && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 text-xs font-medium text-blue-800 dark:text-blue-300">
                                    <Lock className="h-3 w-3 mr-1" />
                                    {t('platformRoles.systeme', 'Système')}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{r.code || r.nom}</p>
                        {r.description && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{r.description}</p>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: 'scope',
            header: t('platformRoles.scope', 'Scope'),
            sortable: true,
            className: 'text-center',
            render: (r) => {
                const scope = r.scope || 'tenant';
                return scope === 'plateforme' ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/30 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:text-blue-300">
                        <Globe className="h-3 w-3" />
                        Plateforme
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:text-emerald-300">
                        <Building2 className="h-3 w-3" />
                        Tenant
                    </span>
                );
            },
        },
        {
            key: 'permissions',
            header: t('platformRoles.permissions', 'Permissions'),
            sortable: false,
            className: 'text-center',
            render: (r) => (
                <div className="flex flex-col items-center gap-1">
                    <span className="text-2xl font-bold text-[var(--color-dominant-600)]">
                        {r.permissions?.length || 0}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">permissions</span>
                </div>
            ),
        },
        {
            key: 'utilisateurs',
            header: t('platformRoles.utilisateurs', 'Utilisateurs'),
            sortable: true,
            className: 'text-center',
            render: (r) => (
                <div className="flex items-center justify-center gap-2">
                    <Users className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-200">
                        {r.nbUtilisateurs || 0}
                    </span>
                </div>
            ),
        },
        {
            key: 'actions',
            header: t('platformRoles.actions', 'Actions'),
            className: 'text-right',
            renderActions: (r) => [
                {
                    key: 'permissions',
                    icon: Eye,
                    label: t('platformRoles.detail', 'Détail'),
                    onClick: () => navigate({ to: '/platform/roles/$id', params: { id: r.id }, search: { tab: 'permissions' } as any }),
                },
                {
                    key: 'dupliquer',
                    icon: Copy,
                    label: t('platformRoles.dupliquer', 'Dupliquer'),
                    onClick: () => setRoleToDuplicate(r),
                },
                {
                    key: 'modifier',
                    icon: Edit,
                    label: t('platformRoles.modifier', 'Modifier'),
                    onClick: () => setRoleToEdit(r),
                    hidden: r.estSysteme,
                },
                {
                    key: 'supprimer',
                    icon: Trash2,
                    label: t('platformRoles.supprimer', 'Supprimer'),
                    onClick: () => setRoleToDelete(r),
                    variant: 'danger' as const,
                    hidden: r.estSysteme,
                },
            ],
        },
    ];

    // Stats cards
    const statsCards = [
        {
            titre: t('platformRoles.totalRoles', 'Total Rôles'),
            valeur: stats?.totalRoles || 0,
            icone: Shield,
            couleur: 'blue',
        },
        {
            titre: t('platformRoles.rolesSysteme', 'Rôles Système'),
            valeur: stats?.rolesSysteme || 0,
            icone: Lock,
            couleur: 'green',
        },
        {
            titre: t('platformRoles.rolesPersonnalises', 'Rôles Personnalisés'),
            valeur: stats?.rolesPersonnalises || 0,
            icone: Unlock,
            couleur: 'purple',
        },
    ];

    if (isLoading && !roles) {
        return <PageSkeleton showStats showTable />;
    }

    if (error) {
        return (
            <div className="p-6">
                <ErrorMessage
                    title={t('platformRoles.erreurChargement', 'Erreur de chargement')}
                    message={error.message || t('platformRoles.impossibleCharger', 'Impossible de charger les rôles')}
                    onRetry={() => refetch()}
                    retryLabel={t('platformRoles.reessayer', 'Réessayer')}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* Header */}
            <motion.div
                className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-200">
                        {t('platformRoles.titre', 'Rôles & Permissions')}
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        {t('platformRoles.description', 'Gérez les rôles et permissions du Control Plane')}
                    </p>
                </div>
                <ElisaButton
                    variant="primary"
                    size="sm"
                    icon={<Plus className="h-4 w-4" />}
                    onClick={() => setShowCreateModal(true)}
                >
                    {t('platformRoles.creerRole', 'Nouveau rôle')}
                </ElisaButton>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {statsCards.map((stat, index) => (
                    <motion.div
                        key={stat.titre}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-300">{stat.titre}</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-gray-200 mt-2">{stat.valeur}</p>
                            </div>
                            <div className={`p-3 rounded-full bg-${stat.couleur}-100 dark:bg-${stat.couleur}-900/30`}>
                                <stat.icone className={`h-6 w-6 text-${stat.couleur}-600 dark:text-${stat.couleur}-400`} />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Filtres */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3"
            >
                <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />

                {/* Filtre Scope */}
                <select
                    value={filtres.scope || 'tous'}
                    onChange={(e) => setFiltres(prev => ({ ...prev, scope: e.target.value as 'plateforme' | 'tenant' | 'tous' }))}
                    className="h-8 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 text-sm text-gray-700 dark:text-gray-200"
                >
                    <option value="tous">Tous les scopes</option>
                    <option value="plateforme">Plateforme</option>
                    <option value="tenant">Tenant</option>
                </select>

                {/* Filtre Type */}
                <select
                    value={filtreType}
                    onChange={(e) => setFiltreType(e.target.value as 'all' | 'systeme' | 'personnalise')}
                    className="h-8 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 text-sm text-gray-700 dark:text-gray-200"
                >
                    <option value="all">Tous les types</option>
                    <option value="systeme">Système</option>
                    <option value="personnalise">Personnalisé</option>
                </select>

                {/* Reset */}
                {(filtres.scope || filtreType !== 'all') && (
                    <button
                        onClick={() => setFiltres({})}
                        className="h-8 rounded-lg px-3 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        Réinitialiser
                    </button>
                )}
            </motion.div>

            {/* Tableau */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <DataTable
                    tableId="platform-roles-list"
                    data={dataFiltree}
                    columns={colonnes}
                    isLoading={isLoading}
                    isFetching={isFetching}
                    enableReordering
                    enablePinning
                    enableColumnVisibility
                    searchPlaceholder={t('platformRoles.rechercher', 'Rechercher un rôle...')}
                    onSearchChange={(recherche) =>
                        setFiltres((prev) => ({ ...prev, recherche: recherche || undefined }))
                    }
                    disableClientSearch
                    emptyMessage={t('platformRoles.aucunRole', 'Aucun rôle trouvé')}
                />
            </motion.div>

            {/* Modal Confirmation Suppression */}
            <ConfirmationModal
                isOpen={!!roleToDelete}
                title={t('platformRoles.supprimerTitre', 'Supprimer ce rôle')}
                message={t('platformRoles.supprimerMessage', `Êtes-vous sûr de vouloir supprimer le rôle "${roleToDelete?.nom}" ?`)}
                details={t('platformRoles.supprimerDetails', `Ce rôle est actuellement attribué à ${roleToDelete?.nbUtilisateurs || 0} utilisateur(s).`)}
                variant="danger"
                onConfirm={async () => {
                    if (roleToDelete) {
                        await supprimer.mutateAsync(roleToDelete.id);
                        setRoleToDelete(null);
                    }
                }}
                onCancel={() => setRoleToDelete(null)}
                isLoading={supprimer.isPending}
            />

            {/* Modal Confirmation Duplication */}
            <ConfirmationModal
                isOpen={!!roleToDuplicate}
                title={t('platformRoles.dupliquerTitre', 'Dupliquer ce rôle')}
                message={`Créer une copie de "${roleToDuplicate?.libelle || roleToDuplicate?.nom}" ?`}
                details="Le nouveau rôle aura les mêmes permissions. Vous pourrez ensuite le modifier."
                variant="info"
                confirmLabel="Dupliquer"
                onConfirm={async () => {
                    if (roleToDuplicate) {
                        await dupliquer.mutateAsync({ id: roleToDuplicate.id });
                        setRoleToDuplicate(null);
                    }
                }}
                onCancel={() => setRoleToDuplicate(null)}
                isLoading={dupliquer.isPending}
            />

            {/* Modal Création */}
            <CustomModal
                open={showCreateModal}
                onOpenChange={setShowCreateModal}
                title={t('platformRoles.nouveauRole', 'Nouveau rôle personnalisé')}
                footer={
                    <div className="flex justify-end gap-2">
                        <ElisaButton
                            variant="ghost"
                            size="sm"
                            onClick={() => { setShowCreateModal(false); setNewRoleName(''); setNewRoleDesc(''); }}
                        >
                            {t('platformRoles.annuler', 'Annuler')}
                        </ElisaButton>
                        <ElisaButton
                            variant="primary"
                            size="sm"
                            chargement={creer.isPending}
                            disabled={!newRoleName.trim()}
                            onClick={() => {
                                creer.mutate(
                                    { nom: newRoleName.trim(), description: newRoleDesc.trim() || undefined },
                                    { onSuccess: () => { setShowCreateModal(false); setNewRoleName(''); setNewRoleDesc(''); } },
                                );
                            }}
                        >
                            {t('platformRoles.creer', 'Créer')}
                        </ElisaButton>
                    </div>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('platformRoles.nomRole', 'Nom du rôle')}
                        </label>
                        <input
                            type="text"
                            value={newRoleName}
                            onChange={(e) => setNewRoleName(e.target.value)}
                            className="h-9 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 text-sm"
                            placeholder="Ex: GESTIONNAIRE_CONTENU"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('platformRoles.descriptionRole', 'Description')}
                        </label>
                        <input
                            type="text"
                            value={newRoleDesc}
                            onChange={(e) => setNewRoleDesc(e.target.value)}
                            className="h-9 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 text-sm"
                            placeholder="Ex: Gestion du contenu pédagogique"
                        />
                    </div>
                </div>
            </CustomModal>

            {/* Modal Édition rôle */}
            {roleToEdit && (
                <RoleEditModal
                    role={roleToEdit}
                    onClose={() => setRoleToEdit(null)}
                    modifier={modifier}
                />
            )}
        </div>
    );
}

export default PlatformRolesPage;
