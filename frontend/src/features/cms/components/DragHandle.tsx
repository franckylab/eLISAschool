/**
 * ==================================
 * eLISAschool - Drag Handle amélioré pour sections CMS
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Poignées de drag & drop améliorées avec :
 * - Feedback visuel pendant le drag
 * - Indicateurs de position
 * - Animation fluide
 * - Mode compact/étendu
 */

import React, { useState, useRef, useCallback } from 'react';
import { GripVertical, ChevronUp, ChevronDown, Copy, Trash2, Eye, EyeOff, MoreHorizontal } from 'lucide-react';

// ==================================
// Types
// ==================================

export interface DragHandleProps {
    /** Index de la section */
    index: number;
    /** Total de sections */
    total: number;
    /** Section actuellement sélectionnée */
    isSelected: boolean;
    /** Section en hover */
    isHovered: boolean;
    /** Callback drag start */
    onDragStart: (index: number) => void;
    /** Callback drag end */
    onDragEnd: () => void;
    /** Callback move up */
    onMoveUp: () => void;
    /** Callback move down */
    onMoveDown: () => void;
    /** Callback duplicate */
    onDuplicate: () => void;
    /** Callback delete */
    onDelete: () => void;
    /** Callback toggle visibility */
    onToggleVisibility: () => void;
    /** Section visible ? */
    isVisible: boolean;
    /** Mode compact */
    compact?: boolean;
}

// ==================================
// Composant principal
// ==================================

export function EnhancedDragHandle({
    index,
    total,
    isSelected,
    isHovered,
    onDragStart,
    onDragEnd,
    onMoveUp,
    onMoveDown,
    onDuplicate,
    onDelete,
    onToggleVisibility,
    isVisible,
    compact = false,
}: DragHandleProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const handleRef = useRef<HTMLDivElement>(null);

    const handleDragStart = useCallback((e: React.DragEvent) => {
        setIsDragging(true);
        onDragStart(index);
        // Style pendant le drag
        if (handleRef.current) {
            handleRef.current.style.opacity = '0.5';
        }
    }, [index, onDragStart]);

    const handleDragEnd = useCallback(() => {
        setIsDragging(false);
        onDragEnd();
        if (handleRef.current) {
            handleRef.current.style.opacity = '1';
        }
    }, [onDragEnd]);

    const canMoveUp = index > 0;
    const canMoveDown = index < total - 1;

    if (compact) {
        return (
            <div
                ref={handleRef}
                draggable
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-0.5 rounded-md px-1 py-0.5 transition-all ${
                    isDragging
                        ? 'bg-blue-100 scale-95'
                        : isSelected
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                }`}
                title={`Section ${index + 1} — Glisser pour réorganiser`}
            >
                <GripVertical className="h-3 w-3 cursor-grab active:cursor-grabbing" />
            </div>
        );
    }

    return (
        <div
            ref={handleRef}
            className={`group relative flex items-center gap-1 rounded-lg border transition-all ${
                isDragging
                    ? 'border-blue-300 bg-blue-50 shadow-lg scale-95'
                    : isSelected
                    ? 'border-blue-200 bg-blue-50/80 shadow-sm'
                    : isHovered
                    ? 'border-gray-200 bg-white shadow-sm'
                    : 'border-transparent bg-transparent'
            }`}
        >
            {/* Drag handle principal */}
            <div
                draggable
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                className={`flex items-center justify-center rounded-md px-1.5 py-1 cursor-grab active:cursor-grabbing transition-colors ${
                    isDragging
                        ? 'bg-blue-100 text-blue-600'
                        : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                }`}
                title={`Section ${index + 1}/${total} — Glisser pour réorganiser`}
            >
                <GripVertical className="h-3.5 w-3.5" />
            </div>

            {/* Numéro de section */}
            <div className={`flex h-5 w-5 items-center justify-center rounded text-[9px] font-bold transition-colors ${
                isSelected
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
            }`}>
                {index + 1}
            </div>

            {/* Actions rapides (visible au hover) */}
            <div className={`flex items-center gap-0.5 transition-opacity ${
                isHovered || isSelected ? 'opacity-100' : 'opacity-0'
            }`}>
                {/* Move up */}
                <button
                    onClick={onMoveUp}
                    disabled={!canMoveUp}
                    className="rounded p-0.5 text-gray-400 hover:bg-amber-50 hover:text-amber-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Monter (↑)"
                >
                    <ChevronUp className="h-3 w-3" />
                </button>

                {/* Move down */}
                <button
                    onClick={onMoveDown}
                    disabled={!canMoveDown}
                    className="rounded p-0.5 text-gray-400 hover:bg-amber-50 hover:text-amber-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Descendre (↓)"
                >
                    <ChevronDown className="h-3 w-3" />
                </button>

                {/* Separator */}
                <div className="mx-0.5 h-3 w-px bg-gray-200" />

                {/* Duplicate */}
                <button
                    onClick={onDuplicate}
                    className="rounded p-0.5 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                    title="Dupliquer (Ctrl+D)"
                >
                    <Copy className="h-3 w-3" />
                </button>

                {/* Toggle visibility */}
                <button
                    onClick={onToggleVisibility}
                    className={`rounded p-0.5 transition-colors ${
                        isVisible
                            ? 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                            : 'text-orange-400 hover:bg-orange-50 hover:text-orange-600'
                    }`}
                    title={isVisible ? 'Masquer' : 'Afficher'}
                >
                    {isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                </button>

                {/* Delete */}
                <button
                    onClick={onDelete}
                    className="rounded p-0.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    title="Supprimer (Suppr)"
                >
                    <Trash2 className="h-3 w-3" />
                </button>

                {/* More menu */}
                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                        title="Plus d'actions"
                    >
                        <MoreHorizontal className="h-3 w-3" />
                    </button>
                    {showMenu && (
                        <div className="absolute right-0 top-full mt-1 min-w-[140px] rounded-lg border border-gray-200 bg-white py-1 shadow-xl z-50">
                            <button
                                onClick={() => { onMoveUp(); setShowMenu(false); }}
                                disabled={!canMoveUp}
                                className="flex w-full items-center gap-2 px-2.5 py-1.5 text-[10px] text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                            >
                                <ChevronUp className="h-3 w-3" />
                                Déplacer en haut
                            </button>
                            <button
                                onClick={() => { onMoveDown(); setShowMenu(false); }}
                                disabled={!canMoveDown}
                                className="flex w-full items-center gap-2 px-2.5 py-1.5 text-[10px] text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                            >
                                <ChevronDown className="h-3 w-3" />
                                Déplacer en bas
                            </button>
                            <div className="my-1 h-px bg-gray-100" />
                            <button
                                onClick={() => { onDuplicate(); setShowMenu(false); }}
                                className="flex w-full items-center gap-2 px-2.5 py-1.5 text-[10px] text-gray-600 hover:bg-emerald-50 hover:text-emerald-700"
                            >
                                <Copy className="h-3 w-3" />
                                Dupliquer
                            </button>
                            <div className="my-1 h-px bg-gray-100" />
                            <button
                                onClick={() => { onDelete(); setShowMenu(false); }}
                                className="flex w-full items-center gap-2 px-2.5 py-1.5 text-[10px] text-red-600 hover:bg-red-50"
                            >
                                <Trash2 className="h-3 w-3" />
                                Supprimer
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Indicateur de drag */}
            {isDragging && (
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 rounded-md bg-blue-500 px-2 py-0.5 text-[9px] font-semibold text-white shadow-lg whitespace-nowrap">
                    Déplacement section {index + 1}
                </div>
            )}
        </div>
    );
}

// ==================================
// Hook pour gérer le drag & drop
// ==================================

export function useDragAndDrop<T>(
    items: T[],
    onReorder: (items: T[]) => void
) {
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);

    const handleDragStart = useCallback((index: number) => {
        setDragIndex(index);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
        e.preventDefault();
        setHoverIndex(index);
    }, []);

    const handleDrop = useCallback((index: number) => {
        if (dragIndex === null || dragIndex === index) {
            setDragIndex(null);
            setHoverIndex(null);
            return;
        }

        const newItems = [...items];
        const [draggedItem] = newItems.splice(dragIndex, 1);
        newItems.splice(index, 0, draggedItem);

        onReorder(newItems);
        setDragIndex(null);
        setHoverIndex(null);
    }, [dragIndex, items, onReorder]);

    const handleDragEnd = useCallback(() => {
        setDragIndex(null);
        setHoverIndex(null);
    }, []);

    return {
        dragIndex,
        hoverIndex,
        handleDragStart,
        handleDragOver,
        handleDrop,
        handleDragEnd,
        isDragging: dragIndex !== null,
    };
}

// ==================================
// Composant Drop Zone Indicator
// ==================================

export function DropZoneIndicator({
    isVisible,
    position,
}: {
    isVisible: boolean;
    position: 'before' | 'after';
}) {
    if (!isVisible) return null;

    return (
        <div
            className={`absolute left-0 right-0 h-1 bg-blue-500 transition-all ${
                position === 'before' ? '-top-0.5' : '-bottom-0.5'
            }`}
            style={{
                boxShadow: '0 0 8px rgba(59,130,246,0.5)',
            }}
        >
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-blue-500" />
        </div>
    );
}
