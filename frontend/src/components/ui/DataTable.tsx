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
    Check,
    Rows3,
    Pin,
    PinOff,
    ArrowLeftToLine,
    ArrowRightToLine,
    SlidersHorizontal,
    ChevronDown,
    RotateCcw,
} from 'lucide-react';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { RowActions } from '@/components/ui/RowActions';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterPanel } from '@/components/ui/FilterPanel';
import { usePermissions, useDataTablePreferences } from '@/hooks';
import type { ReactNode } from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useDebounce } from '@/hooks/use-debounce';
import type { ActionConfig } from '@/components/ui/RowActions';

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
    /** Épingle la colonne : `'left'` (gauche), `'right'` (droite), `false`/`undefined` (pas épinglé)
     *  La première colonne visible sera automatiquement épinglée à gauche par défaut */
    pinned?: 'left' | 'right' | false;
    /** Masque la colonne par défaut (l'utilisateur peut la ré-afficher) */
    hidden?: boolean;
    /** Empêche l'utilisateur de masquer cette colonne (ex: colonne Actions) */
    enableHiding?: boolean;
    /** Empêche le glisser-déposer sur cette colonne */
    enableReordering?: boolean;
    /** Empêche le changement d'épinglage pour cette colonne (défaut: false) */
    enablePinningChange?: boolean;
    /** Fonction de rendu des actions de ligne (remplace pinned: 'right') */
    renderActions?: (item: T) => ActionConfig[];
}

interface DataTableProps<T> {
    /** Identifiant unique pour la persistance des préférences (OBLIGATOIRE) */
    tableId: string;
    data: T[];
    columns: Column<T>[];
    isLoading?: boolean;
    /** Indique qu'une refetch est en cours (arrière-plan) — affiche une barre subtile */
    isFetching?: boolean;
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
    /** Active l'épinglage des colonnes via le menu (défaut: true) */
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
    /** Active le panneau de filtres repliable (au lieu des selects toujours visibles) */
    enableCollapsibleFilters?: boolean;
    /** Callback quand les filtres sont réinitialisés */
    onClearFilters?: () => void;
    /** Callback quand l'ordre des colonnes change */
    onColumnOrderChange?: (columnOrder: string[]) => void;
    /** Callback quand la visibilité des colonnes change */
    onColumnVisibilityChange?: (visibility: Record<string, boolean>) => void;
    /** Callback quand l'épinglage des colonnes change */
    onColumnPinningChange?: (pinning: Record<string, 'left' | 'right' | false>) => void;
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
    sortIndex?: number; // Index dans le tableau de multi-tri (0 = premier tri)
    largeur: number;
    estPinned: 'left' | 'right' | false;
    offsetPinned: number;
    enableResize: boolean;
    enableDrag: boolean;
    onSort: () => void;
    onResizeStart: (e: React.MouseEvent | React.TouchEvent, key: string) => void;
    onResizeMove: (e: React.MouseEvent | React.TouchEvent) => void;
    onResizeEnd: () => void;
    isSticky: boolean;
    estDerniereColonne: boolean; // Pour le séparateur de colonne
}

/** En-tête simple — sans @dnd-kit, rendu propre sans attributs ARIA superflus */
const CelluleEnTeteSimple = memo(function CelluleEnTeteSimple({
    col,
    isResizing,
    isSorted,
    sortDirection,
    sortIndex = 0,
    largeur,
    estPinned,
    offsetPinned,
    enableResize,
    onSort,
    onResizeStart,
    onResizeMove,
    onResizeEnd,
    isSticky,
    estDerniereColonne,
}: CelluleEnTeteProps) {
    const estActions = col.renderActions !== undefined;
    
    // Pour la colonne Actions : largeur minimale
    const largeurCellule = estActions ? 48 : largeur;
    
    const style: React.CSSProperties = {
        width: largeurCellule,
        minWidth: estActions ? 48 : col.minSize ?? 50,
        maxWidth: estActions ? 48 : col.maxSize ?? 800,
        position: estPinned || estActions ? 'sticky' as const : undefined,
        left: estPinned === 'left' ? offsetPinned : undefined,
        right: estPinned === 'right' || estActions ? 0 : undefined,
        zIndex: estActions ? 25 : estPinned ? 6 : (isSticky ? 5 : undefined),
        backgroundColor: estActions || estPinned ? 'var(--color-surface-alt)' : undefined,
        boxShadow: estActions ? '-4px 0 8px -2px rgba(0, 0, 0, 0.1)' : undefined,
    };

    return (
        <th
            style={style}
            className={`relative font-medium text-[var(--color-text-secondary)] select-none ${
                estPinned || estActions ? 'border-[var(--color-border)]' : ''} ${col.className || ''}`}
        >
            {/* Séparateur de colonne discret */}
            {!estDerniereColonne && !estActions && (
                <div className="absolute right-0 top-1/4 bottom-1/4 w-px bg-[var(--color-bordure)] opacity-90" />
            )}
            
            {/* Pour la colonne Actions : ne pas afficher le header */}
            {!estActions && (
                <div className="flex items-center gap-[clamp(0.25rem,0.2rem+0.1vw,0.375rem)]" style={{ padding: 'var(--padding-table-cell)' }}>
                    <span className="truncate" style={{ fontSize: 'clamp(0.75rem, 0.65rem + 0.3vw, 0.875rem)' }}>{col.header}</span>
                    {col.sortable && (
                        <>
                            {isSorted ? (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onSort(); }}
                                    className="cursor-pointer hover:opacity-80 transition-opacity"
                                    aria-label={`Trier par ${col.header}`}
                                >
                                    <div className="flex items-center gap-0.5">
                                        {sortDirection === 'ASC' ? (
                                            <ArrowUp className="h-[var(--icon-xs)] w-[var(--icon-xs)] shrink-0 text-[var(--color-dominant-600)]" />
                                        ) : (
                                            <ArrowDown className="h-[var(--icon-xs)] w-[var(--icon-xs)] shrink-0 text-[var(--color-dominant-600)]" />
                                        )}
                                        {/* Badge de multi-tri */}
                                        {sortIndex > 0 && (
                                            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[var(--color-dominant-600)] text-[0.625rem] font-bold text-white">
                                                {sortIndex + 1}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            ) : (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onSort(); }}
                                    className="cursor-pointer hover:opacity-60 transition-opacity"
                                    aria-label={`Trier par ${col.header}`}
                                >
                                    <ArrowUpDown className="h-[var(--icon-xs)] w-[var(--icon-xs)] shrink-0 opacity-40" />
                                </button>
                            )}
                        </>
                    )}
                    {estPinned && (
                        <Pin className="h-[var(--icon-xs)] w-[var(--icon-xs)] shrink-0 text-[var(--color-dominant-500)]" />
                    )}
                </div>
            )}
            {/* Pour la colonne Actions : afficher juste une icône */}
            {estActions && (
                <div className="flex items-center justify-center" style={{ padding: 'var(--padding-table-cell)' }}>
                    <span className="text-xs font-medium text-[var(--color-text-muted)]">Actions</span>
                </div>
            )}
            {/* Poignée de redimensionnement (pas pour Actions) */}
            {enableResize && col.enableResizing !== false && !estActions && (
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
    sortIndex = 0,
    largeur,
    estPinned,
    offsetPinned,
    enableResize,
    onSort,
    onResizeStart,
    onResizeMove,
    onResizeEnd,
    isSticky,
    estDerniereColonne,
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

    const estActions = col.renderActions !== undefined;
    
    // Pour la colonne Actions : largeur minimale
    const largeurCellule = estActions ? 48 : largeur;
    
    const style: React.CSSProperties = {
        width: largeurCellule,
        minWidth: estActions ? 48 : col.minSize ?? 50,
        maxWidth: estActions ? 48 : col.maxSize ?? 800,
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        position: estPinned || estActions ? 'sticky' as const : undefined,
        left: estPinned === 'left' ? offsetPinned : undefined,
        right: estPinned === 'right' || estActions ? 0 : undefined,
        zIndex: estActions ? 25 : estPinned ? 6 : (isSticky ? 5 : undefined),
        backgroundColor: estActions || estPinned ? 'var(--color-surface-alt)' : undefined,
        boxShadow: estActions ? '-4px 0 8px -2px rgba(0, 0, 0, 0.1)' : undefined,
    };

    return (
        <th
            ref={setNodeRef}
            style={style}
            className={`relative font-medium text-[var(--color-text-secondary)] select-none ${
                estPinned || estActions ? 'border-[var(--color-border)]' : ''} ${col.className || ''}`}
            {...attributes}
        >
            {/* Séparateur de colonne discret */}
            {!estDerniereColonne && !estActions && (
                <div className="absolute right-0 top-1/4 bottom-1/4 w-px bg-[var(--color-bordure)] opacity-90" />
            )}
            
            <div className="flex items-center gap-[clamp(0.25rem,0.2rem+0.1vw,0.375rem)]" style={{ padding: 'var(--padding-table-cell)' }}>
                {/* Grip de drag (pas pour Actions) */}
                {col.enableReordering !== false && !estActions && (
                    <button
                        className="cursor-grab touch-none text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] active:cursor-grabbing"
                        {...listeners}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <GripVertical className="h-[clamp(0.75rem,0.65rem+0.3vw,0.875rem)] w-[clamp(0.75rem,0.65rem+0.3vw,0.875rem)]" />
                    </button>
                )}
                {/* Pour la colonne Actions : ne pas afficher le header */}
                {!estActions && (
                    <>
                        <span className="truncate" style={{ fontSize: 'clamp(0.75rem, 0.65rem + 0.3vw, 0.875rem)' }}>{col.header}</span>
                        {col.sortable && (
                            <>
                                {isSorted ? (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onSort(); }}
                                        className="cursor-pointer hover:opacity-80 transition-opacity"
                                        aria-label={`Trier par ${col.header}`}
                                    >
                                        <div className="flex items-center gap-0.5">
                                            {sortDirection === 'ASC' ? (
                                                <ArrowUp className="h-[var(--icon-xs)] w-[var(--icon-xs)] shrink-0 text-[var(--color-dominant-600)]" />
                                            ) : (
                                                <ArrowDown className="h-[var(--icon-xs)] w-[var(--icon-xs)] shrink-0 text-[var(--color-dominant-600)]" />
                                            )}
                                            {/* Badge de multi-tri */}
                                            {sortIndex > 0 && (
                                                <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[var(--color-dominant-600)] text-[0.625rem] font-bold text-white">
                                                    {sortIndex + 1}
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                ) : (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onSort(); }}
                                        className="cursor-pointer hover:opacity-60 transition-opacity"
                                        aria-label={`Trier par ${col.header}`}
                                    >
                                        <ArrowUpDown className="h-[var(--icon-xs)] w-[var(--icon-xs)] shrink-0 opacity-40" />
                                    </button>
                                )}
                            </>
                        )}
                        {estPinned && (
                            <Pin className="h-[var(--icon-xs)] w-[var(--icon-xs)] shrink-0 text-[var(--color-dominant-500)]" />
                        )}
                    </>
                )}
                {/* Pour la colonne Actions : afficher juste une icône */}
                {estActions && (
                    <span className="text-xs font-medium text-[var(--color-text-muted)]">Actions</span>
                )}
            </div>
            {/* Poignée de redimensionnement (pas pour Actions) */}
            {enableResize && col.enableResizing !== false && !estActions && (
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
    pinningPositions: Map<string, 'left' | 'right' | false>;
    offsetsPinned: Map<string, number>;
    largeurs: Map<string, number>;
    rowId: string;
    animer: boolean;
    paddingVertical: string;
}

/* ================================================================
 * COMPOSANT INTERNE — BULLE DE TOOLTIP
 * ================================================================
 * Tooltip en position fixed pour éviter les problèmes d'overflow.
 * Se positionne au-dessus de l'élément ancre via getBoundingClientRect.
 */

function TooltipBulle({ texte, ancreRef }: { texte: string; ancreRef: React.RefObject<HTMLElement | null> }) {
    const [position, setPosition] = useState({ top: 0, left: 0 });

    useEffect(() => {
        if (!ancreRef.current) return;
        const rect = ancreRef.current.getBoundingClientRect();
        setPosition({
            top: rect.top - 8,
            left: rect.left + rect.width / 2,
        });
    }, [ancreRef]);

    return (
        <div
            className="fixed z-[99999] px-3 py-2 rounded-lg shadow-2xl pointer-events-none animate-in fade-in duration-150"
            style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
                transform: 'translate(-50%, -100%)',
                backgroundColor: '#1f2937',
                color: 'white',
                fontSize: 'clamp(0.6875rem, 0.65rem + 0.15vw, 0.8125rem)',
                maxWidth: 'min(360px, calc(100vw - 2rem))',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                lineHeight: '1.5',
            }}
        >
            {texte}
            <div
                className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
                style={{
                    borderLeft: '6px solid transparent',
                    borderRight: '6px solid transparent',
                    borderTop: '6px solid #1f2937',
                }}
            />
        </div>
    );
}

/* ================================================================
 * COMPOSANT INTERNE — CELLULE DE CONTENU
 * ================================================================
 * Gère l'affichage intelligent du contenu des cellules :
 * - Retour à la ligne automatique pour les textes longs
 * - Troncation avec tooltip si nécessaire
 * - Préservation du rendu personnalisé
 */

interface CelluleContenuProps {
    contenu: React.ReactNode;
    colonne: { size?: number };
}

function CelluleContenu({ contenu, colonne }: CelluleContenuProps) {
    const [afficherTooltip, setAfficherTooltip] = useState(false);
    const refEl = useRef<HTMLDivElement>(null);
    const texteBrut = (typeof contenu === 'string' || typeof contenu === 'number')
        ? String(contenu)
        : extraireTexte(contenu);

    // Vérifier la troncature AU SURVOL
    const verifierTroncature = () => {
        if (!refEl.current) return;
        const el = refEl.current;
        const tronque = el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 2;
        if (tronque) setAfficherTooltip(true);
    };

    // Déterminer le style selon le type de contenu
    const estTexte = typeof contenu === 'string' || typeof contenu === 'number';
    const largeurColonne = colonne.size ?? 150;
    const estColonneEtroite = largeurColonne < 100;

    // Contenu JSX complexe
    if (!estTexte) {
        return (
            <div className="relative">
                <div
                    ref={refEl}
                    className="min-w-0 overflow-hidden"
                    onMouseEnter={verifierTroncature}
                    onMouseLeave={() => setAfficherTooltip(false)}
                >
                    {contenu}
                </div>
                {afficherTooltip && texteBrut && (
                    <TooltipBulle texte={texteBrut} ancreRef={refEl} />
                )}
            </div>
        );
    }

    const texte = String(contenu);

    // Colonne étroite : troncation forcée
    if (estColonneEtroite && texte.length > 15) {
        return (
            <div className="relative">
                <div
                    ref={refEl}
                    className="truncate cursor-default"
                    onMouseEnter={verifierTroncature}
                    onMouseLeave={() => setAfficherTooltip(false)}
                >
                    {texte}
                </div>
                {afficherTooltip && (
                    <TooltipBulle texte={texte} ancreRef={refEl} />
                )}
            </div>
        );
    }

    // Colonne normale : retour à la ligne
    return (
        <div className="relative">
            <div
                ref={refEl}
                className="break-words whitespace-normal leading-relaxed overflow-hidden"
                style={{
                    maxWidth: '100%',
                    overflowWrap: 'break-word',
                    wordBreak: 'break-word',
                }}
                onMouseEnter={verifierTroncature}
                onMouseLeave={() => setAfficherTooltip(false)}
            >
                {texte}
            </div>
            {afficherTooltip && (
                <TooltipBulle texte={texte} ancreRef={refEl} />
            )}
        </div>
    );
}

/**
 * Extrait le texte brut d'un ReactNode (pour les tooltips)
 */
function extraireTexte(node: React.ReactNode): string {
    if (typeof node === 'string') return node;
    if (typeof node === 'number') return String(node);
    if (!node || typeof node !== 'object') return '';
    
    if (Array.isArray(node)) {
        return node.map(extraireTexte).join(' ');
    }
    
    const element = node as React.ReactElement<any>;
    if (element.props?.children) {
        return extraireTexte(element.props.children);
    }
    
    return '';
}

function LigneTableauInterne<T>({
    item,
    index,
    colonnesVisibles,
    colonnesPinned,
    pinningPositions,
    offsetsPinned,
    largeurs,
    rowId,
    animer,
    paddingVertical,
}: LigneTableauProps<T>) {
    const { hasPermission } = usePermissions();
    const rowRef = useRef<HTMLTableRowElement>(null);
    
    // Trouver la colonne avec renderActions (pas utilisé)

    const cellules = colonnesVisibles.map((col) => {
        const estPinned = colonnesPinned.has(col.key);
        const estActions = col.renderActions !== undefined;
        const positionEpinglage = pinningPositions.get(col.key) || false;
        const largeur = largeurs.get(col.key) ?? col.size ?? 150;
        
        // Pour la colonne Actions : largeur minimale (juste le bouton)
        const largeurCellule = estActions ? 48 : largeur;
        
        const style: React.CSSProperties = {
            width: largeurCellule,
            maxWidth: largeurCellule,
            minWidth: estActions ? 48 : undefined,
            position: estPinned || estActions ? 'sticky' as const : undefined,
            left: positionEpinglage === 'left' ? offsetsPinned.get(col.key) : undefined,
            right: positionEpinglage === 'right' || estActions ? 0 : undefined,
            zIndex: estActions ? 20 : estPinned ? 3 : undefined,
            backgroundColor: estActions || estPinned ? 'var(--color-surface)' : undefined,
            paddingBlock: paddingVertical,
            overflow: estActions ? 'visible' : 'hidden',
            boxShadow: estActions ? '-4px 0 8px -2px rgba(0, 0, 0, 0.1)' : undefined,
        };

        // Si c'est la colonne Actions, utiliser RowActions
        let contenu: React.ReactNode = null;
        
        if (col.renderActions) {
            const actionsBrutes = col.renderActions(item);
            const actionsFiltrees = actionsBrutes.filter(
                (action) => !action.permission || hasPermission(action.permission)
            );
            contenu = actionsFiltrees.length > 0
                ? (
                    <div className="flex items-center justify-center w-full h-full">
                        <RowActions actions={actionsFiltrees} />
                    </div>
                )
                : null;
        } else {
            contenu = col.render
                ? col.render(item, index)
                : (item as any)[col.key];
        }

        return (
            <td
                key={col.key}
                style={style}
                className={`${estPinned || estActions ? 'border-[var(--color-border)]' : ''} ${col.className || ''}`}
            >
                {estActions ? (
                    <div style={{ padding: 'var(--padding-table-cell)' }}>
                        {contenu}
                    </div>
                ) : (
                    <div 
                        className="min-w-0 overflow-hidden"
                        style={{ padding: 'var(--padding-table-cell)' }}
                    >
                        <CelluleContenu contenu={contenu} colonne={col} />
                    </div>
                )}
            </td>
        );
    });

    if (animer) {
        return (
            <motion.tr
                ref={rowRef as any}
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
            ref={rowRef}
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
 * SOUS-COMPOSANT : Menu d'épinglage des colonnes
 * ================================================================ */

interface MenuEpinglageProps {
    colonnes: Column<any>[];
    pinning: Record<string, 'left' | 'right' | false>;
    onPin: (key: string, position: 'left' | 'right' | false) => void;
    enablePinning?: boolean;
}

function MenuEpinglageColonnes({ colonnes, pinning, onPin, enablePinning = true }: MenuEpinglageProps) {
    const { t } = useTranslation();
    
    if (!enablePinning) return null;
    if (!colonnes || colonnes.length === 0) return null;
    
    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button
                    className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] transition-colors"
                    title={t('tableau.epingler', { defaultValue: 'Épingler les colonnes' })}
                >
                    <Pin className="h-4 w-4" />
                </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    align="end"
                    sideOffset={4}
                    className="z-50 min-w-[240px] rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-lg"
                >
                    <div className="px-2 py-1.5 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                        {t('tableau.epinglerColonnes', { defaultValue: 'Épingler les colonnes' })}
                    </div>
                    <DropdownMenu.Separator className="my-1 h-px bg-[var(--color-border)]" />
                    {colonnes.map((col) => {
                        const etatEpinglage = pinning[col.key] || false;
                        const desactive = col.enablePinningChange === false;
                        
                        return (
                            <div key={col.key} className="px-2 py-1">
                                <div className={`flex items-center justify-between gap-2 ${desactive ? 'opacity-50' : ''}`}>
                                    <span className="flex-1 text-sm text-[var(--color-text-primary)] truncate">
                                        {col.header}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <button
                                            disabled={desactive}
                                            onClick={() => !desactive && onPin(col.key, etatEpinglage === 'left' ? false : 'left')}
                                            className={`flex items-center gap-1 rounded px-1.5 py-1 text-xs transition-colors ${
                                                etatEpinglage === 'left'
                                                    ? 'bg-[var(--color-dominant-100)] text-[var(--color-dominant-700)] dark:bg-[var(--color-dominant-900)] dark:text-[var(--color-dominant-300)]'
                                                    : 'hover:bg-[var(--color-surface-alt)] text-[var(--color-text-muted)]'
                                            } ${desactive ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                            title={t('tableau.epinglerGauche', { defaultValue: 'Épingler à gauche' })}
                                        >
                                            <ArrowLeftToLine className="h-3 w-3" />
                                            <span className="hidden sm:inline">{t('a11y.gauche')}</span>
                                        </button>
                                        <button
                                            disabled={desactive}
                                            onClick={() => !desactive && onPin(col.key, etatEpinglage === 'right' ? false : 'right')}
                                            className={`flex items-center gap-1 rounded px-1.5 py-1 text-xs transition-colors ${
                                                etatEpinglage === 'right'
                                                    ? 'bg-[var(--color-dominant-100)] text-[var(--color-dominant-700)] dark:bg-[var(--color-dominant-900)] dark:text-[var(--color-dominant-300)]'
                                                    : 'hover:bg-[var(--color-surface-alt)] text-[var(--color-text-muted)]'
                                            } ${desactive ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                            title={t('tableau.epinglerDroite', { defaultValue: 'Épingler à droite' })}
                                        >
                                            <ArrowRightToLine className="h-3 w-3" />
                                            <span className="hidden sm:inline">{t('a11y.droite')}</span>
                                        </button>
                                        {etatEpinglage && (
                                            <button
                                                disabled={desactive}
                                                onClick={() => !desactive && onPin(col.key, false)}
                                                className={`flex items-center rounded px-1.5 py-1 text-xs transition-colors hover:bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] ${desactive ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                                title={t('tableau.desepingler', { defaultValue: 'Désépingler' })}
                                            >
                                                <PinOff className="h-3 w-3" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <DropdownMenu.Separator className="my-1 h-px bg-[var(--color-border)]" />
                    <div className="px-2 py-1.5 text-xs text-[var(--color-text-muted)]">
                        {t('tableau.infoEpinglage', { defaultValue: 'Les colonnes épinglées restent visibles lors du scroll horizontal' })}
                    </div>
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
    /** Mode panneau repliable */
    enableCollapsibleFilters?: boolean;
    filtresOuverts?: boolean;
    onToggleFiltres?: () => void;
    filtresActifsCount?: number;
    onClearFilters?: () => void;
    enableColumnVisibility: boolean;
    colonnes: Column<any>[];
    visibilite: VisibilityState;
    onToggleVisibilite: (key: string) => void;
    enablePinning: boolean;
    pinning: Record<string, 'left' | 'right' | false>;
    onPin: (key: string, position: 'left' | 'right' | false) => void;
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
    enableCollapsibleFilters,
    filtresOuverts,
    onToggleFiltres,
    filtresActifsCount,
    onClearFilters,
    enableColumnVisibility,
    colonnes,
    visibilite,
    onToggleVisibilite,
    enablePinning,
    pinning,
    onPin,
    enableRowHeight,
    hauteurLigne,
    onHauteurChange,
}: BarreOutilsProps) {
    const { t } = useTranslation();
    const aDesOutils = searchable || filtres?.length || enableColumnVisibility || enableRowHeight || enablePinning;
    if (!aDesOutils) return null;

    return (
        <div className="flex flex-wrap items-center gap-[var(--gap-sm)] border-b border-[var(--color-bordure)]" style={{ padding: 'var(--padding-toolbar)' }}>
            {searchable && (
                <SearchInput
                    value={recherche}
                    onChange={onRechercheChange}
                    placeholder={searchPlaceholder || t('tableau.rechercher', { defaultValue: 'Rechercher...' })}
                />
            )}
            {/* Filtres rapides */}
            {filtres && filtres.length > 0 && (
                enableCollapsibleFilters ? (
                    <div className="flex items-center">
                        <button
                            type="button"
                            onClick={onToggleFiltres}
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-all duration-150 ${
                                (filtresActifsCount ?? 0) > 0
                                    ? 'border-[var(--color-dominant-500)]/30 bg-[var(--color-dominant-50)] dark:bg-[var(--color-dominant-900)]/20 text-[var(--color-dominant-600)] dark:text-[var(--color-dominant-400)]'
                                    : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)]'
                            }`}
                            title={t('boutons.filtrer')}
                        >
                            <SlidersHorizontal className="h-4 w-4" />
                            <span className="hidden sm:inline text-xs font-medium">{t('boutons.filtrer')}</span>
                            {(filtresActifsCount ?? 0) > 0 && (
                                <span className="inline-flex items-center justify-center h-[18px] min-w-[18px] rounded-full bg-[var(--color-dominant-500)] text-[10px] font-bold text-white leading-none px-1">
                                    {filtresActifsCount}
                                </span>
                            )}
                            <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${filtresOuverts ? 'rotate-180' : ''}`} />
                        </button>
                        {(filtresActifsCount ?? 0) > 0 && (
                            <button
                                type="button"
                                onClick={onClearFilters}
                                className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors ml-1"
                                title={t('effacerFiltres')}
                            >
                                <RotateCcw className="h-3 w-3" />
                            </button>
                        )}
                    </div>
                ) : (
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
                )
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
                {enablePinning && colonnes && colonnes.length > 0 && (
                    <MenuEpinglageColonnes
                        colonnes={colonnes}
                        pinning={pinning}
                        onPin={onPin}
                        enablePinning={enablePinning}
                    />
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
    tableId,
    data,
    columns,
    isLoading = false,
    isFetching = false,
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
    enablePinning = true,
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
    enableCollapsibleFilters = false,
    onClearFilters,
    onColumnOrderChange,
    onColumnVisibilityChange,
    onColumnPinningChange,
}: DataTableProps<T>) {
    const { t } = useTranslation();
    const { hasPermission } = usePermissions();

    // --- Persistance des préférences DataTable ---
    const {
        preferences,
        updatePreferences,
    } = useDataTablePreferences(tableId);

    // --- Normalisation des props (rétro-compatibilité + persistance) ---
    const colonnesFinales = columns ?? colonnesLegacy ?? [];
    const donneesFinales = data ?? donneesLegacy ?? [];
    
    // Wrapper onLimitChange pour sauvegarder la préférence
    const handleLimitChange = useCallback((limit: number) => {
        onLimitChange?.(limit);
        updatePreferences({ pageSize: limit });
    }, [onLimitChange, updatePreferences]);
    
    const paginationNormalisee = useMemo(
        () => normaliserPagination(pagination, onPageChange, handleLimitChange),
        [pagination, onPageChange, handleLimitChange],
    );

    // --- État de tri MULTI-COLONNES (avec persistance) ---
    // Tableau de { key, order } pour supporter le multi-tri
    const [localSortState, setLocalSortState] = useState<Array<{ key: string; order: 'ASC' | 'DESC' }>>(
        () => preferences.sortBy || []
    );
    const isControlled = sortBy !== undefined && onSortChange !== undefined;
    
    // Pour compatibilité arrière, on utilise le premier tri comme "tri principal" (variables pas utilisées)

    const handleSort = useCallback((key: string) => {
        if (!isControlled) {
            setLocalSortState((prev) => {
                // Trouver si cette colonne est déjà dans le tri
                const existingIndex = prev.findIndex(s => s.key === key);
                
                let newState: Array<{ key: string; order: 'ASC' | 'DESC' }>;
                if (existingIndex >= 0) {
                    // Colonne déjà triée : cycle ASC → DESC → suppression
                    const currentOrder = prev[existingIndex].order;
                    if (currentOrder === 'ASC') {
                        // ASC → DESC
                        newState = [...prev];
                        newState[existingIndex] = { key, order: 'DESC' };
                    } else {
                        // DESC → supprimer du tri
                        newState = prev.filter((_, i) => i !== existingIndex);
                    }
                } else {
                    // Nouvelle colonne : ajouter en ASC
                    newState = [...prev, { key, order: 'ASC' }];
                }
                
                // Sauvegarder le tri dans les préférences
                updatePreferences({ sortBy: newState });
                return newState;
            });
        } else if (onSortChange) {
            // Mode contrôlé : comportement simple (mono-tri)
            const newOrder = sortBy === key && sortOrder === 'ASC' ? 'DESC' : 'ASC';
            onSortChange(key, newOrder);
        }
    }, [isControlled, sortBy, sortOrder, onSortChange]);
    
    // Réinitialiser le tri local si les props contrôlées changent
    useEffect(() => {
        if (isControlled) {
            setLocalSortState([]);
        }
    }, [isControlled]);

    // --- Tri local des données (support multi-tri) ---
    const donneesTriees = useMemo(() => {
        if (localSortState.length === 0 || donneesFinales.length === 0) return donneesFinales;
        
        return [...donneesFinales].sort((a: any, b: any) => {
            // Appliquer chaque critère de tri dans l'ordre
            for (const { key, order } of localSortState) {
                const aVal = a[key];
                const bVal = b[key];
                
                // Gérer les valeurs nulles/undefined
                if (aVal == null && bVal == null) continue;
                if (aVal == null) return 1; // null à la fin
                if (bVal == null) return -1;
                
                // Comparer
                let cmp = 0;
                if (aVal < bVal) cmp = -1;
                else if (aVal > bVal) cmp = 1;
                
                if (cmp !== 0) {
                    return order === 'ASC' ? cmp : -cmp;
                }
                // Si égal, passer au critère suivant
            }
            return 0;
        });
    }, [donneesFinales, localSortState]);

    const donneesAffichees = isControlled ? donneesFinales : donneesTriees;

    // --- Recherche optimisée avec debounce ---
    const [recherche, setRechercheInterne] = useState('');
    const rechercheDebounce = useDebounce(recherche, 300); // 300ms de délai

    const onSearchChangeRef = useRef(onSearchChange);
    useEffect(() => {
        onSearchChangeRef.current = onSearchChange;
    });

    // Wrapper local uniquement — pas de callback serveur immédiat
    const setRecherche = useCallback((valeur: string) => {
        setRechercheInterne(valeur);
    }, []);

    // Callback serveur différé via la valeur debouncée (300ms)
    useEffect(() => {
        onSearchChangeRef.current?.(rechercheDebounce);
    }, [rechercheDebounce]);

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

    // État panneau de filtres repliable
    const [filtresOuverts, setFiltresOuverts] = useState(false);
    const filtresActifsCount = useMemo(() => {
        return Object.values(valeurFiltres).filter(v => v !== '').length;
    }, [valeurFiltres]);
    const handleClearFilters = useCallback(() => {
        setValeurFiltres((prev) => {
            const cleared: Record<string, string> = {};
            for (const key of Object.keys(prev)) cleared[key] = '';
            return cleared;
        });
        onClearFilters?.();
    }, [onClearFilters]);

    // Filtrage côté client (Fuse.js) — uniquement si disableClientSearch n'est pas activé
    // Utilise la valeur debounced pour éviter les recalculs excessifs
    const donneesFiltrees = useMemo(() => {
        let resultats = donneesAffichees;

        // Recherche Fuse.js optimisée
        if (searchable && rechercheDebounce.trim() && !disableClientSearch) {
            const fuse = new Fuse(resultats as any[], {
                keys: colonnesFinales.map((c) => c.key),
                threshold: 0.3,
                includeScore: true, // Pour score de pertinence
            });
            resultats = fuse.search(rechercheDebounce).map((r) => r.item) as T[];
        }

        return resultats;
    }, [donneesAffichees, rechercheDebounce, searchable, colonnesFinales, disableClientSearch]);

    // --- État colonnes TanStack (avec persistance) ---
    const [taillesColonnes, setTaillesColonnes] = useState<ColumnSizingState>({});
    
    // Synchroniser les tailles depuis les préférences (quand elles sont chargées)
    useEffect(() => {
        if (preferences.columnWidths && Object.keys(preferences.columnWidths).length > 0) {
            setTaillesColonnes(preferences.columnWidths);
        }
    }, [preferences.columnWidths]);
    
    const [visibiliteColonnes, setVisibiliteColonnes] = useState<VisibilityState>(
        () => {
            const initial = buildInitialVisibility(colonnesFinales);
            // Appliquer les colonnes masquées persistées
            if (preferences.hiddenColumns?.length > 0) {
                preferences.hiddenColumns.forEach(key => {
                    initial[key] = false;
                });
            }
            return initial;
        }
    );
    const [ordreColonnes, setOrdreColonnes] = useState<string[]>(
        () => preferences.columnOrder?.length > 0 
            ? preferences.columnOrder 
            : colonnesFinales.map((c) => c.key)
    );
    
    // --- État d'épinglage des colonnes (avec persistance) ---
    const [pinningEtat, setPinningEtat] = useState<Record<string, 'left' | 'right' | false>>(() => {
        const initial: Record<string, 'left' | 'right' | false> = {};
        
        // Appliquer l'épinglage persisté
        if (preferences.pinnedColumns) {
            preferences.pinnedColumns.left.forEach(key => {
                initial[key] = 'left';
            });
            preferences.pinnedColumns.right.forEach(key => {
                initial[key] = 'right';
            });
        }
        
        // Fallback sur la config des colonnes
        if (Object.keys(initial).length === 0) {
            colonnesFinales.forEach((col) => {
                if (col.pinned === 'left' || col.pinned === 'right') {
                    initial[col.key] = col.pinned;
                }
            });
        }
        
        // Épingler automatiquement la première colonne visible à gauche si aucune n'est épinglée
        const hasAnyPinned = Object.values(initial).some(v => v !== false);
        if (!hasAnyPinned && colonnesFinales.length > 0) {
            const premiereColonne = colonnesFinales.find(c => !c.hidden);
            if (premiereColonne && premiereColonne.enablePinningChange !== false) {
                initial[premiereColonne.key] = 'left';
            }
        }
        return initial;
    });

    // Séparer colonnes pinned (left) et non-pinned pour l'ordre d'affichage
    // Ordre : colonnes épinglées à gauche -> colonnes non-épinglées -> colonnes épinglées à droite
    const colonnesPinnedLeft = useMemo(
        () => Object.entries(pinningEtat)
            .filter(([, pos]) => pos === 'left')
            .map(([key]) => key),
        [pinningEtat],
    );
    
    const colonnesPinnedRight = useMemo(
        () => Object.entries(pinningEtat)
            .filter(([, pos]) => pos === 'right')
            .map(([key]) => key),
        [pinningEtat],
    );
    
    const ordreColonnesFinal = useMemo(() => {
        const pinnedLeftSet = new Set(colonnesPinnedLeft);
        const pinnedRightSet = new Set(colonnesPinnedRight);
        const rest = ordreColonnes.filter((id) => !pinnedLeftSet.has(id) && !pinnedRightSet.has(id));
        return [...colonnesPinnedLeft, ...rest, ...colonnesPinnedRight];
    }, [ordreColonnes, colonnesPinnedLeft, colonnesPinnedRight]);

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
        onColumnSizingChange: (updater) => {
            setTaillesColonnes((prev) => {
                const next = typeof updater === 'function' ? updater(prev) : updater;
                // Sauvegarder les largeurs de colonnes
                updatePreferences({ columnWidths: next });
                return next;
            });
        },
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

    // --- Callbacks ordre colonnes (avec persistance) ---
    const handleOrdreChange = useCallback((nouvelOrdre: string[]) => {
        setOrdreColonnes(nouvelOrdre);
        onColumnOrderChange?.(nouvelOrdre);
        // Sauvegarder la préférence
        updatePreferences({ columnOrder: nouvelOrdre });
    }, [onColumnOrderChange, updatePreferences]);

    const handleToggleVisibilite = useCallback((key: string) => {
        setVisibiliteColonnes((prev) => {
            const next = {
                ...prev,
                [key]: prev[key] === false ? true : false,
            };
            // Sauvegarder les colonnes masquées
            const hiddenColumns = Object.entries(next)
                .filter(([_, visible]) => !visible)
                .map(([key]) => key);
            updatePreferences({ hiddenColumns });
            return next;
        });
    }, [updatePreferences]);
    
    // --- Callback épinglage (avec persistance) ---
    const handlePin = useCallback((key: string, position: 'left' | 'right' | false) => {
        setPinningEtat((prev) => {
            const next = { ...prev, [key]: position };
            onColumnPinningChange?.(next);
            // Sauvegarder l'épinglage
            const pinnedColumns = {
                left: Object.entries(next).filter(([, pos]) => pos === 'left').map(([key]) => key),
                right: Object.entries(next).filter(([, pos]) => pos === 'right').map(([key]) => key),
            };
            updatePreferences({ pinnedColumns });
            return next;
        });
    }, [onColumnPinningChange, updatePreferences]);

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
        const ref = resizeRef.current;
        if (!ref) return;
        
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const delta = clientX - ref.startX;
        const col = colonnesFinales.find((c) => c.key === ref.key);
        const minW = col?.minSize ?? 50;
        const maxW = col?.maxSize ?? 800;
        const newWidth = Math.max(minW, Math.min(maxW, ref.startWidth + delta));
        setTaillesColonnes((prev) => {
            const next = { ...prev, [ref.key]: newWidth };
            updatePreferences({ columnWidths: next });
            return next;
        });
    }, [colonnesFinales, updatePreferences]);

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
            setTaillesColonnes((prev) => {
                const next = { ...prev, [ref.key]: newWidth };
                updatePreferences({ columnWidths: next });
                return next;
            });
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
    }, [resizeKey, colonnesFinales, updatePreferences]);

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

    const setPinned = useMemo(() => {
        const pinned = new Set<string>();
        Object.entries(pinningEtat).forEach(([key, pos]) => {
            if (pos === 'left' || pos === 'right') {
                pinned.add(key);
            }
        });
        return pinned;
    }, [pinningEtat]);

    const offsetsPinned = useMemo(() => {
        const map = new Map<string, number>();
        
        // Calculer les offsets pour les colonnes épinglées à gauche
        let offsetLeft = 0;
        for (const key of colonnesPinnedLeft) {
            map.set(key, offsetLeft);
            offsetLeft += largeursColonnes.get(key) ?? 150;
        }
        
        // Les offsets pour les colonnes épinglées à droite seront calculés après colonnesVisibles
        return map;
    }, [colonnesPinnedLeft, largeursColonnes]);
    
    // Positions d'épinglage pour chaque colonne
    const pinningPositions = useMemo(() => {
        const positions: Map<string, 'left' | 'right' | false> = new Map();
        Object.entries(pinningEtat).forEach(([key, pos]) => {
            positions.set(key, pos);
        });
        return positions;
    }, [pinningEtat]);

    // --- Colonnes visibles dans l'ordre ---
    const colonnesVisibles = useMemo(() => {
        return ordreColonnesFinal
            .filter((id) => visibiliteColonnes[id] !== false)
            .map((id) => colonnesFinales.find((c) => c.key === id)!)
            .filter(Boolean);
    }, [ordreColonnesFinal, visibiliteColonnes, colonnesFinales]);
    
    // Calculer les offsets pour les colonnes épinglées à droite (après colonnesVisibles)
    const offsetsPinnedFinal = useMemo(() => {
        const map = new Map<string, number>(offsetsPinned);
        
        if (colonnesPinnedRight.length === 0) return map;
        
        // Calculer la largeur totale du tableau
        const largeurTotaleCalc = colonnesVisibles.reduce(
            (sum, col) => sum + (largeursColonnes.get(col.key) ?? col.size ?? 150),
            0
        );
        
        let offsetRight = largeurTotaleCalc;
        for (const key of [...colonnesPinnedRight].reverse()) {
            const largeur = largeursColonnes.get(key) ?? 150;
            offsetRight -= largeur;
            map.set(key, offsetRight);
        }
        
        return map;
    }, [colonnesPinnedRight, largeursColonnes, colonnesVisibles, offsetsPinned]);

    // --- Animer seulement les petits datasets ---
    const animerLignes = donneesFiltrees.length <= 50;

    // --- Détection petit écran pour vue carte ---
    const estPetitEcran = useMediaQuery('(max-width: 479px)');

    // --- Largeur totale du tableau (exclut la colonne Actions) ---
    const largeurTotale = useMemo(() => {
        return colonnesVisibles.reduce((sum, col) => {
            // Exclure la colonne Actions du calcul de largeur
            if (col.renderActions) return sum;
            return sum + (largeursColonnes.get(col.key) ?? col.size ?? 150);
        }, 0);
    }, [colonnesVisibles, largeursColonnes]);

    const limits = [10, 20, 50, 100];

    return (
        <div className="rounded-[var(--radius-xl)] border border-[var(--color-bordure)] bg-[var(--color-surface)] shadow-sm relative overflow-hidden">
            {/* Barre de progression subtile pour les refetches en arrière-plan */}
            {isFetching && !isLoading && (
                <motion.div
                    className="absolute top-0 left-0 h-[2px] z-20"
                    style={{
                        background: 'linear-gradient(90deg, var(--color-dominant-500), var(--color-accent-500))',
                        borderRadius: '1px',
                    }}
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                />
            )}
            {/* Barre d'outils */}
            <BarreOutils
                recherche={recherche}
                onRechercheChange={setRecherche}
                searchable={searchable}
                searchPlaceholder={searchPlaceholder}
                filtres={filtres}
                valeurFiltres={valeurFiltres}
                onFiltreChange={setFiltre}
                enableCollapsibleFilters={enableCollapsibleFilters}
                filtresOuverts={filtresOuverts}
                onToggleFiltres={() => setFiltresOuverts(prev => !prev)}
                filtresActifsCount={filtresActifsCount}
                onClearFilters={handleClearFilters}
                enableColumnVisibility={enableColumnVisibility}
                colonnes={colonnesFinales}
                visibilite={visibiliteColonnes}
                onToggleVisibilite={handleToggleVisibilite}
                enablePinning={enablePinning}
                pinning={pinningEtat}
                onPin={handlePin}
                enableRowHeight={enableRowHeight}
                hauteurLigne={hauteurLigne}
                onHauteurChange={setHauteurLigne}
            />

            {/* Panneau de filtres repliable */}
            {enableCollapsibleFilters && filtres && filtres.length > 0 && (
                <FilterPanel
                    open={filtresOuverts}
                    onOpenChange={setFiltresOuverts}
                    filters={filtres}
                    values={valeurFiltres}
                    onChange={setFiltre}
                    onClear={handleClearFilters}
                    activeCount={filtresActifsCount}
                    showToggle={false}
                />
            )}

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
                            {colonnesVisibles.map((col, index) => {
                                // Calculer l'index de tri pour le badge multi-tri
                                const sortIndexInMulti = localSortState.findIndex(s => s.key === col.key);
                                const estDansMultiTri = sortIndexInMulti >= 0;
                                
                                return enableReordering ? (
                                    <CelluleEnTeteSortable
                                        key={col.key}
                                        col={col}
                                        index={index}
                                        isResizing={resizeKey === col.key}
                                        isSorted={estDansMultiTri}
                                        sortDirection={estDansMultiTri ? localSortState[sortIndexInMulti].order : null}
                                        sortIndex={sortIndexInMulti}
                                        largeur={largeursColonnes.get(col.key) ?? col.size ?? 150}
                                        estPinned={(pinningPositions.get(col.key) || false) as 'left' | 'right' | false}
                                        offsetPinned={offsetsPinnedFinal.get(col.key) ?? 0}
                                        enableResize={enableResizing}
                                        enableDrag={true}
                                        onSort={() => handleSort(col.key)}
                                        onResizeStart={handleResizeStart}
                                        onResizeMove={handleResizeMove}
                                        onResizeEnd={handleResizeEnd}
                                        isSticky={stickyHeader}
                                        estDerniereColonne={index === colonnesVisibles.length - 1}
                                    />
                                ) : (
                                    <CelluleEnTeteSimple
                                        key={col.key}
                                        col={col}
                                        index={index}
                                        isResizing={resizeKey === col.key}
                                        isSorted={estDansMultiTri}
                                        sortDirection={estDansMultiTri ? localSortState[sortIndexInMulti].order : null}
                                        sortIndex={sortIndexInMulti}
                                        largeur={largeursColonnes.get(col.key) ?? col.size ?? 150}
                                        estPinned={(pinningPositions.get(col.key) || false) as 'left' | 'right' | false}
                                        offsetPinned={offsetsPinnedFinal.get(col.key) ?? 0}
                                        enableResize={enableResizing}
                                        enableDrag={false}
                                        onSort={() => handleSort(col.key)}
                                        onResizeStart={handleResizeStart}
                                        onResizeMove={handleResizeMove}
                                        onResizeEnd={handleResizeEnd}
                                        isSticky={stickyHeader}
                                        estDerniereColonne={index === colonnesVisibles.length - 1}
                                    />
                                );
                            })}
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
                                    pinningPositions={pinningPositions}
                                    offsetsPinned={offsetsPinnedFinal}
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
                                {colonnesVisibles.map((col) => {
                                    // Si la colonne a renderActions, utiliser RowActions avec filtrage RBAC
                                    const contenu = col.renderActions
                                        ? (() => {
                                            const actionsBrutes = col.renderActions(item);
                                            const actionsFiltrees = actionsBrutes.filter(
                                                (action) => !action.permission || hasPermission(action.permission)
                                            );
                                            return actionsFiltrees.length > 0
                                                ? <RowActions actions={actionsFiltrees} />
                                                : null;
                                        })()
                                        : col.render
                                          ? col.render(item, index)
                                          : (item as any)[col.key];

                                    return (
                                        <div key={col.key} className="flex flex-col gap-[var(--gap-xxs)] py-[var(--space-xxs)]">
                                            <span className="text-xs font-medium text-[var(--color-text-secondary)]" style={{ fontSize: 'clamp(0.625rem, 0.55rem + 0.2vw, 0.75rem)' }}>
                                                {col.header}
                                            </span>
                                            <div className="text-sm text-[var(--color-text-primary)]" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}>
                                                {contenu}
                                            </div>
                                        </div>
                                    );
                                })}
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
