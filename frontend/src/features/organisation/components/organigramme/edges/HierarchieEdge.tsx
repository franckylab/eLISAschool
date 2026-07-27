/**
 * ==================================
 * eLISAschool - Edge Hiérarchique pour React Flow
 * ==================================
 * Version: 4.0.0
 * Auteur: franck arlos chendjou
 *
 * Edge orthogonal (smooth step) liant les unités organisationnelles
 * (parent→enfant). Routing qui évite de passer sur les cartes.
 * Tooltip au survol (source → cible), style épuré avec distinction
 * visuelle par rapport aux edges relation.
 */

import { memo, useState } from 'react';
import { getSmoothStepPath, EdgeLabelRenderer, type EdgeProps } from 'reactflow';
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
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    data,
    style = {},
    markerEnd,
}: EdgeProps<HierarchieEdgeData>) {
    const { t } = useTranslation('organisation');
    const [isHovered, setIsHovered] = useState(false);

    const [edgePath, labelX, labelY] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        borderRadius: 8,
        offset: 4,
    });

    const couleur = resolveColor(isHovered
        ? 'var(--color-dominant-600)'
        : 'var(--color-dominant-500)');
    const epaisseur = isHovered ? 3 : 2.5;

    return (
        <>
            <g
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <path
                    d={edgePath}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={16}
                    className="cursor-pointer"
                />
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
                />
            </g>

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
