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
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, Shield, Users, Edit, Trash2, Lock, Unlock, 
    CheckSquare, Eye, AlertTriangle,
    UserCheck, Calendar, Mail, Phone
} from 'lucide-react';
import { useRoles, useSupprimerRole, useStatsRoles, useUsersByRole } from '../hooks/use-roles-permissions';
import { DataTable } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { CustomModal } from '@/components/modals';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { RoleFormModal } from './role-form-modal';
import { usePermissions } from '@/hooks';
import type { Role, RoleFiltres } from '../types/utilisateur.types';
import type { Column } from '@/components/ui/DataTable';

export function RolesPage() {
    const { hasPermission } = usePermissions();
    const [filtres, setFiltres] = useState<RoleFiltres>({ page: 1, limit: 50 });
    const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [showPermissions, setShowPermissions] = useState(false);
    const [showFormModal, setShowFormModal] = useState(false);
    const [roleToEdit, setRoleToEdit] = useState<Role | null>(null);
    const [filtreType, setFiltreType] = useState<'all' | 'systeme' | 'personnalise'>('all');

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
                                <p className="font-medium text-gray-900 dark:text-gray-200">{r.nom}</p>
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
                    label: 'Permissions',
                    onClick: () => {
                        setSelectedRole(r);
                        setShowPermissions(true);
                    },
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

// Modal de visualisation des permissions et utilisateurs d'un rôle
function RolePermissionsModal({ role, onClose }: { role: Role; onClose: () => void }) {
    const [ongletActif, setOngletActif] = useState<'permissions' | 'utilisateurs'>('permissions');
    const { data: utilisateurs, isLoading: loadingUsers, error: usersError } = useUsersByRole(role.id);

    // Gérer les deux formats: string[] ou Permission[]
    const permissionsList = role.permissions.map(p => {
        if (typeof p === 'string') {
            return { code: p, libelle: p, module: p.split(':')[0] || 'inconnu' };
        }
        return { code: p.code, libelle: p.libelle, module: p.module || 'inconnu' };
    });

    const permissionsGroupedByModule = permissionsList.reduce((acc, perm) => {
        const module = perm.module;
        if (!acc[module]) acc[module] = [];
        acc[module].push(perm);
        return acc;
    }, {} as Record<string, Array<{ code: string; libelle: string; module: string }>>);

    const onglets = [
        { id: 'permissions' as const, label: 'Permissions', icone: Shield, count: role.permissions.length },
        { id: 'utilisateurs' as const, label: 'Utilisateurs', icone: Users, count: utilisateurs?.length || role.nbUtilisateurs || 0 },
    ];

    return (
        <CustomModal
            open={true}
            onOpenChange={(v) => { if (!v) onClose(); }}
            title={role.nom}
            description={role.code}
            size="3xl"
            initialHeight={700}
            footer={<ElisaButton variant="primary" onClick={onClose}>Fermer</ElisaButton>}
        >
            {/* Onglets */}
            <div className="flex border-b border-[var(--color-bordure)] mb-4">
                {onglets.map((onglet) => {
                    const Icone = onglet.icone;
                    return (
                        <button
                            key={onglet.id}
                            onClick={() => setOngletActif(onglet.id)}
                            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative ${
                                ongletActif === onglet.id
                                    ? 'text-[var(--color-dominante)] border-b-2 border-[var(--color-dominante)]'
                                    : 'text-[var(--color-texte-secondaire)] hover:text-[var(--color-texte)] hover:bg-[var(--color-surface-hover)]'
                            }`}
                        >
                            <Icone className="h-4 w-4" />
                            {onglet.label}
                            <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                                ongletActif === onglet.id
                                    ? 'bg-[var(--color-dominante)]/10 text-[var(--color-dominante)]'
                                    : 'bg-[var(--color-surface-hover)] text-[var(--color-texte-secondaire)]'
                            }`}>
                                {onglet.count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Contenu des onglets */}
            <div className="overflow-y-auto">
                <AnimatePresence mode="wait">
                    {/* Onglet Permissions */}
                    {ongletActif === 'permissions' && (
                        <motion.div
                            key="permissions"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-6"
                        >
                            {Object.keys(permissionsGroupedByModule).length === 0 ? (
                                <div className="text-center py-12 text-[var(--color-texte-secondaire)]">
                                    <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                    <p>Aucune permission attribuée</p>
                                </div>
                            ) : (
                                Object.entries(permissionsGroupedByModule).map(([module, perms]) => (
                                    <div key={module} className="space-y-3">
                                        <h3 className="text-lg font-semibold text-[var(--color-texte)] capitalize flex items-center gap-2">
                                            <Shield className="h-4 w-4 text-[var(--color-dominante)]" />
                                            {module.replace(/[-_]/g, ' ')}
                                            <span className="text-sm font-normal text-[var(--color-texte-secondaire)]">
                                                ({perms.length} permission{perms.length > 1 ? 's' : ''})
                                            </span>
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {perms.map((perm) => (
                                                <div key={perm.code} className="flex items-start gap-2 p-3 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-bordure)]">
                                                    <CheckSquare className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-[var(--color-texte)]">{perm.libelle}</p>
                                                        <code className="text-xs text-[var(--color-texte-secondaire)] bg-[var(--color-fond)] px-1.5 py-0.5 rounded mt-1 inline-block">
                                                            {perm.code}
                                                        </code>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </motion.div>
                    )}

                    {/* Onglet Utilisateurs */}
                    {ongletActif === 'utilisateurs' && (
                        <motion.div
                            key="utilisateurs"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                        >
                            {loadingUsers ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="animate-pulse h-16 bg-[var(--color-surface-hover)] rounded-lg" />
                                    ))}
                                </div>
                            ) : usersError ? (
                                <div className="text-center py-12 text-red-600">
                                    <AlertTriangle className="h-12 w-12 mx-auto mb-3" />
                                    <p>Erreur de chargement des utilisateurs</p>
                                    <p className="text-sm text-[var(--color-texte-secondaire)] mt-2">{usersError.message}</p>
                                </div>
                            ) : !utilisateurs || utilisateurs.length === 0 ? (
                                <div className="text-center py-12 text-[var(--color-texte-secondaire)]">
                                    <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                    <p>Aucun utilisateur avec ce rôle</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {utilisateurs.map((user) => (
                                        <div key={user.id} className="flex items-center gap-4 p-4 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-bordure)] hover:bg-[var(--color-fond)] transition-colors">
                                            <div className="flex-shrink-0">
                                                <div className="h-12 w-12 rounded-full bg-[var(--color-dominante)]/10 flex items-center justify-center">
                                                    <UserCheck className="h-6 w-6 text-[var(--color-dominante)]" />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-[var(--color-texte)]">
                                                    {user.prenom} {user.nom}
                                                </p>
                                                <div className="flex items-center gap-4 mt-1">
                                                    <span className="flex items-center gap-1 text-xs text-[var(--color-texte-secondaire)]">
                                                        <Mail className="h-3 w-3" />
                                                        {user.email}
                                                    </span>
                                                    {user.telephone && (
                                                        <span className="flex items-center gap-1 text-xs text-[var(--color-texte-secondaire)]">
                                                            <Phone className="h-3 w-3" />
                                                            {user.telephone}
                                                        </span>
                                                    )}
                                                    {(user as any).derniereConnexion && (
                                                        <span className="flex items-center gap-1 text-xs text-[var(--color-texte-secondaire)]">
                                                            <Calendar className="h-3 w-3" />
                                                            {new Date((user as any).derniereConnexion).toLocaleDateString('fr-FR')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex-shrink-0">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    user.statut === 'ACTIF'
                                                        ? 'bg-green-100 text-green-800'
                                                        : user.statut === 'SUSPENDU'
                                                        ? 'bg-red-100 text-red-800'
                                                        : 'bg-[var(--color-surface-hover)] text-[var(--color-texte-secondaire)]'
                                                }`}>
                                                    {user.statut === 'ACTIF' ? 'Actif' : user.statut === 'SUSPENDU' ? 'Suspendu' : user.statut || 'Inactif'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </CustomModal>
    );
}
