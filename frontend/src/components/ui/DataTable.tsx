/**
 * ==================================
 * eLISAschool - Tableau de Données Avancé
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * Composant de tableau réutilisable avec :
 * - Tri (local ou contrôlé), pagination, recherche
 * - Redimensionnement des colonnes (drag handle)
 * - Réorganisation des colonnes (drag & drop @dnd-kit)
 * - Affichage/masquage des colonnes (Radix dropdown)
 * - En-tête sticky (fixé lors du scroll vertical)
 * - Colonnes épinglées (fixées lors du scroll horizontal)
 * - Hauteur de lignes ajustable (Compact/Normal/Confortable)
 * - Rétro-compatibilité API française (colonnes/donnees)
 */

import {
    useState,
    useMemo,
    useCallback,
    useRef,
    useEffect,
    memo,
} from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
    useReactTable,
    getCoreRowModel,
    type ColumnDef,
    type ColumnSizingState,
    type VisibilityState,
} from '@tanstack/react-table';
import {
    DndContext,
    PointerSensor,
    useSensor,
    useSensors,
    closestCenter,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    useSortable,
    arrayMove,
    horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import Fuse from 'fuse.js';
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    GripVertical,
    Settings2,
    Search,
    Check,
    Rows3,
    Pin,
} from 'lucide-react';
import { ElisaButton } from '@/components/ui/ElisaButton';
import type { ReactNode } from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';

/* ================================================================
 * INTERFACES
 * ================================================================ */

export interface Column<T> {
    /** Clé unique identifiant la colonne (correspond à un champ de T) */
    key: string;
    /** Texte affiché dans l'en-tête */
    header: string;
    /** Fonction de rendu personnalisé pour chaque cellule */
    render?: (item: T, index: number) => ReactNode;
    /** Active le tri sur cette colonne */
    sortable?: boolean;
    /** Classes CSS additionnelles pour th et td */
    className?: string;
    /** Largeur initiale en pixels (défaut: 150) */
    size?: number;
    /** Largeur minimale en pixels (défaut: 50) */
    minSize?: number;
    /** Largeur maximale en pixels (défaut: 800) */
    maxSize?: number;
    /** Désactive le redimensionnement pour cette colonne */
    enableResizing?: boolean;
    /** Épingle la colonne : `true`/`'left'` (gauche), `'right'` (droite), `false` (pas épinglé) */
    pinned?: boolean | 'left' | 'right';
    /** Masque la colonne par défaut (l'utilisateur peut la ré-afficher) */
    hidden?: boolean;
    /** Empêche l'utilisateur de masquer cette colonne (ex: colonne Actions) */
    enableHiding?: boolean;
    /** Empêche le glisser-déposer sur cette colonne */
    enableReordering?: boolean;
    /** Active l'épinglage des colonnes (défaut: false) */
    enablePinning?: boolean;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    isLoading?: boolean;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages?: number;
        hasNext?: boolean;
        hasPrev?: boolean;
        onPageChange?: (page: number) => void;
    };
    onPageChange?: (page: number) => void;
    onLimitChange?: (limit: number) => void;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    onSortChange?: (sortBy: string, sortOrder: 'ASC' | 'DESC') => void;
    getRowId?: (item: T, index: number) => string;
    emptyMessage?: string;
    /** Alias français — rétro-compatibilité */
    colonnes?: Column<T>[];
    donnees?: T[];
    /** Active le redimensionnement global des colonnes (défaut: true) */
    enableResizing?: boolean;
    /** Active la réorganisation des colonnes par glisser-déposer (défaut: false) */
    enableReordering?: boolean;
    /** Active l'épinglage des colonnes (défaut: false) */
    enablePinning?: boolean;
    /** Active le menu de visibilité des colonnes (défaut: true) */
    enableColumnVisibility?: boolean;
    /** Active l'en-tête sticky (défaut: true) */
    stickyHeader?: boolean;
    /** Hauteur max du tableau avant scroll vertical (défaut: 70vh si sticky) */
    maxHeight?: string | number;
    /** Active l'ajustement de la hauteur des lignes (défaut: false) */
    enableRowHeight?: boolean;
    /** Hauteur de ligne par défaut en pixels (défaut: 48) */
    defaultRowHeight?: number;
    /** Active la barre de recherche intégrée */
    searchable?: boolean;
    /** Placeholder de la barre de recherche (défaut: 'Rechercher...') */
    searchPlaceholder?: string;
    /** Filtres rapides configurables par la page */
    filtres?: {
        /** Clé unique du filtre */
        key: string;
        /** Label affiché */
        label: string;
        /** Options du select */
        options: { value: string; label: string }[];
        /** Option "tous" par défaut */
        allOptionLabel?: string;
    }[];
    /** Callback quand la recherche change (filtrage serveur) */
    onSearchChange?: (recherche: string) => void;
    /** Callback quand un filtre change (filtrage serveur) */
    onFilterChange?: (key: string, valeur: string) => void;
    /** Désactive la recherche Fuse.js côté client (utilise uniquement le callback serveur) */
    disableClientSearch?: boolean;
    /** Callback quand l'ordre des colonnes change */
    onColumnOrderChange?: (columnOrder: string[]) => void;
    /** Callback quand la visibilité des colonnes change */
    onColumnVisibilityChange?: (visibility: Record<string, boolean>) => void;
}

/* ================================================================
 * UTILITAIRES
 * ================================================================ */

/** Normalise la pagination entre le pattern A (totalPages/hasNext) et B (onPageChange interne) */
function normaliserPagination(pagination: DataTableProps<any>['pagination'], onPageChangeProp?: (page: number) => void, onLimitChangeProp?: (limit: number) => void) {
    if (!pagination) return null;
    const totalPages = Math.max(1, pagination.totalPages ?? (Math.ceil(pagination.total / pagination.limit) || 1));
    return {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages,
        hasNext: pagination.hasNext ?? (pagination.page < totalPages),
        hasPrev: pagination.hasPrev ?? (pagination.page > 1),
        onPageChange: pagination.onPageChange ?? onPageChangeProp,
        onLimitChange: onLimitChangeProp,
    };
}

/** Génère l'état initial de visibilité à partir des colonnes (hidden par défaut) */
function buildInitialVisibility<T>(colonnes: Column<T>[]): VisibilityState {
    const visibilite: VisibilityState = {};
    for (const col of colonnes) {
        if (col.hidden) visibilite[col.key] = false;
    }
    return visibilite;
}

/** Presets de hauteur de lignes */
const PRESETS_HAUTEUR = [
    { label: 'Compact', valeur: 36 },
    { label: 'Normal', valeur: 48 },
    { label: 'Confortable', valeur: 64 },
];

/* ================================================================
 * SOUS-COMPOSANT : Cellule d'en-tête SIMPLE (sans DnD)
 * Utilisée quand enableReordering est désactivé
 * ================================================================ */

interface CelluleEnTeteProps {
    col: Column<any>;
    index: number;
    isResizing: boolean;
    isSorted: boolean;
    sortDirection: 'ASC' | 'DESC' | null;
    largeur: number;
    estPinned: boolean;
    offsetPinned: number;
    enableResize: boolean;
    enableDrag: boolean;
    onSort: () => void;
    onResizeStart: (e: React.MouseEvent | React.TouchEvent, key: string) => void;
    onResizeMove: (e: React.MouseEvent | React.TouchEvent) => void;
    onResizeEnd: () => void;
    isSticky: boolean;
}

/** En-tête simple — sans @dnd-kit, rendu propre sans attributs ARIA superflus */
const CelluleEnTeteSimple = memo(function CelluleEnTeteSimple({
    col,
    isResizing,
    isSorted,
    sortDirection,
    largeur,
    estPinned,
    offsetPinned,
    enableResize,
    onSort,
    onResizeStart,
    onResizeMove,
    onResizeEnd,
    isSticky,
}: CelluleEnTeteProps) {
    const style: React.CSSProperties = {
        width: largeur,
        minWidth: col.minSize ?? 50,
        maxWidth: col.maxSize ?? 800,
        position: estPinned ? 'sticky' as const : undefined,
        left: estPinned ? offsetPinned : undefined,
        zIndex: estPinned ? 6 : (isSticky ? 5 : undefined),
        backgroundColor: estPinned ? 'var(--color-surface-alt)' : undefined,
    };

    return (
        <th
            style={style}
            className={`relative font-medium text-[var(--color-text-secondary)] select-none ${
                col.sortable ? 'cursor-pointer' : ''
            } ${estPinned ? 'border-r border-[var(--color-border)]' : ''} ${col.className || ''}`}
            onClick={() => col.sortable && onSort()}
        >
            <div className="flex items-center gap-[clamp(0.25rem,0.2rem+0.1vw,0.375rem)]" style={{ padding: 'var(--padding-table-cell)' }}>
                <span className="truncate" style={{ fontSize: 'clamp(0.75rem, 0.65rem + 0.3vw, 0.875rem)' }}>{col.header}</span>
                {col.sortable && (
                    <>
                        {isSorted ? (
                            sortDirection === 'ASC' ? (
                                <ArrowUp className="h-[var(--icon-xs)] w-[var(--icon-xs)] shrink-0" />
                            ) : (
                                <ArrowDown className="h-[var(--icon-xs)] w-[var(--icon-xs)] shrink-0" />
                            )
                        ) : (
                            <ArrowUpDown className="h-[var(--icon-xs)] w-[var(--icon-xs)] shrink-0 opacity-40" />
                        )}
                    </>
                )}
                {col.pinned && (
                    <Pin className="h-[var(--icon-xs)] w-[var(--icon-xs)] shrink-0 text-[var(--color-dominant-500)]" />
                )}
            </div>
            {/* Poignée de redimensionnement */}
            {enableResize && col.enableResizing !== false && (
                <div
                    className={`absolute right-0 top-0 h-full w-1 cursor-col-resize select-none transition-colors ${
                        isResizing
                            ? 'bg-[var(--color-dominant-500)]'
                            : 'hover:bg-[var(--color-dominant-300)]'
                    }`}
                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onResizeStart(e, col.key); }}
                    onTouchStart={(e) => { e.stopPropagation(); onResizeStart(e, col.key); }}
                    onMouseMove={onResizeMove}
                    onMouseUp={onResizeEnd}
                    onTouchMove={onResizeMove}
                    onTouchEnd={onResizeEnd}
                />
            )}
        </th>
    );
});

/** En-tête avec DnD — utilise useSortable de @dnd-kit */
const CelluleEnTeteSortable = memo(function CelluleEnTeteSortable({
    col,
    isResizing,
    isSorted,
    sortDirection,
    largeur,
    estPinned,
    offsetPinned,
    enableResize,
    onSort,
    onResizeStart,
    onResizeMove,
    onResizeEnd,
    isSticky,
}: CelluleEnTeteProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: col.key,
        disabled: col.enableReordering === false,
    });

    const style: React.CSSProperties = {
        width: largeur,
        minWidth: col.minSize ?? 50,
        maxWidth: col.maxSize ?? 800,
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        position: estPinned ? 'sticky' as const : undefined,
        left: estPinned ? offsetPinned : undefined,
        zIndex: estPinned ? 6 : (isSticky ? 5 : undefined),
        backgroundColor: estPinned ? 'var(--color-surface-alt)' : undefined,
    };

    return (
        <th
            ref={setNodeRef}
            style={style}
            className={`relative font-medium text-[var(--color-text-secondary)] select-none ${
                col.sortable ? 'cursor-pointer' : ''
            } ${estPinned ? 'border-r border-[var(--color-border)]' : ''} ${col.className || ''}`}
            onClick={() => col.sortable && onSort()}
            {...attributes}
        >
            <div className="flex items-center gap-[clamp(0.25rem,0.2rem+0.1vw,0.375rem)]" style={{ padding: 'var(--padding-table-cell)' }}>
                {col.enableReordering !== false && (
                    <button
                        className="cursor-grab touch-none text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] active:cursor-grabbing"
                        {...listeners}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <GripVertical className="h-[clamp(0.75rem,0.65rem+0.3vw,0.875rem)] w-[clamp(0.75rem,0.65rem+0.3vw,0.875rem)]" />
                    </button>
                )}
                <span className="truncate" style={{ fontSize: 'clamp(0.75rem, 0.65rem + 0.3vw, 0.875rem)' }}>{col.header}</span>
                {col.sortable && (
                    <>
                        {isSorted ? (
                            sortDirection === 'ASC' ? (
                                <ArrowUp className="h-[var(--icon-xs)] w-[var(--icon-xs)] shrink-0" />
                            ) : (
                                <ArrowDown className="h-[var(--icon-xs)] w-[var(--icon-xs)] shrink-0" />
                            )
                        ) : (
                            <ArrowUpDown className="h-[var(--icon-xs)] w-[var(--icon-xs)] shrink-0 opacity-40" />
                        )}
                    </>
                )}
                {col.pinned && (
                    <Pin className="h-[var(--icon-xs)] w-[var(--icon-xs)] shrink-0 text-[var(--color-dominant-500)]" />
                )}
            </div>
            {/* Poignée de redimensionnement */}
            {enableResize && col.enableResizing !== false && (
                <div
                    className={`absolute right-0 top-0 h-full w-1 cursor-col-resize select-none transition-colors ${
                        isResizing
                            ? 'bg-[var(--color-dominant-500)]'
                            : 'hover:bg-[var(--color-dominant-300)]'
                    }`}
                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onResizeStart(e, col.key); }}
                    onTouchStart={(e) => { e.stopPropagation(); onResizeStart(e, col.key); }}
                    onMouseMove={onResizeMove}
                    onMouseUp={onResizeEnd}
                    onTouchMove={onResizeMove}
                    onTouchEnd={onResizeEnd}
                />
            )}
        </th>
    );
});

/* ================================================================
 * SOUS-COMPOSANT : Ligne de tableau (tr)
 * ================================================================ */

interface LigneTableauProps<T> {
    item: T;
    index: number;
    colonnesVisibles: Column<T>[];
    colonnesPinned: Set<string>;
    offsetsPinned: Map<string, number>;
    largeurs: Map<string, number>;
    rowId: string;
    animer: boolean;
    paddingVertical: string;
}

function LigneTableauInterne<T>({
    item,
    index,
    colonnesVisibles,
    colonnesPinned,
    offsetsPinned,
    largeurs,
    rowId,
    animer,
    paddingVertical,
}: LigneTableauProps<T>) {
    const cellules = colonnesVisibles.map((col) => {
        const estPinned = colonnesPinned.has(col.key);
        const style: React.CSSProperties = {
            width: largeurs.get(col.key) ?? col.size ?? 150,
            position: estPinned ? 'sticky' as const : undefined,
            left: estPinned ? offsetsPinned.get(col.key) : undefined,
            zIndex: estPinned ? 3 : undefined,
            backgroundColor: estPinned ? 'var(--color-surface)' : undefined,
            paddingBlock: paddingVertical,
        };

        return (
            <td
                key={col.key}
                style={style}
                className={`${estPinned ? 'border-r border-[var(--color-border)]' : ''} ${col.className || ''}`}
            >
                <div style={{ padding: 'var(--padding-table-cell)' }}>
                    {col.render ? col.render(item, index) : (item as any)[col.key]}
                </div>
            </td>
        );
    });

    if (animer) {
        return (
            <motion.tr
                key={rowId}
                className="border-b border-[var(--color-border)] transition-colors last:border-b-0 hover:bg-[var(--color-dominant-50)] dark:hover:bg-[var(--color-surface-alt)]"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.02, 0.5) }}
            >
                {cellules}
            </motion.tr>
        );
    }

    return (
        <tr
            key={rowId}
            className="border-b border-[var(--color-border)] transition-colors last:border-b-0 hover:bg-[var(--color-dominant-50)] dark:hover:bg-[var(--color-surface-alt)]"
        >
            {cellules}
        </tr>
    );
}

const LigneTableau = memo(LigneTableauInterne) as typeof LigneTableauInterne;

/* ================================================================
 * SOUS-COMPOSANT : Menu de visibilité des colonnes
 * ================================================================ */

interface MenuVisibiliteProps {
    colonnes: Column<any>[];
    visibilite: VisibilityState;
    onToggle: (key: string) => void;
}

function MenuVisibiliteColonnes({ colonnes, visibilite, onToggle }: MenuVisibiliteProps) {
    const { t } = useTranslation();
    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button
                    className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] transition-colors"
                    title={t('tableau.colonnes', { defaultValue: 'Colonnes' })}
                >
                    <Settings2 className="h-4 w-4" />
                </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    align="end"
                    sideOffset={4}
                    className="z-50 min-w-[200px] rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-lg"
                >
                    <div className="px-2 py-1.5 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                        {t('tableau.colonnesVisibles', { defaultValue: 'Colonnes visibles' })}
                    </div>
                    <DropdownMenu.Separator className="my-1 h-px bg-[var(--color-border)]" />
                    {colonnes.map((col) => {
                        const visible = visibilite[col.key] !== false;
                        const desactive = col.enableHiding === false;
                        return (
                            <button
                                key={col.key}
                                disabled={desactive}
                                onClick={() => !desactive && onToggle(col.key)}
                                className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                                    desactive
                                        ? 'cursor-not-allowed opacity-50'
                                        : 'hover:bg-[var(--color-surface-alt)] cursor-pointer'
                                }`}
                            >
                                <span
                                    className={`flex h-4 w-4 items-center justify-center rounded border ${
                                        visible
                                            ? 'border-[var(--color-dominant-500)] bg-[var(--color-dominant-500)]'
                                            : 'border-[var(--color-border)]'
                                    }`}
                                >
                                    {visible && <Check className="h-3 w-3 text-white" />}
                                </span>
                                <span className="text-[var(--color-text-primary)]">{col.header}</span>
                            </button>
                        );
                    })}
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}

/* ================================================================
 * SOUS-COMPOSANT : Barre d'outils (recherche + visibilité + hauteur)
 * ================================================================ */

interface BarreOutilsProps {
    recherche: string;
    onRechercheChange: (valeur: string) => void;
    searchable: boolean;
    searchPlaceholder?: string;
    /** Filtres rapides */
    filtres?: {
        key: string;
        label: string;
        options: { value: string; label: string }[];
        allOptionLabel?: string;
    }[];
    /** Valeurs actuelles des filtres */
    valeurFiltres?: Record<string, string>;
    /** Callback quand un filtre change */
    onFiltreChange?: (key: string, valeur: string) => void;
    enableColumnVisibility: boolean;
    colonnes: Column<any>[];
    visibilite: VisibilityState;
    onToggleVisibilite: (key: string) => void;
    enableRowHeight: boolean;
    hauteurLigne: number;
    onHauteurChange: (valeur: number) => void;
}

function BarreOutils({
    recherche,
    onRechercheChange,
    searchable,
    searchPlaceholder,
    filtres,
    valeurFiltres,
    onFiltreChange,
    enableColumnVisibility,
    colonnes,
    visibilite,
    onToggleVisibilite,
    enableRowHeight,
    hauteurLigne,
    onHauteurChange,
}: BarreOutilsProps) {
    const { t } = useTranslation();
    const aDesOutils = searchable || filtres?.length || enableColumnVisibility || enableRowHeight;
    if (!aDesOutils) return null;

    return (
        <div className="flex flex-wrap items-center gap-[var(--gap-sm)] border-b border-[var(--color-bordure)]" style={{ padding: 'var(--padding-toolbar)' }}>
            {searchable && (
                <div className="relative flex-1" style={{ minWidth: 'clamp(120px, 30vw, 384px)', maxWidth: 'clamp(200px, 40vw, 512px)' }}>
                    <Search className="absolute left-[clamp(0.5rem,0.4rem+0.2vw,0.625rem)] top-1/2 h-[var(--icon-sm)] w-[var(--icon-sm)] -translate-y-1/2 text-[var(--color-text-muted)]" />
                    <input
                        type="text"
                        placeholder={searchPlaceholder || t('tableau.rechercher', { defaultValue: 'Rechercher...' })}
                        value={recherche}
                        onChange={(e) => onRechercheChange(e.target.value)}
                        className="w-full rounded-[var(--radius-md)] border border-[var(--color-bordure)] bg-[var(--color-surface)] py-[clamp(0.375rem,0.3rem+0.2vw,0.5rem)] pl-9 pr-3 text-sm focus:border-[var(--color-dominant-500)] focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)]/20"
                        style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}
                    />
                </div>
            )}
            {/* Filtres rapides */}
            {filtres && filtres.length > 0 && (
                <div className="flex flex-wrap items-center gap-[var(--gap-sm)]">
                    {filtres.map((f) => (
                        <select
                            key={f.key}
                            value={valeurFiltres?.[f.key] ?? ''}
                            onChange={(e) => onFiltreChange?.(f.key, e.target.value)}
                            className="rounded-[var(--radius-md)] border border-[var(--color-bordure)] bg-[var(--color-surface)] px-[clamp(0.5rem,0.4rem+0.3vw,0.75rem)] py-[clamp(0.375rem,0.3rem+0.2vw,0.5rem)] text-sm text-[var(--color-text-secondary)] focus:border-[var(--color-dominant-500)] focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)]/20"
                            style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}
                        >
                            <option value="">{f.allOptionLabel ?? `Tous les ${f.label.toLowerCase()}`}</option>
                            {f.options.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    ))}
                </div>
            )}
            <div className="flex items-center gap-[var(--gap-sm)] ml-auto">
                {enableRowHeight && (
                    <div className="flex items-center gap-[var(--gap-xs)]">
                        <Rows3 className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-[var(--color-text-muted)]" />
                        <select
                            value={hauteurLigne}
                            onChange={(e) => onHauteurChange(Number(e.target.value))}
                            className="rounded-[var(--radius-sm)] border border-[var(--color-bordure)] bg-[var(--color-surface)] px-[clamp(0.375rem,0.3rem+0.2vw,0.5rem)] py-[clamp(0.25rem,0.2rem+0.1vw,0.375rem)] text-xs text-[var(--color-text-secondary)]"
                            style={{ fontSize: 'clamp(0.625rem, 0.55rem + 0.2vw, 0.75rem)' }}
                        >
                            {PRESETS_HAUTEUR.map((p) => (
                                <option key={p.valeur} value={p.valeur}>{p.label}</option>
                            ))}
                        </select>
                    </div>
                )}
                {enableColumnVisibility && (
                    <MenuVisibiliteColonnes
                        colonnes={colonnes}
                        visibilite={visibilite}
                        onToggle={onToggleVisibilite}
                    />
                )}
            </div>
        </div>
    );
}

/* ================================================================
 * COMPOSANT PRINCIPAL : DataTable
 * ================================================================ */

export function DataTable<T>({
    data,
    columns,
    isLoading = false,
    pagination,
    onPageChange,
    onLimitChange,
    sortBy,
    sortOrder,
    onSortChange,
    getRowId,
    emptyMessage,
    colonnes: colonnesLegacy,
    donnees: donneesLegacy,
    enableResizing = true,
    enableReordering = false,
    enableColumnVisibility = true,
    stickyHeader = true,
    maxHeight,
    enableRowHeight = false,
    defaultRowHeight = 48,
    searchable = true,
    searchPlaceholder,
    filtres,
    onSearchChange,
    onFilterChange,
    disableClientSearch = false,
    onColumnOrderChange,
    onColumnVisibilityChange,
}: DataTableProps<T>) {
    const { t } = useTranslation();

    // --- Normalisation des props (rétro-compatibilité) ---
    const colonnesFinales = columns ?? colonnesLegacy ?? [];
    const donneesFinales = data ?? donneesLegacy ?? [];
    const paginationNormalisee = useMemo(
        () => normaliserPagination(pagination, onPageChange, onLimitChange),
        [pagination, onPageChange, onLimitChange],
    );

    // --- État de tri ---
    const [localSortBy, setLocalSortBy] = useState<string | null>(null);
    const [localSortOrder, setLocalSortOrder] = useState<'ASC' | 'DESC'>('ASC');
    const isControlled = sortBy !== undefined && onSortChange !== undefined;
    const activeSortBy = isControlled ? sortBy : localSortBy;
    const activeSortOrder = isControlled ? (sortOrder ?? 'ASC') : localSortOrder;

    const handleSort = useCallback((key: string) => {
        if (!isControlled) {
            setLocalSortBy((prev) => {
                if (prev === key) {
                    setLocalSortOrder((o) => (o === 'ASC' ? 'DESC' : 'ASC'));
                    return key;
                }
                setLocalSortOrder('ASC');
                return key;
            });
        } else if (onSortChange) {
            const newOrder = sortBy === key && sortOrder === 'ASC' ? 'DESC' : 'ASC';
            onSortChange(key, newOrder);
        }
    }, [isControlled, sortBy, sortOrder, onSortChange]);

    // --- Tri local des données ---
    const donneesTriees = useMemo(() => {
        if (!activeSortBy || donneesFinales.length === 0) return donneesFinales;
        return [...donneesFinales].sort((a: any, b: any) => {
            const aVal = a[activeSortBy];
            const bVal = b[activeSortBy];
            if (aVal < bVal) return activeSortOrder === 'ASC' ? -1 : 1;
            if (aVal > bVal) return activeSortOrder === 'ASC' ? 1 : -1;
            return 0;
        });
    }, [donneesFinales, activeSortBy, activeSortOrder]);

    const donneesAffichees = isControlled ? donneesFinales : donneesTriees;

    // --- Recherche ---
    const [recherche, setRechercheInterne] = useState('');

    // Wrapper pour la recherche — émet le callback serveur + filtre client
    const setRecherche = useCallback((valeur: string) => {
        setRechercheInterne(valeur);
        onSearchChange?.(valeur);
    }, [onSearchChange]);

    // État des filtres
    const [valeurFiltres, setValeurFiltres] = useState<Record<string, string>>(() => {
        if (!filtres) return {};
        const init: Record<string, string> = {};
        for (const f of filtres) init[f.key] = '';
        return init;
    });

    const setFiltre = useCallback((key: string, valeur: string) => {
        setValeurFiltres((prev) => ({ ...prev, [key]: valeur }));
        onFilterChange?.(key, valeur);
    }, [onFilterChange]);

    // Filtrage côté client (Fuse.js) — uniquement si disableClientSearch n'est pas activé
    const donneesFiltrees = useMemo(() => {
        let resultats = donneesAffichees;

        // Recherche Fuse.js
        if (searchable && recherche.trim() && !disableClientSearch) {
            const fuse = new Fuse(resultats as any[], {
                keys: colonnesFinales.map((c) => c.key),
                threshold: 0.3,
            });
            resultats = fuse.search(recherche).map((r) => r.item) as T[];
        }

        return resultats;
    }, [donneesAffichees, recherche, searchable, colonnesFinales, disableClientSearch]);

    // --- État colonnes TanStack ---
    const [taillesColonnes, setTaillesColonnes] = useState<ColumnSizingState>({});
    const [visibiliteColonnes, setVisibiliteColonnes] = useState<VisibilityState>(
        () => buildInitialVisibility(colonnesFinales),
    );
    const [ordreColonnes, setOrdreColonnes] = useState<string[]>(
        () => colonnesFinales.map((c) => c.key),
    );

    // Séparer colonnes pinned et non-pinned pour l'ordre
    const colonnesPinned = useMemo(
        () => colonnesFinales.filter((c) => c.pinned).map((c) => c.key),
        [colonnesFinales],
    );
    const ordreColonnesFinal = useMemo(() => {
        const pinned = colonnesPinned;
        const rest = ordreColonnes.filter((id) => !pinned.includes(id));
        return [...pinned, ...rest];
    }, [ordreColonnes, colonnesPinned]);

    // --- Conversion Column<T> → ColumnDef<T> TanStack ---
    const colonnesTanStack = useMemo<ColumnDef<T, unknown>[]>(() => {
        return colonnesFinales.map((col) => ({
            id: col.key,
            accessorKey: col.key,
            header: col.header,
            size: col.size ?? 150,
            minSize: col.minSize ?? 50,
            maxSize: col.maxSize ?? 800,
            enableResizing: col.enableResizing !== false,
            enableHiding: col.enableHiding !== false,
            cell: col.render
                ? (info: any) => col.render!(info.row.original, info.row.index)
                : (info: any) => (info.row.original as any)[col.key],
            meta: {
                pinned: col.pinned ?? false,
                className: col.className,
                sortable: col.sortable,
            },
        }));
    }, [colonnesFinales]);

    // --- Instance TanStack Table ---
    useReactTable({
        data: donneesFiltrees,
        columns: colonnesTanStack,
        state: {
            columnOrder: ordreColonnesFinal,
            columnVisibility: visibiliteColonnes,
            columnSizing: taillesColonnes,
        },
        onColumnSizingChange: setTaillesColonnes,
        onColumnVisibilityChange: (updater) => {
            setVisibiliteColonnes((prev) => {
                const next = typeof updater === 'function' ? updater(prev) : updater;
                onColumnVisibilityChange?.(next as Record<string, boolean>);
                return next;
            });
        },
        enableColumnResizing: enableResizing,
        columnResizeMode: 'onChange',
        getCoreRowModel: getCoreRowModel(),
    });

    // --- Callbacks ordre colonnes ---
    const handleOrdreChange = useCallback((nouvelOrdre: string[]) => {
        setOrdreColonnes(nouvelOrdre);
        onColumnOrderChange?.(nouvelOrdre);
    }, [onColumnOrderChange]);

    const handleToggleVisibilite = useCallback((key: string) => {
        setVisibiliteColonnes((prev) => ({
            ...prev,
            [key]: prev[key] === false ? true : false,
        }));
    }, []);

    // --- Hauteur de ligne ---
    const [hauteurLigne, setHauteurLigne] = useState(defaultRowHeight);
    const paddingVertical = useMemo(() => {
        const padding = Math.max(4, Math.round((hauteurLigne - 20) / 2));
        return `${padding}px`;
    }, [hauteurLigne]);

    // --- Resize manuel des colonnes ---
    const resizeRef = useRef<{ key: string; startX: number; startWidth: number } | null>(null);
    const [resizeKey, setResizeKey] = useState<string | null>(null);

    const handleResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent, key: string) => {
        const startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const col = colonnesFinales.find((c) => c.key === key);
        const startWidth = taillesColonnes[key] ?? col?.size ?? 150;
        resizeRef.current = { key, startX, startWidth };
        setResizeKey(key);
    }, [colonnesFinales, taillesColonnes]);

    const handleResizeMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        if (!resizeRef.current) return;
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const delta = clientX - resizeRef.current.startX;
        const col = colonnesFinales.find((c) => c.key === resizeRef.current!.key);
        const minW = col?.minSize ?? 50;
        const maxW = col?.maxSize ?? 800;
        const newWidth = Math.max(minW, Math.min(maxW, resizeRef.current.startWidth + delta));
        setTaillesColonnes((prev) => ({ ...prev, [resizeRef.current!.key]: newWidth }));
    }, [colonnesFinales]);

    const handleResizeEnd = useCallback(() => {
        resizeRef.current = null;
        setResizeKey(null);
    }, []);

    // Nettoyage listeners globaux pour le resize
    useEffect(() => {
        if (!resizeKey) return;
        const handleGlobalMove = (e: MouseEvent | TouchEvent) => {
            const ref = resizeRef.current;
            if (!ref) return;
            const clientX = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
            const delta = clientX - ref.startX;
            const col = colonnesFinales.find((c) => c.key === ref.key);
            const minW = col?.minSize ?? 50;
            const maxW = col?.maxSize ?? 800;
            const newWidth = Math.max(minW, Math.min(maxW, ref.startWidth + delta));
            setTaillesColonnes((prev) => ({ ...prev, [ref.key]: newWidth }));
        };
        const handleGlobalUp = () => {
            resizeRef.current = null;
            setResizeKey(null);
        };
        window.addEventListener('mousemove', handleGlobalMove, { passive: true });
        window.addEventListener('mouseup', handleGlobalUp);
        window.addEventListener('touchmove', handleGlobalMove, { passive: true });
        window.addEventListener('touchend', handleGlobalUp);
        return () => {
            window.removeEventListener('mousemove', handleGlobalMove);
            window.removeEventListener('mouseup', handleGlobalUp);
            window.removeEventListener('touchmove', handleGlobalMove);
            window.removeEventListener('touchend', handleGlobalUp);
        };
    }, [resizeKey, colonnesFinales]);

    // --- DnD sensors ---
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    );

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = ordreColonnes.indexOf(active.id as string);
        const newIndex = ordreColonnes.indexOf(over.id as string);
        if (oldIndex === -1 || newIndex === -1) return;
        const nouvelOrdre = arrayMove(ordreColonnes, oldIndex, newIndex);
        handleOrdreChange(nouvelOrdre);
    }, [ordreColonnes, handleOrdreChange]);

    // --- Sentinel pour shadow sticky header ---
    const [headerScrolled, setHeaderScrolled] = useState(false);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!stickyHeader || !sentinelRef.current) return;
        const observer = new IntersectionObserver(
            ([entry]) => setHeaderScrolled(!entry.isIntersecting),
            { threshold: 1, root: scrollContainerRef.current },
        );
        observer.observe(sentinelRef.current);
        return () => observer.disconnect();
    }, [stickyHeader]);

    // --- Calcul des largeurs et offsets pinned ---
    const largeursColonnes = useMemo(() => {
        const map = new Map<string, number>();
        for (const col of colonnesFinales) {
            map.set(col.key, taillesColonnes[col.key] ?? col.size ?? 150);
        }
        return map;
    }, [colonnesFinales, taillesColonnes]);

    const setPinned = useMemo(() => new Set(colonnesPinned), [colonnesPinned]);

    const offsetsPinned = useMemo(() => {
        const map = new Map<string, number>();
        let offset = 0;
        for (const key of colonnesPinned) {
            map.set(key, offset);
            offset += largeursColonnes.get(key) ?? 150;
        }
        return map;
    }, [colonnesPinned, largeursColonnes]);

    // --- Colonnes visibles dans l'ordre ---
    const colonnesVisibles = useMemo(() => {
        return ordreColonnesFinal
            .filter((id) => visibiliteColonnes[id] !== false)
            .map((id) => colonnesFinales.find((c) => c.key === id)!)
            .filter(Boolean);
    }, [ordreColonnesFinal, visibiliteColonnes, colonnesFinales]);

    // --- Animer seulement les petits datasets ---
    const animerLignes = donneesFiltrees.length <= 50;

    // --- Détection petit écran pour vue carte ---
    const estPetitEcran = useMediaQuery('(max-width: 479px)');

    // --- Largeur totale du tableau ---
    const largeurTotale = useMemo(() => {
        return colonnesVisibles.reduce((sum, col) => sum + (largeursColonnes.get(col.key) ?? col.size ?? 150), 0);
    }, [colonnesVisibles, largeursColonnes]);

    const limits = [10, 20, 50, 100];

    return (
        <div className="rounded-[var(--radius-xl)] border border-[var(--color-bordure)] bg-[var(--color-surface)] shadow-sm">
            {/* Barre d'outils */}
            <BarreOutils
                recherche={recherche}
                onRechercheChange={setRecherche}
                searchable={searchable}
                searchPlaceholder={searchPlaceholder}
                filtres={filtres}
                valeurFiltres={valeurFiltres}
                onFiltreChange={setFiltre}
                enableColumnVisibility={enableColumnVisibility}
                colonnes={colonnesFinales}
                visibilite={visibiliteColonnes}
                onToggleVisibilite={handleToggleVisibilite}
                enableRowHeight={enableRowHeight}
                hauteurLigne={hauteurLigne}
                onHauteurChange={setHauteurLigne}
            />

            {/* Conteneur scrollable */}
            <DndContext
                sensors={enableReordering ? sensors : undefined}
                collisionDetection={enableReordering ? closestCenter : undefined}
                onDragEnd={enableReordering ? handleDragEnd : undefined}
            >
                <SortableContext items={enableReordering ? ordreColonnesFinal : []} strategy={enableReordering ? horizontalListSortingStrategy : undefined}>
                    <div
                        ref={scrollContainerRef}
                        className="overflow-auto"
                        style={{
                            maxHeight: maxHeight ?? (stickyHeader ? '70vh' : undefined),
                        }}
                    >
                {/* Sentinel pour détecter le scroll */}
                {stickyHeader && <div ref={sentinelRef} className="h-0 w-0" />}

                {/* VUE TABLEAU — écrans >= 480px */}
                {!estPetitEcran && (
                <table
                    className="w-full text-left text-sm"
                    style={{ minWidth: largeurTotale, tableLayout: 'fixed' }}
                >
                    {/* En-tête */}
                    <thead
                        className={`border-b border-[var(--color-border)] bg-[var(--color-surface-alt)] ${
                            stickyHeader
                                ? `sticky top-0 z-10 transition-shadow ${headerScrolled ? 'shadow-md' : ''}`
                                : ''
                        }`}
                    >
                        <tr>
                            {colonnesVisibles.map((col, index) => (
                                enableReordering ? (
                                    <CelluleEnTeteSortable
                                        key={col.key}
                                        col={col}
                                        index={index}
                                        isResizing={resizeKey === col.key}
                                        isSorted={activeSortBy === col.key}
                                        sortDirection={activeSortBy === col.key ? activeSortOrder : null}
                                        largeur={largeursColonnes.get(col.key) ?? col.size ?? 150}
                                        estPinned={setPinned.has(col.key)}
                                        offsetPinned={offsetsPinned.get(col.key) ?? 0}
                                        enableResize={enableResizing}
                                        enableDrag={true}
                                        onSort={() => handleSort(col.key)}
                                        onResizeStart={handleResizeStart}
                                        onResizeMove={handleResizeMove}
                                        onResizeEnd={handleResizeEnd}
                                        isSticky={stickyHeader}
                                    />
                                ) : (
                                    <CelluleEnTeteSimple
                                        key={col.key}
                                        col={col}
                                        index={index}
                                        isResizing={resizeKey === col.key}
                                        isSorted={activeSortBy === col.key}
                                        sortDirection={activeSortBy === col.key ? activeSortOrder : null}
                                        largeur={largeursColonnes.get(col.key) ?? col.size ?? 150}
                                        estPinned={setPinned.has(col.key)}
                                        offsetPinned={offsetsPinned.get(col.key) ?? 0}
                                        enableResize={enableResizing}
                                        enableDrag={false}
                                        onSort={() => handleSort(col.key)}
                                        onResizeStart={handleResizeStart}
                                        onResizeMove={handleResizeMove}
                                        onResizeEnd={handleResizeEnd}
                                        isSticky={stickyHeader}
                                    />
                                )
                            ))}
                        </tr>
                    </thead>

                    {/* Corps */}
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td
                                    colSpan={colonnesVisibles.length}
                                    className="px-4 py-12 text-center text-[var(--color-text-secondary)]"
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-dominant-600)] border-t-transparent" />
                                        <p>{t('messages.chargement')}</p>
                                    </div>
                                </td>
                            </tr>
                        ) : donneesFiltrees.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={colonnesVisibles.length}
                                    className="px-4 py-12 text-center text-[var(--color-text-secondary)]"
                                >
                                    {emptyMessage || t('messages.aucuneDonnee')}
                                </td>
                            </tr>
                        ) : (
                            donneesFiltrees.map((item, index) => (
                                <LigneTableau
                                    key={getRowId?.(item, index) || index}
                                    item={item}
                                    index={index}
                                    colonnesVisibles={colonnesVisibles}
                                    colonnesPinned={setPinned}
                                    offsetsPinned={offsetsPinned}
                                    largeurs={largeursColonnes}
                                    rowId={getRowId?.(item, index) || String(index)}
                                    animer={animerLignes}
                                    paddingVertical={paddingVertical}
                                />
                            ))
                        )}
                    </tbody>
                </table>
                )}

                {/* VUE CARTE — écrans < 480px */}
                {estPetitEcran && !isLoading && donneesFiltrees.length > 0 && (
                    <div className="flex flex-col gap-[var(--gap-sm)] p-[var(--padding-modal-body)]">
                        {donneesFiltrees.map((item, index) => (
                            <div
                                key={getRowId?.(item, index) || index}
                                className="rounded-[var(--radius-lg)] border border-[var(--color-bordure)] bg-[var(--color-surface-alt)] p-[clamp(0.75rem,0.6rem+0.4vw,1rem)]"
                            >
                                {colonnesVisibles.map((col) => (
                                    <div key={col.key} className="flex flex-col gap-[var(--gap-xxs)] py-[var(--space-xxs)]">
                                        <span className="text-xs font-medium text-[var(--color-text-secondary)]" style={{ fontSize: 'clamp(0.625rem, 0.55rem + 0.2vw, 0.75rem)' }}>
                                            {col.header}
                                        </span>
                                        <div className="text-sm text-[var(--color-text-primary)]" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}>
                                            {col.render ? col.render(item, index) : (item as any)[col.key]}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                )}
            </div>
                </SortableContext>
            </DndContext>

            {/* Pagination */}
            {paginationNormalisee && (
                <div className="flex flex-wrap items-center justify-between gap-[var(--gap-md)] border-t border-[var(--color-bordure)]" style={{ padding: 'var(--padding-pagination)' }}>
                    <div className="flex flex-wrap items-center gap-[var(--gap-sm)] text-sm text-[var(--color-text-secondary)]">
                        <span style={{ fontSize: 'clamp(0.75rem, 0.65rem + 0.3vw, 0.875rem)' }}>
                            {t('pagination.resultats', { total: paginationNormalisee.total })}
                        </span>
                        {paginationNormalisee.onLimitChange && (
                            <select
                                value={paginationNormalisee.limit}
                                onChange={(e) => paginationNormalisee.onLimitChange!(Number(e.target.value))}
                                className="rounded-[var(--radius-sm)] border border-[var(--color-bordure)] bg-[var(--color-surface)] px-[clamp(0.375rem,0.3rem+0.2vw,0.5rem)] py-[clamp(0.25rem,0.2rem+0.1vw,0.375rem)] text-sm"
                                style={{ fontSize: 'clamp(0.75rem, 0.65rem + 0.3vw, 0.875rem)' }}
                            >
                                {limits.map((limit) => (
                                    <option key={limit} value={limit}>
                                        {limit} / page
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-[clamp(0.25rem,0.2rem+0.1vw,0.5rem)]">
                        <ElisaButton
                            variant="outline"
                            size="sm"
                            icon={<ChevronsLeft className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                            onClick={() => paginationNormalisee.onPageChange?.(1)}
                            disabled={!paginationNormalisee.hasPrev}
                        />
                        <ElisaButton
                            variant="outline"
                            size="sm"
                            icon={<ChevronLeft className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                            onClick={() => paginationNormalisee.onPageChange?.(paginationNormalisee.page - 1)}
                            disabled={!paginationNormalisee.hasPrev}
                        />
                        <span className="px-[clamp(0.5rem,0.4rem+0.3vw,0.75rem)] text-sm text-[var(--color-text-secondary)]" style={{ fontSize: 'clamp(0.75rem, 0.65rem + 0.3vw, 0.875rem)' }}>
                            {t('pagination.pageSur', {
                                page: paginationNormalisee.page,
                                total: paginationNormalisee.totalPages,
                            })}
                        </span>
                        <ElisaButton
                            variant="outline"
                            size="sm"
                            icon={<ChevronRight className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                            onClick={() => paginationNormalisee.onPageChange?.(paginationNormalisee.page + 1)}
                            disabled={!paginationNormalisee.hasNext}
                        />
                        <ElisaButton
                            variant="outline"
                            size="sm"
                            icon={<ChevronsRight className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                            onClick={() => paginationNormalisee.onPageChange?.(paginationNormalisee.totalPages)}
                            disabled={!paginationNormalisee.hasNext}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
