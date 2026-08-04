import {
    Filter, SlidersHorizontal, Search, X, ListRestart,
    FolderOpen, PlusCircle, Ban, Lock,
    Check, Minus,
    ChevronDown, ChevronUp,
} from 'lucide-react';
import { PermissionCheckbox, type PermissionState } from '@/components/ui/PermissionCheckbox';
import type { PermissionAvecSource, PermissionGroupe } from '../types/utilisateur.types';

// ─── Types simplifiés ───

export type PermissionStatut = 'autorisee' | 'refusee';

export function getStatut(source: 'role' | 'granted' | 'denied' | 'none'): PermissionStatut {
    if (source === 'role' || source === 'granted') return 'autorisee';
    return 'refusee';
}

export type SourceFiltre = 'toutes' | 'autorisee' | 'refusee' | 'surchargees';
export type ModuleFiltre = 'tous' | string;

export const SOURCES: { key: SourceFiltre; labelKey: string; }[] = [
    { key: 'toutes', labelKey: 'filtreTous' },
    { key: 'autorisee', labelKey: 'filtreAutorisee' },
    { key: 'refusee', labelKey: 'filtreRefusee' },
    { key: 'surchargees', labelKey: 'filtreSurchargees' },
];

// Filtre une source API vers les catégories du nouveau modèle
export function sourceDansCategorie(source: string, categorie: SourceFiltre): boolean {
    if (categorie === 'toutes') return true;
    if (categorie === 'autorisee') return source === 'role' || source === 'granted';
    if (categorie === 'refusee') return source === 'denied' || source === 'none';
    if (categorie === 'surchargees') return source === 'granted' || source === 'denied';
    return false;
}

// ─── getInitialState : toutes les permissions, mapped GRANTED/DENIED ───

export function getInitialState(detailPerms: PermissionAvecSource[] | undefined): Map<string, PermissionState> {
    const map = new Map<string, PermissionState>();
    if (!detailPerms) return map;
    for (const p of detailPerms) {
        if (p.source === 'role' || p.source === 'granted') map.set(p.permissionId, 'GRANTED');
        else map.set(p.permissionId, 'DENIED');
    }
    return map;
}

// ─── Icône de source (détaillée) — utilisée comme icône discrète ───

export function SourceIcon({ source, className }: { source: string; className?: string }) {
    if (source === 'granted') return <PlusCircle className={`text-blue-500 ${className ?? 'h-3.5 w-3.5'}`} />;
    if (source === 'denied') return <Ban className={`text-red-500 ${className ?? 'h-3.5 w-3.5'}`} />;
    if (source === 'role') return <Lock className={`text-gray-400 dark:text-gray-500 ${className ?? 'h-3.5 w-3.5'}`} />;
    return <div className={`rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 ${className ?? 'h-3.5 w-3.5'}`} />;
}

// ─── Badge compteur module : total ( autorisées / refusées ) ───

export function ModuleCountBadge({ total, authorized }: { total: number; authorized: number }) {
    const refused = total - authorized;
    return (
        <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs tabular-nums leading-none flex-shrink-0">
            <span className="text-gray-400 dark:text-gray-500 font-semibold">{total}</span>
            <span className="inline-flex items-center gap-px text-green-700 dark:text-green-400 bg-green-100/60 dark:bg-green-900/25 px-1.5 py-0.5 rounded-full font-medium">
                <Check className="h-[10px] w-[10px] sm:h-3 sm:w-3" />
                {authorized}
            </span>
            <span className="inline-flex items-center gap-px text-red-600 dark:text-red-400 bg-red-100/60 dark:bg-red-900/25 px-1.5 py-0.5 rounded-full font-medium">
                <X className="h-[10px] w-[10px] sm:h-3 sm:w-3" />
                {refused}
            </span>
        </span>
    );
}

// ─── Barre de filtres source + module ───

interface FilterBarsProps {
    sourceFilter: SourceFiltre;
    setSourceFilter: (v: SourceFiltre) => void;
    filtreModule: string;
    setFiltreModule: (v: string) => void;
    modules: string[];
    sourceCounts: Record<string, number>;
    t: (key: string) => string;
}

export function FilterBars({
    sourceFilter, setSourceFilter,
    filtreModule, setFiltreModule,
    modules, sourceCounts, t,
}: FilterBarsProps) {
    return (
        <>
            <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-1 hidden sm:inline">
                    <SlidersHorizontal className="h-3.5 w-3.5 inline mr-1" />
                    {t('filtreSource')}
                </span>
                {SOURCES.map(s => {
                    const active = sourceFilter === s.key;
                    const count = sourceCounts[s.key] ?? 0;
                    return (
                        <button
                            key={s.key}
                            onClick={() => setSourceFilter(s.key)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-150 ${
                                active
                                    ? 'bg-dominant-100 text-dominant-700 ring-1 ring-dominant-300 dark:bg-dominant-900/60 dark:text-dominant-300 dark:ring-dominant-700'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                            }`}
                        >
                            {t(s.labelKey)}
                            <span className={`ml-0.5 tabular-nums ${active ? 'text-dominant-500 dark:text-dominant-400' : 'text-gray-400 dark:text-gray-500'}`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-1 hidden sm:inline">
                    <Filter className="h-3.5 w-3.5 inline mr-1" />
                    {t('filtreModule')}
                </span>
                <button
                    onClick={() => setFiltreModule('tous')}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                        filtreModule === 'tous'
                            ? 'bg-dominant-100 text-dominant-700 dark:bg-dominant-900 dark:text-dominant-300'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                    }`}
                >
                    {t('filtreTous')}
                </button>
                {modules.map(mod => (
                    <button
                        key={mod}
                        onClick={() => setFiltreModule(mod)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                            filtreModule === mod
                                ? 'bg-dominant-100 text-dominant-700 dark:bg-dominant-900 dark:text-dominant-300'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                        }`}
                    >
                        {mod}
                    </button>
                ))}
            </div>
        </>
    );
}

// ─── Panneau de filtres (search + source + module) — collapsible ───

export interface PermissionFilterPanelProps {
    showFilters: boolean;
    onToggleFilters: () => void;
    search: string;
    onSearchChange: (v: string) => void;
    sourceFilter: SourceFiltre;
    onSourceFilterChange: (v: SourceFiltre) => void;
    filtreModule: string;
    onFiltreModuleChange: (v: string) => void;
    modules: string[];
    sourceCounts: Record<string, number>;
    hasActiveFilters: boolean;
    onClearFilters: () => void;
    allModulesExpanded: boolean;
    onToggleAllModules: () => void;
    editButton?: React.ReactNode;
    t: (key: string) => string;
}

export function PermissionFilterPanel({
    showFilters,
    onToggleFilters,
    search,
    onSearchChange,
    sourceFilter,
    onSourceFilterChange,
    filtreModule,
    onFiltreModuleChange,
    modules,
    sourceCounts,
    hasActiveFilters,
    onClearFilters,
    allModulesExpanded,
    onToggleAllModules,
    editButton,
    t,
}: PermissionFilterPanelProps) {
    return (
        <div className="flex flex-col rounded-lg bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={onToggleFilters}
                    className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-dominant-600 dark:hover:text-dominant-400 transition-colors"
                >
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${showFilters ? '' : '-rotate-90'}`} />
                    <SlidersHorizontal className="h-4 w-4 text-dominant-500" />
                    <span>{t('filtres')}</span>
                    {hasActiveFilters && (
                        <span className="w-2 h-2 rounded-full bg-dominant-500 ml-1" />
                    )}
                </button>
                <div className="flex items-center gap-2">
                    {editButton}
                    <button
                        onClick={onToggleAllModules}
                        className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-dominant-600 dark:text-gray-400 dark:hover:text-dominant-400 transition-colors"
                    >
                        {allModulesExpanded ? (
                            <><ChevronUp className="h-3.5 w-3.5" />{t('toutReplier')}</>
                        ) : (
                            <><ChevronDown className="h-3.5 w-3.5" />{t('toutDeplier')}</>
                        )}
                    </button>
                </div>
            </div>
            {showFilters && (
                <div className="flex flex-col gap-3 p-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => onSearchChange(e.target.value)}
                            placeholder={t('rechercherPermission')}
                            className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-dominant-500 transition-shadow"
                        />
                        {search && (
                            <button
                                onClick={() => onSearchChange('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                aria-label="Clear search"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                    <FilterBars
                        sourceFilter={sourceFilter}
                        setSourceFilter={onSourceFilterChange}
                        filtreModule={filtreModule}
                        setFiltreModule={onFiltreModuleChange}
                        modules={modules}
                        sourceCounts={sourceCounts}
                        t={t}
                    />
                    {hasActiveFilters && (
                        <div className="flex items-center gap-2 pt-1.5 border-t border-gray-200 dark:border-gray-700">
                            <span className="text-[11px] text-dominant-600 dark:text-dominant-400 font-medium flex items-center gap-1">
                                <SlidersHorizontal className="h-3 w-3" />
                                {t('filtresActifs')}
                            </span>
                            <button
                                onClick={onClearFilters}
                                className="text-[11px] text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 flex items-center gap-1 transition-colors"
                            >
                                <ListRestart className="h-3 w-3" />
                                {t('effacerFiltres')}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Arbre de permissions (vue read-only) — checkbox + icône discrète ───

interface ModuleTreeProps {
    groupe: PermissionGroupe;
    isExpanded: boolean;
    onToggleModule: () => void;
    detailMap: Map<string, PermissionAvecSource>;
    moduleCounts?: Map<string, number>;
    t: (key: string) => string;
}

export function ModuleTree({ groupe, isExpanded, onToggleModule, detailMap, moduleCounts }: ModuleTreeProps) {
    const assigned = moduleCounts?.get(groupe.module) ?? 0;
    const total = groupe.permissions.length;
    return (
        <div key={groupe.module}>
            <button
                type="button"
                onClick={onToggleModule}
                className="flex items-center gap-2 w-full px-4 py-3 text-sm font-medium text-left text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
                <FolderOpen className={`h-4 w-4 text-dominant-500 transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`} />
                <span>{groupe.libelle}</span>
                <ModuleCountBadge total={total} authorized={assigned} />
            </button>
            {isExpanded && (
                <div className="divide-y divide-gray-100 dark:divide-gray-700/50 transition-all duration-200">
                    {groupe.permissions.map(perm => {
                        const detail = detailMap.get(perm.id);
                        const source = detail?.source || 'none';
                        const statut = getStatut(source);
                        const rowBg = statut === 'autorisee'
                            ? source === 'granted'
                                ? 'bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-100/50 dark:hover:bg-blue-950/30'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'
                            : 'bg-red-50/40 dark:bg-red-950/20 hover:bg-red-100/50 dark:hover:bg-red-950/30';
                        return (
                            <div
                                key={perm.id}
                                className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 text-sm transition-colors ${rowBg}`}
                            >
                                <span className={`flex-shrink-0 h-4 w-4 rounded border flex items-center justify-center transition-colors ${
                                    statut === 'autorisee'
                                        ? 'bg-dominant-500 border-dominant-500 text-white'
                                        : 'bg-red-50 border-red-400 text-red-500 dark:bg-red-900/30 dark:border-red-500'
                                }`}>
                                    {statut === 'autorisee' && <Check className="h-3 w-3 text-white" />}
                                    {statut === 'refusee' && <Minus className="h-3 w-3" />}
                                </span>
                                <SourceIcon source={source} className="h-3 w-3 flex-shrink-0" />
                                <span className="font-mono text-xs text-gray-800 dark:text-gray-200 flex-1 min-w-0 truncate leading-snug">
                                    {perm.code}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 hidden lg:block truncate max-w-[140px] xl:max-w-[200px]">
                                    {perm.libelle}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ─── Module row en modal d'édition — toggle 2 états (GRANTED ↔ DENIED) ───

interface ModuleEditRowProps {
    groupe: PermissionGroupe;
    isExpanded: boolean;
    onToggleModule: () => void;
    editState: Map<string, PermissionState>;
    onTogglePermission: (id: string) => void;
    onToggleAllModule: () => void;
    t: (key: string) => string;
}

export function ModuleEditRow({
    groupe, isExpanded, onToggleModule,
    editState, onTogglePermission, onToggleAllModule,
    t,
}: ModuleEditRowProps) {
    const allGranted = groupe.permissions.every(p => editState.get(p.id) === 'GRANTED');
    const someGranted = groupe.permissions.some(p => editState.get(p.id) === 'GRANTED');
    const checkedCount = groupe.permissions.filter(p => editState.get(p.id) === 'GRANTED').length;
    const total = groupe.permissions.length;

    return (
        <div key={groupe.module} className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 dark:bg-gray-800/60">
                <button
                    type="button"
                    onClick={onToggleAllModule}
                    className={`h-5 w-5 rounded border flex items-center justify-center flex-shrink-0 transition-all cursor-pointer ${
                        allGranted
                            ? 'bg-dominant-500 border-dominant-500 text-white'
                            : someGranted
                                ? 'border-dominant-400 bg-dominant-50 dark:bg-dominant-900/20'
                                : 'border-gray-300 dark:border-gray-600 hover:border-dominant-400'
                    }`}
                    title={allGranted ? t('deselectAll') : t('selectAll')}
                >
                    {allGranted && <Check className="h-3.5 w-3.5 text-white" />}
                    {someGranted && !allGranted && (
                        <div className="h-2 w-2 rounded-sm bg-dominant-500" />
                    )}
                </button>
                <button
                    type="button"
                    onClick={onToggleModule}
                    className="flex items-center gap-2 flex-1 text-sm font-medium text-left text-gray-700 dark:text-gray-300"
                >
                    <FolderOpen className={`h-4 w-4 text-dominant-500 transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`} />
                    {groupe.libelle}
                    <ModuleCountBadge total={total} authorized={checkedCount} />
                </button>
            </div>
            {isExpanded && (
                <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                    {groupe.permissions.map(perm => {
                        const state = editState.get(perm.id) ?? null;
                        const modalRowBg = state === 'GRANTED'
                            ? 'bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-100/50 dark:hover:bg-blue-950/30'
                            : state === 'DENIED'
                                ? 'bg-red-50/40 dark:bg-red-950/20 hover:bg-red-100/50 dark:hover:bg-red-950/30'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-800/40';
                        return (
                            <div
                                key={perm.id}
                                className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 text-sm transition-colors ${modalRowBg}`}
                            >
                                <PermissionCheckbox
                                    state={state}
                                    onToggle={() => onTogglePermission(perm.id)}
                                    size="sm"
                                />
                                <span className="font-mono text-xs text-gray-800 dark:text-gray-200 flex-1 min-w-0 truncate leading-snug">
                                    {perm.code}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 hidden lg:block truncate max-w-[140px] xl:max-w-[200px]">
                                    {perm.libelle}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
