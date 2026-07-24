/**
 * ==================================
 * eLISAschool - Noeud Unite pour React Flow
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * Noeud custom React Flow représentant une UniteOrganisationnelle.
 * Header coloré (thème), liste des postes compacte, footer stats.
 * v2: Menu ⋮ dans header, distinction clic/drag, handles améliorés.
 */

import { memo, useCallback, useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Handle, Position, type NodeProps } from 'reactflow';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Users, Briefcase, MoreVertical, Pencil, Plus, Trash2 } from 'lucide-react';
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
    isConnecting?: boolean; // true quand un drag de connexion est en cours
}

function UniteNodeComponent({ data }: NodeProps<UniteNodeData>) {
    const { t } = useTranslation('organisation');
    const {
        unite, isCollapsed, onToggleCollapse, onSelect, isSelected, isSearchMatch, direction,
        isEditMode, onEdit, onAddChild, onDelete,
        isDragged, isDropTarget, isDropValid, isAnyDragging, isConnectable, isConnecting,
    } = data;

    // ─── Distinction clic vs drag ───
    const hasDraggedRef = useRef(false);
    const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);

    // ─── Menu ⋮ dropdown ───
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Fermer le menu au clic extérieur
    useEffect(() => {
        if (!menuOpen) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        // Delay pour éviter le fermeture immédiate au clic qui a ouvert le menu
        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 0);
        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [menuOpen]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        mouseDownPosRef.current = { x: e.clientX, y: e.clientY };
        hasDraggedRef.current = false;
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (mouseDownPosRef.current) {
            const dx = Math.abs(e.clientX - mouseDownPosRef.current.x);
            const dy = Math.abs(e.clientY - mouseDownPosRef.current.y);
            if (dx > 3 || dy > 3) {
                hasDraggedRef.current = true;
            }
        }
    }, []);

    const handleToggle = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleCollapse(unite.id);
    }, [unite.id, onToggleCollapse]);

    const handleClick = useCallback((e: React.MouseEvent) => {
        // Si un drag a eu lieu, ne pas déclencher la sélection
        if (hasDraggedRef.current) {
            hasDraggedRef.current = false;
            return;
        }
        // Si le clic vient du menu ⋮ ou du dropdown, ne pas sélectionner
        if ((e.target as HTMLElement).closest('[data-menu-trigger]')) {
            return;
        }
        onSelect(unite);
    }, [unite, onSelect]);

    const handleDoubleClick = useCallback((e: React.MouseEvent) => {
        // En mode édition : double-clic ouvre le modal d'édition
        // Sauf si le double-clic vient du menu ⋮
        if ((e.target as HTMLElement).closest('[data-menu-trigger]')) return;
        if (isEditMode && onEdit) {
            onEdit(unite);
        }
    }, [isEditMode, onEdit, unite]);

    // Handlers mode édition
    const handleEdit = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setMenuOpen(false);
        onEdit?.(unite);
    }, [unite, onEdit]);

    const handleAddChild = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setMenuOpen(false);
        onAddChild?.(unite);
    }, [unite, onAddChild]);

    const handleDelete = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setMenuOpen(false);
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
            onDoubleClick={handleDoubleClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
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
                    ? 'ring-4 ring-success/60 shadow-[0_0_20px_rgba(var(--color-success),0.3)] scale-[1.03] border-[var(--color-success)]'
                    : isDropTarget && !isDropValid
                        ? 'ring-4 ring-danger/60 shadow-[0_0_20px_rgba(var(--color-danger),0.3)] border-[var(--color-danger)]'
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
                ${isEditMode && !isDragged && !isDropTarget ? 'border-dashed border-[var(--color-dominant-300)]/50' : ''}
                bg-[var(--color-surface)]
            `}
            style={{ width: 220 }}
        >
            {/* Handle d'entrée — connectable uniquement en mode édition */}
            <Handle
                type="target"
                position={inputPos}
                className={`
                    transition-all duration-200
                    ${isEditMode
                        ? '!w-3 !h-3 !border-[var(--color-surface)] !border-2 !bg-[var(--color-dominant-400)] hover:!bg-[var(--color-dominant-600)] !cursor-crosshair'
                        : '!w-2 !h-2 !bg-[var(--color-text-muted)] !opacity-30'
                    }
                    ${isConnecting && isEditMode
                        ? '!bg-[var(--color-success)] !w-4 !h-4 !shadow-[0_0_8px_rgba(var(--color-success),0.6)]'
                        : ''
                    }
                `}
                isConnectable={isConnectable}
                isConnectableStart={isConnectable}
                isConnectableEnd={isConnectable}
            />

            {/* Header */}
            <div
                className="px-3 py-2 flex items-center gap-1"
                style={{ backgroundColor: unite.echelonStructurelCouleur || 'var(--color-dominant-600)' }}
            >
                <span
                    className="text-white font-medium truncate text-xs flex-1 min-w-0"
                    style={{ fontSize: 'clamp(0.6875rem, 0.65rem + 0.15vw, 0.75rem)' }}
                    title={unite.nom}
                >
                    {unite.nom}
                </span>
                {/* Badge échelon */}
                {unite.echelonStructurelLabel && (
                    <span
                        className="text-[9px] px-1 py-0.5 rounded-full font-medium text-white/90 bg-white/15 flex-shrink-0"
                        title={unite.echelonStructurelLabel}
                    >
                        {unite.echelonStructurelLabel}
                    </span>
                )}
                <div className="flex items-center gap-0.5 flex-shrink-0">
                    {/* Menu ⋮ — visible uniquement en mode édition */}
                    {isEditMode && (
                        <div className="relative" ref={menuRef} data-menu-trigger="true">
                            <button
                                onClick={(e) => { e.stopPropagation(); setMenuOpen(prev => !prev); }}
                                className="text-white/70 hover:text-white transition-colors p-0.5 rounded hover:bg-white/10"
                                aria-label="Actions"
                                aria-expanded={menuOpen}
                                aria-haspopup="menu"
                            >
                                <MoreVertical className="h-3.5 w-3.5" />
                            </button>
                            {/* Dropdown — animé via Framer Motion (opacity + scale) */}
                            <AnimatePresence>
                                {menuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                        transition={{ duration: 0.15, ease: 'easeOut' }}
                                        className="absolute top-full right-0 mt-1 py-1 rounded-[var(--radius-md)] shadow-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] z-50 min-w-[140px]"
                                        style={{ transformOrigin: 'top right' }}
                                    >
                                        {onEdit && (
                                            <button
                                                onClick={handleEdit}
                                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--color-text-primary)] hover:bg-[var(--color-dominant-50)] transition-colors"
                                            >
                                                <Pencil className="w-3 h-3" />
                                                {t('modifier', 'Modifier')}
                                            </button>
                                        )}
                                        {onAddChild && (
                                            <button
                                                onClick={handleAddChild}
                                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--color-text-primary)] hover:bg-[var(--color-dominant-50)] transition-colors"
                                            >
                                                <Plus className="w-3 h-3 text-[var(--color-dominant-600)]" />
                                                {t('ajouterEnfant', 'Ajouter enfant')}
                                            </button>
                                        )}
                                        {onDelete && (
                                            <button
                                                onClick={handleDelete}
                                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--color-danger)] hover:bg-danger/10 transition-colors"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                                {t('supprimer', 'Supprimer')}
                                            </button>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                    {/* Chevron collapse/expand */}
                    {hasChildren && (
                        <button
                            onClick={handleToggle}
                            className="text-white/80 hover:text-white transition-colors p-0.5"
                            aria-label={isCollapsed ? t('deplier') : t('replier')}
                            aria-expanded={!isCollapsed}
                        >
                            {isCollapsed ? (
                                <ChevronRight className="h-3.5 w-3.5" />
                            ) : (
                                <ChevronDown className="h-3.5 w-3.5" />
                            )}
                        </button>
                    )}
                </div>
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
                        +{t('autres', { count: postesRestants })}
                    </div>
                )}
                {postes.length === 0 && (
                    <div
                        className="text-[var(--color-text-muted)] italic"
                        style={{ fontSize: 'clamp(0.5625rem, 0.55rem + 0.08vw, 0.625rem)' }}
                    >
                        {t('aucunPosteCourt')}
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
                    <span className="text-[var(--color-warning)] font-medium">
                        {t('vacants_count', { count: unite.postesVacants })}
                    </span>
                )}
            </div>

            {/* Handle de sortie — connectable uniquement en mode édition */}
            <Handle
                type="source"
                position={outputPos}
                className={`
                    transition-all duration-200
                    ${isEditMode
                        ? '!w-3 !h-3 !border-[var(--color-surface)] !border-2 !bg-[var(--color-dominant-600)] hover:!bg-[var(--color-dominant-700)] !cursor-crosshair'
                        : '!w-2 !h-2 !bg-[var(--color-dominant-600)] !opacity-30'
                    }
                    ${isConnecting && isEditMode
                        ? '!bg-[var(--color-success)] !w-4 !h-4 !shadow-[0_0_8px_rgba(var(--color-success),0.6)]'
                        : ''
                    }
                `}
                isConnectable={isConnectable}
                isConnectableStart={isConnectable}
                isConnectableEnd={isConnectable}
            />
        </div>
    );
}

export const UniteNode = memo(UniteNodeComponent);
