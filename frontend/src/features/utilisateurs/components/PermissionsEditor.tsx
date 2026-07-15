import { useState, useMemo, useCallback } from 'react';
import {
    Search, Filter, CheckCircle, XCircle, Save, RotateCcw,
    AlertTriangle, FolderOpen,
} from 'lucide-react';
import { PermissionCheckbox } from '@/components/ui/PermissionCheckbox';
import { ElisaButton } from '@/components/ui/ElisaButton';
import type { PermissionGroupe, Permission } from '../types/utilisateur.types';
import type { UtilisateurPermissionResponse } from '../hooks/use-roles-permissions';

export type PermissionState = 'GRANTED' | 'DENIED' | null;
export type PermissionChange = {
    permissionId: string;
    permissionCode: string;
    previousState: PermissionState;
    newState: PermissionState;
};

interface PermissionsEditorProps {
    permissionsGroupes: PermissionGroupe[];
    initialDirectPermissions: UtilisateurPermissionResponse[];
    effectivePermissions?: string[];
    onSave: (changes: PermissionChange[]) => Promise<void>;
    onCancel?: () => void;
    saving?: boolean;
    readonly?: boolean;
}

function getInitialState(directs: UtilisateurPermissionResponse[]): Map<string, PermissionState> {
    const map = new Map<string, PermissionState>();
    for (const dp of directs) {
        map.set(dp.permissionId, dp.type);
    }
    return map;
}

export function PermissionsEditor({
    permissionsGroupes,
    initialDirectPermissions,
    effectivePermissions,
    onSave,
    onCancel,
    saving = false,
    readonly = false,
}: PermissionsEditorProps) {
    const [currentState, setCurrentState] = useState<Map<string, PermissionState>>(
        () => getInitialState(initialDirectPermissions),
    );
    const [search, setSearch] = useState('');
    const [moduleFilter, setModuleFilter] = useState<string | null>(null);
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

    const initialMap = useMemo(() => getInitialState(initialDirectPermissions), [initialDirectPermissions]);
    const effectiveSet = useMemo(() => new Set(effectivePermissions ?? []), [effectivePermissions]);

    const changes = useMemo((): PermissionChange[] => {
        const result: PermissionChange[] = [];
        for (const [pid, newState] of currentState) {
            const prev = initialMap.get(pid) ?? null;
            if (prev !== newState) {
                const code = permissionsGroupes
                    .flatMap(g => g.permissions)
                    .find(p => p.id === pid)?.code ?? pid;
                result.push({ permissionId: pid, permissionCode: code, previousState: prev, newState });
            }
        }
        return result;
    }, [currentState, initialMap, permissionsGroupes]);

    const changeCount = changes.length;

    const modules = useMemo(() => {
        return permissionsGroupes.map(g => g.module).sort();
    }, [permissionsGroupes]);

    const togglePermission = useCallback((permissionId: string) => {
        setCurrentState(prev => {
            const next = new Map(prev);
            const current = prev.get(permissionId) ?? null;
            const cycle: PermissionState[] = [null, 'GRANTED', 'DENIED'];
            const idx = cycle.indexOf(current);
            const newVal = cycle[(idx + 1) % cycle.length];
            if (newVal === null) {
                next.delete(permissionId);
            } else {
                next.set(permissionId, newVal);
            }
            return next;
        });
    }, []);

    const resetAll = useCallback(() => {
        setCurrentState(getInitialState(initialDirectPermissions));
    }, [initialDirectPermissions]);

    const toggleModule = useCallback((module: string) => {
        setExpandedModules(prev => {
            const next = new Set(prev);
            if (next.has(module)) next.delete(module);
            else next.add(module);
            return next;
        });
    }, []);

    const filteredGroupes = useMemo(() => {
        let list = moduleFilter
            ? permissionsGroupes.filter(g => g.module === moduleFilter)
            : permissionsGroupes;

        if (!search) return list;

        const q = search.toLowerCase();
        return list
            .map(g => ({
                ...g,
                permissions: g.permissions.filter(p =>
                    p.code.toLowerCase().includes(q) ||
                    p.libelle.toLowerCase().includes(q) ||
                    p.description?.toLowerCase().includes(q),
                ),
            }))
            .filter(g => g.permissions.length > 0);
    }, [permissionsGroupes, moduleFilter, search]);

    const grantedCount = useMemo(() => {
        let count = 0;
        for (const state of currentState.values()) {
            if (state === 'GRANTED') count++;
        }
        return count;
    }, [currentState]);

    const deniedCount = useMemo(() => {
        let count = 0;
        for (const state of currentState.values()) {
            if (state === 'DENIED') count++;
        }
        return count;
    }, [currentState]);

    const handleSave = useCallback(async () => {
        if (changes.length === 0) return;
        await onSave(changes);
    }, [changes, onSave]);

    return (
        <div className="space-y-4">
            {/* Search + header */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Rechercher par code, libellé..."
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-dominant-500 transition-shadow"
                    />
                </div>
                {!readonly && (
                    <ElisaButton
                        variant="outline"
                        size="sm"
                        icon={<RotateCcw className="h-4 w-4" />}
                        onClick={resetAll}
                        disabled={changeCount === 0}
                    >
                        Réinitialiser
                    </ElisaButton>
                )}
            </div>

            {/* Stats bar */}
            <div className="flex flex-wrap items-center gap-3 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/40 text-sm">
                <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                    <span className="font-medium text-blue-600 dark:text-blue-400">{grantedCount}</span>
                    activée{grantedCount > 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="font-medium text-red-600 dark:text-red-400">{deniedCount}</span>
                    refusée{deniedCount > 1 ? 's' : ''}
                </span>
                {changeCount > 0 && (
                    <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 ml-auto">
                        <AlertTriangle className="h-4 w-4" />
                        {changeCount} modification{changeCount > 1 ? 's' : ''} non sauvegardée{changeCount > 1 ? 's' : ''}
                    </span>
                )}
            </div>

            {/* Module filter pills */}
            <div className="flex gap-2 overflow-x-auto pb-1">
                <button
                    onClick={() => setModuleFilter(null)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                        moduleFilter === null
                            ? 'bg-dominant-100 text-dominant-700 dark:bg-dominant-900 dark:text-dominant-300'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                    }`}
                >
                    <Filter className="h-3.5 w-3.5" />
                    Tous
                </button>
                {modules.map(mod => (
                    <button
                        key={mod}
                        onClick={() => setModuleFilter(mod)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                            moduleFilter === mod
                                ? 'bg-dominant-100 text-dominant-700 dark:bg-dominant-900 dark:text-dominant-300'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                        }`}
                    >
                        {mod}
                    </button>
                ))}
            </div>

            {/* Permission groups */}
            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {filteredGroupes.map(groupe => {
                    const isExpanded = expandedModules.has(groupe.module) || !!search || moduleFilter !== null;
                    return (
                        <div key={groupe.module} className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <button
                                type="button"
                                onClick={() => toggleModule(groupe.module)}
                                className="flex items-center gap-2 w-full px-3 py-2.5 text-sm font-medium text-left text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <FolderOpen className={`h-4 w-4 text-dominant-500 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                                {groupe.libelle}
                                <span className="text-xs text-gray-400 ml-auto">({groupe.permissions.length})</span>
                            </button>
                            {isExpanded && (
                                <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                    {groupe.permissions.map(perm => (
                                        <PermissionRow
                                            key={perm.id}
                                            permission={perm}
                                            state={currentState.get(perm.id) ?? null}
                                            effective={effectiveSet.has(perm.code)}
                                            onChange={readonly ? undefined : () => togglePermission(perm.id)}
                                            readonly={readonly}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
                {filteredGroupes.length === 0 && (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <Search className="h-10 w-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                        <p className="text-sm">Aucune permission trouvée</p>
                    </div>
                )}
            </div>

            {/* Footer actions */}
            {!readonly && (
                <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-xs text-gray-400">
                        {changeCount > 0
                            ? `${changeCount} modification${changeCount > 1 ? 's' : ''} en attente`
                            : 'Aucune modification'}
                    </span>
                    <div className="flex gap-2">
                        {onCancel && (
                            <ElisaButton variant="outline" size="sm" onClick={onCancel} disabled={saving}>
                                Annuler
                            </ElisaButton>
                        )}
                        <ElisaButton
                            variant="primary"
                            size="sm"
                            icon={<Save className="h-4 w-4" />}
                            onClick={handleSave}
                            disabled={changeCount === 0}
                            isLoading={saving}
                        >
                            Enregistrer
                        </ElisaButton>
                    </div>
                </div>
            )}
        </div>
    );
}

// ---- PermissionRow ----

interface PermissionRowProps {
    permission: Permission;
    state: PermissionState;
    effective: boolean;
    onChange?: () => void;
    readonly?: boolean;
}

function PermissionRow({ permission, state, effective, onChange, readonly }: PermissionRowProps) {
    return (
        <div className={`flex items-center gap-3 px-3 py-2 text-sm transition-colors
            ${!permission.actif ? 'opacity-50' : ''}
            ${readonly ? '' : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'}
        `}>
            {readonly ? (
                <div className={`h-4 w-4 rounded border flex items-center justify-center flex-shrink-0
                    ${state === 'GRANTED' ? 'bg-blue-600 border-blue-600' : ''}
                    ${state === 'DENIED' ? 'bg-red-50 border-red-400 dark:bg-red-900/30 dark:border-red-500' : ''}
                    ${state === null ? 'border-gray-300 dark:border-gray-500' : ''}
                `}>
                    {state === 'GRANTED' && <CheckCircle className="h-3 w-3 text-white" />}
                    {state === 'DENIED' && <XCircle className="h-3 w-3 text-red-500" />}
                </div>
            ) : (
                <PermissionCheckbox state={state} onToggle={onChange!} />
            )}
            <span className="font-mono text-xs text-gray-800 dark:text-gray-200 flex-1 min-w-0 truncate">
                {permission.code}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block truncate max-w-[200px]">
                {permission.libelle}
            </span>
            <div className="flex items-center gap-1 flex-shrink-0">
                {!permission.actif && (
                    <span title="Permission inactive"><AlertTriangle className="h-3 w-3 text-amber-500" /></span>
                )}
                {state === 'GRANTED' && (
                    <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 px-1.5 py-0.5 rounded">
                        activée
                    </span>
                )}
                {state === 'DENIED' && (
                    <span className="text-[10px] font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded">
                        refusée
                    </span>
                )}
                {effective && state === null && (
                    <span className="text-[10px] text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                        rôle
                    </span>
                )}
            </div>
        </div>
    );
}
