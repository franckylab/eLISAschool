/**
 * ==================================
 * eLISAschool - Hook Layout Engine
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Abstraction du moteur de layout dagre.
 * Fournit une interface unifiée pour calculer les positions
 * des noeuds selon la direction (TB/LR) et l'état collapse/expand.
 */

import { useMemo } from 'react';
import type { OrganigrammeNode } from '../../../types/organisation.types';
import { computeLayout, type LayoutDirection, type LayoutNode, type LayoutEdge } from '../utils/layout';

interface UseLayoutEngineOptions {
    data: OrganigrammeNode[];
    direction: LayoutDirection;
    collapsedIds: Set<string>;
}

interface UseLayoutEngineResult {
    layoutNodes: LayoutNode[];
    layoutEdges: LayoutEdge[];
    direction: LayoutDirection;
}

/**
 * Hook qui encapsule le calcul de layout dagre.
 * Mémorise le résultat et ne recalcule que si les entrées changent.
 */
export function useLayoutEngine({ data, direction, collapsedIds }: UseLayoutEngineOptions): UseLayoutEngineResult {
    const result = useMemo(() => {
        const { nodes: layoutNodes, edges: layoutEdges } = computeLayout(data, direction, collapsedIds);
        return { layoutNodes, layoutEdges, direction };
    }, [data, direction, collapsedIds]);

    return result;
}
