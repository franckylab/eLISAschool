import { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Shield, CheckCircle, Filter, Search, Edit3,
    X, ListRestart, SlidersHorizontal,
    RotateCcw, AlertTriangle, ChevronDown, ChevronUp,
    PlusCircle, Ban, ArrowRight,
} from 'lucide-react';
import { CardGrid } from '@/components/ui/CardGrid';
import { StatCard } from '@/components/ui/StatCard';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { CustomModal } from '@/components/modals/CustomModal';
import { Card, CardSection } from '@/components/ui/Card';
import {
    useToutesPermissions,
    useEffectivePermissionsDetail,
    useBatchPermissionsUtilisateur,
} from '../hooks/use-roles-permissions';
import { usePermissions } from '@/hooks';
import {
    PermissionFilterPanel,
    ModuleTree,
    ModuleEditRow,
    getInitialState,
    sourceDansCategorie,
    type SourceFiltre,
    type ModuleFiltre,
} from './permission-utils';
import { ChangeRoleModal } from './change-role-modal';
import type { Utilisateur } from '../types/utilisateur.types';
import type { PermissionState } from '@/components/ui/PermissionCheckbox';
import type { PermissionAvecSource } from '../types/utilisateur.types';

export function UserPermissionsTab({ utilisateur }: { utilisateur: Utilisateur }) {
    const { t } = useTranslation('utilisateurs');
    const { hasPermission } = usePermissions();
    const peutGererPermissions = hasPermission('roles:manage');
    const peutChangerRole = hasPermission('utilisateurs:role:change');

    const { data: permissionsGroupes } = useToutesPermissions({ enabled: peutGererPermissions });
    const { data: detailPerms } = useEffectivePermissionsDetail(utilisateur.id, { enabled: peutGererPermissions });
    const batchMutation = useBatchPermissionsUtilisateur();

    const [modalOpen, setModalOpen] = useState(false);
    const [showChangeRoleModal, setShowChangeRoleModal] = useState(false);
    const [search, setSearch] = useState('');
    const [filtreModule, setFiltreModule] = useState<ModuleFiltre>('tous');
    const [sourceFilter, setSourceFilter] = useState<SourceFiltre>('toutes');
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
    const [showFilters, setShowFilters] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    const initialEditState = useMemo(() => getInitialState(detailPerms), [detailPerms]);
    const [editState, setEditState] = useState<Map<string, PermissionState>>(() => initialEditState);

    useEffect(() => {
        setEditState(initialEditState);
    }, [initialEditState]);

    // ── Index et statistiques ──

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

    const stats = useMemo(() => {
        let roleCount = 0, grantedCount = 0, denied = 0, none = 0;
        for (const p of detailPerms || []) {
            if (p.source === 'granted') grantedCount++;
            else if (p.source === 'denied') denied++;
            else if (p.source === 'role') roleCount++;
            else none++;
        }
        return {
            roleCount, grantedCount,
            autorisees: roleCount + grantedCount,
            refused: denied + none,
            total: (detailPerms || []).length,
        };
    }, [detailPerms]);

    // Comptes par catégorie pour les pills
    const sourceCounts = useMemo(() => {
        if (!detailPerms) return { toutes: 0, autorisee: 0, refusee: 0, surchargees: 0 };
        return {
            toutes: detailPerms.length,
            autorisee: detailPerms.filter(p => p.source === 'role' || p.source === 'granted').length,
            refusee: detailPerms.filter(p => p.source === 'denied' || p.source === 'none').length,
            surchargees: detailPerms.filter(p => p.source === 'granted' || p.source === 'denied').length,
        };
    }, [detailPerms]);

    // Vérifie si un filtre non-défaut est actif
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
                if (detail && (detail.source === 'role' || detail.source === 'granted')) c++;
            }
            counts.set(g.module, c);
        }
        return counts;
    }, [permissionsGroupes, detailMap]);

    // ── Filtre combiné : module + source + recherche (vue principale) ──
    const filteredModules = useMemo(() => {
        if (!permissionsGroupes) return [];
        let list = permissionsGroupes;
        if (filtreModule !== 'tous') list = list.filter(g => g.module === filtreModule);

        return list
            .map(g => ({
                ...g,
                permissions: g.permissions.filter(p => {
                    // Filtre texte
                    if (search) {
                        const q = search.toLowerCase();
                        if (!p.code.toLowerCase().includes(q) && !p.libelle.toLowerCase().includes(q)) return false;
                    }
                    // Filtre source (catégories simplifiées)
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
        setEditState(getInitialState(detailPerms));
        setExpandedModules(new Set());
        setSearch('');
        setFiltreModule('tous');
        setSourceFilter('toutes');
        setShowResetConfirm(false);
        setModalOpen(true);
    }, [detailPerms, modules]);

    const closeModal = useCallback(() => {
        setModalOpen(false);
    }, []);

    const togglePermission = useCallback((permissionId: string) => {
        setEditState(prev => {
            const next = new Map(prev);
            const current = prev.get(permissionId) ?? 'DENIED';
            next.set(permissionId, current === 'GRANTED' ? 'DENIED' : 'GRANTED');
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
            const newVal = allGranted ? 'DENIED' : 'GRANTED';
            for (const id of allIds) next.set(id, newVal);
            return next;
        });
    }, []);

    const handleSave = useCallback(async () => {
        const initial = getInitialState(detailPerms);
        const entries: Array<{ permissionId: string; type: 'GRANTED' | 'DENIED' | null }> = [];
        for (const p of detailPerms || []) {
            const current = editState.get(p.permissionId);
            const was = initial.get(p.permissionId);
            if (current === undefined) {
                // Reset : permission retirée d'editState → supprimer la surcharge si existante
                if (p.source === 'granted' || p.source === 'denied') {
                    entries.push({ permissionId: p.permissionId, type: null });
                }
            } else if (current !== was) {
                // Changement : GRANTED ↔ DENIED
                entries.push({ permissionId: p.permissionId, type: current });
            }
            // else : pas de changement
        }
        if (entries.length === 0) return;
        await batchMutation.mutateAsync({ userId: utilisateur.id, permissions: entries });
        closeModal();
    }, [editState, detailPerms, batchMutation, utilisateur.id, closeModal]);

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
        const initial = getInitialState(detailPerms);
        let count = 0;
        for (const [id, s] of editState) {
            if (initial.get(id) !== s) count++;
        }
        // Permissions retirées de l'editState : compter seulement les surcharges existantes
        for (const p of detailPerms || []) {
            const current = editState.get(p.permissionId);
            if (current === undefined && (p.source === 'granted' || p.source === 'denied')) {
                count++;
            }
        }
        return count;
    }, [editState, detailPerms]);

    // Compte les surcharges (existantes + en cours) pour le reset
    const directCounts = useMemo(() => {
        const initial = getInitialState(detailPerms);
        let granted = 0, denied = 0;
        for (const p of detailPerms || []) {
            const desired = editState.get(p.permissionId);
            const was = initial.get(p.permissionId);
            if (desired === undefined) {
                // Reset : compter les surcharges existantes à supprimer
                if (p.source === 'granted') granted++;
                else if (p.source === 'denied') denied++;
            } else if (desired !== was) {
                // Changement en cours
                if (desired === 'GRANTED') granted++;
                else denied++;
            } else if (p.source === 'granted') {
                granted++; // surcharge GRANTED existante inchangée
            } else if (p.source === 'denied') {
                denied++; // surcharge DENIED existante inchangée
            }
        }
        return { granted, denied, total: granted + denied };
    }, [editState, detailPerms]);

    const hasDirectPermissions = directCounts.total > 0;

    const handleResetToRole = useCallback(() => {
        setEditState(new Map());
        setShowResetConfirm(false);
    }, []);

    // ── Note: FilterBars et ModuleTree sont désormais importés depuis permission-utils ──

    return (
        <div className="space-y-6">
            {/* Stats cards */}
            <CardGrid columns={{ default: 1, md: 3 }}>
                <StatCard icon={Shield} label={t('permissionsTotal')} value={stats.total} color="blue" />
                <StatCard
                    icon={CheckCircle}
                    label={t('statAutorisee')}
                    value={stats.autorisees}
                    color="green"
                    subtitle={t('statAutoriseeTooltip', { roleCount: stats.roleCount, grantedCount: stats.grantedCount })}
                />
                <StatCard icon={Ban} label={t('statRefusee')} value={stats.refused} color="red" />
            </CardGrid>

            {/* Changement de rôle */}
            <CardSection
                icon={<Shield className="h-5 w-5" />}
                title={t('rolePrincipal')}
                noAnimation
            >
                <div className="flex items-center gap-4">
                    <span className="inline-flex items-center gap-2 rounded-full bg-dominant-100 dark:bg-dominant-900 px-4 py-2 text-sm font-medium text-dominant-800 dark:text-dominant-200">
                        <Shield className="h-4 w-4" />
                        {utilisateur.role}
                    </span>
                    {peutChangerRole && (
                        <ElisaButton
                            variant="outline"
                            size="sm"
                            icon={<ArrowRight className="h-4 w-4" />}
                            onClick={() => setShowChangeRoleModal(true)}
                        >
                            {t('changerRole.bouton')}
                        </ElisaButton>
                    )}
                </div>
            </CardSection>

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

            {/* MODAL D'ÉDITION */}
            <CustomModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                title={t('modifierPermissions')}
                description={t('modifierPermissionsDesc')}
                size="3xl"
                footer={
                    <div className="flex items-center justify-between w-full gap-2">
                        {showResetConfirm ? (
                            <div className="flex items-center gap-2 flex-wrap">
                                <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                                <span className="text-xs text-amber-700 dark:text-amber-400">
                                    {t('confirmerResetPermissions', directCounts)}
                                </span>
                                <ElisaButton
                                    variant="danger"
                                    size="sm"
                                    onClick={handleResetToRole}
                                    isLoading={batchMutation.isPending}
                                >
                                    {t('confirmerReset')}
                                </ElisaButton>
                                <ElisaButton
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowResetConfirm(false)}
                                    disabled={batchMutation.isPending}
                                >
                                    {t('resetAnnuler')}
                                </ElisaButton>
                            </div>
                        ) : (
                            <>
                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                    {changeCount > 0
                                        ? t('modificationsEnAttente', { count: changeCount })
                                        : t('aucuneModification')}
                                </span>
                                <div className="flex gap-2">
                                    {hasDirectPermissions && (
                                        <ElisaButton
                                            variant="outline"
                                            size="sm"
                                            icon={<RotateCcw className="h-3.5 w-3.5" />}
                                            onClick={() => setShowResetConfirm(true)}
                                            disabled={batchMutation.isPending}
                                        >
                                            {t('resetterPermissions')}
                                        </ElisaButton>
                                    )}
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
                            </>
                        )}
                    </div>
                }
            >
                <div className="flex flex-col max-h-[65vh]">
                    {/* Sticky header : search + filtre module + expand/collapse all */}
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
                                    <Filter className="h-3 w-3" />
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

            <ChangeRoleModal
                open={showChangeRoleModal}
                onOpenChange={setShowChangeRoleModal}
                utilisateur={utilisateur}
            />
        </div>
    );
}
