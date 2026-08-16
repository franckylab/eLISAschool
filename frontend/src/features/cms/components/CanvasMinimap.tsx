/**
 * ==================================
 * eLISAschool - Canvas Minimap (vue d'ensemble)
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Mini-carte du canvas affichant toutes les sections en miniature
 * avec indicateur de viewport et navigation rapide.
 * Inspiré de Figma minimap / VS Code minimap.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Eye, ZoomIn, ZoomOut, Maximize2, ChevronUp, ChevronDown } from 'lucide-react';
import type { Data } from '@puckeditor/core';

// ==================================
// Types
// ==================================

interface CanvasMinimapProps {
    /** Données Puck actuelles */
    puckData: Data;
    /** Zoom actuel */
    zoom: number;
    /** Position scroll actuelle */
    scrollPos: { x: number; y: number };
    /** Taille du contenu */
    contentSize: { width: number; height: number };
    /** Taille du viewport */
    viewportSize: { width: number; height: number };
    /** Callback scroll vers position */
    onScrollTo: (x: number, y: number) => void;
    /** Callback zoom change */
    onZoomChange: (zoom: number) => void;
    /** Callback zoom-to-fit */
    onZoomToFit: () => void;
    /** Section sélectionnée */
    selectedItemId: string | null;
    /** Callback select section */
    onSelectSection: (id: string) => void;
    /** Mode sombre */
    dark?: boolean;
}

// ==================================
// Couleurs par type de section
// ==================================

const SECTION_COLORS: Record<string, string> = {
    Hero: '#3b82f6',
    Texte: '#6366f1',
    Galerie: '#8b5cf6',
    CarteInfos: '#06b6d4',
    Temoignages: '#f59e0b',
    ChiffresCles: '#10b981',
    Equipe: '#ec4899',
    Formulaire: '#ef4444',
    Carte: '#14b8a6',
    Video: '#f43f5e',
    Telechargements: '#84cc16',
    Actualites: '#0ea5e9',
    Horaires: '#a855f7',
    Partenaires: '#f97316',
    Faq: '#22d3ee',
    AppelAction: '#e11d48',
    Separateur: '#94a3b8',
    HtmlCustom: '#64748b',
};

function getSectionColor(type: string): string {
    return SECTION_COLORS[type] || '#6b7280';
}

// ==================================
// Composant principal
// ==================================

export function CanvasMinimap({
    puckData,
    zoom,
    scrollPos,
    contentSize,
    viewportSize,
    onScrollTo,
    onZoomChange,
    onZoomToFit,
    selectedItemId,
    onSelectSection,
    dark = false,
}: CanvasMinimapProps) {
    const minimapRef = useRef<HTMLDivElement>(null);
    const [isDraggingViewport, setIsDraggingViewport] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [hoveredSection, setHoveredSection] = useState<string | null>(null);

    // Dimensions minimap
    const MINIMAP_WIDTH = 160;
    const MINIMAP_HEIGHT = 120;
    // Protection NaN : si contentSize contient NaN, utiliser 0 pour éviter la propagation
    const safeWidth = Number.isFinite(contentSize.width) ? contentSize.width : 0;
    const safeHeight = Number.isFinite(contentSize.height) ? contentSize.height : 0;
    const SCALE_X = MINIMAP_WIDTH / Math.max(safeWidth, 1);
    const SCALE_Y = MINIMAP_HEIGHT / Math.max(safeHeight, 1);
    const scale = Number.isFinite(Math.min(SCALE_X, SCALE_Y)) ? Math.min(SCALE_X, SCALE_Y) : 1;

    // Viewport rectangle dans le minimap
    const vpRect = {
        x: Number.isFinite(scrollPos.x * scale) ? scrollPos.x * scale : 0,
        y: Number.isFinite(scrollPos.y * scale) ? scrollPos.y * scale : 0,
        width: Number.isFinite(viewportSize.width * scale) ? Math.min(viewportSize.width * scale, MINIMAP_WIDTH) : MINIMAP_WIDTH,
        height: Number.isFinite(viewportSize.height * scale) ? Math.min(viewportSize.height * scale, MINIMAP_HEIGHT) : MINIMAP_HEIGHT,
    };

    // Drag viewport dans le minimap
    const handleViewportMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingViewport(true);
    }, []);

    useEffect(() => {
        if (!isDraggingViewport) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!minimapRef.current) return;
            const rect = minimapRef.current.getBoundingClientRect();
            const x = (e.clientX - rect.left) / scale - viewportSize.width / 2;
            const y = (e.clientY - rect.top) / scale - viewportSize.height / 2;
            onScrollTo(Math.max(0, x), Math.max(0, y));
        };

        const handleMouseUp = () => setIsDraggingViewport(false);

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDraggingViewport, scale, viewportSize, onScrollTo]);

    // Clic sur le minimap → naviguer
    const handleMinimapClick = useCallback((e: React.MouseEvent) => {
        if (!minimapRef.current) return;
        const rect = minimapRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / scale - viewportSize.width / 2;
        const y = (e.clientY - rect.top) / scale - viewportSize.height / 2;
        onScrollTo(Math.max(0, x), Math.max(0, y));
    }, [scale, viewportSize, onScrollTo]);

    // Sections du contenu
    const sections = puckData.content || [];

    // Calculer la position et hauteur de chaque section dans le minimap
    const sectionHeight = Math.max(2, MINIMAP_HEIGHT / Math.max(sections.length, 1));
    const safeSectionHeight = Number.isFinite(sectionHeight) ? sectionHeight : 2;

    if (!isExpanded) {
        return (
            <div className="cms-minimap-toggle">
                <button
                    onClick={() => setIsExpanded(true)}
                    className="cms-minimap-toggle__btn"
                    title="Ouvrir la mini-carte"
                >
                    <Eye className="cms-minimap-toggle__icon" />
                    <span className="cms-minimap-toggle__label">Mini-carte</span>
                </button>
            </div>
        );
    }

    return (
        <div className={`cms-minimap ${dark ? 'cms-minimap--dark' : ''}`}>
            {/* Header */}
            <div className="cms-minimap__header">
                <span className="cms-minimap__title">
                    <Eye className="cms-minimap__title-icon" />
                    Vue d'ensemble
                </span>
                <div className="cms-minimap__controls">
                    <button
                        onClick={() => onZoomChange(Math.max(25, zoom - 10))}
                        className="cms-minimap__ctrl-btn"
                        title="Zoom -"
                    >
                        <ZoomOut className="cms-minimap__ctrl-icon" />
                    </button>
                    <span className="cms-minimap__zoom">{zoom}%</span>
                    <button
                        onClick={() => onZoomChange(Math.min(200, zoom + 10))}
                        className="cms-minimap__ctrl-btn"
                        title="Zoom +"
                    >
                        <ZoomIn className="cms-minimap__ctrl-icon" />
                    </button>
                    <button
                        onClick={onZoomToFit}
                        className="cms-minimap__ctrl-btn"
                        title="Ajuster à la vue"
                    >
                        <Maximize2 className="cms-minimap__ctrl-icon" />
                    </button>
                    <button
                        onClick={() => setIsExpanded(false)}
                        className="cms-minimap__close-btn"
                        title="Réduire"
                    >
                        ×
                    </button>
                </div>
            </div>

            {/* Canvas minimap */}
            <div
                ref={minimapRef}
                className="cms-minimap__canvas"
                onClick={handleMinimapClick}
                style={{ width: MINIMAP_WIDTH, height: MINIMAP_HEIGHT }}
            >
                {/* Sections blocks */}
                {sections.map((section, idx) => {
                    const type = (section as any).type || 'Texte';
                    const color = getSectionColor(type);
                    const id = (section.props as any)?.id || `idx-${idx}`;
                    const isSelected = selectedItemId === id;
                    const isHovered = hoveredSection === id;

                    return (
                        <div
                            key={id}
                            className={`cms-minimap__section ${isSelected ? 'cms-minimap__section--selected' : ''} ${isHovered ? 'cms-minimap__section--hovered' : ''}`}
                            style={{
                                top: idx * (safeSectionHeight + 1),
                                height: safeSectionHeight,
                                backgroundColor: color,
                                opacity: isSelected ? 1 : 0.6,
                            }}
                            onMouseEnter={() => setHoveredSection(id)}
                            onMouseLeave={() => setHoveredSection(null)}
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelectSection(id);
                            }}
                            title={`${type} — ${idx + 1}`}
                        >
                            {sectionHeight > 8 && (
                                <span className="cms-minimap__section-label">
                                    {type}
                                </span>
                            )}
                        </div>
                    );
                })}

                {/* Viewport indicator */}
                <div
                    className={`cms-minimap__viewport ${isDraggingViewport ? 'cms-minimap__viewport--dragging' : ''}`}
                    style={{
                        left: vpRect.x,
                        top: vpRect.y,
                        width: vpRect.width,
                        height: vpRect.height,
                    }}
                    onMouseDown={handleViewportMouseDown}
                />

                {/* Empty state */}
                {sections.length === 0 && (
                    <div className="cms-minimap__empty">
                        <span>Page vide</span>
                    </div>
                )}
            </div>

            {/* Footer — section list */}
            <div className="cms-minimap__footer">
                <div className="cms-minimap__stats">
                    <span>{sections.length} section{sections.length > 1 ? 's' : ''}</span>
                    <span>{zoom}%</span>
                </div>
                {/* Quick scroll buttons */}
                <div className="cms-minimap__quick-scroll">
                    <button
                        onClick={() => onScrollTo(scrollPos.x, Math.max(0, scrollPos.y - 200))}
                        className="cms-minimap__scroll-btn"
                        title="Remonter"
                    >
                        <ChevronUp className="cms-minimap__scroll-icon" />
                    </button>
                    <button
                        onClick={() => onScrollTo(scrollPos.x, scrollPos.y + 200)}
                        className="cms-minimap__scroll-btn"
                        title="Descendre"
                    >
                        <ChevronDown className="cms-minimap__scroll-icon" />
                    </button>
                </div>
            </div>

            {/* Hovered section tooltip */}
            {hoveredSection && (
                <div className="cms-minimap__tooltip">
                    {(() => {
                        const idx = sections.findIndex((s) => (s.props as any)?.id === hoveredSection);
                        const section = sections[idx];
                        if (!section) return null;
                        const type = (section as any).type || 'Section';
                        return (
                            <>
                                <span className="cms-minimap__tooltip-type">{type}</span>
                                <span className="cms-minimap__tooltip-idx">#{idx + 1}</span>
                            </>
                        );
                    })()}
                </div>
            )}
        </div>
    );
}
