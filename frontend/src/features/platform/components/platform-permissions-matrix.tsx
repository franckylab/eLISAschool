/**
 * ==================================
 * eLISAschool - Page Matrice Permissions Plateforme
 * ==================================
 * Version: 1.0.0
 *
 * Grille 6 rôles × ~40 permissions avec toggle checkboxes,
 * groupées par module. Sauvegarde inline.
 *
 * Modèle C — Auth0 Internalisé (Dual-Plane)
 */

import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Check, X, Save, Loader2, AlertTriangle } from 'lucide-react';
import {
    usePlatformPermissions,
    usePlatformPermissionsMatrix,
    useUpdateRolePermissions,
    type PlatformPermission,
} from '../hooks/use-platform-roles';

interface RoleColumn {
    key: string;
    libelle: string;
    permissions: string[];
}

export function PlatformPermissionsMatrixPage() {
    const { t } = useTranslation('admin');

    const { data: permissions, isLoading: loadingPerms } = usePlatformPermissions();
    const { data: matrix, isLoading: loadingMatrix } = usePlatformPermissionsMatrix();
    const updateRolePerms = useUpdateRolePermissions();

    // État local des modifications en cours (non sauvegardées)
    const [pendingChanges, setPendingChanges] = useState<Record<string, Set<string>>>({});
    const [savingRole, setSavingRole] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

    // Grouper les permissions par module
    const permissionsByModule = useMemo(() => {
        if (!permissions) return {};
        const grouped: Record<string, PlatformPermission[]> = {};
        for (const perm of permissions) {
            const mod = perm.module || 'AUTRE';
            if (!grouped[mod]) grouped[mod] = [];
            grouped[mod].push(perm);
        }
        // Trier par ordre dans chaque module
        for (const mod of Object.keys(grouped)) {
            grouped[mod].sort((a, b) => a.ordre - b.ordre);
        }
        return grouped;
    }, [permissions]);

    // Construire les colonnes de rôles
    const roleColumns = useMemo<RoleColumn[]>(() => {
        if (!matrix) return [];
        return Object.entries(matrix).map(([key, value]: [string, any]) => ({
            key,
            libelle: value.libelle || key,
            permissions: value.permissions || [],
        }));
    }, [matrix]);

    // Vérifier si une permission est cochée pour un rôle
    const isPermissionChecked = useCallback(
        (permCode: string, roleKey: string): boolean => {
            // Vérifier d'abord les modifications en cours
            const pending = pendingChanges[roleKey];
            if (pending) {
                return pending.has(permCode);
            }
            // Sinon, vérifier la matrice
            const role = roleColumns.find((r) => r.key === roleKey);
            return role ? role.permissions.includes(permCode) : false;
        },
        [pendingChanges, roleColumns],
    );

    // Toggle une permission pour un rôle
    const togglePermission = useCallback((permCode: string, roleKey: string) => {
        setPendingChanges((prev) => {
            const current = new Set(prev[roleKey] || []);
            if (current.has(permCode)) {
                current.delete(permCode);
            } else {
                current.add(permCode);
            }
            return { ...prev, [roleKey]: current };
        });
    }, []);

    // Sauvegarder les modifications d'un rôle
    const handleSaveRole = useCallback(
        async (roleKey: string, roleId: string) => {
            const pending = pendingChanges[roleKey];
            if (!pending || pending.size === 0) return;

            setSavingRole(roleKey);
            try {
                // Calculer la liste finale de permissions
                const role = roleColumns.find((r) => r.key === roleKey);
                const currentPerms = new Set(role?.permissions || []);

                // Appliquer les toggles en attente
                for (const permCode of pending) {
                    if (currentPerms.has(permCode)) {
                        currentPerms.delete(permCode);
                    } else {
                        currentPerms.add(permCode);
                    }
                }

                await updateRolePerms.mutateAsync({
                    roleId,
                    permissions: Array.from(currentPerms),
                });

                // Nettoyer les modifications en cours
                setPendingChanges((prev) => {
                    const next = { ...prev };
                    delete next[roleKey];
                    return next;
                });

                setSaveSuccess(roleKey);
                setTimeout(() => setSaveSuccess(null), 2000);
            } catch {
                // Erreur gérée par TanStack Query
            } finally {
                setSavingRole(null);
            }
        },
        [pendingChanges, roleColumns, updateRolePerms],
    );

    // Nombre de modifications en cours pour un rôle
    const getPendingCount = useCallback(
        (roleKey: string): number => {
            return pendingChanges[roleKey]?.size || 0;
        },
        [pendingChanges],
    );

    if (loadingPerms || loadingMatrix) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-2 border-[var(--color-danger-500)] border-t-transparent rounded-full" />
            </div>
        );
    }

    const modules = Object.keys(permissionsByModule);
    const hasAnyPending = Object.keys(pendingChanges).length > 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-[var(--color-texte)]">
                        {t('platformPermissions.title', 'Matrice des Permissions')}
                    </h1>
                    <p className="text-sm text-[var(--color-texte-muted)]">
                        {t(
                            'platformPermissions.subtitle',
                            'Gestion granulaire des permissions par rôle plateforme',
                        )}
                    </p>
                </div>
                {hasAnyPending && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-warning-100)] text-[var(--color-warning-700)] text-sm">
                        <AlertTriangle className="w-4 h-4" />
                        {t('platformPermissions.unsavedChanges', 'Modifications non sauvegardées')}
                    </div>
                )}
            </div>

            {/* Légende */}
            <div className="flex items-center gap-6 text-sm text-[var(--color-texte-muted)]">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-[var(--color-success-100)] border border-[var(--color-success-300)] flex items-center justify-center">
                        <Check className="w-3 h-3 text-[var(--color-success-600)]" />
                    </div>
                    <span>{t('platformPermissions.granted', 'Accordée')}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-[var(--color-gris-clair)] border border-[var(--color-gris-moyen)]" />
                    <span>{t('platformPermissions.denied', 'Refusée')}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-[var(--color-warning-100)] border border-[var(--color-warning-300)]" />
                    <span>{t('platformPermissions.pending', 'En attente')}</span>
                </div>
            </div>

            {/* Matrice */}
            <div className="overflow-x-auto border border-[var(--color-gris-clair)] rounded-xl">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-[var(--color-gris-clair)]">
                            <th className="sticky left-0 z-10 bg-[var(--color-gris-clair)] text-left px-4 py-3 font-semibold text-[var(--color-texte)] min-w-[250px]">
                                {t('platformPermissions.permission', 'Permission')}
                            </th>
                            {roleColumns.map((role) => (
                                <th
                                    key={role.key}
                                    className="px-3 py-3 text-center font-semibold text-[var(--color-texte)] min-w-[120px]"
                                >
                                    <div className="flex flex-col items-center gap-1">
                                        <span className="text-xs">{role.libelle}</span>
                                        {getPendingCount(role.key) > 0 && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-warning-100)] text-[var(--color-warning-700)]">
                                                {getPendingCount(role.key)}{' '}
                                                {t('platformPermissions.changes', 'modif.')}
                                            </span>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {modules.map((mod) => (
                            <>
                                {/* En-tête de module */}
                                <tr key={`module-${mod}`} className="bg-[var(--color-primaire-50)]">
                                    <td
                                        colSpan={roleColumns.length + 1}
                                        className="px-4 py-2 font-semibold text-[var(--color-primaire-700)] text-xs uppercase tracking-wider"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Shield className="w-3.5 h-3.5" />
                                            {t(`platformPermissions.modules.${mod.toLowerCase()}`, mod)}
                                        </div>
                                    </td>
                                </tr>

                                {/* Permissions du module */}
                                {permissionsByModule[mod].map((perm) => (
                                    <tr
                                        key={perm.id}
                                        className="border-t border-[var(--color-gris-clair)] hover:bg-[var(--color-gris-clair)]/30"
                                    >
                                        <td className="sticky left-0 z-10 bg-white px-4 py-2.5">
                                            <div>
                                                <div className="font-medium text-[var(--color-texte)]">
                                                    {perm.libelle}
                                                </div>
                                                <div className="text-xs text-[var(--color-texte-muted)] font-mono">
                                                    {perm.code}
                                                </div>
                                            </div>
                                        </td>
                                        {roleColumns.map((role) => {
                                            const checked = isPermissionChecked(perm.code, role.key);
                                            const isPending =
                                                pendingChanges[role.key]?.has(perm.code) ?? false;

                                            return (
                                                <td
                                                    key={`${perm.id}-${role.key}`}
                                                    className="px-3 py-2.5 text-center"
                                                >
                                                    <button
                                                        onClick={() =>
                                                            togglePermission(perm.code, role.key)
                                                        }
                                                        className={`w-7 h-7 rounded-md border flex items-center justify-center transition-colors ${
                                                            isPending
                                                                ? 'bg-[var(--color-warning-100)] border-[var(--color-warning-300)]'
                                                                : checked
                                                                  ? 'bg-[var(--color-success-100)] border-[var(--color-success-300)] hover:bg-[var(--color-success-200)]'
                                                                  : 'bg-white border-[var(--color-gris-clair)] hover:bg-[var(--color-gris-clair)]'
                                                        }`}
                                                        title={`${checked ? 'Retirer' : 'Accorder'} ${perm.code} → ${role.libelle}`}
                                                    >
                                                        {checked ? (
                                                            <Check className="w-4 h-4 text-[var(--color-success-600)]" />
                                                        ) : (
                                                            <X className="w-3 h-3 text-[var(--color-gris-moyen)]" />
                                                        )}
                                                    </button>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Boutons de sauvegarde par rôle */}
            {hasAnyPending && (
                <div className="flex flex-wrap gap-3">
                    {roleColumns.map((role) => {
                        const pending = getPendingCount(role.key);
                        if (pending === 0) return null;
                        return (
                            <button
                                key={role.key}
                                onClick={() => handleSaveRole(role.key, role.key)}
                                disabled={savingRole === role.key}
                                className="px-4 py-2 text-sm rounded-lg bg-[var(--color-primaire-500)] text-white hover:bg-[var(--color-primaire-600)] disabled:opacity-50 flex items-center gap-2"
                            >
                                {savingRole === role.key ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : saveSuccess === role.key ? (
                                    <Check className="w-4 h-4" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                {t('platformPermissions.saveRole', 'Sauvegarder')}{' '}
                                {role.libelle} ({pending})
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Résumé */}
            <div className="text-sm text-[var(--color-texte-muted)]">
                {t('platformPermissions.summary', '{{total}} permissions · {{roles}} rôles · {{modules}} modules', {
                    total: permissions?.length || 0,
                    roles: roleColumns.length,
                    modules: modules.length,
                })}
            </div>
        </div>
    );
}

export default PlatformPermissionsMatrixPage;
