/**
 * ==================================
 * eLISAschool - TransfertList — Composant générique deux colonnes
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Layout deux colonnes (pool disponibles ↔ enfants actuels)
 * avec drag & drop @dnd-kit + boutons fallback accessibilité.
 * Ultra-responsif (empilé vertical sur mobile < 640px).
 */

import { useState, useCallback, useMemo } from 'react';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
    arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    GripVertical,
    ChevronRight,
    ChevronLeft,
    ChevronsRight,
    ChevronsLeft,
    Search,
    X,
} from 'lucide-react';
import { useMediaQuery } from '@/hooks/use-media-query';
import type { ReactNode } from 'react';

/**
 * Item générique pour le transfert
 */
export interface TransfertItem {
    id: string;
    label: string;
    sublabel?: string;
    badge?: string;
    /** Poids optionnel pour répartition personnalisée */
    poids?: number;
    /** Callback appelé quand le poids change (si éditable) */
    onPoidsChange?: (id: string, poids: number) => void;
}

interface TransfertListProps<T extends TransfertItem> {
    /** Pool d'items disponibles (à gauche) */
    disponibles: T[];
    /** Items déjà sélectionnés (à droite) */
    selectionnes: T[];
    /** Callback quand la sélection change */
    onSelectionChange: (items: T[]) => void;
    /** Fonction de rendu personnalisé d'un item */
    renderItem?: (item: T, context: 'pool' | 'selection') => ReactNode;
    /** Label de la colonne disponible */
    labelPool?: string;
    /** Label de la colonne sélection */
    labelSelection?: string;
    /** Désactiver le drag & drop (mobile ou mode lecture) */
    disableDrag?: boolean;
    /** État de chargement */
    isLoading?: boolean;
    /** Texte affiché quand aucune donnée */
    emptyText?: string;
    /** Activer l'affichage/édition des poids dans la colonne sélectionnée */
    showPoids?: boolean;
}

/**
 * Item sortable pour le drag & drop
 */
function SortableItem<T extends TransfertItem>({
    item,
    context,
    renderContent,
    onRemove,
    renderPoids,
}: {
    item: T;
    context: 'pool' | 'selection';
    renderContent: (item: T) => ReactNode;
    onRemove?: (id: string) => void;
    renderPoids?: (item: T) => ReactNode | null;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: item.id,
        disabled: context === 'pool',
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center gap-[var(--gap-xs)] rounded-[var(--radius-md)] border border-[var(--color-bordure)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-alt)] transition-colors group"
        >
            {context === 'selection' && (
                <button
                    {...attributes}
                    {...listeners}
                    className="p-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] cursor-grab active:cursor-grabbing shrink-0"
                    aria-label="Réordonner"
                >
                    <GripVertical className="h-3.5 w-3.5" />
                </button>
            )}
            <div className="flex-1 min-w-0 py-1.5 px-2">
                {renderContent(item)}
            </div>
            {context === 'selection' && renderPoids && renderPoids(item)}
            {context === 'selection' && onRemove && (
                <button
                    onClick={() => onRemove(item.id)}
                    className="p-1 mr-1 text-[var(--color-text-tertiary)] hover:text-red-500 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                    aria-label="Retirer"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            )}
        </div>
    );
}

/**
 * Composant TransfertList — Deux colonnes avec drag & drop
 */
export function TransfertList<T extends TransfertItem>({
    disponibles,
    selectionnes,
    onSelectionChange,
    renderItem,
    labelPool = 'Disponibles',
    labelSelection = 'Sélectionnés',
    disableDrag = false,
    isLoading = false,
    emptyText = 'Aucun élément',
    showPoids = false,
}: TransfertListProps<T>) {
    const estMobile = useMediaQuery('(max-width: 639px)');
    const [recherchePool, setRecherchePool] = useState('');
    const [rechercheSelection, setRechercheSelection] = useState('');

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    );

    // Filtrage pool
    const poolFiltre = useMemo(() => {
        if (!recherchePool.trim()) return disponibles;
        const q = recherchePool.toLowerCase();
        return disponibles.filter(item =>
            item.label.toLowerCase().includes(q) ||
            item.sublabel?.toLowerCase().includes(q),
        );
    }, [disponibles, recherchePool]);

    // Filtrage sélection
    const selectionFiltre = useMemo(() => {
        if (!rechercheSelection.trim()) return selectionnes;
        const q = rechercheSelection.toLowerCase();
        return selectionnes.filter(item =>
            item.label.toLowerCase().includes(q) ||
            item.sublabel?.toLowerCase().includes(q),
        );
    }, [selectionnes, rechercheSelection]);

    // IDs stabilisés pour SortableContext (évite les re-renders @dnd-kit)
    const selectionIds = useMemo(() => selectionFiltre.map(s => s.id), [selectionFiltre]);

    // Rendu par défaut d'un item
    const defaultRenderItem = useCallback((item: T) => (
        <div className="min-w-0">
            <p className="truncate font-medium text-[var(--color-text-primary)]" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}>
                {item.label}
            </p>
            {item.sublabel && (
                <p className="truncate text-[var(--color-text-tertiary)]" style={{ fontSize: 'clamp(0.6875rem, 0.65rem + 0.15vw, 0.75rem)' }}>
                    {item.sublabel}
                </p>
            )}
        </div>
    ), []);

    const render = renderItem || defaultRenderItem;

    // Composant d'affichage/édition du poids
    const renderPoids = useCallback((item: T) => {
        if (!showPoids || item.onPoidsChange === undefined) return null;
        return (
            <div className="flex items-center gap-[var(--gap-xxs)] shrink-0 ml-[var(--gap-xs)]">
                <label className="text-[10px] font-medium text-[var(--color-text-tertiary)] shrink-0" style={{ width: '30px' }}>
                    Poids
                </label>
                <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={item.poids ?? 1}
                    onChange={(e) => item.onPoidsChange?.(item.id, parseFloat(e.target.value) || 0)}
                    className="w-14 rounded-[var(--radius-sm)] border border-[var(--color-bordure)] bg-[var(--color-surface)] text-[var(--color-text-primary)] text-center"
                    style={{ fontSize: 'clamp(0.6875rem, 0.65rem + 0.15vw, 0.75rem)', padding: '0.125rem 0.25rem' }}
                    aria-label={`Poids de ${item.label}`}
                />
            </div>
        );
    }, [showPoids]);

    // Handlers boutons
    const ajouter = (item: T) => {
        onSelectionChange([...selectionnes, item]);
    };

    const retirer = (id: string) => {
        onSelectionChange(selectionnes.filter(s => s.id !== id));
    };

    const ajouterTous = () => {
        onSelectionChange([...selectionnes, ...poolFiltre]);
    };

    const retirerTous = () => {
        onSelectionChange([]);
    };

    // Drag end pour réordonner la sélection
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = selectionnes.findIndex(s => s.id === active.id);
        const newIndex = selectionnes.findIndex(s => s.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;
        onSelectionChange(arrayMove(selectionnes, oldIndex, newIndex));
    };

    // Colonnes
    const colPool = (
        <div className="flex flex-col flex-1 min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-bordure)] bg-[var(--color-surface)]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--color-bordure)]" style={{ padding: 'var(--space-sm)' }}>
                <h4 className="font-semibold text-[var(--color-text-primary)]" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}>
                    {labelPool}
                    <span className="ml-2 text-xs font-normal text-[var(--color-text-tertiary)]">({poolFiltre.length})</span>
                </h4>
            </div>
            {/* Recherche */}
            <div className="border-b border-[var(--color-bordure)] px-2 py-1.5">
                <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-text-tertiary)]" />
                    <input
                        type="text"
                        value={recherchePool}
                        onChange={(e) => setRecherchePool(e.target.value)}
                        placeholder="Rechercher..."
                        className="w-full rounded-[var(--radius-sm)] border border-[var(--color-bordure)] bg-[var(--color-surface)] text-[var(--color-text-primary)] pl-7 pr-2"
                        style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.8125rem)', padding: '0.375rem 0.5rem 0.375rem 1.75rem' }}
                    />
                </div>
            </div>
            {/* Liste */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1" style={{ maxHeight: 'clamp(200px, 40vh, 400px)' }}>
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-[var(--color-bordure)] border-t-[var(--color-dominant-600)]" />
                    </div>
                ) : poolFiltre.length === 0 ? (
                    <p className="text-center py-8 text-[var(--color-text-tertiary)]" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.8125rem)' }}>
                        {emptyText}
                    </p>
                ) : (
                    poolFiltre.map((item) => (
                        <div key={item.id} className="flex items-center gap-[var(--gap-xxs)]">
                            <div className="flex-1 min-w-0">
                                {render(item, 'pool')}
                            </div>
                            <button
                                onClick={() => ajouter(item)}
                                className="p-1 rounded hover:bg-[var(--color-dominant-50)] text-[var(--color-text-tertiary)] hover:text-[var(--color-dominant-600)] transition-colors shrink-0"
                                aria-label={`Ajouter ${item.label}`}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    const colSelection = (
        <div className="flex flex-col flex-1 min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-dominant-200)] bg-[var(--color-surface)]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--color-dominant-200)]" style={{ padding: 'var(--space-sm)' }}>
                <h4 className="font-semibold text-[var(--color-dominant-700)]" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}>
                    {labelSelection}
                    <span className="ml-2 text-xs font-normal text-[var(--color-text-tertiary)]">({selectionnes.length})</span>
                </h4>
            </div>
            {/* Recherche */}
            <div className="border-b border-[var(--color-dominant-200)] px-2 py-1.5">
                <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-text-tertiary)]" />
                    <input
                        type="text"
                        value={rechercheSelection}
                        onChange={(e) => setRechercheSelection(e.target.value)}
                        placeholder="Rechercher..."
                        className="w-full rounded-[var(--radius-sm)] border border-[var(--color-bordure)] bg-[var(--color-surface)] text-[var(--color-text-primary)] pl-7 pr-2"
                        style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.8125rem)', padding: '0.375rem 0.5rem 0.375rem 1.75rem' }}
                    />
                </div>
            </div>
            {/* Liste */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1" style={{ maxHeight: 'clamp(200px, 40vh, 400px)' }}>
                {selectionFiltre.length === 0 ? (
                    <p className="text-center py-8 text-[var(--color-text-tertiary)]" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.8125rem)' }}>
                        Aucun élément sélectionné
                    </p>
                ) : disableDrag || estMobile ? (
                    /* Mode sans drag (mobile ou désactivé) */
                    selectionFiltre.map((item) => (
                        <div key={item.id} className="flex items-center gap-[var(--gap-xxs)]">
                            <button
                                onClick={() => retirer(item.id)}
                                className="p-1 rounded hover:bg-red-50 text-[var(--color-text-tertiary)] hover:text-red-500 transition-colors shrink-0"
                                aria-label={`Retirer ${item.label}`}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <div className="flex-1 min-w-0">
                                {render(item, 'selection')}
                            </div>
                        </div>
                    ))
                ) : (
                    /* Mode drag & drop */
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={selectionIds} strategy={verticalListSortingStrategy}>
                            {selectionFiltre.map((item) => (
                                <SortableItem
                                    key={item.id}
                                    item={item}
                                    context="selection"
                                    renderContent={render}
                                    onRemove={retirer}
                                    renderPoids={renderPoids}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                )}
            </div>
        </div>
    );

    // Layout responsive
    if (estMobile) {
        return (
            <div className="flex flex-col gap-[var(--gap-md)]">
                {colSelection}
                {/* Boutons centraux */}
                <div className="flex items-center justify-center gap-[var(--gap-sm)]">
                    <button
                        onClick={retirerTous}
                        disabled={selectionnes.length === 0}
                        className="flex items-center gap-1 rounded-[var(--radius-md)] border border-[var(--color-bordure)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] disabled:opacity-40 transition-colors"
                    >
                        <ChevronsLeft className="h-3.5 w-3.5" />
                        Tout retirer
                    </button>
                    <button
                        onClick={ajouterTous}
                        disabled={poolFiltre.length === 0}
                        className="flex items-center gap-1 rounded-[var(--radius-md)] border border-[var(--color-dominant-200)] px-3 py-1.5 text-xs font-medium text-[var(--color-dominant-600)] hover:bg-[var(--color-dominant-50)] disabled:opacity-40 transition-colors"
                    >
                        Tout ajouter
                        <ChevronsRight className="h-3.5 w-3.5" />
                    </button>
                </div>
                {colPool}
            </div>
        );
    }

    return (
        <div className="flex items-stretch gap-[var(--gap-md)]">
            {colPool}
            {/* Boutons centraux (desktop) */}
            <div className="flex flex-col items-center justify-center gap-[var(--gap-sm)] shrink-0">
                <button
                    onClick={ajouterTous}
                    disabled={poolFiltre.length === 0}
                    className="flex items-center gap-1 rounded-[var(--radius-md)] border border-[var(--color-dominant-200)] px-2 py-1.5 text-xs font-medium text-[var(--color-dominant-600)] hover:bg-[var(--color-dominant-50)] disabled:opacity-40 transition-colors"
                    title="Tout ajouter"
                >
                    <ChevronsRight className="h-4 w-4" />
                </button>
                <button
                    onClick={retirerTous}
                    disabled={selectionnes.length === 0}
                    className="flex items-center gap-1 rounded-[var(--radius-md)] border border-[var(--color-bordure)] px-2 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] disabled:opacity-40 transition-colors"
                    title="Tout retirer"
                >
                    <ChevronsLeft className="h-4 w-4" />
                </button>
            </div>
            {colSelection}
        </div>
    );
}
