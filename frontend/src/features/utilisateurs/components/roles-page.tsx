/**
 * ==================================
 * eLISAschool - Page Gestion des Rôles
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * Page complète de gestion des rôles et permissions
 */

import { useState, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { 
    Plus, Shield, Users, Edit, Trash2, Lock, Unlock, 
    Eye,
} from 'lucide-react';
import { useRoles, useSupprimerRole, useStatsRoles } from '../hooks/use-roles-permissions';
import { DataTable } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { RoleFormModal } from './role-form-modal';
import { usePermissions } from '@/hooks';
import type { Role, RoleFiltres } from '../types/utilisateur.types';
import type { Column } from '@/components/ui/DataTable';

export function RolesPage() {
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const [filtres, setFiltres] = useState<RoleFiltres>({ page: 1, limit: 50 });
    const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
    const [showFormModal, setShowFormModal] = useState(false);
    const [roleToEdit, setRoleToEdit] = useState<Role | null>(null);
    const [filtreType] = useState<'all' | 'systeme' | 'personnalise'>('all');

    const { data, isLoading, isFetching, error, refetch } = useRoles(filtres);
    const { data: statsApi } = useStatsRoles();
    const supprimer = useSupprimerRole();

    // Calculer les stats depuis la liste des rôles (fallback si l'API stats échoue)
    const statsCalculees = useMemo(() => {
        if (!data || data.length === 0) {
            return {
                totalRoles: 0,
                rolesSysteme: 0,
                rolesPersonnalises: 0,
            };
        }

        return {
            totalRoles: data.length,
            rolesSysteme: data.filter(r => r.estSysteme).length,
            rolesPersonnalises: data.filter(r => !r.estSysteme).length,
        };
    }, [data]);

    // Utiliser les stats de l'API si disponibles, sinon utiliser les stats calculées
    const stats = statsApi?.totalRoles ? statsApi : statsCalculees;

    // Filtrage côté client selon le type
    const dataFiltree = data?.filter(role => {
        if (filtreType === 'systeme') return role.estSysteme;
        if (filtreType === 'personnalise') return !role.estSysteme;
        return true;
    }) || [];

    const colonnes: Column<Role>[] = [
        {
            key: 'role',
            header: 'Rôle',
            sortable: true,
            render: (r) => (
                <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        r.estSysteme ? 'bg-blue-100' : 'bg-purple-100'
                    }`}>
                        <Shield className={`h-5 w-5 ${
                            r.estSysteme ? 'text-blue-600' : 'text-purple-600'
                        }`} />
                    </div>
                    <div>
                            <div className="flex items-center gap-2">
                                <p className="font-medium text-gray-900 dark:text-gray-200">{r.libelle}</p>
                            {r.estSysteme && (
                                <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                                    <Lock className="h-3 w-3 mr-1" />
                                    Système
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{r.code}</p>
                        {r.description && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{r.description}</p>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: 'permissions',
            header: 'Permissions',
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
            header: 'Utilisateurs',
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
            header: 'Actions',
            className: 'text-right',
            renderActions: (r) => [
                {
                    key: 'permissions',
                    icon: Eye,
                    label: 'Détail',
                    onClick: () => navigate({ to: '/admin/roles/$id', params: { id: r.id } }),
                },
                {
                    key: 'modifier',
                    icon: Edit,
                    label: 'Modifier',
                    onClick: () => {
                        setRoleToEdit(r);
                        setShowFormModal(true);
                    },
                    permission: 'roles:edit',
                    hidden: r.estSysteme,
                },
                {
                    key: 'supprimer',
                    icon: Trash2,
                    label: 'Supprimer',
                    onClick: () => setRoleToDelete(r),
                    permission: 'roles:delete',
                    variant: 'danger' as const,
                    hidden: r.estSysteme,
                },
            ],
        },
    ];

    // Stats cards
    const statsCards = [
        {
            titre: 'Total Rôles',
            valeur: stats?.totalRoles || 0,
            icone: Shield,
            couleur: 'blue',
        },
        {
            titre: 'Rôles Système',
            valeur: stats?.rolesSysteme || 0,
            icone: Lock,
            couleur: 'green',
        },
        {
            titre: 'Rôles Personnalisés',
            valeur: stats?.rolesPersonnalises || 0,
            icone: Unlock,
            couleur: 'purple',
        },
    ];

    // Affichage skeleton au premier chargement uniquement
    if (isLoading && !data) {
        return <PageSkeleton showStats showTable />;
    }

    // Affichage erreur
    if (error) {
        return (
            <div className="p-6">
                <ErrorMessage
                    title="Erreur de chargement"
                    message={error.message || "Impossible de charger les rôles"}
                    onRetry={() => refetch()}
                    retryLabel="Réessayer"
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
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-200">Gestion des Rôles</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Gérez les rôles et permissions du système</p>
                </div>
                {hasPermission('roles:create') && (
                    <ElisaButton 
                        variant="primary" 
                        size="sm" 
                        icon={<Plus className="h-4 w-4" />}
                        onClick={() => {
                            setRoleToEdit(null);
                            setShowFormModal(true);
                        }}
                    >
                        Nouveau rôle
                    </ElisaButton>
                )}
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
                            <div className={`p-3 rounded-full bg-${stat.couleur}-100`}>
                                <stat.icone className={`h-6 w-6 text-${stat.couleur}-600`} />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Tableau */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <DataTable
                    tableId="roles-list"
                    data={dataFiltree}
                    columns={colonnes}
                    isLoading={isLoading}
                isFetching={isFetching}
                enableReordering
                enablePinning
                enableColumnVisibility
                    searchPlaceholder="Rechercher un rôle..."
                    onSearchChange={(recherche) =>
                        setFiltres((prev) => ({ ...prev, recherche, page: 1 }))
                    }
                    disableClientSearch
                    emptyMessage="Aucun rôle trouvé"
                />
            </motion.div>

            {/* Modal Confirmation Suppression */}
            <ConfirmationModal
                isOpen={!!roleToDelete}
                title="Supprimer ce rôle"
                message={`Êtes-vous sûr de vouloir supprimer le rôle "${roleToDelete?.libelle}" ?`}
                details={`Ce rôle est actuellement attribué à ${roleToDelete?.nbUtilisateurs || 0} utilisateur(s). La suppression peut affecter leurs accès.`}
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

            {/* Modal Formulaire Création/Modification */}
            {showFormModal && (
                <RoleFormModal
                    role={roleToEdit}
                    onClose={() => {
                        setShowFormModal(false);
                        setRoleToEdit(null);
                    }}
                />
            )}

        </div>
    );
}
