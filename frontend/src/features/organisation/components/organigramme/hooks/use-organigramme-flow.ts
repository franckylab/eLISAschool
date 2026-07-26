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

import { useMemo, useCallback, useState, useEffect } from 'react';
import type { Node, Edge } from 'reactflow';
import { MarkerType } from 'reactflow';
import type { OrganigrammeNode, HierarchiePersonnel } from '../../../types/organisation.types';
import { computeLayout, type LayoutDirection } from '../utils/layout';
import type { UniteNodeData } from '../nodes/UniteNode';
import type { HierarchieEdgeData } from '../edges/HierarchieEdge';
import type { RelationEdgeData } from '../edges/RelationEdge';

/** état DnD propagé aux noeuds pour le feedback visuel */
export interface DndVisualState {
    draggedNodeId: string | null;
    dropTargetId: string | null;
    isValid: boolean;
    isDragging: boolean;
    isConnecting: boolean; // true quand un drag de connexion est en cours
}

interface UseOrganigrammeFlowOptions {
    data: OrganigrammeNode[];
    direction: LayoutDirection;
    defaultCollapseDepth?: number; // Noeuds au-delà de cette profondeur sont collapse par défaut
    isEditMode?: boolean;
    dndVisualState?: DndVisualState;
    /** Relations hiérarchiques poste→poste à superposer (overlay) */
    relations?: HierarchiePersonnel[];
}

/** Agrège les relations poste→poste par couple d'unités visibles.
 * Les unités masquées (sous-arbre replié) sont remontées vers leur premier ancêtre visible. */
function construireEdgesRelations(
    relations: HierarchiePersonnel[],
    visibleIds: Set<string>,
    nomById: Map<string, string>,
    parentById: Map<string, string | undefined>,
): Edge<RelationEdgeData>[] {
    const resoudreVisible = (id: string): string | null => {
        let courant: string | undefined = id;
        while (courant && !visibleIds.has(courant)) {
            courant = parentById.get(courant);
        }
        return courant ?? null;
    };
    const groupes = new Map<string, { source: string; target: string; typeRelation: HierarchiePersonnel['typeRelation']; relations: HierarchiePersonnel[] }>();
    for (const r of relations) {
        const sourceUniteBrute = r.superieurPoste?.uniteOrganisationnelle?.id;
        const targetUniteBrute = r.poste?.uniteOrganisationnelle?.id;
        if (!sourceUniteBrute || !targetUniteBrute || sourceUniteBrute === targetUniteBrute) continue;
        const sourceUnite = resoudreVisible(sourceUniteBrute);
        const targetUnite = resoudreVisible(targetUniteBrute);
        if (!sourceUnite || !targetUnite || sourceUnite === targetUnite) continue;
        const cle = `${sourceUnite}-${targetUnite}-${r.typeRelation}`;
        const existant = groupes.get(cle);
        if (existant) {
            existant.relations.push(r);
        } else {
            groupes.set(cle, { source: sourceUnite, target: targetUnite, typeRelation: r.typeRelation, relations: [r] });
        }
    }
    return Array.from(groupes.entries()).map(([cle, g]) => {
        const couleur = g.typeRelation === 'FONCTIONNEL' ? 'var(--color-accent-600)' : 'var(--color-dominant-600)';
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
            },
            markerEnd: { type: MarkerType.ArrowClosed, color: couleur, width: 14, height: 14 },
            animated: false,
            zIndex: 1,
        };
    });
}

export function useOrganigrammeFlow({ data, direction, defaultCollapseDepth = 2, isEditMode = false, dndVisualState, relations }: UseOrganigrammeFlowOptions) {
    const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [searchMatchIds, setSearchMatchIds] = useState<Set<string>>(new Set());

    // Initialiser les collapses par défaut (profondeur > seuil)
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
                isConnecting: dndVisualState?.isConnecting ?? false,
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
            markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--color-dominant-400)', width: 12, height: 12 },
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
            rfEdges.push(...construireEdgesRelations(relations, visibleIds, nomById, parentById));
        }

        return { nodes: rfNodes, edges: rfEdges };
    }, [data, direction, collapsedIds, selectedId, toggleCollapse, selectNode, searchMatchIds, isEditMode, dndVisualState, relations]);

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
