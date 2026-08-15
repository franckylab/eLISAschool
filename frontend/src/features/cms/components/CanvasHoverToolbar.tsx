/**
 * ==================================
 * eLISAschool - Barre d'actions flottante au survol (canvas)
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Toolbar contextuelle qui apparaît au survol d'une section dans le canvas.
 * Inspiré de Figma/Webflow : actions rapides sans clic droit.
 * Positionnée au-dessus du composant survolé.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    Paintbrush, Type, CopyPlus, Trash2, ChevronUp, ChevronDown,
    Eye, Sparkles, MoreHorizontal,
} from 'lucide-react';

// ==================================
// Types
// ==================================

interface CanvasHoverToolbarProps {
    /** Position du composant survolé (bounding rect relatif au canvas) */
    position: { top: number; left: number; width: number; height: number } | null;
    /** Type du composant survolé */
    componentType: string;
    /** Label affiché */
    label?: string;
    /** Callback actions */
    onEditStyle: () => void;
    onEditContent: () => void;
    onInlineEdit: () => void;
    onDuplicate: () => void;
    onDelete: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onToggleVisibility: () => void;
    /** Zoom actuel du canvas (pour ajuster la position) */
    zoom: number;
    /** Scroll position du canvas */
    scrollPos: { x: number; y: number };
}

// ==================================
// Composant principal
// ==================================

export function CanvasHoverToolbar({
    position, componentType, label,
    onEditStyle, onEditContent, onInlineEdit,
    onDuplicate, onDelete, onMoveUp, onMoveDown,
    onToggleVisibility, zoom, scrollPos,
}: CanvasHoverToolbarProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const toolbarRef = useRef<HTMLDivElement>(null);
    const [toolbarPos, setToolbarPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
    const [isVisible, setIsVisible] = useState(false);

    // Calculer la position de la toolbar (au-dessus du composant, centrée)
    useEffect(() => {
        if (!position) {
            setIsVisible(false);
            return;
        }

        const scale = zoom / 100;
        // Positionner au-dessus du composant
        const top = position.top * scale + scrollPos.y - 36;
        const left = (position.left + position.width / 2) * scale + scrollPos.x;

        setToolbarPos({ top: Math.max(8, top), left });
        setIsVisible(true);
    }, [position, zoom, scrollPos]);

    // Fermer le menu étendu au clic extérieur
    useEffect(() => {
        if (!isExpanded) return;
        const handler = (e: MouseEvent) => {
            if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
                setIsExpanded(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isExpanded]);

    if (!position || !isVisible) return null;

    return (
        <div
            ref={toolbarRef}
            className="cms-hover-toolbar"
            style={{
                top: toolbarPos.top,
                left: toolbarPos.left,
                transform: 'translateX(-50%)',
            }}
        >
            <div className="cms-hover-toolbar__inner">
                {/* Label type */}
                <span className="cms-hover-toolbar__label">
                    {label || componentType.replace(/Section$/, '')}
                </span>

                {/* Actions principales (toujours visibles) */}
                <button className="cms-hover-toolbar__btn cms-hover-toolbar__btn--indigo" onClick={onInlineEdit} title="Édition rapide">
                    <Paintbrush />
                </button>
                <button className="cms-hover-toolbar__btn cms-hover-toolbar__btn--purple" onClick={onEditContent} title="Éditer le contenu">
                    <Type />
                </button>
                <button className="cms-hover-toolbar__btn cms-hover-toolbar__btn--blue" onClick={onEditStyle} title="Éditer le style">
                    <Sparkles />
                </button>

                <div className="cms-hover-toolbar__sep" />

                {/* Actions secondaires */}
                <button className="cms-hover-toolbar__btn cms-hover-toolbar__btn--emerald" onClick={onDuplicate} title="Dupliquer">
                    <CopyPlus />
                </button>
                <button className="cms-hover-toolbar__btn cms-hover-toolbar__btn--amber" onClick={onMoveUp} title="Monter">
                    <ChevronUp />
                </button>
                <button className="cms-hover-toolbar__btn cms-hover-toolbar__btn--amber" onClick={onMoveDown} title="Descendre">
                    <ChevronDown />
                </button>

                {/* Menu étendu */}
                <div className="relative">
                    <button
                        className={`cms-hover-toolbar__btn ${isExpanded ? 'cms-hover-toolbar__btn--active' : ''}`}
                        onClick={() => setIsExpanded(!isExpanded)}
                        title="Plus d'actions"
                    >
                        <MoreHorizontal />
                    </button>
                    {isExpanded && (
                        <div className="cms-hover-toolbar__menu">
                            <button
                                onClick={() => { onToggleVisibility(); setIsExpanded(false); }}
                                className="cms-hover-toolbar__menu-item"
                            >
                                <Eye />
                                Basculer visibilité
                            </button>
                            <div className="cms-hover-toolbar__menu-sep" />
                            <button
                                onClick={() => { onDelete(); setIsExpanded(false); }}
                                className="cms-hover-toolbar__menu-item cms-hover-toolbar__menu-item--danger"
                            >
                                <Trash2 />
                                Supprimer
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ==================================
// Hook pour tracker le hover sur les composants Puck
// ==================================

export function useCanvasHoverTracker(canvasScrollRef: React.RefObject<HTMLDivElement | null>) {
    const [hoveredComponent, setHoveredComponent] = useState<{
        id: string;
        type: string;
        position: { top: number; left: number; width: number; height: number };
    } | null>(null);

    useEffect(() => {
        const el = canvasScrollRef.current;
        if (!el) return;

        let debounceTimer: ReturnType<typeof setTimeout> | null = null;

        const handleMouseMove = (e: MouseEvent) => {
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const target = e.target as HTMLElement;
                const puckComponent = target.closest('[data-puck-component-id]') as HTMLElement | null;
                if (puckComponent) {
                    const rect = puckComponent.getBoundingClientRect();
                    const canvasRect = el.getBoundingClientRect();
                    setHoveredComponent({
                        id: puckComponent.getAttribute('data-puck-component-id') || '',
                        type: puckComponent.getAttribute('data-puck-component-type') || '',
                        position: {
                            top: rect.top - canvasRect.top + el.scrollTop,
                            left: rect.left - canvasRect.left + el.scrollLeft,
                            width: rect.width,
                            height: rect.height,
                        },
                    });
                } else {
                    setHoveredComponent(null);
                }
            }, 50); // Petit debounce pour la fluidité
        };

        const handleMouseLeave = () => {
            setHoveredComponent(null);
        };

        el.addEventListener('mousemove', handleMouseMove, { passive: true });
        el.addEventListener('mouseleave', handleMouseLeave);
        return () => {
            el.removeEventListener('mousemove', handleMouseMove);
            el.removeEventListener('mouseleave', handleMouseLeave);
            if (debounceTimer) clearTimeout(debounceTimer);
        };
    }, [canvasScrollRef]);

    return hoveredComponent;
}
