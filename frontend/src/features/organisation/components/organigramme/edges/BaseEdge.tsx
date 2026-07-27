/**
 * ==================================
 * eLISAschool - Edge de base partagé pour React Flow
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Composants et hook partagés par tous les types d'edges de l'organigramme.
 * Élimine la duplication entre HierarchieEdge et RelationEdge :
 * - useBaseEdge : routing smoothstep unifié + état hover + handlers
 * - EdgeShell : hit-testing + path visible + transitions
 * - EdgeTooltip : tooltip positionné au milieu du path
 */

import { memo, useState, useCallback, type ReactNode } from 'react';
import { getSmoothStepPath, type Position } from 'reactflow';
import { resolveColor } from '@/lib/export';

// ─── Configuration routing ───────────────────────────────────────────

/**
 * Paramètres de routing par type d'edge.
 *
 * Stratégie anti-chevauchement :
 * - Offset progressif : chaque type est décalé du précédent (6→14→24)
 * - Gap minimum 8px entre types adjacents → jamais de superposition visuelle
 * - edgesep dagre (20px) sépare les edges aux bornes des noeuds
 * - nodesep (80/100px) + ranksep (120/140px) laissent l'espace nécessaire
 * - zIndex layering : hiérarchie=0, DIRECT=1, FONCTIONNEL=2
 */
export const EDGE_ROUTING = {
    hierarchie: { offset: 6, borderRadius: 10 },
    direct: { offset: 14, borderRadius: 10 },
    fonctionnel: { offset: 24, borderRadius: 10 },
} as const;

/** Styles visuels unifiés */
export const EDGE_STYLE = {
    strokeWidth: 2.5,
    strokeWidthHover: 3.5,
    opacity: 1.0,
    markerSize: 15,
    transition: 'stroke 0.2s ease, stroke-width 0.2s ease, opacity 0.2s ease',
} as const;

// ─── Hook useBaseEdge ────────────────────────────────────────────────

interface UseBaseEdgeConfig {
    sourceX: number;
    sourceY: number;
    sourcePosition: Position;
    targetX: number;
    targetY: number;
    targetPosition: Position;
    offset: number;
    borderRadius?: number;
}

interface UseBaseEdgeResult {
    edgePath: string;
    labelX: number;
    labelY: number;
    isHovered: boolean;
    handlers: {
        onMouseEnter: () => void;
        onMouseLeave: () => void;
    };
}

/**
 * Hook partagé : calcule le path smoothstep, gère l'état hover,
 * retourne les handlers pour le hit-testing.
 */
export function useBaseEdge({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    offset,
    borderRadius = 10,
}: UseBaseEdgeConfig): UseBaseEdgeResult {
    const [isHovered, setIsHovered] = useState(false);

    const [edgePath, labelX, labelY] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        borderRadius,
        offset,
    });

    const onMouseEnter = useCallback(() => setIsHovered(true), []);
    const onMouseLeave = useCallback(() => setIsHovered(false), []);

    return {
        edgePath,
        labelX,
        labelY,
        isHovered,
        handlers: { onMouseEnter, onMouseLeave },
    };
}

// ─── EdgeShell ───────────────────────────────────────────────────────

interface EdgeShellProps {
    id: string;
    edgePath: string;
    stroke: string;
    strokeWidth: number;
    strokeDasharray?: string;
    opacity?: number;
    markerEnd?: string;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onClick?: () => void;
    role?: string;
    ariaLabel?: string;
    children?: ReactNode;
}

/**
 * Composant de rendu partagé : hit-testing transparent + path visible.
 * Les enfants (badge, tooltip) sont rendus en dehors du <g> SVG.
 */
export const EdgeShell = memo(function EdgeShell({
    id,
    edgePath,
    stroke,
    strokeWidth,
    strokeDasharray,
    opacity = EDGE_STYLE.opacity,
    markerEnd,
    onMouseEnter,
    onMouseLeave,
    onClick,
    role,
    ariaLabel,
    children,
}: EdgeShellProps) {
    return (
        <>
            <g
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                onClick={onClick}
                role={role}
                aria-label={ariaLabel}
            >
                {/* Zone de hit-testing élargie (16px) */}
                <path
                    d={edgePath}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={16}
                    className={onClick ? 'cursor-pointer' : undefined}
                />
                {/* Path visible */}
                <path
                    id={id}
                    className="react-flow__edge-path"
                    d={edgePath}
                    fill="none"
                    style={{
                        stroke,
                        strokeWidth,
                        strokeDasharray,
                        opacity,
                        transition: EDGE_STYLE.transition,
                        pointerEvents: 'none',
                    }}
                    markerEnd={markerEnd}
                />
            </g>
            {children}
        </>
    );
});

// ─── EdgeTooltip ─────────────────────────────────────────────────────

interface EdgeTooltipProps {
    labelX: number;
    labelY: number;
    couleur: string;
    titre: string;
    sourceNom?: string;
    targetNom?: string;
    detail?: string;
    position?: 'above' | 'below';
}

/**
 * Tooltip unifié pour tous les types d'edges.
 * Positionné au milieu du path (above) ou sous un badge (below).
 */
export const EdgeTooltip = memo(function EdgeTooltip({
    labelX,
    labelY,
    couleur,
    titre,
    sourceNom,
    targetNom,
    detail,
    position = 'above',
}: EdgeTooltipProps) {
    const bg = resolveColor('var(--org-node-bg)');
    const text = resolveColor('var(--org-node-text)');
    const textMuted = resolveColor('var(--org-node-text-muted)');

    const positionStyle = position === 'above'
        ? { top: '-8px', transform: `translate(-50%, -100%) translate(${labelX}px, ${labelY}px)` }
        : { top: 'calc(100% + 6px)', transform: `translateX(-50%)` };

    return (
        <div
            className="nodrag nopan absolute rounded-lg border shadow-md whitespace-nowrap"
            style={{
                ...positionStyle,
                left: position === 'below' ? '50%' : undefined,
                backgroundColor: bg,
                borderColor: couleur,
                color: text,
                fontSize: 'clamp(10px, 0.7vw + 0.35rem, 12px)',
                padding: '5px 10px',
                pointerEvents: 'none',
                zIndex: 20,
            }}
        >
            <span className="font-semibold" style={{ color: couleur }}>
                {titre}
            </span>
            {sourceNom && targetNom && (
                <span> — {sourceNom} → {targetNom}</span>
            )}
            {detail && (
                <span style={{ color: textMuted }}> · {detail}</span>
            )}
        </div>
    );
});
