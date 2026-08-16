/**
 * ==================================
 * eLISAschool - Scrollbar Navigator avec marqueurs de sections
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Barre de défilement verticale avec marqueurs colorés
 * représentant chaque section. Permet la navigation rapide
 * et donne une vue d'ensemble de la structure de la page.
 */

import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import type { Data } from '@puckeditor/core';

// ==================================
// Types
// ==================================

interface SectionMarker {
    id: string;
    type: string;
    label: string;
    color: string;
    position: number; // 0-100 percentage
}

export interface ScrollbarNavigatorProps {
    puckData: Data;
    scrollPos: { x: number; y: number };
    contentSize: { width: number; height: number };
    viewportHeight: number;
    onScrollTo: (y: number) => void;
    selectedItemId?: string | null;
    dark?: boolean;
}

// ==================================
// Section colors (cohérent avec CanvasMinimap)
// ==================================

const SECTION_COLORS: Record<string, string> = {
    HeroSection: '#3b82f6',
    TexteSection: '#6366f1',
    GalerieSection: '#8b5cf6',
    CarteInfosSection: '#06b6d4',
    TemoignagesSection: '#f59e0b',
    ChiffresClesSection: '#10b981',
    EquipeSection: '#ec4899',
    FormulaireSection: '#ef4444',
    CarteSection: '#14b8a6',
    VideoSection: '#f43f5e',
    TelechargementsSection: '#84cc16',
    ActualitesSection: '#0ea5e9',
    HorairesSection: '#f97316',
    PartenairesSection: '#a855f7',
    FaqSection: '#3b82f6',
    AppelActionSection: '#f43f5e',
    SeparateurSection: '#94a3b8',
    HtmlCustomSection: '#64748b',
    NewsletterSection: '#8b5cf6',
};

const DEFAULT_COLOR = '#94a3b8';

// ==================================
// Composant principal
// ==================================

export function ScrollbarNavigator({
    puckData,
    scrollPos,
    contentSize,
    viewportHeight,
    onScrollTo,
    selectedItemId,
    dark = false,
}: ScrollbarNavigatorProps) {
    const trackRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);

    // Protection NaN : s'assurer que contentSize.height est un nombre valide
    const safeHeight = Number.isFinite(contentSize.height) ? contentSize.height : 0;

    // Calculer les marqueurs de sections
    const markers = useMemo<SectionMarker[]>(() => {
        if (!puckData.content.length || safeHeight <= 0) return [];

        const totalSections = puckData.content.length;
        // Estimation : chaque section occupe une portion égale du contenu
        // (en pratique, les sections ont des hauteurs variables)
        const sectionHeight = safeHeight / totalSections;

        return puckData.content.map((item, index) => {
            const props = item.props as Record<string, any>;
            const id = props?.id || `item-${index}`;
            const type = item.type;
            const label = props?.titre || props?.surtitre || type.replace(/Section$/, '');
            const color = SECTION_COLORS[type] || DEFAULT_COLOR;
            // Position en pourcentage
            const position = (index * sectionHeight) / safeHeight * 100;

            return { id, type, label, color, position };
        });
    }, [puckData.content, safeHeight]);

    // Calculer la position et taille du thumb
    const thumbStyle = useMemo(() => {
        if (safeHeight <= 0) return { top: '0%', height: '100%' };

        const scrollPercent = scrollPos.y / Math.max(1, safeHeight - viewportHeight);
        const thumbHeightPercent = Math.min(100, Math.max(8, (viewportHeight / safeHeight) * 100));
        const thumbTopPercent = scrollPercent * (100 - thumbHeightPercent);

        // Protection NaN finale
        if (!Number.isFinite(thumbHeightPercent) || !Number.isFinite(thumbTopPercent)) {
            return { top: '0%', height: '100%' };
        }

        return {
            top: `${thumbTopPercent}%`,
            height: `${thumbHeightPercent}%`,
        };
    }, [scrollPos.y, safeHeight, viewportHeight]);

    // Clic sur le track → navigation directe
    const handleTrackClick = useCallback((e: React.MouseEvent) => {
        if (!trackRef.current) return;
        const rect = trackRef.current.getBoundingClientRect();
        const clickPercent = (e.clientY - rect.top) / rect.height;
        const targetY = clickPercent * (safeHeight - viewportHeight);
        onScrollTo(Math.max(0, Math.min(safeHeight - viewportHeight, targetY)));
    }, [safeHeight, viewportHeight, onScrollTo]);

    // Drag du thumb
    const handleThumbMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!trackRef.current) return;
            const rect = trackRef.current.getBoundingClientRect();
            const dragPercent = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
            const targetY = dragPercent * (safeHeight - viewportHeight);
            onScrollTo(targetY);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, safeHeight, viewportHeight, onScrollTo]);

    // Clic sur un marqueur → scroll vers la section
    const handleMarkerClick = useCallback((marker: SectionMarker) => {
        const index = markers.indexOf(marker);
        if (index >= 0) {
            const sectionHeight = safeHeight / markers.length;
            const targetY = index * sectionHeight;
            onScrollTo(targetY);
        }
    }, [markers, safeHeight, onScrollTo]);

    // Ne pas afficher si pas de sections
    if (markers.length === 0) return null;

    return (
        <div
            className="cms-scrollbar-nav"
            role="scrollbar"
            aria-orientation="vertical"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={safeHeight > 0 ? Math.round((scrollPos.y / Math.max(1, safeHeight - viewportHeight)) * 100) : 0}
            aria-label="Navigation des sections"
        >
            <div
                ref={trackRef}
                className="cms-scrollbar-nav__track"
                onClick={handleTrackClick}
            >
                {/* Thumb (position courante) */}
                <div
                    className={`cms-scrollbar-nav__thumb ${isDragging ? 'cms-scrollbar-nav__thumb--dragging' : ''}`}
                    style={thumbStyle}
                    onMouseDown={handleThumbMouseDown}
                />

                {/* Marqueurs de sections */}
                {markers.map((marker) => (
                    <div
                        key={marker.id}
                        className="cms-scrollbar-nav__marker"
                        style={{
                            top: `${marker.position}%`,
                            backgroundColor: marker.color,
                            color: marker.color,
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleMarkerClick(marker);
                        }}
                        onMouseEnter={() => setHoveredMarker(marker.id)}
                        onMouseLeave={() => setHoveredMarker(null)}
                        role="button"
                        aria-label={`Aller à: ${marker.label}`}
                        tabIndex={0}
                    >
                        {/* Label au hover */}
                        {hoveredMarker === marker.id && (
                            <span className="cms-scrollbar-nav__marker-label">
                                {marker.label}
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ScrollbarNavigator;
