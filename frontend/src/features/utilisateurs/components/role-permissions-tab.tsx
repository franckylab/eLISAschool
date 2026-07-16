import { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Shield, CheckCircle, Ban, Search, Edit3,
    X, ListRestart, SlidersHorizontal,
    ChevronDown, ChevronUp,
} from 'lucide-react';
import { CardGrid } from '@/components/ui/CardGrid';
import { StatCard } from '@/components/ui/StatCard';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { CustomModal } from '@/components/modals/CustomModal';
import { Card } from '@/components/ui/Card';
import {
    useToutesPermissions,
    useRolePermissionsDetail,
    useBatchRolePermissions,
} from '../hooks/use-roles-permissions';
import { usePermissions } from '@/hooks';
import {
    PermissionFilterPanel,
    ModuleTree,
    ModuleEditRow,
    sourceDansCategorie,
    type SourceFiltre,
    type ModuleFiltre,
} from './permission-utils';
import type { PermissionState } from '@/components/ui/PermissionCheckbox';
import type { PermissionAvecSource } from '../types/utilisateur.types';

interface RolePermissionsTabProps {
    roleId: string;
    estSysteme: boolean;
}

export function RolePermissionsTab({ roleId, estSysteme }: RolePermissionsTabProps) {
    const { t } = useTranslation('utilisateurs');
    const { hasPermission } = usePermissions();
    const peutGererPermissions = hasPermission('roles:manage') && !estSysteme;

    const { data: permissionsGroupes } = useToutesPermissions({ enabled: true });
    const { data: detailPerms } = useRolePermissionsDetail(roleId);
    const batchMutation = useBatchRolePermissions();

    const [modalOpen, setModalOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [filtreModule, setFiltreModule] = useState<ModuleFiltre>('tous');
    const [sourceFilter, setSourceFilter] = useState<SourceFiltre>('toutes');
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
    const [showFilters, setShowFilters] = useState(false);

    // Pour les rôles, le state initial vient du détail des permissions (source: 'role' = GRANTED)
    const initialEditState = useMemo(() => {
        const map = new Map<string, PermissionState>();
        if (!detailPerms) return map;
        for (const p of detailPerms) {
            if (p.source === 'role') map.set(p.permissionId, 'GRANTED');
        }
        return map;
    }, [detailPerms]);

    const [editState, setEditState] = useState<Map<string, PermissionState>>(() => initialEditState);

    useEffect(() => {
        setEditState(initialEditState);
    }, [initialEditState]);

    // ── Modules ──

    const modules = useMemo(() => {
        if (!permissionsGroupes) return [];
        return permissionsGroupes.map(g => g.module).sort();
    }, [permissionsGroupes]);

    const detailMap = useMemo(() => {
        const map = new Map<string, PermissionAvecSource>();
        if (!detailPerms) return map;
        for (const p of detailPerms) {
            map.set(p.permissionId, p);
        }
        return map;
    }, [detailPerms]);

    // ── Stats ──

    const stats = useMemo(() => {
        let assigned = 0, none = 0;
        for (const p of detailPerms || []) {
            if (p.source === 'role') assigned++;
            else none++;
        }
        return { assigned, refused: none, total: (detailPerms || []).length };
    }, [detailPerms]);

    const sourceCounts = useMemo(() => {
        if (!detailPerms) return { toutes: 0, autorisee: 0, refusee: 0, surchargees: 0 };
        const autorisee = detailPerms.filter(p => p.source === 'role').length;
        return {
            toutes: detailPerms.length,
            autorisee,
            refusee: detailPerms.length - autorisee,
            surchargees: 0,
        };
    }, [detailPerms]);

    const hasActiveFilters = !!search || filtreModule !== 'tous' || sourceFilter !== 'toutes';

    const clearFilters = useCallback(() => {
        setSearch('');
        setFiltreModule('tous');
        setSourceFilter('toutes');
    }, []);

    // ── Comptes par module (permissions effectives: tout sauf 'none') ──

    const moduleCounts = useMemo(() => {
        const counts = new Map<string, number>();
        if (!permissionsGroupes || !detailMap) return counts;
        for (const g of permissionsGroupes) {
            let c = 0;
            for (const p of g.permissions) {
                const detail = detailMap.get(p.id);
                if (detail && detail.source !== 'none') c++;
            }
            counts.set(g.module, c);
        }
        return counts;
    }, [permissionsGroupes, detailMap]);

    // ── Filtre vue principale ──

    const filteredModules = useMemo(() => {
        if (!permissionsGroupes) return [];
        let list = permissionsGroupes;
        if (filtreModule !== 'tous') list = list.filter(g => g.module === filtreModule);

        return list
            .map(g => ({
                ...g,
                permissions: g.permissions.filter(p => {
                    if (search) {
                        const q = search.toLowerCase();
                        if (!p.code.toLowerCase().includes(q) && !p.libelle.toLowerCase().includes(q)) return false;
                    }
                    if (sourceFilter !== 'toutes') {
                        const src = detailMap.get(p.id)?.source || 'none';
                        if (!sourceDansCategorie(src, sourceFilter)) return false;
                    }
                    return true;
                }),
            }))
            .filter(g => g.permissions.length > 0);
    }, [permissionsGroupes, filtreModule, sourceFilter, search, detailMap]);

    // ── Handlers modale ──

    const openModal = useCallback(() => {
        setEditState(new Map(initialEditState));
        setExpandedModules(new Set());
        setSearch('');
        setFiltreModule('tous');
        setSourceFilter('toutes');
        setModalOpen(true);
    }, [initialEditState]);

    const closeModal = useCallback(() => {
        setModalOpen(false);
    }, []);

    // Pour les rôles, cycle sans DENIED : null → GRANTED → null
    const togglePermission = useCallback((permissionId: string) => {
        setEditState(prev => {
            const next = new Map(prev);
            const current = prev.get(permissionId) ?? null;
            if (current === 'GRANTED') {
                next.delete(permissionId);
            } else {
                next.set(permissionId, 'GRANTED');
            }
            return next;
        });
    }, []);

    const toggleModule = useCallback((moduleName: string) => {
        setExpandedModules(prev => {
            const next = new Set(prev);
            if (next.has(moduleName)) next.delete(moduleName);
            else next.add(moduleName);
            return next;
        });
    }, []);

    const toggleAllInModule = useCallback((_moduleName: string, permissions: { id: string }[]) => {
        const allIds = permissions.map(p => p.id);
        setEditState(prev => {
            const allGranted = allIds.every(id => prev.get(id) === 'GRANTED');
            const next = new Map(prev);
            if (allGranted) {
                for (const id of allIds) next.delete(id);
            } else {
                for (const id of allIds) next.set(id, 'GRANTED');
            }
            return next;
        });
    }, []);

    const handleSave = useCallback(async () => {
        const initialIds = new Set<string>();
        for (const [id, state] of initialEditState) {
            if (state === 'GRANTED') initialIds.add(id);
        }
        const currentIds = new Set<string>();
        for (const [id, state] of editState) {
            if (state === 'GRANTED') currentIds.add(id);
        }

        const added: string[] = [];
        const removed: string[] = [];

        for (const id of currentIds) {
            if (!initialIds.has(id)) added.push(id);
        }
        for (const id of initialIds) {
            if (!currentIds.has(id)) removed.push(id);
        }

        if (added.length === 0 && removed.length === 0) return;

        await batchMutation.mutateAsync({
            roleId,
            addedPermissionIds: added,
            removedPermissionIds: removed,
        });
        closeModal();
    }, [editState, initialEditState, batchMutation, roleId, closeModal]);

    // ── Filtre modal ──

    const filteredForModal = useMemo(() => {
        if (!permissionsGroupes) return [];
        let list = permissionsGroupes;
        if (filtreModule !== 'tous') list = list.filter(g => g.module === filtreModule);

        return list
            .map(g => ({
                ...g,
                permissions: g.permissions.filter(p => {
                    if (search) {
                        const q = search.toLowerCase();
                        if (!p.code.toLowerCase().includes(q) && !p.libelle.toLowerCase().includes(q)) return false;
                    }
                    return true;
                }),
            }))
            .filter(g => g.permissions.length > 0);
    }, [permissionsGroupes, filtreModule, search]);

    // ── Expand / Collapse All ──

    const allModulesExpanded = useMemo(() => {
        return filteredModules.length > 0 && filteredModules.every(g => expandedModules.has(g.module));
    }, [filteredModules, expandedModules]);

    const allModalModulesExpanded = useMemo(() => {
        return filteredForModal.length > 0 && filteredForModal.every(g => expandedModules.has(g.module));
    }, [filteredForModal, expandedModules]);

    const toggleAllModules = useCallback(() => {
        setExpandedModules(prev => {
            const names = new Set(filteredModules.map(g => g.module));
            const allExpanded = [...names].every(m => prev.has(m));
            const next = new Set(prev);
            for (const m of names) {
                if (allExpanded) next.delete(m);
                else next.add(m);
            }
            return next;
        });
    }, [filteredModules]);

    const toggleAllModalModules = useCallback(() => {
        setExpandedModules(prev => {
            const names = new Set(filteredForModal.map(g => g.module));
            const allExpanded = [...names].every(m => prev.has(m));
            const next = new Set(prev);
            for (const m of names) {
                if (allExpanded) next.delete(m);
                else next.add(m);
            }
            return next;
        });
    }, [filteredForModal]);

    const changeCount = useMemo(() => {
        let count = 0;
        for (const [id, s] of editState) {
            if (initialEditState.get(id) !== s) count++;
        }
        for (const [id, s] of initialEditState) {
            if (!editState.has(id) && s !== null) count++;
        }
        return count;
    }, [editState, initialEditState]);

    return (
        <div className="space-y-6">
            {/* Stats cards */}
            <CardGrid columns={{ default: 1, md: 3 }}>
                <StatCard icon={Shield} label={t('permissionsTotal')} value={stats.total} color="blue" />
                <StatCard icon={CheckCircle} label={t('statAutorisee')} value={stats.assigned} color="green" />
                <StatCard icon={Ban} label={t('sourceDenied')} value={stats.refused} color="red" />
            </CardGrid>

            {/* Filter panel — search + source + module pills, collapsible */}
            <PermissionFilterPanel
                showFilters={showFilters}
                onToggleFilters={() => setShowFilters(prev => !prev)}
                search={search}
                onSearchChange={setSearch}
                sourceFilter={sourceFilter}
                onSourceFilterChange={setSourceFilter}
                filtreModule={filtreModule}
                onFiltreModuleChange={setFiltreModule}
                modules={modules}
                sourceCounts={sourceCounts}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={clearFilters}
                allModulesExpanded={allModulesExpanded}
                onToggleAllModules={toggleAllModules}
                editButton={peutGererPermissions ? (
                    <ElisaButton variant="primary" size="sm" icon={<Edit3 className="h-4 w-4" />} onClick={openModal}>
                        {t('modifierPermissions')}
                    </ElisaButton>
                ) : undefined}
                t={t}
            />

            {/* VUE PRINCIPALE : Permissions groupées */}
            <Card>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredModules.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            {hasActiveFilters ? (
                                <>
                                    <SlidersHorizontal className="h-10 w-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                                    <p className="text-sm font-medium">{t('aucunResultat')}</p>
                                    <p className="text-xs mt-1 text-gray-400 dark:text-gray-500">{t('aucunResultatDetail')}</p>
                                    <button
                                        onClick={clearFilters}
                                        className="mt-3 inline-flex items-center gap-1 text-xs text-dominant-600 hover:text-dominant-700 dark:text-dominant-400 dark:hover:text-dominant-300 font-medium transition-colors"
                                    >
                                        <ListRestart className="h-3 w-3" />
                                        {t('effacerFiltres')}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Shield className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                                    <p className="text-sm">{t('aucunePermissionTrouvee')}</p>
                                </>
                            )}
                        </div>
                    ) : (
                        filteredModules.map(groupe => {
                            const isExpanded = expandedModules.has(groupe.module) || !!search || filtreModule !== 'tous' || sourceFilter !== 'toutes';
                            return (
                                <ModuleTree
                                    key={groupe.module}
                                    groupe={groupe}
                                    isExpanded={isExpanded}
                                    onToggleModule={() => toggleModule(groupe.module)}
                                    detailMap={detailMap}
                                    moduleCounts={moduleCounts}
                                    t={t}
                                />
                            );
                        })
                    )}
                </div>
            </Card>

            {/* MODAL D'ÉDITION — avec cycle null→GRANTED→null (skip DENIED pour les rôles) */}
            <CustomModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                title={t('modifierPermissions')}
                description={t('modifierPermissionsDesc')}
                size="3xl"
                footer={
                    <div className="flex items-center justify-between w-full gap-2">
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                            {changeCount > 0
                                ? t('modificationsEnAttente', { count: changeCount })
                                : t('aucuneModification')}
                        </span>
                        <div className="flex gap-2">
                            <ElisaButton variant="outline" size="sm" onClick={closeModal} disabled={batchMutation.isPending}>
                                {t('annuler')}
                            </ElisaButton>
                            <ElisaButton
                                variant="primary"
                                size="sm"
                                onClick={handleSave}
                                disabled={changeCount === 0}
                                isLoading={batchMutation.isPending}
                            >
                                {t('sauvegarder')}
                            </ElisaButton>
                        </div>
                    </div>
                }
            >
                <div className="flex flex-col max-h-[65vh]">
                    {/* Sticky header */}
                    <div className="flex-shrink-0 space-y-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder={t('rechercherPermission')}
                                className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-dominant-500 transition-shadow"
                            />
                            {search && (
                                <button
                                    onClick={() => setSearch('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center justify-between gap-2">
                            <div className="flex gap-2 overflow-x-auto">
                                <button
                                    onClick={() => setFiltreModule('tous')}
                                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                                        filtreModule === 'tous'
                                            ? 'bg-dominant-100 text-dominant-700 dark:bg-dominant-900 dark:text-dominant-300'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    <SlidersHorizontal className="h-3 w-3" />
                                    {t('filtreTous')}
                                </button>
                                {modules.map(mod => (
                                    <button
                                        key={mod}
                                        onClick={() => setFiltreModule(mod)}
                                        className={`px-2.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                                            filtreModule === mod
                                                ? 'bg-dominant-100 text-dominant-700 dark:bg-dominant-900 dark:text-dominant-300'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                                        }`}
                                    >
                                        {mod}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={toggleAllModalModules}
                                className="flex-shrink-0 flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-dominant-600 dark:text-gray-400 dark:hover:text-dominant-400 transition-colors"
                            >
                                {allModalModulesExpanded ? (
                                    <><ChevronUp className="h-3.5 w-3.5" />{t('toutReplier')}</>
                                ) : (
                                    <><ChevronDown className="h-3.5 w-3.5" />{t('toutDeplier')}</>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Scrollable tree */}
                    <div className="flex-1 overflow-y-auto space-y-4 pt-3 pr-1">
                        {filteredForModal.map(groupe => {
                            const isExpanded = expandedModules.has(groupe.module) || !!search || filtreModule !== 'tous';
                            return (
                                <ModuleEditRow
                                    key={groupe.module}
                                    groupe={groupe}
                                    isExpanded={isExpanded}
                                    onToggleModule={() => toggleModule(groupe.module)}
                                    editState={editState}
                                    onTogglePermission={togglePermission}
                                    onToggleAllModule={() => toggleAllInModule(groupe.module, groupe.permissions)}
                                    t={t}
                                />
                            );
                        })}

                        {filteredForModal.length === 0 && (
                            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                <Search className="h-10 w-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                                <p className="text-sm">{t('aucunePermissionTrouvee')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </CustomModal>
        </div>
    );
}
