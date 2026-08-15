/**
 * ==================================
 * eLISAschool - Hook de multi-sélection de sections pour éditeur CMS
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Permet de sélectionner plusieurs sections à la fois avec Shift+Click,
 * Ctrl+Click, et sélection par zone (drag select).
 * Inspiré de Figma, Webflow, et Framer.
 */

import { useState, useCallback, useMemo } from 'react';

// ==================================
// Types
// ==================================

export interface MultiSelectState {
    selectedIds: Set<string>;
    lastSelectedId: string | null;
    isMultiSelecting: boolean;
}

export interface MultiSelectHandlers {
    handleSelect: (id: string, event: React.MouseEvent | React.KeyboardEvent) => void;
    handleSelectAll: () => void;
    handleDeselectAll: () => void;
    handleSelectRange: (startId: string, endId: string, allIds: string[]) => void;
    isSelected: (id: string) => boolean;
    selectedCount: number;
    selectedIds: string[];
}

// ==================================
// Hook principal
// ==================================

export function useMultiSelect(initialIds: string[] = []): MultiSelectHandlers {
    const [state, setState] = useState<MultiSelectState>({
        selectedIds: new Set(initialIds),
        lastSelectedId: null,
        isMultiSelecting: false,
    });

    // Sélectionner une section (avec support Shift/Ctrl)
    const handleSelect = useCallback((id: string, event: React.MouseEvent | React.KeyboardEvent) => {
        const isShift = event.shiftKey;
        const isCtrl = event.ctrlKey || event.metaKey;

        setState(prev => {
            const newSelectedIds = new Set(prev.selectedIds);

            if (isShift && prev.lastSelectedId) {
                // Sélection par plage (Shift+Click)
                // Note: nécessite handleSelectRange pour connaître l'ordre des sections
                // Ici on ajoute juste l'élément
                newSelectedIds.add(id);
            } else if (isCtrl) {
                // Toggle selection (Ctrl/Cmd+Click)
                if (newSelectedIds.has(id)) {
                    newSelectedIds.delete(id);
                } else {
                    newSelectedIds.add(id);
                }
            } else {
                // Sélection simple (Click)
                newSelectedIds.clear();
                newSelectedIds.add(id);
            }

            return {
                selectedIds: newSelectedIds,
                lastSelectedId: id,
                isMultiSelecting: newSelectedIds.size > 1,
            };
        });
    }, []);

    // Sélectionner par plage (Shift+Click)
    const handleSelectRange = useCallback((startId: string, endId: string, allIds: string[]) => {
        const startIndex = allIds.indexOf(startId);
        const endIndex = allIds.indexOf(endId);

        if (startIndex === -1 || endIndex === -1) return;

        const min = Math.min(startIndex, endIndex);
        const max = Math.max(startIndex, endIndex);
        const rangeIds = allIds.slice(min, max + 1);

        setState(prev => ({
            selectedIds: new Set([...prev.selectedIds, ...rangeIds]),
            lastSelectedId: endId,
            isMultiSelecting: true,
        }));
    }, []);

    // Tout sélectionner
    const handleSelectAll = useCallback(() => {
        // Note: nécessite de passer tous les IDs
        // Cette fonction sera appelée avec les IDs depuis le composant
    }, []);

    // Tout désélectionner
    const handleDeselectAll = useCallback(() => {
        setState({
            selectedIds: new Set(),
            lastSelectedId: null,
            isMultiSelecting: false,
        });
    }, []);

    // Vérifier si une section est sélectionnée
    const isSelected = useCallback((id: string) => {
        return state.selectedIds.has(id);
    }, [state.selectedIds]);

    // Nombre de sections sélectionnées
    const selectedCount = state.selectedIds.size;

    // IDs sélectionnés sous forme de tableau
    const selectedIds = useMemo(() => Array.from(state.selectedIds), [state.selectedIds]);

    return {
        handleSelect,
        handleSelectAll,
        handleDeselectAll,
        handleSelectRange,
        isSelected,
        selectedCount,
        selectedIds,
    };
}

// ==================================
// Hook pour la sélection par zone (drag select)
// ==================================

export function useDragSelect() {
    const [isDragging, setIsDragging] = useState(false);
    const [selectionBox, setSelectionBox] = useState<{
        startX: number;
        startY: number;
        endX: number;
        endY: number;
    } | null>(null);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        // Ne démarrer que si on clique sur le canvas (pas sur une section)
        if (e.target === e.currentTarget) {
            setIsDragging(true);
            setSelectionBox({
                startX: e.clientX,
                startY: e.clientY,
                endX: e.clientX,
                endY: e.clientY,
            });
        }
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging) return;

        setSelectionBox(prev => prev ? {
            ...prev,
            endX: e.clientX,
            endY: e.clientY,
        } : null);
    }, [isDragging]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        setSelectionBox(null);
    }, []);

    // Calculer la boîte de sélection
    const selectionRect = useMemo(() => {
        if (!selectionBox) return null;

        const { startX, startY, endX, endY } = selectionBox;
        return {
            left: Math.min(startX, endX),
            top: Math.min(startY, endY),
            width: Math.abs(endX - startX),
            height: Math.abs(endY - startY),
        };
    }, [selectionBox]);

    // Vérifier si un élément est dans la boîte de sélection
    const isElementInSelection = useCallback((elementRect: DOMRect, selectionRect: typeof selectionRect) => {
        if (!selectionRect) return false;

        return !(
            elementRect.right < selectionRect.left ||
            elementRect.left > selectionRect.left + selectionRect.width ||
            elementRect.bottom < selectionRect.top ||
            elementRect.top > selectionRect.top + selectionRect.height
        );
    }, []);

    return {
        isDragging,
        selectionRect,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        isElementInSelection,
    };
}

// ==================================
// Composant visuel pour la boîte de sélection
// ==================================

export function SelectionBox({ rect }: { rect: { left: number; top: number; width: number; height: number } | null }) {
    if (!rect) return null;

    return (
        <div
            className="cms-drag-select-box"
            style={{
                position: 'fixed',
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height,
                border: '2px solid #3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '4px',
                pointerEvents: 'none',
                zIndex: 9999,
                boxShadow: '0 0 0 1px rgba(59, 130, 246, 0.2), 0 4px 12px rgba(59, 130, 246, 0.15)',
            }}
        />
    );
}
