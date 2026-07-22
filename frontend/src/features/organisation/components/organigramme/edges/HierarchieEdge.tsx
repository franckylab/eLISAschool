/**
 * ==================================
 * eLISAschool - Edge Hiérarchique pour React Flow
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * Edge Bézier courbe avec style thème, highlight au hover,
 * animation d'apparition (dash) pour les nouvelles connexions.
 */

import { memo, useState } from 'react';
import { getBezierPath, type EdgeProps } from 'reactflow';

function HierarchieEdgeComponent({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
}: EdgeProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [isNew] = useState(() => {
        // Marque l'edge comme "nouveau" pour l'animation d'apparition
        return true;
    });

    const [edgePath] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    return (
        <g
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Zone de clic élargie */}
            <path
                d={edgePath}
                fill="none"
                stroke="transparent"
                strokeWidth={12}
                className="cursor-pointer"
            />
            {/* Edge visible */}
            <path
                id={id}
                className="react-flow__edge-path"
                d={edgePath}
                style={{
                    ...style,
                    stroke: isHovered ? 'var(--color-dominant-600)' : 'var(--color-text-muted)',
                    strokeWidth: isHovered ? 2.5 : 1.5,
                    transition: 'stroke 0.2s ease, stroke-width 0.2s ease',
                }}
                markerEnd={markerEnd}
                strokeDasharray={isNew ? '2000' : undefined}
                strokeDashoffset={isNew ? '2000' : undefined}
            >
                {isNew && (
                    <animate
                        attributeName="stroke-dashoffset"
                        from="2000"
                        to="0"
                        dur="0.6s"
                        fill="freeze"
                        calcMode="spline"
                        keySplines="0.4 0 0.2 1"
                    />
                )}
            </path>
        </g>
    );
}

export const HierarchieEdge = memo(HierarchieEdgeComponent);
