/**
 * ==================================
 * eLISAschool - Layout Engine pour Organigramme
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Calcul des positions des noeuds via dagre (algorithme de layout hiérarchique).
 * Supporte les directions TB (top-bottom) et LR (left-right).
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

/**
 * Calcule la hauteur d'un noeud en fonction du nombre de postes affichés
 */
function computeNodeHeight(node: OrganigrammeNode): number {
    const postesCount = Math.min(node.postes?.length || 0, MAX_POSTES_VISIBLE);
    return NODE_HEIGHT_BASE + (postesCount * NODE_HEIGHT_PER_POSTE);
}

/**
 * Construit le graphe dagre à partir de l'arbre d'unités
 */
export function computeLayout(
    arbre: OrganigrammeNode[],
    direction: LayoutDirection = 'TB',
    collapsedIds: Set<string> = new Set(),
): { nodes: LayoutNode[]; edges: LayoutEdge[] } {
    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({
        rankdir: direction,
        nodesep: direction === 'TB' ? 60 : 80,
        ranksep: direction === 'TB' ? 100 : 120,
        marginx: 40,
        marginy: 40,
    });

    const nodes: LayoutNode[] = [];
    const edges: LayoutEdge[] = [];

    // Parcours récursif de l'arbre
    const parcourir = (unites: OrganigrammeNode[]) => {
        for (const unite of unites) {
            const height = computeNodeHeight(unite);
            g.setNode(unite.id, { width: NODE_WIDTH, height });

            nodes.push({
                id: unite.id,
                width: NODE_WIDTH,
                height,
                position: { x: 0, y: 0 }, // sera calculé par dagre
                data: unite,
            });

            // Arêtes vers les enfants (si non collapse)
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

    // Calcul du layout par dagre
    dagre.layout(g);

    // Récupérer les positions calculées
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

/**
 * Collecte tous les IDs de descendants d'un noeud
 */
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

/**
 * Vérifie si un noeud est visible (tous ses ancêtres sont dépliés)
 */
export function estNoeudVisible(
    arbre: OrganigrammeNode[],
    nodeId: string,
    collapsedIds: Set<string>,
): boolean {
    // Trouver le chemin du noeud vers la racine
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

    // Vérifier qu'aucun ancêtre n'est collapse
    for (const ancetreId of chemin) {
        if (collapsedIds.has(ancetreId)) return false;
    }
    return true;
}

export { NODE_WIDTH, NODE_HEIGHT_BASE, MAX_POSTES_VISIBLE };
