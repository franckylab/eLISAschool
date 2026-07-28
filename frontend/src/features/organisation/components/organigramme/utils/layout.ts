/**
 * ==================================
 * eLISAschool - Layout Engine pour Organigramme
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * Calcul des positions des noeuds via dagre (algorithme de layout hiérarchique).
 * Supporte les directions TB (top-bottom) et LR (left-right).
 * v2.0.0 : espacement auto-adaptatif selon la densité des relations.
 */

import dagre from 'dagre';
import type { OrganigrammeNode } from '../../../types/organisation.types';

export type LayoutDirection = 'TB' | 'LR';

export interface LayoutNode {
    id: string;
    width: number;
    height: number;
    position: { x: number; y: number };
    data: OrganigrammeNode;
}

export interface LayoutEdge {
    id: string;
    source: string;
    target: string;
}

const NODE_WIDTH = 240;
const NODE_HEIGHT_BASE = 120;
const NODE_HEIGHT_PER_POSTE = 24;
const MAX_POSTES_VISIBLE = 3;

const BASE_RANKSEP_TB = 100;
const BASE_NODESEP_TB = 60;
const BASE_RANKSEP_LR = 120;
const BASE_NODESEP_LR = 80;

function computeNodeHeight(node: OrganigrammeNode): number {
    const postesCount = Math.min(node.postes?.length || 0, MAX_POSTES_VISIBLE);
    return NODE_HEIGHT_BASE + (postesCount * NODE_HEIGHT_PER_POSTE);
}

function computeSpacingFactor(relationCount: number, nodeCount: number): number {
    if (relationCount === 0 || nodeCount === 0) return 1;
    const density = relationCount / nodeCount;
    if (density <= 0.3) return 1;
    if (density <= 0.6) return 1.25;
    if (density <= 1.0) return 1.4;
    return Math.min(1.4 + (density - 1) * 0.15, 1.8);
}

export function computeLayout(
    arbre: OrganigrammeNode[],
    direction: LayoutDirection = 'TB',
    collapsedIds: Set<string> = new Set(),
    relationCount: number = 0,
): { nodes: LayoutNode[]; edges: LayoutEdge[] } {
    const totalNodes = arbre.length;
    const factor = computeSpacingFactor(relationCount, totalNodes);

    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({
        rankdir: direction,
        nodesep: direction === 'TB'
            ? Math.round(BASE_NODESEP_TB * factor)
            : Math.round(BASE_NODESEP_LR * factor),
        ranksep: direction === 'TB'
            ? Math.round(BASE_RANKSEP_TB * factor)
            : Math.round(BASE_RANKSEP_LR * factor),
        marginx: 40,
        marginy: 40,
    });

    const nodes: LayoutNode[] = [];
    const edges: LayoutEdge[] = [];

    const parcourir = (unites: OrganigrammeNode[]) => {
        for (const unite of unites) {
            const height = computeNodeHeight(unite);
            g.setNode(unite.id, { width: NODE_WIDTH, height });

            nodes.push({
                id: unite.id,
                width: NODE_WIDTH,
                height,
                position: { x: 0, y: 0 },
                data: unite,
            });

            if (!collapsedIds.has(unite.id) && unite.enfants?.length) {
                for (const enfant of unite.enfants) {
                    g.setEdge(unite.id, enfant.id);
                    edges.push({
                        id: `${unite.id}-${enfant.id}`,
                        source: unite.id,
                        target: enfant.id,
                    });
                }
                parcourir(unite.enfants);
            }
        }
    };

    parcourir(arbre);
    dagre.layout(g);

    for (const node of nodes) {
        const dagreNode = g.node(node.id);
        if (dagreNode) {
            node.position = {
                x: dagreNode.x - node.width / 2,
                y: dagreNode.y - node.height / 2,
            };
        }
    }

    return { nodes, edges };
}

export function collecterDescendants(
    arbre: OrganigrammeNode[],
    uniteId: string,
): string[] {
    const result: string[] = [];

    const trouver = (unites: OrganigrammeNode[]): boolean => {
        for (const unite of unites) {
            if (unite.id === uniteId) {
                const collecter = (n: OrganigrammeNode) => {
                    for (const e of n.enfants || []) {
                        result.push(e.id);
                        collecter(e);
                    }
                };
                collecter(unite);
                return true;
            }
            if (unite.enfants && trouver(unite.enfants)) return true;
        }
        return false;
    };

    trouver(arbre);
    return result;
}

export function estNoeudVisible(
    arbre: OrganigrammeNode[],
    nodeId: string,
    collapsedIds: Set<string>,
): boolean {
    const chemin: string[] = [];
    const trouverChemin = (unites: OrganigrammeNode[], cible: string, path: string[]): boolean => {
        for (const unite of unites) {
            if (unite.id === cible) {
                chemin.push(...path);
                return true;
            }
            if (unite.enfants) {
                if (trouverChemin(unite.enfants, cible, [...path, unite.id])) return true;
            }
        }
        return false;
    };

    trouverChemin(arbre, nodeId, []);

    for (const ancetreId of chemin) {
        if (collapsedIds.has(ancetreId)) return false;
    }
    return true;
}

export { NODE_WIDTH, NODE_HEIGHT_BASE, MAX_POSTES_VISIBLE };
