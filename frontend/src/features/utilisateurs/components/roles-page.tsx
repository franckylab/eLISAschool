/**
 * ==================================
 * eLISAschool - Page Gestion des Rôles
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * Page complète de gestion des rôles et permissions
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
    Plus, Search, Shield, Users, Edit, Trash2, Lock, Unlock, 
    CheckSquare, Square, Eye, AlertTriangle 
} from 'lucide-react';
import { useRoles, useSupprimerRole, useStatsRoles } from '../hooks/use-roles-permissions';
import { DataTable } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { usePermissions } from '@/hooks';
import type { Role, RoleFiltres } from '../types/utilisateur.types';
import type { Column } from '@/components/ui/DataTable';

export function RolesPage() {
    const { hasPermission } = usePermissions();
    const [filtres, setFiltres] = useState<RoleFiltres>({ page: 1, limit: 50 });
    const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [showPermissions, setShowPermissions] = useState(false);

    const { data, isLoading, error, refetch } = useRoles(filtres);
    const { data: stats } = useStatsRoles();
    const supprimer = useSupprimerRole();

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
                            <p className="font-medium text-gray-900">{r.nom}</p>
                            {r.estSysteme && (
                                <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                                    <Lock className="h-3 w-3 mr-1" />
                                    Système
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-gray-500">{r.code}</p>
                        {r.description && (
                            <p className="text-xs text-gray-400 mt-1">{r.description}</p>
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
                    <span className="text-xs text-gray-500">permissions</span>
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
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">
                        {r.nbUtilisateurs || 0}
                    </span>
                </div>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            className: 'text-right',
            render: (r) => (
                <div className="flex justify-end gap-2">
                    <ElisaButton
                        variant="outline"
                        size="sm"
                        icon={<Eye className="h-4 w-4" />}
                        onClick={() => {
                            setSelectedRole(r);
                            setShowPermissions(true);
                        }}
                    >
                        Permissions
                    </ElisaButton>
                    {!r.estSysteme && hasPermission('roles:edit') && (
                        <ElisaButton
                            variant="outline"
                            size="sm"
                            icon={<Edit className="h-4 w-4" />}
                        >
                            Modifier
                        </ElisaButton>
                    )}
                    {!r.estSysteme && hasPermission('roles:delete') && (
                        <ElisaButton
                            variant="danger"
                            size="sm"
                            icon={<Trash2 className="h-4 w-4" />}
                            isLoading={supprimer.isPending}
                            onClick={() => setRoleToDelete(r)}
                        >
                            Supprimer
                        </ElisaButton>
                    )}
                </div>
            ),
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

    // Affichage skeleton
    if (isLoading) {
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
                    <h1 className="text-3xl font-bold text-gray-900">Gestion des Rôles</h1>
                    <p className="text-sm text-gray-600">Gérez les rôles et permissions du système</p>
                </div>
                {hasPermission('roles:create') && (
                    <ElisaButton 
                        variant="primary" 
                        size="sm" 
                        icon={<Plus className="h-4 w-4" />}
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
                        className="bg-white rounded-lg border border-gray-200 p-6"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">{stat.titre}</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.valeur}</p>
                            </div>
                            <div className={`p-3 rounded-full bg-${stat.couleur}-100`}>
                                <stat.icone className={`h-6 w-6 text-${stat.couleur}-600`} />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Barre de recherche */}
            <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="relative"
            >
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Rechercher un rôle..." 
                    className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-[var(--color-dominant-500)] focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)]/20"
                    value={filtres.recherche || ''} 
                    onChange={(e) => setFiltres((prev) => ({ ...prev, recherche: e.target.value, page: 1 }))} 
                />
            </motion.div>

            {/* Tableau */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <DataTable
                    data={data?.items || []}
                    columns={colonnes}
                    isLoading={isLoading}
                    emptyMessage="Aucun rôle trouvé"
                />
            </motion.div>

            {/* Modal Confirmation Suppression */}
            <ConfirmationModal
                isOpen={!!roleToDelete}
                title="Supprimer ce rôle"
                message={`Êtes-vous sûr de vouloir supprimer le rôle "${roleToDelete?.nom}" ?`}
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

            {/* Modal Permissions (à implémenter) */}
            {showPermissions && selectedRole && (
                <RolePermissionsModal
                    role={selectedRole}
                    onClose={() => {
                        setShowPermissions(false);
                        setSelectedRole(null);
                    }}
                />
            )}
        </div>
    );
}

// Modal de visualisation des permissions d'un rôle
function RolePermissionsModal({ role, onClose }: { role: Role; onClose: () => void }) {
    const permissionsGroupedByModule = role.permissions.reduce((acc, perm) => {
        const [module] = perm.split(':');
        if (!acc[module]) acc[module] = [];
        acc[module].push(perm);
        return acc;
    }, {} as Record<string, string[]>);

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-full bg-[var(--color-dominant-100)]">
                            <Shield className="h-6 w-6 text-[var(--color-dominant-600)]" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{role.nom}</h2>
                            <p className="text-sm text-gray-600">{role.permissions.length} permissions</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <AlertTriangle className="h-6 w-6" />
                    </button>
                </div>

                {/* Permissions */}
                <div className="p-6 space-y-6">
                    {Object.entries(permissionsGroupedByModule).map(([module, perms]) => (
                        <div key={module} className="space-y-3">
                            <h3 className="text-lg font-semibold text-gray-900 capitalize">
                                {module.replace(/-/g, ' ')}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {perms.map((perm) => (
                                    <div key={perm} className="flex items-center gap-2 p-2 rounded bg-gray-50">
                                        <CheckSquare className="h-4 w-4 text-green-600" />
                                        <span className="text-sm text-gray-700">{perm}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 flex justify-end">
                    <ElisaButton variant="primary" onClick={onClose}>
                        Fermer
                    </ElisaButton>
                </div>
            </motion.div>
        </div>
    );
}
