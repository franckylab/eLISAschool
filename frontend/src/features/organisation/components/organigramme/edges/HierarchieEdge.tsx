/**
 * ==================================
 * eLISAschool - Edge Hiérarchique pour React Flow
 * ==================================
 * Version: 3.0.0
 * Auteur: franck arlos chendjou
 *
 * Edge Bézier courbe liant les unités organisationnelles (parent→enfant).
 * Tooltip au survol (source → cible), animation d'apparition,
 * style épuré avec distinction visuelle par rapport aux edges relation.
 */

import { memo, useState } from 'react';
import { getBezierPath, EdgeLabelRenderer, type EdgeProps } from 'reactflow';
import { useTranslation } from 'react-i18next';
import { resolveColor } from '../utils/css-var-resolver';

export interface HierarchieEdgeData {
    sourceNom?: string;
    targetNom?: string;
    nbPostes?: number;
}

function HierarchieEdgeComponent({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    style = {},
    markerEnd,
}: EdgeProps<HierarchieEdgeData>) {
    const { t } = useTranslation('organisation');
    const [isHovered, setIsHovered] = useState(false);

    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    const couleur = resolveColor(isHovered
        ? 'var(--color-dominant-600)'
        : 'var(--color-dominant-400)');
    const epaisseur = isHovered ? 2.5 : 2;

    return (
        <>
            <g
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Zone de clic élargie */}
                <path
                    d={edgePath}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={14}
                    className="cursor-pointer"
                />
                {/* Edge visible */}
                <path
                    id={id}
                    className="react-flow__edge-path"
                    d={edgePath}
                    style={{
                        ...style,
                        stroke: couleur,
                        strokeWidth: epaisseur,
                        transition: 'stroke 0.2s ease, stroke-width 0.2s ease',
                    }}
                    markerEnd={markerEnd}
                    strokeDasharray="2000"
                    strokeDashoffset="2000"
                >
                    <animate
                        attributeName="stroke-dashoffset"
                        from="2000"
                        to="0"
                        dur="0.6s"
                        fill="freeze"
                        calcMode="spline"
                        keySplines="0.4 0 0.2 1"
                    />
                </path>
            </g>

            {/* Tooltip au survol */}
            {isHovered && data?.sourceNom && data?.targetNom && (
                <EdgeLabelRenderer>
                    <div
                        className="nodrag nopan absolute rounded-lg border shadow-lg whitespace-nowrap"
                        style={{
                            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                            top: '-8px',
                            backgroundColor: resolveColor('var(--org-node-bg)'),
                            borderColor: resolveColor('var(--color-dominant-400)'),
                            color: resolveColor('var(--org-node-text)'),
                            fontSize: 'clamp(10px, 0.7vw + 0.35rem, 12px)',
                            padding: '4px 8px',
                            pointerEvents: 'none',
                            zIndex: 20,
                        }}
                    >
                        <span className="font-semibold" style={{ color: resolveColor('var(--color-dominant-600)') }}>
                            {t('organigramme.liens.hierarchie', 'Lien hiérarchique')}
                        </span>
                        <span> — {data.sourceNom} → {data.targetNom}</span>
                        {data.nbPostes != null && data.nbPostes > 0 && (
                            <span style={{ color: resolveColor('var(--org-node-text-muted)') }}>
                                {' '}· {t('organigramme.liens.nbPostes', '{{count}} poste(s)', { count: data.nbPostes })}
                            </span>
                        )}
                    </div>
                </EdgeLabelRenderer>
            )}
        </>
    );
}

export const HierarchieEdge = memo(HierarchieEdgeComponent);
