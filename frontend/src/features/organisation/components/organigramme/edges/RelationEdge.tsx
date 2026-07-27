/**
 * ==================================
 * eLISAschool - Edge Relation hiérarchique (overlay) pour React Flow
 * ==================================
 * Version: 3.0.0
 * Auteur: franck arlos chendjou
 *
 * Edge orthogonal (smooth step) pointillé représentant les relations
 * poste→poste agrégées entre deux unités. Couleur et pointillé selon
 * le type de relation, badge compteur cliquable, tooltip au survol,
 * clic → drawer de détail. Routing qui évite les cartes d'unité.
 */

import { memo, useState } from 'react';
import { getSmoothStepPath, EdgeLabelRenderer, type EdgeProps } from 'reactflow';
import { useTranslation } from 'react-i18next';
import { resolveColor } from '../utils/css-var-resolver';
import type { HierarchiePersonnel, TypeRelationHierarchique } from '../../../types/organisation.types';

export interface RelationEdgeData {
    typeRelation: TypeRelationHierarchique;
    count: number;
    relations: HierarchiePersonnel[];
    sourceNom?: string;
    targetNom?: string;
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
    markerEnd,
}: EdgeProps<RelationEdgeData>) {
    const { t } = useTranslation('organisation');
    const [isHovered, setIsHovered] = useState(false);

    const estFonctionnel = data?.typeRelation === 'FONCTIONNEL';
    const couleur = resolveColor(estFonctionnel ? 'var(--color-accent-600)' : 'var(--color-secondary-500)');
    const dasharray = estFonctionnel ? '4 5' : '10 5';
    const count = data?.count ?? 1;
    const actif = isHovered || selected;

    const [edgePath, labelX, labelY] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        borderRadius: 12,
        offset: estFonctionnel ? 16 : 8,
    });

    const handleOpen = () => data?.onOpen?.(id);

    return (
        <>
            <g
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={handleOpen}
                role="button"
                aria-label={t(estFonctionnel ? 'typeRelation_FONCTIONNEL' : 'typeRelation_DIRECT')}
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
                    fill="none"
                    style={{
                        stroke: couleur,
                        strokeWidth: actif ? 3 : 2,
                        strokeDasharray: dasharray,
                        opacity: actif ? 1 : 0.8,
                        transition: 'stroke-width 0.2s ease, opacity 0.2s ease',
                        pointerEvents: 'none',
                    }}
                    markerEnd={markerEnd}
                />
            </g>
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
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                        className="cursor-pointer rounded-full font-medium leading-none transition-all"
                        style={{
                            backgroundColor: actif ? couleur : resolveColor('var(--org-node-bg)'),
                            border: `1.5px solid ${couleur}`,
                            color: actif ? '#fff' : couleur,
                            fontSize: 'clamp(9px, 0.7vw + 0.3rem, 11px)',
                            padding: '3px 8px',
                            minHeight: '20px',
                            minWidth: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: actif ? '0 2px 8px rgba(0,0,0,0.18)' : '0 1px 3px rgba(0,0,0,0.08)',
                        }}
                        aria-label={t('organigramme.relations.ouvrirDetail', 'Voir le détail des relations')}
                    >
                        {count}
                    </button>

                    {actif && (
                        <div
                            className="absolute rounded-lg border shadow-lg whitespace-nowrap"
                            style={{
                                top: 'calc(100% + 6px)',
                                backgroundColor: resolveColor('var(--org-node-bg)'),
                                borderColor: couleur,
                                color: resolveColor('var(--org-node-text)'),
                                fontSize: 'clamp(10px, 0.7vw + 0.35rem, 12px)',
                                padding: '4px 8px',
                                pointerEvents: 'none',
                            }}
                        >
                            <span className="font-semibold" style={{ color: couleur }}>
                                {t(estFonctionnel ? 'typeRelation_FONCTIONNEL' : 'typeRelation_DIRECT')}
                            </span>
                            {data?.sourceNom && data?.targetNom && (
                                <span> — {data.sourceNom} → {data.targetNom}</span>
                            )}
                            <span> · {t('organigramme.relations.nbRelations', '{{count}} relation(s)', { count })}</span>
                        </div>
                    )}
                </div>
            </EdgeLabelRenderer>
        </>
    );
}

export const RelationEdge = memo(RelationEdgeComponent);
