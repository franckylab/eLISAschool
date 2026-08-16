/**
 * ==================================
 * eLISAschool - Guides de snapping visuels pour drag & drop
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Affiche des lignes guides quand on aligne des éléments
 * pendant le drag & drop. Inspiré de Figma et Webflow.
 */

import React, { useMemo } from 'react';
import { Grid3X3 } from 'lucide-react';

// ==================================
// Types
// ==================================

export interface SnapLine {
    type: 'horizontal' | 'vertical';
    position: number; // Position en px
    label?: string;
    color?: string;
}

export interface SnapGuidesProps {
    guides: SnapLine[];
    visible: boolean;
    canvasRect?: DOMRect;
    zoom?: number;
}

// ==================================
// Composant principal
// ==================================

export function SnapGuides({ guides, visible, canvasRect, zoom = 100 }: SnapGuidesProps) {
    if (!visible || guides.length === 0) return null;

    const scale = zoom / 100;

    return (
        <div 
            className="cms-snap-guides"
            style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                zIndex: 100,
            }}
        >
            {guides.map((guide, index) => {
                const isHorizontal = guide.type === 'horizontal';
                const color = guide.color || '#3b82f6';
                
                return (
                    <React.Fragment key={index}>
                        {/* Ligne guide */}
                        <div
                            className="cms-snap-guide-line"
                            style={{
                                position: 'absolute',
                                ...(isHorizontal 
                                    ? {
                                        top: guide.position,
                                        left: 0,
                                        right: 0,
                                        height: '1px',
                                    }
                                    : {
                                        left: guide.position,
                                        top: 0,
                                        bottom: 0,
                                        width: '1px',
                                    }
                                ),
                                background: color,
                                boxShadow: `0 0 4px ${color}40`,
                                opacity: 0.8,
                            }}
                        />
                        
                        {/* Label (optionnel) */}
                        {guide.label && (
                            <div
                                className="cms-snap-guide-label"
                                style={{
                                    position: 'absolute',
                                    ...(isHorizontal
                                        ? {
                                            top: guide.position - 10,
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                        }
                                        : {
                                            left: guide.position + 4,
                                            top: 8,
                                        }
                                    ),
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    background: color,
                                    color: 'white',
                                    fontSize: '9px',
                                    fontWeight: 600,
                                    whiteSpace: 'nowrap',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                }}
                            >
                                {guide.label}
                            </div>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

// ==================================
// Hook pour calculer les guides de snapping
// ==================================

export function useSnapGuides(
    draggingItemId: string | null,
    itemRects: Map<string, DOMRect>,
    threshold: number = 5
): SnapLine[] {
    return useMemo(() => {
        if (!draggingItemId || !itemRects.has(draggingItemId)) {
            return [];
        }

        const draggingRect = itemRects.get(draggingItemId)!;
        const guides: SnapLine[] = [];
        const seen = new Set<string>();

        // Obtenir les positions clés de l'élément en drag
        const dragEdges = {
            top: draggingRect.top,
            bottom: draggingRect.bottom,
            left: draggingRect.left,
            right: draggingRect.right,
            centerX: draggingRect.left + draggingRect.width / 2,
            centerY: draggingRect.top + draggingRect.height / 2,
        };

        // Comparer avec tous les autres éléments
        itemRects.forEach((rect, id) => {
            if (id === draggingItemId) return;

            const otherEdges = {
                top: rect.top,
                bottom: rect.bottom,
                left: rect.left,
                right: rect.right,
                centerX: rect.left + rect.width / 2,
                centerY: rect.top + rect.height / 2,
            };

            // Guides horizontaux (alignement vertical)
            const horizontalChecks = [
                { drag: dragEdges.top, other: otherEdges.top, label: 'Top' },
                { drag: dragEdges.top, other: otherEdges.bottom, label: 'Top-Bottom' },
                { drag: dragEdges.bottom, other: otherEdges.top, label: 'Bottom-Top' },
                { drag: dragEdges.bottom, other: otherEdges.bottom, label: 'Bottom' },
                { drag: dragEdges.centerY, other: otherEdges.centerY, label: 'Center' },
            ];

            horizontalChecks.forEach(({ drag, other, label }) => {
                if (Math.abs(drag - other) < threshold) {
                    const key = `h-${other}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        guides.push({
                            type: 'horizontal',
                            position: other,
                            label,
                        });
                    }
                }
            });

            // Guides verticaux (alignement horizontal)
            const verticalChecks = [
                { drag: dragEdges.left, other: otherEdges.left, label: 'Left' },
                { drag: dragEdges.left, other: otherEdges.right, label: 'Left-Right' },
                { drag: dragEdges.right, other: otherEdges.left, label: 'Right-Left' },
                { drag: dragEdges.right, other: otherEdges.right, label: 'Right' },
                { drag: dragEdges.centerX, other: otherEdges.centerX, label: 'Center' },
            ];

            verticalChecks.forEach(({ drag, other, label }) => {
                if (Math.abs(drag - other) < threshold) {
                    const key = `v-${other}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        guides.push({
                            type: 'vertical',
                            position: other,
                            label,
                        });
                    }
                }
            });
        });

        return guides;
    }, [draggingItemId, itemRects, threshold]);
}

// ==================================
// Composant pour les indicateurs de distance
// ==================================

export function DistanceIndicators({
    sourceRect,
    targetRect,
    visible,
}: {
    sourceRect: DOMRect | null;
    targetRect: DOMRect | null;
    visible: boolean;
}) {
    if (!visible || !sourceRect || !targetRect) return null;

    // Calculer les distances — protection NaN si les rects contiennent des valeurs invalides
    const rawHGap = Math.max(0, Math.max(targetRect.left - sourceRect.right, sourceRect.left - targetRect.right));
    const rawVGap = Math.max(0, Math.max(targetRect.top - sourceRect.bottom, sourceRect.top - targetRect.bottom));
    const horizontalGap = Number.isFinite(rawHGap) ? rawHGap : 0;
    const verticalGap = Number.isFinite(rawVGap) ? rawVGap : 0;

    return (
        <div 
            className="cms-distance-indicators"
            style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                zIndex: 101,
            }}
        >
            {/* Distance horizontale */}
            {horizontalGap > 0 && (
                <div
                    style={{
                        position: 'absolute',
                        top: Math.min(sourceRect.top, targetRect.top) - 20,
                        left: Math.min(sourceRect.right, targetRect.left),
                        width: horizontalGap,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <div style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: '#8b5cf6',
                        color: 'white',
                        fontSize: '9px',
                        fontWeight: 600,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }}>
                        {Math.round(horizontalGap)}px
                    </div>
                </div>
            )}

            {/* Distance verticale */}
            {verticalGap > 0 && (
                <div
                    style={{
                        position: 'absolute',
                        left: Math.min(sourceRect.left, targetRect.left) - 40,
                        top: Math.min(sourceRect.bottom, targetRect.top),
                        height: verticalGap,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <div style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: '#8b5cf6',
                        color: 'white',
                        fontSize: '9px',
                        fontWeight: 600,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        writingMode: 'vertical-rl',
                        transform: 'rotate(180deg)',
                    }}>
                        {Math.round(verticalGap)}px
                    </div>
                </div>
            )}
        </div>
    );
}

// ==================================
// GridOverlay — Grille de points/lignes pour le canvas
// ==================================

export function GridOverlay({ visible, gridSize = 24, zoom = 100, dark = false }: {
    visible: boolean;
    gridSize?: number;
    zoom?: number;
    dark?: boolean;
}) {
    if (!visible) return null;

    const scaledSize = gridSize * (zoom / 100);
    const dotColor = dark ? 'rgba(148, 163, 184, 0.12)' : 'rgba(148, 163, 184, 0.15)';
    const dotSize = Math.max(1, Math.round(zoom / 100));

    return (
        <div
            className="cms-grid-overlay"
            style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                zIndex: 1,
                backgroundImage: `radial-gradient(circle, ${dotColor} ${dotSize}px, transparent ${dotSize}px)`,
                backgroundSize: `${scaledSize}px ${scaledSize}px`,
                backgroundPosition: 'center center',
            }}
        />
    );
}
