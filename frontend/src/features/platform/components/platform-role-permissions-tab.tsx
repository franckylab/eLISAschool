/**
 * ============================================
 * eLISAschool - Platform Role Permissions Tab
 * ============================================
 * Version: 2.0.0 — Toggles permissions interactifs
 *
 * Liste des permissions groupées par module avec toggles on/off.
 * Lecture seule pour les rôles système.
 * Sauvegarde via PATCH /api/platform/roles/:id pour les rôles personnalisés.
 */

import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Key, Lock, Save, X, Search, Check, ChevronDown, ChevronRight, GitCompare } from 'lucide-react';
import {
    usePlatformRolePermissions,
    useMatricePermissions,
    useModifierRolePlateforme,
    usePlatformRoles,
    useComparerPermissions,
    type ComparaisonResult,
} from '../hooks/use-platform-roles';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { toast } from 'sonner';

interface PlatformRolePermissionsTabProps {
    roleId: string;
    estSysteme: boolean;
    currentRoleNom?: string;
}

export function PlatformRolePermissionsTab({ roleId, estSysteme, currentRoleNom }: PlatformRolePermissionsTabProps) {
    const { t } = useTranslation('admin');
    const { data: rolePermissions, isLoading: loadingPerms, error: permError, refetch: refetchPerms } = usePlatformRolePermissions(roleId);
    const { data: matrice, isLoading: loadingMatrice } = useMatricePermissions();
    const modifier = useModifierRolePlateforme();
    const { data: allRoles } = usePlatformRoles();
    const comparer = useComparerPermissions();

    // État local des permissions cochées
    const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set());
    const [isDirty, setIsDirty] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
    const [modeComparaison, setModeComparaison] = useState(false);
    const [rolesAComparer, setRolesAComparer] = useState<string[]>([]);
    const [comparaisonResult, setComparaisonResult] = useState<ComparaisonResult | null>(null);

    // Initialiser les permissions sélectionnées quand les données arrivent
    if (!isInitialized && rolePermissions && matrice) {
        setSelectedPerms(new Set(rolePermissions));
        // Déplier tous les modules par défaut
        setExpandedModules(new Set(matrice.modules.map(m => m.module)));
        setIsInitialized(true);
    }

    // Toggle une permission
    const togglePermission = useCallback((perm: string) => {
        if (estSysteme) return;
        setSelectedPerms(prev => {
            const next = new Set(prev);
            if (next.has(perm)) {
                next.delete(perm);
            } else {
                next.add(perm);
            }
            return next;
        });
        setIsDirty(true);
    }, [estSysteme]);

    // Toggle un module entier
    const toggleModule = useCallback((permissions: string[]) => {
        if (estSysteme) return;
        setSelectedPerms(prev => {
            const next = new Set(prev);
            const allSelected = permissions.every(p => next.has(p));
            if (allSelected) {
                permissions.forEach(p => next.delete(p));
            } else {
                permissions.forEach(p => next.add(p));
            }
            return next;
        });
        setIsDirty(true);
    }, [estSysteme]);

    // Déplier/replier un module
    const toggleModuleExpand = useCallback((module: string) => {
        setExpandedModules(prev => {
            const next = new Set(prev);
            if (next.has(module)) {
                next.delete(module);
            } else {
                next.add(module);
            }
            return next;
        });
    }, []);

    // Sauvegarder les permissions
    const handleSave = useCallback(async () => {
        try {
            await modifier.mutateAsync({
                id: roleId,
                permissions: Array.from(selectedPerms),
            });
            setIsDirty(false);
            toast.success('Permissions mises à jour');
        } catch {
            toast.error('Erreur lors de la sauvegarde');
        }
    }, [roleId, selectedPerms, modifier]);

    // Annuler les modifications
    const handleCancel = useCallback(() => {
        if (rolePermissions) {
            setSelectedPerms(new Set(rolePermissions));
            setIsDirty(false);
        }
    }, [rolePermissions]);

    // Lancer la comparaison
    const handleComparer = useCallback(async () => {
        if (rolesAComparer.length < 2) {
            toast.error('Sélectionnez au moins 2 rôles à comparer');
            return;
        }
        try {
            const result = await comparer.mutateAsync(rolesAComparer);
            setComparaisonResult(result);
        } catch {
            toast.error('Erreur lors de la comparaison');
        }
    }, [rolesAComparer, comparer]);

    // Filtrage par recherche
    const filteredModules = useMemo(() => {
        if (!matrice?.modules) return [];
        if (!searchQuery.trim()) return matrice.modules;
        const q = searchQuery.toLowerCase();
        return matrice.modules
            .map(mod => ({
                ...mod,
                permissions: mod.permissions.filter(p => p.toLowerCase().includes(q)),
            }))
            .filter(mod => mod.permissions.length > 0 || mod.module.toLowerCase().includes(q) || mod.label.toLowerCase().includes(q));
    }, [matrice, searchQuery]);

    // Stats
    const totalPerms = matrice?.totalPermissions || 0;
    const selectedCount = selectedPerms.size;

    // Rôles disponibles pour comparaison (exclure le rôle courant)
    const rolesForComparison = useMemo(() => {
        if (!allRoles) return [];
        return allRoles.filter(r => r.id !== roleId);
    }, [allRoles, roleId]);

    // Toggle un rôle dans la comparaison
    const toggleRoleInComparison = useCallback((roleIdToToggle: string) => {
        setRolesAComparer(prev => {
            if (prev.includes(roleIdToToggle)) {
                return prev.filter(id => id !== roleIdToToggle);
            }
            if (prev.length >= 4) {
                toast.error('Maximum 5 rôles (le rôle courant + 4 autres)');
                return prev;
            }
            return [...prev, roleIdToToggle];
        });
        setComparaisonResult(null);
    }, []);

    if (loadingPerms || loadingMatrice) return <PageSkeleton />;
    if (permError) {
        return (
            <ErrorMessage
                title={t('platformRoles.erreurPermissions', 'Erreur')}
                message={permError.message || 'Impossible de charger les permissions'}
                onRetry={() => refetchPerms()}
                retryLabel={t('platformRoles.reessayer', 'Réessayer')}
            />
        );
    }

    return (
        <div className="space-y-6">
            {/* Header avec actions */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-[var(--color-dominant-600)]" />
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {t('platformRoles.permissionsAttribuees', 'Permissions')}
                    </h3>
                    <span className="rounded-full bg-[var(--color-dominant-100)] dark:bg-[var(--color-dominant-900)]/30 px-2.5 py-0.5 text-xs font-medium text-[var(--color-dominant-700)] dark:text-[var(--color-dominant-400)]">
                        {selectedCount}/{totalPerms}
                    </span>
                    {estSysteme && (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                            <Lock className="h-3 w-3" />
                            {t('platformRoles.lectureSeule', 'Lecture seule')}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Toggle comparaison */}
                    <button
                        onClick={() => {
                            setModeComparaison(!modeComparaison);
                            if (modeComparaison) {
                                setComparaisonResult(null);
                                setRolesAComparer([]);
                            }
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                            modeComparaison
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 ring-1 ring-blue-300 dark:ring-blue-700'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                    >
                        <GitCompare className="h-3.5 w-3.5" />
                        {modeComparaison ? 'Comparer' : 'Comparer'}
                    </button>

                    {/* Actions (non-système uniquement) */}
                    {!estSysteme && isDirty && (
                        <>
                            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                Modifications non sauvegardées
                            </span>
                            <ElisaButton variant="ghost" size="xs" onClick={handleCancel} icon={<X className="h-3.5 w-3.5" />}>
                                Annuler
                            </ElisaButton>
                            <ElisaButton
                                variant="primary"
                                size="xs"
                                chargement={modifier.isPending}
                                onClick={handleSave}
                                icon={<Save className="h-3.5 w-3.5" />}
                            >
                                Sauvegarder
                            </ElisaButton>
                        </>
                    )}
                </div>
            </div>

            {/* Panneau de comparaison */}
            {modeComparaison && (
                <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                        <GitCompare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200">
                            Comparer les permissions
                        </h4>
                    </div>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                        Sélectionnez 2 à 4 rôles supplémentaires à comparer avec <strong>{currentRoleNom || 'ce rôle'}</strong>.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {rolesForComparison.map(r => {
                            const isSelected = rolesAComparer.includes(r.id);
                            return (
                                <button
                                    key={r.id}
                                    onClick={() => toggleRoleInComparison(r.id)}
                                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                                        isSelected
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-blue-400'
                                    }`}
                                >
                                    {isSelected && <Check className="h-3 w-3" />}
                                    {r.libelle || r.nom}
                                </button>
                            );
                        })}
                    </div>
                    <div className="flex items-center gap-2">
                        <ElisaButton
                            variant="primary"
                            size="xs"
                            chargement={comparer.isPending}
                            disabled={rolesAComparer.length < 2}
                            onClick={handleComparer}
                            icon={<GitCompare className="h-3.5 w-3.5" />}
                        >
                            Comparer ({rolesAComparer.length + 1} rôles)
                        </ElisaButton>
                        {comparaisonResult && (
                            <span className="text-xs text-blue-600 dark:text-blue-400">
                                {comparaisonResult.totalPermissions} permissions comparées
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Résultat de comparaison */}
            {comparaisonResult && modeComparaison && (
                <ComparaisonView result={comparaisonResult} />
            )}

            {/* Barre de recherche */}
            {totalPerms > 0 && (
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Rechercher une permission..."
                        className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                    />
                </div>
            )}

            {/* Permissions groupées par module */}
            {totalPerms === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Key className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">{t('platformRoles.aucunePermission', 'Aucune permission disponible')}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredModules.map((mod) => {
                        const isExpanded = expandedModules.has(mod.module);
                        const moduleSelected = mod.permissions.filter(p => selectedPerms.has(p)).length;
                        const allSelected = mod.permissions.length > 0 && moduleSelected === mod.permissions.length;
                        const someSelected = moduleSelected > 0 && !allSelected;

                        return (
                            <div
                                key={mod.module}
                                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 overflow-hidden"
                            >
                                {/* Header du module */}
                                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                    {/* Expand/collapse */}
                                    <button
                                        onClick={() => toggleModuleExpand(mod.module)}
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    >
                                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                    </button>

                                    {/* Checkbox module (non-système) */}
                                    {!estSysteme && (
                                        <button
                                            onClick={() => toggleModule(mod.permissions)}
                                            className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                                                allSelected
                                                    ? 'bg-[var(--color-dominant-600)] border-[var(--color-dominant-600)]'
                                                    : someSelected
                                                        ? 'bg-[var(--color-dominant-200)] border-[var(--color-dominant-400)]'
                                                        : 'border-gray-300 dark:border-gray-600'
                                            }`}
                                        >
                                            {allSelected && <Check className="h-3 w-3 text-white" />}
                                            {someSelected && <div className="h-1.5 w-1.5 rounded-sm bg-[var(--color-dominant-600)]" />}
                                        </button>
                                    )}

                                    {/* Label + count */}
                                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex-1">
                                        {mod.label}
                                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                            ({moduleSelected}/{mod.permissions.length})
                                        </span>
                                    </h4>
                                </div>

                                {/* Permissions (si déplié) */}
                                {isExpanded && (
                                    <div className="p-3 flex flex-wrap gap-1.5">
                                        {mod.permissions.map((perm) => {
                                            const isSelected = selectedPerms.has(perm);
                                            return (
                                                <button
                                                    key={perm}
                                                    onClick={() => togglePermission(perm)}
                                                    disabled={estSysteme}
                                                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
                                                        isSelected
                                                            ? 'bg-[var(--color-dominant-100)] dark:bg-[var(--color-dominant-900)]/30 text-[var(--color-dominant-700)] dark:text-[var(--color-dominant-400)] ring-1 ring-[var(--color-dominant-300)] dark:ring-[var(--color-dominant-700)]'
                                                            : 'bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                                    } ${estSysteme ? 'cursor-default' : 'cursor-pointer'}`}
                                                >
                                                    {isSelected && <Check className="h-3 w-3 mr-1" />}
                                                    <PermBadge perm={perm} />
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default PlatformRolePermissionsTab;

// =============================================
// PermBadge — Badge coloré par type de permission
// =============================================

const PERM_CATEGORIES: Record<string, { label: string; color: string }> = {
    'create': { label: 'C', color: 'bg-green-500/20 text-green-700 dark:text-green-300' },
    'read': { label: 'R', color: 'bg-blue-500/20 text-blue-700 dark:text-blue-300' },
    'update': { label: 'U', color: 'bg-amber-500/20 text-amber-700 dark:text-amber-300' },
    'delete': { label: 'D', color: 'bg-red-500/20 text-red-700 dark:text-red-300' },
    'write': { label: 'W', color: 'bg-purple-500/20 text-purple-700 dark:text-purple-300' },
    'manage': { label: 'M', color: 'bg-pink-500/20 text-pink-700 dark:text-pink-300' },
    'view': { label: 'V', color: 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300' },
    'export': { label: 'E', color: 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300' },
    'toggle': { label: 'T', color: 'bg-teal-500/20 text-teal-700 dark:text-teal-300' },
};

function PermBadge({ perm }: { perm: string }) {
    // Extraire le suffixe (dernier segment après ':')
    const parts = perm.split(':');
    const suffix = parts[parts.length - 1]?.toLowerCase() || '';
    const cat = Object.entries(PERM_CATEGORIES).find(([key]) => suffix.includes(key));

    if (!cat) return <span>{perm}</span>;

    return (
        <span className="inline-flex items-center gap-1">
            <span className={`inline-flex h-4 w-4 items-center justify-center rounded text-[9px] font-bold ${cat[1].color}`}>
                {cat[1].label}
            </span>
            <span>{perm}</span>
        </span>
    );
}

// =============================================
// ComparaisonView — Matrice de comparaison
// =============================================

function ComparaisonView({ result }: { result: ComparaisonResult }) {
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(result.modules.map(m => m.module)));

    const toggleExpand = (mod: string) => {
        setExpandedModules(prev => {
            const next = new Set(prev);
            if (next.has(mod)) next.delete(mod);
            else next.add(mod);
            return next;
        });
    };

    return (
        <div className="rounded-xl border border-blue-200 dark:border-blue-800 overflow-hidden">
            {/* Header de la matrice */}
            <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 dark:bg-blue-900/30 border-b border-blue-200 dark:border-blue-800">
                <GitCompare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                    Matrice de comparaison
                </h4>
                <span className="text-xs text-blue-600 dark:text-blue-400">
                    {result.totalPermissions} permissions • {result.roles.length} rôles
                </span>
            </div>

            {/* Légende rôles */}
            <div className="flex flex-wrap items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                {result.roles.map((r, idx) => (
                    <span
                        key={r.id}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            idx === 0
                                ? 'bg-[var(--color-dominant-100)] dark:bg-[var(--color-dominant-900)]/30 text-[var(--color-dominant-700)] dark:text-[var(--color-dominant-400)]'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                    >
                        <Shield className="h-3 w-3" />
                        {r.nom}
                        <span className="text-[10px] opacity-60">({r.nbPermissions})</span>
                    </span>
                ))}
            </div>

            {/* Modules en accordéon */}
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {result.modules.map(mod => {
                    const isExpanded = expandedModules.has(mod.module);
                    const avecCount = mod.permissions.filter(p =>
                        result.roles.every(r => p.parRole[r.id])
                    ).length;

                    return (
                        <div key={mod.module}>
                            <button
                                onClick={() => toggleExpand(mod.module)}
                                className="flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50"
                            >
                                {isExpanded ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 flex-1">
                                    {mod.module}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {mod.permissions.length} perms • {avecCount} communes
                                </span>
                            </button>
                            {isExpanded && (
                                <div className="px-4 pb-3">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                                    <th className="text-left py-1.5 pr-4 text-gray-500 dark:text-gray-400 font-medium">Permission</th>
                                                    {result.roles.map(r => (
                                                        <th key={r.id} className="text-center py-1.5 px-2 text-gray-500 dark:text-gray-400 font-medium min-w-[60px]">
                                                            {r.nom.length > 12 ? r.nom.slice(0, 12) + '…' : r.nom}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {mod.permissions.map(p => (
                                                    <tr key={p.permission} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                                                        <td className="py-1 pr-4">
                                                            <PermBadge perm={p.permission} />
                                                        </td>
                                                        {result.roles.map(r => (
                                                            <td key={r.id} className="text-center py-1 px-2">
                                                                {p.parRole[r.id] ? (
                                                                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                                                                        <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                                                                        <X className="h-3 w-3 text-gray-400" />
                                                                    </span>
                                                                )}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
