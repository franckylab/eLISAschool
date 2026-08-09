/**
 * ==================================
 * eLISAschool - Page Admin Matrice des Permissions
 * ==================================
 * Version: 3.0.0
 * Auteur: franck arlos chendjou
 *
 * Visualisation complète de la matrice des permissions par rôle
 * Interface d'administration pour gérer les accès
 * V2 — Panel Admin Enterprise : branché sur le vrai RBAC (/api/rbac)
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { RequireRole } from '@/components/permissions';
import { toast } from 'sonner';
import {
    Check,
    X,
    Search,
    Download,
    Shield,
    LayoutGrid,
    Users,
    Target,
    Save,
    Loader2,
    Lock,
} from 'lucide-react';
import { CardGrid } from '@/components/ui/CardGrid';
import { StatCard } from '@/components/ui/StatCard';

// ==================================
// TYPES
// ==================================

interface RbacPermission {
    id: string;
    code: string;
    libelle: string;
    module: string;
    action: string;
}

interface RbacRole {
    id: string;
    code: string;
    libelle: string;
    description?: string | null;
    estSysteme: boolean;
    actif: boolean;
    nbUtilisateurs?: number;
}

interface PendingChange {
    roleId: string;
    permissionId: string;
    granted: boolean;
}

// ==================================
// CONSTANTES
// ==================================

const ROLE_COLOR: Record<string, string> = {
    SUPER_ADMIN: 'var(--color-danger-500)',
    ADMIN: 'var(--color-warning-500)',
    CHEF_ETABLISSEMENT: 'var(--color-warning-400)',
    ENSEIGNANT: 'var(--color-success-500)',
    PERSONNEL: 'var(--color-info-500)',
    PARENT: 'var(--color-accent-500)',
    ELEVE: 'var(--color-accent-400)',
    GESTIONNAIRE_GROUPES: 'var(--color-secondary-500)',
};

function roleColor(code: string): string {
    return ROLE_COLOR[code] ?? 'var(--color-info-500)';
}

// ==================================
// COMPOSANT PRINCIPAL
// ==================================

export function AdminPermissionsMatrixPage() {
    const queryClient = useQueryClient();
    const { t } = useTranslation('admin');

    const [selectedRoleId, setSelectedRoleId] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedModule, setSelectedModule] = useState<string>('all');
    const [viewMode, setViewMode] = useState<'matrix' | 'list'>('matrix');
    const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);

    // Permissions groupées par module
    const { data: permissionsByModule, isLoading: loadingModules } = useQuery({
        queryKey: ['rbac-permissions-modules'],
        queryFn: async () => {
            const res = await apiClient.get<Record<string, RbacPermission[]>>('/api/rbac/permissions/modules');
            return res.data ?? {};
        },
    });

    // Rôles
    const { data: roles, isLoading: loadingRoles } = useQuery({
        queryKey: ['rbac-roles'],
        queryFn: async () => {
            const res = await apiClient.get<RbacRole[]>('/api/rbac/roles');
            return res.data ?? [];
        },
    });

    // Permissions assignées par rôle
    const { data: rolePermissions } = useQuery({
        queryKey: ['rbac-role-permissions', roles?.length],
        enabled: !!roles && roles.length > 0,
        queryFn: async () => {
            const map: Record<string, Set<string>> = {};
            await Promise.all(
                (roles ?? []).map(async (role) => {
                    const res = await apiClient.get<RbacPermission[]>(`/api/rbac/roles/${role.id}/permissions`);
                    map[role.id] = new Set((res.data ?? []).map((p) => p.id));
                }),
            );
            return map;
        },
    });

    const isLoading = loadingModules || loadingRoles || !rolePermissions;

    // Mutation de sauvegarde (delta par rôle)
    const saveMutation = useMutation({
        mutationFn: async (grouped: Record<string, { added: string[]; removed: string[] }>) => {
            const results = await Promise.all(
                Object.entries(grouped).map(async ([roleId, delta]) => {
                    const res = await apiClient.put(`/api/rbac/roles/${roleId}/permissions/batch`, {
                        addedPermissionIds: delta.added,
                        removedPermissionIds: delta.removed,
                    });
                    return res;
                }),
            );
            return results;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rbac-role-permissions'] });
            queryClient.invalidateQueries({ queryKey: ['rbac-roles'] });
            setPendingChanges([]);
            toast.success(t('permissions.sauvegardeReussie', 'Permissions mises à jour'));
        },
        onError: (err: unknown) => {
            const msg = err instanceof Error ? err.message : t('permissions.sauvegardeErreur', 'Échec de la sauvegarde');
            toast.error(msg);
        },
    });

    const hasPendingChanges = pendingChanges.length > 0;

    const isGranted = (roleId: string, permissionId: string): boolean => {
        const change = pendingChanges.find((c) => c.roleId === roleId && c.permissionId === permissionId);
        if (change) return change.granted;
        return rolePermissions?.[roleId]?.has(permissionId) ?? false;
    };

    const handleToggle = (roleId: string, permissionId: string, current: boolean) => {
        setPendingChanges((prev) => {
            const idx = prev.findIndex((c) => c.roleId === roleId && c.permissionId === permissionId);
            if (idx === -1) return [...prev, { roleId, permissionId, granted: !current }];
            const cp = [...prev];
            cp.splice(idx, 1);
            return cp;
        });
    };

    const handleSave = () => {
        const grouped: Record<string, { added: string[]; removed: string[] }> = {};
        for (const change of pendingChanges) {
            const base = rolePermissions?.[change.roleId]?.has(change.permissionId) ?? false;
            if (change.granted && !base) {
                (grouped[change.roleId] ??= { added: [], removed: [] }).added.push(change.permissionId);
            } else if (!change.granted && base) {
                (grouped[change.roleId] ??= { added: [], removed: [] }).removed.push(change.permissionId);
            }
        }
        if (Object.keys(grouped).length > 0) saveMutation.mutate(grouped);
    };

    // Filtres
    const filteredModules = useMemo(() => {
        return Object.keys(permissionsByModule ?? {}).filter((module) => {
            const matchesSearch = module.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesModule = selectedModule === 'all' || module === selectedModule;
            return matchesSearch && matchesModule;
        });
    }, [permissionsByModule, searchTerm, selectedModule]);

    const visibleRoles = useMemo(() => {
        const all = roles ?? [];
        return selectedRoleId === 'all' ? all : all.filter((r) => r.id === selectedRoleId);
    }, [roles, selectedRoleId]);

    const totalPermissions = useMemo(
        () => Object.values(permissionsByModule ?? {}).flat().length,
        [permissionsByModule],
    );

    const averageCoverage = useMemo(() => {
        if (!roles?.length || !totalPermissions) return 0;
        const granted = roles.map((r) => rolePermissions?.[r.id]?.size ?? 0);
        const sum = granted.reduce((a, b) => a + b, 0);
        return Math.round((sum / (roles.length * totalPermissions)) * 100);
    }, [roles, rolePermissions, totalPermissions]);

    const exportMatrix = () => {
        const matrix = Object.entries(permissionsByModule ?? {}).map(([module, perms]) => ({
            module,
            permissions: perms.map((p) => ({
                code: p.code,
                libelle: p.libelle,
                roles: Object.fromEntries(
                    (roles ?? []).map((r) => [r.code, rolePermissions?.[r.id]?.has(p.id) ?? false]),
                ),
            })),
        }));
        const data = {
            date: new Date().toISOString(),
            roles: (roles ?? []).map((r) => ({ code: r.code, libelle: r.libelle, estSysteme: r.estSysteme })),
            modules: matrix,
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `permissions-matrix-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--color-dominant-500)]" />
            </div>
        );
    }

    return (
        <RequireRole roles={['SUPER_ADMIN', 'ADMIN']}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-start flex-wrap gap-3">
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--color-texte)]">{t('permissions.titre')}</h1>
                        <p className="text-[var(--color-texte-muted)] mt-1">
                            {t('permissions.sousTitre', 'Visualisation complète des accès par rôle et module')}
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={handleSave}
                            disabled={!hasPendingChanges || saveMutation.isPending}
                            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-success-600)] text-white rounded-lg hover:bg-[var(--color-success-700)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {t('permissions.sauvegarder')} {hasPendingChanges ? `(${pendingChanges.length})` : ''}
                        </button>
                        <button
                            onClick={exportMatrix}
                            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-info-600)] text-white rounded-lg hover:bg-[var(--color-info-700)]"
                        >
                            <Download className="w-4 h-4" />
                            {t('permissions.exporter', 'Exporter')}
                        </button>
                    </div>
                </div>

                {/* Filtres */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                        <input
                            type="text"
                            placeholder={t('permissions.rechercher', 'Rechercher...')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-[var(--color-bordure)] rounded-lg"
                        />
                    </div>

                    <select
                        value={selectedRoleId}
                        onChange={(e) => setSelectedRoleId(e.target.value)}
                        className="px-4 py-2 border border-[var(--color-bordure)] rounded-lg"
                    >
                        <option value="all">{t('permissions.tousRoles')}</option>
                        {(roles ?? []).map(role => (
                            <option key={role.id} value={role.id}>{role.libelle}</option>
                        ))}
                    </select>

                    <select
                        value={selectedModule}
                        onChange={(e) => setSelectedModule(e.target.value)}
                        className="px-4 py-2 border border-[var(--color-bordure)] rounded-lg"
                    >
                        <option value="all">{t('permissions.tousModules')}</option>
                        {Object.keys(permissionsByModule ?? {}).map(mod => (
                            <option key={mod} value={mod}>{mod}</option>
                        ))}
                    </select>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setViewMode('matrix')}
                            className={`flex-1 px-4 py-2 rounded-lg ${
                                viewMode === 'matrix'
                                    ? 'bg-[var(--color-info-600)] text-white'
                                    : 'bg-[var(--color-surface-hover)] text-[var(--color-texte-muted)]'
                            }`}
                        >
                            {t('permissions.matrice', 'Matrice')}
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`flex-1 px-4 py-2 rounded-lg ${
                                viewMode === 'list'
                                    ? 'bg-[var(--color-info-600)] text-white'
                                    : 'bg-[var(--color-surface-hover)] text-[var(--color-texte-muted)]'
                            }`}
                        >
                            {t('permissions.liste', 'Liste')}
                        </button>
                    </div>
                </div>

                {/* Vue Matrice */}
                {viewMode === 'matrix' && (
                    <div className="overflow-x-auto bg-[var(--color-surface)] rounded-lg border border-[var(--color-bordure)]">
                        <table className="min-w-full divide-y divide-[var(--color-bordure)]">
                            <thead className="bg-[var(--color-surface-hover)]">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-texte-muted)] uppercase tracking-wider">
                                        {t('permissions.modulePermission', 'Module / Permission')}
                                    </th>
                                    {visibleRoles.map(role => (
                                        <th key={role.id} className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: roleColor(role.code) }} />
                                                <span className="text-xs font-medium text-[var(--color-text-secondary)]">{role.libelle}</span>
                                                {role.estSysteme && <Lock className="w-3 h-3 text-[var(--color-texte-muted)]" />}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-[var(--color-surface)] divide-y divide-[var(--color-bordure)]">
                                {filteredModules.map(module => {
                                    const modulePerms = permissionsByModule?.[module] ?? [];
                                    return modulePerms.map((perm, idx) => (
                                        <tr key={perm.id} className={idx === 0 ? 'bg-[var(--color-surface-hover)]' : ''}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {idx === 0 && (
                                                    <div className="text-xs font-semibold text-[var(--color-texte-muted)] mb-1 uppercase">{module}</div>
                                                )}
                                                <div className="text-sm font-medium text-[var(--color-texte)]">
                                                    <code className="text-xs bg-[var(--color-surface-hover)] px-2 py-1 rounded">{perm.code}</code>
                                                    <span className="ml-2 text-xs text-[var(--color-texte-muted)]">{perm.libelle}</span>
                                                </div>
                                            </td>
                                            {visibleRoles.map(role => {
                                                const granted = isGranted(role.id, perm.id);
                                                const modified = pendingChanges.some(c => c.roleId === role.id && c.permissionId === perm.id);
                                                return (
                                                    <td key={role.id} className="px-4 py-4 whitespace-nowrap text-center">
                                                        {role.estSysteme ? (
                                                            granted ? (
                                                                <Check className="w-5 h-5 text-[var(--color-success-600)] mx-auto opacity-60" />
                                                            ) : (
                                                                <X className="w-5 h-5 text-[var(--color-danger-400)] mx-auto opacity-40" />
                                                            )
                                                        ) : (
                                                            <button
                                                                onClick={() => handleToggle(role.id, perm.id, granted)}
                                                                className={`p-1 rounded transition-colors hover:bg-[var(--color-surface-hover)] ${modified ? 'ring-2 ring-[var(--color-warning-400)]' : ''}`}
                                                                aria-label={granted ? 'Retirer la permission' : 'Accorder la permission'}
                                                            >
                                                                {granted ? (
                                                                    <Check className="w-5 h-5 text-[var(--color-success-600)]" />
                                                                ) : (
                                                                    <X className="w-5 h-5 text-[var(--color-danger-400)]" />
                                                                )}
                                                            </button>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ));
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Vue Liste */}
                {viewMode === 'list' && (
                    <div className="space-y-4">
                        {filteredModules.map(module => {
                            const modulePerms = permissionsByModule?.[module] ?? [];
                            return (
                                <div key={module} className="bg-[var(--color-surface)] rounded-lg shadow border border-[var(--color-bordure)] p-6">
                                    <h3 className="text-lg font-semibold text-[var(--color-texte)] mb-4 capitalize">{module}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {modulePerms.map(perm => (
                                            <div key={perm.id} className="border border-[var(--color-bordure)] rounded-lg p-4">
                                                <code className="text-sm font-mono bg-[var(--color-surface-hover)] px-2 py-1 rounded block mb-3">
                                                    {perm.code}
                                                </code>
                                                <div className="space-y-1">
                                                    {visibleRoles.map(role => {
                                                        const granted = isGranted(role.id, perm.id);
                                                        const modified = pendingChanges.some(c => c.roleId === role.id && c.permissionId === perm.id);
                                                        return (
                                                            <button
                                                                key={role.id}
                                                                onClick={() => !role.estSysteme && handleToggle(role.id, perm.id, granted)}
                                                                disabled={role.estSysteme}
                                                                className={`flex items-center justify-between w-full text-sm px-2 py-1 rounded transition-colors ${
                                                                    role.estSysteme ? 'cursor-not-allowed opacity-80' : 'hover:bg-[var(--color-surface-hover)]'
                                                                } ${modified ? 'ring-1 ring-[var(--color-warning-400)]' : ''}`}
                                                            >
                                                                <span className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                                                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: roleColor(role.code) }} />
                                                                    {role.libelle}
                                                                    {role.estSysteme && <Lock className="w-3 h-3" />}
                                                                </span>
                                                                {granted ? (
                                                                    <Check className="w-4 h-4 text-[var(--color-success-600)]" />
                                                                ) : (
                                                                    <X className="w-4 h-4 text-[var(--color-danger-400)]" />
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <CardGrid columns={{ default: 1, md: 4 }}>
                    <StatCard icon={Shield} label={t('permissions.totalPermissions', 'Total Permissions')} value={totalPermissions} tone="accent" />
                    <StatCard icon={LayoutGrid} label={t('permissions.modules', 'Modules')} value={filteredModules.length} tone="info" />
                    <StatCard icon={Users} label={t('permissions.roles', 'Rôles')} value={(roles ?? []).length} tone="purple" />
                    <StatCard icon={Target} label={t('permissions.couvertureMoyenne', 'Couverture Moyenne')} value={`${averageCoverage}%`} tone="success" />
                </CardGrid>
            </div>
        </RequireRole>
    );
}

export default AdminPermissionsMatrixPage;