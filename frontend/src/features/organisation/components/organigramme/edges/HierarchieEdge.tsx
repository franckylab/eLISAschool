/**
 * ==================================
 * eLISAschool - Edge Hiérarchique pour React Flow
 * ==================================
 * Version: 5.0.0
 * Auteur: franck arlos chendjou
 *
 * Edge orthogonal (smooth step) liant les unités organisationnelles
 * (parent→enfant). Utilise BaseEdge (useBaseEdge + EdgeShell + EdgeTooltip)
 * pour le routing, le hit-testing et le tooltip unifiés.
 * Couleur dominante (vert), trait plein, badge nbPostes au survol.
 */

import { memo } from 'react';
import { EdgeLabelRenderer, type EdgeProps } from 'reactflow';
import { useTranslation } from 'react-i18next';
import { resolveColor } from '@/lib/export';
import { useBaseEdge, EdgeShell, EdgeTooltip, EDGE_ROUTING, EDGE_STYLE } from './BaseEdge';
import type { HierarchieEdgeData } from './HierarchieEdge.types';

export type { HierarchieEdgeData } from './HierarchieEdge.types';

function HierarchieEdgeComponent({
    id,
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    data,
    markerEnd,
}: EdgeProps<HierarchieEdgeData>) {
    const { t } = useTranslation('organisation');

    const { edgePath, labelX, labelY, isHovered, handlers } = useBaseEdge({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        offset: EDGE_ROUTING.hierarchie.offset,
        borderRadius: EDGE_ROUTING.hierarchie.borderRadius,
    });

    const couleur = resolveColor(isHovered
        ? 'var(--color-dominant-600)'
        : 'var(--color-dominant-500)');
    const strokeWidth = isHovered ? EDGE_STYLE.strokeWidthHover : EDGE_STYLE.strokeWidth;

    const showTooltip = isHovered && data?.sourceNom && data?.targetNom;
    const nbPostes = data?.nbPostes ?? 0;
    const detail = nbPostes > 0
        ? t('organigramme.liens.nbPostes', '{{count}} poste(s)', { count: nbPostes })
        : undefined;

    return (
        <EdgeShell
            id={id}
            edgePath={edgePath}
            stroke={couleur}
            strokeWidth={strokeWidth}
            markerEnd={markerEnd}
            onMouseEnter={handlers.onMouseEnter}
            onMouseLeave={handlers.onMouseLeave}
        >
            {showTooltip && (
                <EdgeLabelRenderer>
                    <EdgeTooltip
                        labelX={labelX}
                        labelY={labelY}
                        couleur={couleur}
                        titre={t('organigramme.liens.hierarchie', 'Lien hiérarchique')}
                        sourceNom={data.sourceNom}
                        targetNom={data.targetNom}
                        detail={detail}
                    />
                </EdgeLabelRenderer>
            )}
        </EdgeShell>
    );
}

export const HierarchieEdge = memo(HierarchieEdgeComponent);
