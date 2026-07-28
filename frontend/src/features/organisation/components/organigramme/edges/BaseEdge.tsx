/**
 * ==================================
 * eLISAschool - Edge de base partagé pour React Flow
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * Composants et hook partagés par tous les types d'edges de l'organigramme.
 * Élimine la duplication entre HierarchieEdge et RelationEdge :
 * - useBaseEdge : routing smoothstep (hiérarchie axiale)
 * - useBezierEdge : routing courbes de Bézier (relations latérales)
 * - EdgeShell : hit-testing + path visible + transitions
 * - EdgeTooltip : tooltip positionné au milieu du path
 *
 * Stratégie anti-chevauchement v2 :
 * - Hiérarchie (smoothStep) : offset 0, ligne axiale
 * - Relations DIRECT (Bezier) : côté intelligent (gauche/droite selon congestion)
 * - Relations FONCTIONNEL (Bezier) : côté opposé aux DIRECT
 */

import { memo, useState, useCallback, type ReactNode } from 'react';
import { getSmoothStepPath, type Position } from 'reactflow';
import { resolveColor } from '@/lib/export';
import { useBezierPath } from '@/lib/routing';

// ─── Configuration routing ───────────────────────────────────────────

/** Paramètres de routing par type d'edge */
export const EDGE_ROUTING = {
    hierarchie: { offset: 0, borderRadius: 10 },
    direct: { offset: 0, borderRadius: 10 },
    fonctionnel: { offset: 0, borderRadius: 10 },
} as const;

/** Styles visuels unifiés */
export const EDGE_STYLE = {
    strokeWidth: 2.5,
    strokeWidthHover: 3.5,
    strokeWidthHierarchie: 3,
    opacity: 1.0,
    markerSize: 14,
    transition: 'stroke 0.2s ease, stroke-width 0.2s ease, opacity 0.2s ease',
} as const;

// ─── Hook useBaseEdge (smoothStep axiale – hiérarchie) ──────────────

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

// ─── Hook useBezierEdge (courbes latérales – relations) ─────────────

interface UseBezierEdgeConfig {
    sourceX: number;
    sourceY: number;
    sourcePosition: Position;
    targetX: number;
    targetY: number;
    targetPosition: Position;
    side: 'left' | 'right';
    direction: 'TB' | 'LR';
    waypoints?: { x: number; y: number }[];
    rowBounds?: { yMin: number; yMax: number; xMin: number; xMax: number } | null;
}

interface UseBezierEdgeResult {
    edgePath: string;
    labelX: number;
    labelY: number;
    isHovered: boolean;
    handlers: {
        onMouseEnter: () => void;
        onMouseLeave: () => void;
    };
}

export function useBezierEdge({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    side,
    direction,
    waypoints,
    rowBounds,
}: UseBezierEdgeConfig): UseBezierEdgeResult {
    const [isHovered, setIsHovered] = useState(false);

    const { edgePath, labelX, labelY } = useBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        side,
        direction,
        waypoints,
        rowBounds,
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

// ─── Utilitaires flèche ───────────────────────────────────────────

/** Extrait l'angle (en degrés, SVG rotate) de la tangente à l'extrémité du path */
function endTangentAngle(path: string): number {
    const cmds = path.match(/[MLC][-\d.e,\s]+/g);
    if (!cmds || cmds.length < 2) return -90;
    const last = cmds[cmds.length - 1].trim();
    const parts = last.split(/[\s,]+/).filter(s => s !== '' && s !== 'M' && s !== 'L' && s !== 'C');
    const endX = parseFloat(parts[parts.length - 2]);
    const endY = parseFloat(parts[parts.length - 1]);
    let prevX: number, prevY: number;
    if (last.startsWith('C')) {
        prevX = parseFloat(parts[parts.length - 4]);
        prevY = parseFloat(parts[parts.length - 3]);
    } else {
        const prev = cmds[cmds.length - 2].trim();
        const prevParts = prev.split(/[\s,]+/).filter(s => s !== '' && s !== 'M' && s !== 'L' && s !== 'C');
        prevX = parseFloat(prevParts[prevParts.length - 2]);
        prevY = parseFloat(prevParts[prevParts.length - 1]);
    }
    return -Math.atan2(endY - prevY, endX - prevX) * (180 / Math.PI);
}

/** Rendu de la flèche à l'extrémité du path — remplace SVG <marker> */
function EdgeArrow({ path, color }: { path: string; color: string }) {
    const angle = endTangentAngle(path);
    const size = 7;
    const d = `M${-size},${-size * 0.6} L0,0 L${-size},${size * 0.6} Z`;
    const cmds = path.match(/[MLC][-\d.e,\s]+/g);
    if (!cmds) return null;
    const last = cmds[cmds.length - 1].trim();
    const parts = last.split(/[\s,]+/).filter(s => s !== '' && s !== 'M' && s !== 'L' && s !== 'C');
    const x = parseFloat(parts[parts.length - 2]);
    const y = parseFloat(parts[parts.length - 1]);
    return <path d={d} fill={color} transform={`translate(${x},${y}) rotate(${angle})`} />;
}

// ─── EdgeShell ───────────────────────────────────────────────────────

interface EdgeShellProps {
    id: string;
    edgePath: string;
    stroke: string;
    strokeWidth: number;
    strokeDasharray?: string;
    opacity?: number;
    /** Définit la couleur de la flèche à l'extrémité (flèche désactivée si omis) */
    arrowColor?: string;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onClick?: () => void;
    role?: string;
    ariaLabel?: string;
    children?: ReactNode;
}

/**
 * Composant de rendu partagé : hit-testing transparent + path visible + flèche terminale.
 * La flèche est rendue manuellement (pas de SVG <marker>) pour garantir
 * l'orientation et la couleur exactes.
 * Les enfants (badge, tooltip) sont rendus en dehors du <g> SVG.
 */
export const EdgeShell = memo(function EdgeShell({
    id,
    edgePath,
    stroke,
    strokeWidth,
    strokeDasharray,
    opacity = EDGE_STYLE.opacity,
    arrowColor,
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
                />
                {/* Flèche manuelle — pas de SVG <marker> */}
                {arrowColor && <EdgeArrow path={edgePath} color={arrowColor} />}
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
