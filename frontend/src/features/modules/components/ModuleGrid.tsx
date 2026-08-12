/**
 * ModuleGrid — Grille responsive de modules avec filtres
 * Composant réutilisable (P5.2 v7)
 */
import { useState, useMemo } from 'react';
import { cn } from '@/lib/cn';
import { Search, SlidersHorizontal } from 'lucide-react';
import { ModuleCard, type ModuleCardProps } from './ModuleCard';
import type { ModuleRegistryEntry } from '@/features/configuration/types/configuration.types';

export interface ModuleGridProps {
    modules: { entry: ModuleRegistryEntry; actif: boolean }[];
    onToggle?: (code: string, actif: boolean) => void;
    onSelect?: (code: string) => void;
    togglingModules?: Set<string>;
    /** Afficher la barre de recherche/filtres */
    showFilters?: boolean;
    className?: string;
}

type CategorieFilter = 'ALL' | 'CRITIQUE' | 'PREMIUM' | 'ADDON';
type StatusFilter = 'ALL' | 'ACTIF' | 'INACTIF';

export function ModuleGrid({
    modules,
    onToggle,
    onSelect,
    togglingModules = new Set(),
    showFilters = true,
    className,
}: ModuleGridProps) {
    const [search, setSearch] = useState('');
    const [categorieFilter, setCategorieFilter] = useState<CategorieFilter>('ALL');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

    const filtered = useMemo(() => {
        return modules.filter(({ entry, actif }) => {
            // Recherche textuelle
            if (search) {
                const q = search.toLowerCase();
                if (
                    !entry.label.toLowerCase().includes(q) &&
                    !entry.name.toLowerCase().includes(q) &&
                    !entry.description?.toLowerCase().includes(q)
                ) {
                    return false;
                }
            }
            // Filtre catégorie
            if (categorieFilter !== 'ALL' && entry.category !== categorieFilter) return false;
            // Filtre statut
            if (statusFilter === 'ACTIF' && !actif) return false;
            if (statusFilter === 'INACTIF' && actif) return false;
            return true;
        });
    }, [modules, search, categorieFilter, statusFilter]);

    const counts = useMemo(() => ({
        total: modules.length,
        actifs: modules.filter(m => m.actif).length,
        critiques: modules.filter(m => m.entry.category === 'CRITIQUE').length,
        premium: modules.filter(m => m.entry.category === 'PREMIUM').length,
        addons: modules.filter(m => m.entry.category === 'ADDON').length,
    }), [modules]);

    return (
        <div className={cn('space-y-4', className)}>
            {/* Filtres */}
            {showFilters && (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {/* Recherche */}
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Rechercher un module..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className={cn(
                                'w-full rounded-lg border border-zinc-200 dark:border-zinc-800 py-2 pl-9 pr-3 text-sm',
                                'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100',
                                'placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30',
                            )}
                        />
                    </div>

                    {/* Compteurs */}
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <span className="font-medium">{counts.actifs}</span>
                        <span>/</span>
                        <span>{counts.total}</span>
                        <span>actifs</span>
                    </div>
                </div>
            )}

            {/* Tabs filtres */}
            {showFilters && (
                <div className="flex flex-wrap gap-2">
                    {/* Catégorie */}
                    <div className="flex items-center gap-1 rounded-lg bg-zinc-100 dark:bg-zinc-800/50 p-1">
                        {(['ALL', 'CRITIQUE', 'PREMIUM', 'ADDON'] as CategorieFilter[]).map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setCategorieFilter(cat)}
                                className={cn(
                                    'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                                    categorieFilter === cat
                                        ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                                        : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300',
                                )}
                            >
                                {cat === 'ALL' ? 'Tous' : cat === 'CRITIQUE' ? 'Critiques' : cat === 'PREMIUM' ? 'Premium' : 'Addons'}
                            </button>
                        ))}
                    </div>

                    {/* Statut */}
                    <div className="flex items-center gap-1 rounded-lg bg-zinc-100 dark:bg-zinc-800/50 p-1">
                        {(['ALL', 'ACTIF', 'INACTIF'] as StatusFilter[]).map((st) => (
                            <button
                                key={st}
                                onClick={() => setStatusFilter(st)}
                                className={cn(
                                    'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                                    statusFilter === st
                                        ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                                        : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300',
                                )}
                            >
                                {st === 'ALL' ? 'Tous' : st === 'ACTIF' ? 'Actifs' : 'Inactifs'}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Grille */}
            {filtered.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {filtered.map(({ entry, actif }) => (
                        <ModuleCard
                            key={entry.name}
                            module={entry}
                            actif={actif}
                            onToggle={onToggle}
                            onClick={onSelect}
                            isToggling={togglingModules.has(entry.name)}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <SlidersHorizontal className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mb-3" />
                    <p className="text-sm text-zinc-500">Aucun module ne correspond aux filtres</p>
                </div>
            )}
        </div>
    );
}

export default ModuleGrid;
