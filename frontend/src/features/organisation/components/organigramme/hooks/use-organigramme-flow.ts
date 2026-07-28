/**
 * ==================================
 * eLISAschool - Hook conversion Organigramme → React Flow
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * v2.0.0 : routage intelligent différencié
 * - Hiérarchie (smoothStep axial) via computeLayout
 * - Relations (courbes Bézier latérales) avec side intelligent
 * - Anti-collision waypoints pour relations longue portée
 * - Espacement dagre auto-adaptatif selon densité des relations
 */

import { useMemo, useCallback, useState, useEffect } from 'react';
import type { Node, Edge } from 'reactflow';
import type { OrganigrammeNode, HierarchiePersonnel } from '../../../types/organisation.types';
import { computeLayout, type LayoutDirection, type LayoutNode } from '../utils/layout';
import { CongestionManager, computeWaypoints, computeRowBounds } from '@/lib/routing';
import type { UniteNodeData } from '../nodes/UniteNode';
import type { HierarchieEdgeData } from '../edges/HierarchieEdge';
import type { RelationEdgeData } from '../edges/RelationEdge';

const congestionManager = new CongestionManager();

export interface DndVisualState {
    draggedNodeId: string | null;
    dropTargetId: string | null;
    isValid: boolean;
    isDragging: boolean;
    isConnecting: boolean;
}

interface UseOrganigrammeFlowOptions {
    data: OrganigrammeNode[];
    direction: LayoutDirection;
    defaultCollapseDepth?: number;
    isEditMode?: boolean;
    dndVisualState?: DndVisualState;
    relations?: HierarchiePersonnel[];
}

function construireEdgesRelations(
    relations: HierarchiePersonnel[],
    visibleIds: Set<string>,
    nomById: Map<string, string>,
    parentById: Map<string, string | undefined>,
    layoutNodes: LayoutNode[],
    direction: LayoutDirection,
): Edge<RelationEdgeData>[] {
    congestionManager.reset();

    const layoutNodeMap = new Map(layoutNodes.map(n => [n.id, n]));
    const resoudreVisible = (id: string): string | null => {
        let courant: string | undefined = id;
        while (courant && !visibleIds.has(courant)) {
            courant = parentById.get(courant);
        }
        return courant ?? null;
    };

    const groupes = new Map<string, {
        source: string;
        target: string;
        typeRelation: HierarchiePersonnel['typeRelation'];
        relations: HierarchiePersonnel[];
        side: 'left' | 'right';
        waypoints: { x: number; y: number }[];
    }>();

    const relationPairs = new Map<string, {
        source: string;
        target: string;
        directs: HierarchiePersonnel[];
        fonctionnels: HierarchiePersonnel[];
    }>();

    for (const r of relations) {
        const sourceUniteBrute = r.superieurPoste?.uniteOrganisationnelle?.id;
        const targetUniteBrute = r.poste?.uniteOrganisationnelle?.id;
        if (!sourceUniteBrute || !targetUniteBrute || sourceUniteBrute === targetUniteBrute) continue;
        const sourceUnite = resoudreVisible(sourceUniteBrute);
        const targetUnite = resoudreVisible(targetUniteBrute);
        if (!sourceUnite || !targetUnite || sourceUnite === targetUnite) continue;
        const cle = `${sourceUnite}-${targetUnite}`;
        const existant = relationPairs.get(cle);
        if (existant) {
            if (r.typeRelation === 'DIRECT') existant.directs.push(r);
            else existant.fonctionnels.push(r);
        } else {
            relationPairs.set(cle, {
                source: sourceUnite,
                target: targetUnite,
                directs: r.typeRelation === 'DIRECT' ? [r] : [],
                fonctionnels: r.typeRelation === 'FONCTIONNEL' ? [r] : [],
            });
        }
    }

    for (const [, pair] of relationPairs) {
        const sourceNode = layoutNodeMap.get(pair.source);
        const targetNode = layoutNodeMap.get(pair.target);
        if (!sourceNode || !targetNode) continue;

        const sourceCX = sourceNode.position.x + sourceNode.width / 2;
        const targetCX = targetNode.position.x + targetNode.width / 2;

        const { direct: directSide, fonctionnel: fonctionnelSide } = congestionManager.assignPair(
            pair.source, pair.target, sourceCX, targetCX,
        );

        const depthDiff = Math.abs(
            (sourceNode.data.depth ?? 0) - (targetNode.data.depth ?? 0),
        );
        const needsWaypoints = depthDiff >= 3;

        if (pair.directs.length > 0) {
            const waypoints = (needsWaypoints
                ? computeWaypoints(sourceNode, targetNode, layoutNodes, directSide, direction)
                : []) as { x: number; y: number }[];
            const g = {
                source: pair.source,
                target: pair.target,
                typeRelation: 'DIRECT' as HierarchiePersonnel['typeRelation'],
                relations: pair.directs,
                side: directSide,
                waypoints,
            };
            const cle = `${pair.source}-${pair.target}-DIRECT`;
            groupes.set(cle, g);
        }

        if (pair.fonctionnels.length > 0) {
            const waypoints = (needsWaypoints
                ? computeWaypoints(sourceNode, targetNode, layoutNodes, fonctionnelSide, direction)
                : []) as { x: number; y: number }[];
            const g = {
                source: pair.source,
                target: pair.target,
                typeRelation: 'FONCTIONNEL' as HierarchiePersonnel['typeRelation'],
                relations: pair.fonctionnels,
                side: fonctionnelSide,
                waypoints,
            };
            const cle = `${pair.source}-${pair.target}-FONCTIONNEL`;
            groupes.set(cle, g);
        }
    }

    return Array.from(groupes.entries()).map(([cle, g]) => {
        const sourceNode = layoutNodeMap.get(g.source);
        const targetNode = layoutNodeMap.get(g.target);
        const rowBounds = sourceNode && targetNode
            ? computeRowBounds(sourceNode, targetNode, layoutNodes, direction)
            : null;
        return {
            id: `relation-${cle}`,
            source: g.source,
            target: g.target,
            type: 'relationEdge',
            data: {
                typeRelation: g.typeRelation,
                count: g.relations.length,
                relations: g.relations,
                sourceNom: nomById.get(g.source),
                targetNom: nomById.get(g.target),
                side: g.side,
                waypoints: g.waypoints,
                direction,
                rowBounds,
            } satisfies RelationEdgeData,
            animated: false,
            zIndex: g.typeRelation === 'FONCTIONNEL' ? 2 : 1,
        };
    });
}

export function useOrganigrammeFlow({
    data,
    direction,
    defaultCollapseDepth = 2,
    isEditMode = false,
    dndVisualState,
    relations,
}: UseOrganigrammeFlowOptions) {
    const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [searchMatchIds, setSearchMatchIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (data.length === 0) return;
        const ids = new Set<string>();
        const collecter = (unites: OrganigrammeNode[], depth: number) => {
            for (const u of unites) {
                if (depth >= defaultCollapseDepth && u.enfants?.length) {
                    ids.add(u.id);
                }
                if (u.enfants) collecter(u.enfants, depth + 1);
            }
        };
        collecter(data, 0);
        setCollapsedIds(ids);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data]);

    const toggleCollapse = useCallback((id: string) => {
        setCollapsedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    const expandAll = useCallback(() => {
        setCollapsedIds(new Set());
    }, []);

    const collapseAll = useCallback(() => {
        if (data.length === 0) return;
        const ids = new Set<string>();
        const collecter = (unites: OrganigrammeNode[]) => {
            for (const u of unites) {
                if (u.enfants?.length) ids.add(u.id);
                if (u.enfants) collecter(u.enfants);
            }
        };
        collecter(data);
        setCollapsedIds(ids);
    }, [data]);

    const collapseToDepth = useCallback((maxDepth: number) => {
        if (data.length === 0) return;
        const ids = new Set<string>();
        const collecter = (unites: OrganigrammeNode[], depth: number) => {
            for (const u of unites) {
                if (depth >= maxDepth && u.enfants?.length) {
                    ids.add(u.id);
                }
                if (u.enfants) collecter(u.enfants, depth + 1);
            }
        };
        collecter(data, 0);
        setCollapsedIds(ids);
    }, [data]);

    const selectNode = useCallback((unite: OrganigrammeNode) => {
        setSelectedId(prev => prev === unite.id ? null : unite.id);
    }, []);

    const handleSearch = useCallback((query: string) => {
        if (!query.trim()) {
            setSearchMatchIds(new Set());
            return;
        }
        const q = query.toLowerCase().trim();
        const matchIds = new Set<string>();
        const ancestorIds = new Set<string>();

        const trouver = (unites: OrganigrammeNode[]) => {
            for (const u of unites) {
                const matchNom = u.nom.toLowerCase().includes(q);
                const matchPostes = u.postes?.some(p => p.intitule.toLowerCase().includes(q));
                if (matchNom || matchPostes) {
                    matchIds.add(u.id);
                }
                if (u.enfants) trouver(u.enfants);
            }
        };
        trouver(data);

        const trouverAncetres = (unites: OrganigrammeNode[], chemin: string[]): boolean => {
            for (const u of unites) {
                const courant = [...chemin, u.id];
                if (matchIds.has(u.id)) {
                    chemin.forEach(id => ancestorIds.add(id));
                }
                if (u.enfants) {
                    trouverAncetres(u.enfants, courant);
                }
            }
            return false;
        };
        trouverAncetres(data, []);

        setCollapsedIds(prev => {
            const next = new Set(prev);
            ancestorIds.forEach(id => next.delete(id));
            return next;
        });

        setSearchMatchIds(matchIds);
    }, [data]);

    const { nodes, edges } = useMemo(() => {
        if (data.length === 0) return { nodes: [], edges: [] };

        const relationCount = relations?.length ?? 0;
        const { nodes: layoutNodes, edges: layoutEdges } = computeLayout(
            data, direction, collapsedIds, relationCount,
        );

        const rfNodes: Node<UniteNodeData>[] = layoutNodes.map(ln => ({
            id: ln.id,
            type: 'uniteNode',
            position: ln.position,
            data: {
                unite: ln.data,
                isCollapsed: collapsedIds.has(ln.id),
                onToggleCollapse: toggleCollapse,
                onSelect: selectNode,
                isSelected: selectedId === ln.id,
                isSearchMatch: searchMatchIds.has(ln.id),
                direction,
                isDragged: dndVisualState?.isDragging && dndVisualState?.draggedNodeId === ln.id,
                isDropTarget: dndVisualState?.isDragging && dndVisualState?.dropTargetId === ln.id,
                isDropValid: dndVisualState?.isValid ?? false,
                isAnyDragging: !!dndVisualState?.isDragging,
                isConnecting: dndVisualState?.isConnecting ?? false,
                isEditMode,
                isConnectable: isEditMode,
            },
            draggable: isEditMode,
            selectable: false,
            connectable: isEditMode,
            style: { transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' },
        }));

        const nomById = new Map(layoutNodes.map(ln => [ln.id, ln.data.nom]));
        const postesById = new Map(layoutNodes.map(ln => [ln.id, ln.data.postes?.length ?? 0]));

        const rfEdges: Edge<HierarchieEdgeData>[] = layoutEdges.map(le => ({
            id: le.id,
            source: le.source,
            target: le.target,
            type: 'hierarchieEdge',
            data: {
                sourceNom: nomById.get(le.source),
                targetNom: nomById.get(le.target),
                nbPostes: postesById.get(le.target),
            },
            animated: false,
            zIndex: 0,
        }));

        if (relations?.length) {
            const visibleIds = new Set(layoutNodes.map(ln => ln.id));
            const parentById = new Map<string, string | undefined>();
            const collecterParents = (unites: OrganigrammeNode[], parentId?: string) => {
                for (const u of unites) {
                    parentById.set(u.id, parentId);
                    if (u.enfants) collecterParents(u.enfants, u.id);
                }
            };
            collecterParents(data);
            rfEdges.push(...construireEdgesRelations(
                relations, visibleIds, nomById, parentById, layoutNodes, direction,
            ));
        }

        return { nodes: rfNodes, edges: rfEdges };
    }, [data, direction, collapsedIds, selectedId, toggleCollapse, selectNode, searchMatchIds, isEditMode, dndVisualState, relations]);

    const stats = useMemo(() => {
        let total = 0;
        let visibles = nodes.length;
        const compter = (unites: OrganigrammeNode[]) => {
            for (const u of unites) {
                total++;
                if (u.enfants) compter(u.enfants);
            }
        };
        compter(data);
        return { total, visibles };
    }, [data, nodes.length]);

    return {
        nodes,
        edges,
        collapsedIds,
        selectedId,
        toggleCollapse,
        expandAll,
        collapseAll,
        collapseToDepth,
        selectNode,
        handleSearch,
        searchMatchIds,
        stats,
    };
}
