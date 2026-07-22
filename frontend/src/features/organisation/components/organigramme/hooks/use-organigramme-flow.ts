/**
 * ==================================
 * eLISAschool - Hook conversion Organigramme → React Flow
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Convertit les données API (arbre imbriqué) en nodes/edges React Flow.
 * Gère le collapse/expand et les 2 directions (TB/LR).
 */

import { useMemo, useCallback, useState } from 'react';
import type { Node, Edge } from 'reactflow';
import { MarkerType } from 'reactflow';
import type { OrganigrammeNode } from '../../../types/organisation.types';
import { computeLayout, type LayoutDirection } from '../utils/layout';
import type { UniteNodeData } from '../nodes/UniteNode';

/** état DnD propagé aux noeuds pour le feedback visuel */
export interface DndVisualState {
    draggedNodeId: string | null;
    dropTargetId: string | null;
    isValid: boolean;
    isDragging: boolean;
}

interface UseOrganigrammeFlowOptions {
    data: OrganigrammeNode[];
    direction: LayoutDirection;
    defaultCollapseDepth?: number; // Noeuds au-delà de cette profondeur sont collapse par défaut
    isEditMode?: boolean;
    dndVisualState?: DndVisualState;
}

export function useOrganigrammeFlow({ data, direction, defaultCollapseDepth = 2, isEditMode = false, dndVisualState }: UseOrganigrammeFlowOptions) {
    const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [searchMatchIds, setSearchMatchIds] = useState<Set<string>>(new Set());

    // Initialiser les collapses par défaut (profondeur > seuil)
    useMemo(() => {
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
    }, [data]); // Seulement au chargement initial des données

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

    // Recherche : trouver les nœuds correspondants et déplier leurs ancêtres
    const handleSearch = useCallback((query: string) => {
        if (!query.trim()) {
            setSearchMatchIds(new Set());
            return;
        }
        const q = query.toLowerCase().trim();
        const matchIds = new Set<string>();
        const ancestorIds = new Set<string>();

        // Trouver les nœuds correspondants
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

        // Trouver les ancêtres des nœuds correspondants pour les déplier
        const trouverAncetres = (unites: OrganigrammeNode[], chemin: string[]): boolean => {
            for (const u of unites) {
                const courant = [...chemin, u.id];
                if (matchIds.has(u.id)) {
                    // Ajouter tous les ancêtres (sauf le nœud lui-même)
                    chemin.forEach(id => ancestorIds.add(id));
                }
                if (u.enfants) {
                    trouverAncetres(u.enfants, courant);
                }
            }
            return false;
        };
        trouverAncetres(data, []);

        // Déplier les ancêtres pour rendre les résultats visibles
        setCollapsedIds(prev => {
            const next = new Set(prev);
            // Retirer les ancêtres de collapsedIds (les déplier)
            ancestorIds.forEach(id => next.delete(id));
            return next;
        });

        setSearchMatchIds(matchIds);
    }, [data]);

    // Convertir en nodes/edges React Flow
    const { nodes, edges } = useMemo(() => {
        if (data.length === 0) return { nodes: [], edges: [] };

        const { nodes: layoutNodes, edges: layoutEdges } = computeLayout(data, direction, collapsedIds);

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
                // DnD visual state
                isDragged: dndVisualState?.isDragging && dndVisualState?.draggedNodeId === ln.id,
                isDropTarget: dndVisualState?.isDragging && dndVisualState?.dropTargetId === ln.id,
                isDropValid: dndVisualState?.isValid ?? false,
                isAnyDragging: !!dndVisualState?.isDragging,
                // Mode édition
                isEditMode,
                isConnectable: isEditMode,
            },
            draggable: isEditMode,
            selectable: false,
            connectable: isEditMode,
            // Animation de transition lors du repositionnement
            style: { transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' },
        }));

        const rfEdges: Edge[] = layoutEdges.map(le => ({
            id: le.id,
            source: le.source,
            target: le.target,
            type: 'hierarchieEdge',
            markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--color-text-muted)', width: 12, height: 12 },
            animated: false,
        }));

        return { nodes: rfNodes, edges: rfEdges };
    }, [data, direction, collapsedIds, selectedId, toggleCollapse, selectNode, searchMatchIds, isEditMode, dndVisualState]);

    // Statistiques pour la toolbar
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
