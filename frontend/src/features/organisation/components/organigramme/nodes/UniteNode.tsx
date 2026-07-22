/**
 * ==================================
 * eLISAschool - Noeud Unite pour React Flow
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Noeud custom React Flow représentant une UniteOrganisationnelle.
 * Header coloré (thème), liste des postes compacte, footer stats.
 */

import { memo, useCallback } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { ChevronDown, ChevronRight, Users, Briefcase, Pencil, Plus, Trash2 } from 'lucide-react';
import type { OrganigrammeNode } from '../../../types/organisation.types';
import { MAX_POSTES_VISIBLE } from '../utils/layout';

export interface UniteNodeData {
    unite: OrganigrammeNode;
    isCollapsed: boolean;
    onToggleCollapse: (id: string) => void;
    onSelect: (unite: OrganigrammeNode) => void;
    isSelected: boolean;
    isSearchMatch?: boolean;
    direction: 'TB' | 'LR';
    // Mode édition
    isEditMode?: boolean;
    onEdit?: (unite: OrganigrammeNode) => void;
    onAddChild?: (unite: OrganigrammeNode) => void;
    onDelete?: (unite: OrganigrammeNode) => void;
    // DnD visual state
    isDragged?: boolean;
    isDropTarget?: boolean;
    isDropValid?: boolean;
    isAnyDragging?: boolean;
    isConnectable?: boolean;
}

function UniteNodeComponent({ data }: NodeProps<UniteNodeData>) {
    const {
        unite, isCollapsed, onToggleCollapse, onSelect, isSelected, isSearchMatch, direction,
        isEditMode, onEdit, onAddChild, onDelete,
        isDragged, isDropTarget, isDropValid, isAnyDragging, isConnectable,
    } = data;

    const handleToggle = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleCollapse(unite.id);
    }, [unite.id, onToggleCollapse]);

    const handleClick = useCallback(() => {
        onSelect(unite);
    }, [unite, onSelect]);

    // Handlers mode édition
    const handleEdit = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onEdit?.(unite);
    }, [unite, onEdit]);

    const handleAddChild = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onAddChild?.(unite);
    }, [unite, onAddChild]);

    const handleDelete = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete?.(unite);
    }, [unite, onDelete]);

    const postes = unite.postes || [];
    const postesAffiches = postes.slice(0, MAX_POSTES_VISIBLE);
    const postesRestants = postes.length - MAX_POSTES_VISIBLE;
    const hasChildren = (unite.enfants?.length || 0) > 0;

    // Positions des handles selon la direction
    const inputPos = direction === 'TB' ? Position.Top : Position.Left;
    const outputPos = direction === 'TB' ? Position.Bottom : Position.Right;

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(unite);
        }
    }, [unite, onSelect]);

    return (
        <div
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            role="treeitem"
            tabIndex={0}
            aria-label={`${unite.nom} — ${postes.length} postes, ${unite.totalMembres || 0} membres`}
            aria-expanded={hasChildren ? !isCollapsed : undefined}
            aria-selected={isSelected}
            className={`
                group relative rounded-[var(--radius-lg)] overflow-visible cursor-pointer
                border-2 transition-all duration-200
                focus-visible:outline-2 focus-visible:outline-[var(--color-dominant-600)] focus-visible:outline-offset-2
                ${isDragged
                    ? 'opacity-50 scale-95 shadow-lg'
                    : isAnyDragging && !isDropTarget
                        ? 'opacity-70'
                        : ''
                }
                ${isDropTarget && isDropValid
                    ? 'ring-4 ring-green-500/60 shadow-[0_0_20px_rgba(34,197,94,0.3)] scale-[1.03] border-green-500'
                    : isDropTarget && !isDropValid
                        ? 'ring-4 ring-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.3)] border-red-500'
                        : ''
                }
                ${isSearchMatch && !isDragged
                    ? 'border-[var(--color-accent-600)] shadow-[0_0_16px_rgba(var(--color-accent-600-rgb),0.4)] ring-2 ring-[var(--color-accent-600)]/30 scale-[1.03]'
                    : !isDragged && !isDropTarget && isSelected
                        ? 'border-[var(--color-dominant-600)] shadow-[0_0_12px_rgba(var(--color-dominant-600-rgb),0.3)]'
                        : !isDragged && !isDropTarget && !isSelected
                            ? 'border-[var(--color-bordure)] hover:border-[var(--color-dominant-400)] hover:shadow-md hover:scale-[1.02]'
                            : ''
                }
                ${isEditMode && !isDragged && !isDropTarget ? 'ring-2 ring-dashed ring-[var(--color-dominant-300)]/50' : ''}
                bg-[var(--color-surface)]
            `}
            style={{ width: 220 }}
        >
            {/* Handle d'entrée — connectable uniquement en mode édition */}
            <Handle
                type="target"
                position={inputPos}
                className={`!w-2.5 !h-2.5 !border-[var(--color-surface)] !border-2 transition-colors duration-200 ${
                    isConnectable
                        ? '!bg-[var(--color-dominant-400)] hover:!bg-[var(--color-dominant-600)] !cursor-crosshair'
                        : '!bg-[var(--color-text-muted)]'
                }`}
                isConnectable={isConnectable}
            />

            {/* Header */}
            <div
                className="px-3 py-2 flex items-center justify-between gap-1"
                style={{ backgroundColor: 'var(--color-dominant-600)' }}
            >
                <span
                    className="text-white font-medium truncate text-xs"
                    style={{ fontSize: 'clamp(0.6875rem, 0.65rem + 0.15vw, 0.75rem)' }}
                    title={unite.nom}
                >
                    {unite.nom}
                </span>
                {hasChildren && (
                    <button
                        onClick={handleToggle}
                        className="text-white/80 hover:text-white transition-colors flex-shrink-0"
                        aria-label={isCollapsed ? 'Déplier' : 'Replier'}
                    >
                        {isCollapsed ? (
                            <ChevronRight className="h-3.5 w-3.5" />
                        ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                        )}
                    </button>
                )}
            </div>

            {/* Body — Postes */}
            <div className="px-3 py-2 space-y-1">
                {postesAffiches.map((poste: OrganigrammeNode['postes'][number]) => (
                    <div
                        key={poste.id}
                        className="flex items-center gap-1.5 text-[var(--color-text-secondary)]"
                        style={{ fontSize: 'clamp(0.625rem, 0.6rem + 0.1vw, 0.6875rem)' }}
                    >
                        <Briefcase className="h-3 w-3 flex-shrink-0 text-[var(--color-text-muted)]" />
                        <span className="truncate">{poste.intitule}</span>
                    </div>
                ))}
                {postesRestants > 0 && (
                    <div
                        className="text-[var(--color-text-muted)] italic"
                        style={{ fontSize: 'clamp(0.5625rem, 0.55rem + 0.08vw, 0.625rem)' }}
                    >
                        +{postesRestants} autre{postesRestants > 1 ? 's' : ''}
                    </div>
                )}
                {postes.length === 0 && (
                    <div
                        className="text-[var(--color-text-muted)] italic"
                        style={{ fontSize: 'clamp(0.5625rem, 0.55rem + 0.08vw, 0.625rem)' }}
                    >
                        Aucun poste
                    </div>
                )}
            </div>

            {/* Footer — Stats */}
            <div
                className="px-3 py-1.5 flex items-center justify-between border-t border-[var(--color-bordure)]"
                style={{ fontSize: 'clamp(0.5625rem, 0.54rem + 0.08vw, 0.625rem)' }}
            >
                <span className="flex items-center gap-1 text-[var(--color-text-muted)]">
                    <Briefcase className="h-3 w-3" />
                    {postes.length}
                </span>
                <span className="flex items-center gap-1 text-[var(--color-text-muted)]">
                    <Users className="h-3 w-3" />
                    {unite.totalMembres || 0}
                </span>
                {unite.postesVacants > 0 && (
                    <span className="text-amber-500 font-medium">
                        {unite.postesVacants} vacant{unite.postesVacants > 1 ? 's' : ''}
                    </span>
                )}
            </div>

            {/* Overlay actions mode édition */}
            {isEditMode && (
                <div
                    className="absolute -top-1 -right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                    onClick={(e) => e.stopPropagation()}
                >
                    {onEdit && (
                        <button
                            onClick={handleEdit}
                            className="w-6 h-6 flex items-center justify-center rounded-md bg-white shadow-md border border-[var(--color-bordure)] hover:bg-[var(--color-dominant-50)] transition-colors"
                            title="Modifier"
                        >
                            <Pencil className="w-3 h-3 text-[var(--color-text-muted)]" />
                        </button>
                    )}
                    {onAddChild && (
                        <button
                            onClick={handleAddChild}
                            className="w-6 h-6 flex items-center justify-center rounded-md bg-white shadow-md border border-[var(--color-bordure)] hover:bg-[var(--color-dominant-50)] transition-colors"
                            title="Ajouter enfant"
                        >
                            <Plus className="w-3 h-3 text-[var(--color-dominant-600)]" />
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={handleDelete}
                            className="w-6 h-6 flex items-center justify-center rounded-md bg-white shadow-md border border-[var(--color-bordure)] hover:bg-red-50 transition-colors"
                            title="Supprimer"
                        >
                            <Trash2 className="w-3 h-3 text-red-500" />
                        </button>
                    )}
                </div>
            )}

            {/* Handle de sortie — connectable uniquement en mode édition */}
            <Handle
                type="source"
                position={outputPos}
                className={`!w-2.5 !h-2.5 !border-[var(--color-surface)] !border-2 transition-colors duration-200 ${
                    isConnectable
                        ? '!bg-[var(--color-dominant-600)] hover:!bg-[var(--color-dominant-700)] !cursor-crosshair'
                        : '!bg-[var(--color-dominant-600)]'
                }`}
                isConnectable={isConnectable}
            />
        </div>
    );
}

export const UniteNode = memo(UniteNodeComponent);
