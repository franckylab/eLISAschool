/**
 * ==================================
 * eLISAschool - Edge Relation pour React Flow
 * ==================================
 * Version: 5.0.0
 * Auteur: franck arlos chendjou
 *
 * Edge courbe de Bézier représentant les relations poste→poste entre
 * deux unités. Ne se superpose PAS aux edges hiérarchiques (smoothStep
 * axial) car utilise un routage latéral différencié :
 * - DIRECT (ambre) : côté intelligent gauche/droite, pointillé large
 * - FONCTIONNEL (bleu) : côté opposé, pointillé serré
 * - Waypoints pour relations longue portée (≥3 niveaux)
 *
 * Basé sur BaseEdge (EdgeShell) pour le hit-testing et les transitions.
 */

import { memo } from 'react';
import { EdgeLabelRenderer, type EdgeProps } from 'reactflow';
import { useTranslation } from 'react-i18next';
import { resolveColor } from '@/lib/export';
import type { HierarchiePersonnel, TypeRelationHierarchique } from '../../../types/organisation.types';
import { useBezierEdge, EdgeShell, EDGE_STYLE } from './BaseEdge';

export interface RelationEdgeData {
    typeRelation: TypeRelationHierarchique;
    count: number;
    relations: HierarchiePersonnel[];
    sourceNom?: string;
    targetNom?: string;
    side: 'left' | 'right';
    waypoints?: { x: number; y: number }[];
    direction: 'TB' | 'LR';
    rowBounds?: { yMin: number; yMax: number; xMin: number; xMax: number } | null;
    onOpen?: (edgeId: string) => void;
}

function RelationEdgeComponent({
    id,
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    data,
    selected,
}: EdgeProps<RelationEdgeData>) {
    const { t } = useTranslation('organisation');

    const estFonctionnel = data?.typeRelation === 'FONCTIONNEL';
    const couleur = resolveColor(estFonctionnel ? 'var(--color-accent-600)' : 'var(--color-secondary-500)');
    const dasharray = estFonctionnel ? '4 5' : '10 5';
    const count = data?.count ?? 1;

    const { edgePath, labelX, labelY, isHovered, handlers } = useBezierEdge({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        side: data?.side ?? 'right',
        direction: data?.direction ?? 'TB',
        waypoints: data?.waypoints,
        rowBounds: data?.rowBounds,
    });

    const actif = isHovered || selected;
    const strokeWidth = actif ? EDGE_STYLE.strokeWidthHover : EDGE_STYLE.strokeWidth;

    const handleOpen = () => data?.onOpen?.(id);

    const bg = resolveColor('var(--org-node-bg)');
    const text = resolveColor('var(--org-node-text)');
    const textMuted = resolveColor('var(--org-node-text-muted)');

    return (
        <EdgeShell
            id={id}
            edgePath={edgePath}
            stroke={couleur}
            strokeWidth={strokeWidth}
            strokeDasharray={dasharray}
            arrowColor={couleur}
            onMouseEnter={handlers.onMouseEnter}
            onMouseLeave={handlers.onMouseLeave}
            onClick={handleOpen}
            role="button"
            ariaLabel={t(estFonctionnel ? 'typeRelation_FONCTIONNEL' : 'typeRelation_DIRECT')}
        >
            <EdgeLabelRenderer>
                <div
                    className="nodrag nopan absolute flex flex-col items-center"
                    style={{
                        transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                        pointerEvents: 'all',
                        zIndex: actif ? 10 : 1,
                    }}
                >
                    <button
                        type="button"
                        onClick={handleOpen}
                        onMouseEnter={handlers.onMouseEnter}
                        onMouseLeave={handlers.onMouseLeave}
                        className="cursor-pointer rounded-full font-medium leading-none transition-all"
                        style={{
                            backgroundColor: actif ? couleur : bg,
                            border: `1.5px solid ${couleur}`,
                            color: actif ? '#fff' : couleur,
                            fontSize: 'clamp(9px, 0.7vw + 0.3rem, 11px)',
                            padding: '3px 8px',
                            minHeight: '20px',
                            minWidth: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: actif
                                ? '0 2px 8px rgba(0,0,0,0.18)'
                                : '0 1px 3px rgba(0,0,0,0.08)',
                        }}
                        aria-label={t('organigramme.relations.ouvrirDetail', '')}
                    >
                        {count}
                    </button>

                    {actif && (
                        <div
                            className="absolute rounded-lg border shadow-md whitespace-nowrap"
                            style={{
                                top: 'calc(100% + 6px)',
                                backgroundColor: bg,
                                borderColor: couleur,
                                color: text,
                                fontSize: 'clamp(10px, 0.7vw + 0.35rem, 12px)',
                                padding: '5px 10px',
                                pointerEvents: 'none',
                            }}
                        >
                            <span className="font-semibold" style={{ color: couleur }}>
                                {t(estFonctionnel ? 'typeRelation_FONCTIONNEL' : 'typeRelation_DIRECT')}
                            </span>
                            {data?.sourceNom && data?.targetNom && (
                                <span> — {data.sourceNom} → {data.targetNom}</span>
                            )}
                            <span style={{ color: textMuted }}>
                                {' '}· {t('organigramme.relations.nbRelations', '{{count}} relation(s)', { count })}
                            </span>
                        </div>
                    )}
                </div>
            </EdgeLabelRenderer>
        </EdgeShell>
    );
}

export const RelationEdge = memo(RelationEdgeComponent);
