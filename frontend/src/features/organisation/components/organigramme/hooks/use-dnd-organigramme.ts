/**
 * ==================================
 * eLISAschool - Hook Drag & Drop Organigramme
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * Gère le DnD des unités :
 * - Drag node sur un autre → changer parent (reparenting)
 * - Drag node sur canvas vide → détacher (faire racine)
 * - Connexion par poignées handle-to-handle (mode édition)
 * - Vérification anti-cycle côté frontend
 * - Optimistic update + rollback
 * - Feedback visuel enrichi (isDragged, isDropTarget, isValid)
 * - Gated par mode édition (isEditMode)
 */

import { useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useModifierUnite } from '../../../hooks/use-unites';
import type { OrganigrammeNode } from '../../../types/organisation.types';
import type { Node, Connection } from 'reactflow';
import { toast } from 'sonner';

interface UseDndOrganigrammeProps {
    arbre: OrganigrammeNode[];
    isEditMode?: boolean;
}

interface DndState {
    draggedNodeId: string | null;
    dropTargetId: string | null;
    isValid: boolean;
    isOverPane: boolean;
    isDragging: boolean; // distingue un vrai drag d'un simple clic
}

/**
 * Vérifie si déplacer `uniteId` sous `newParentId` crée un cycle.
 */
function estDescendant(arbre: OrganigrammeNode[], uniteId: string, ancestorId: string): boolean {
    const trouver = (noeuds: OrganigrammeNode[]): boolean => {
        for (const n of noeuds) {
            if (n.id === ancestorId) {
                const chercherDescendant = (children: OrganigrammeNode[]): boolean => {
                    for (const c of children) {
                        if (c.id === uniteId) return true;
                        if (c.enfants?.length && chercherDescendant(c.enfants)) return true;
                    }
                    return false;
                };
                return chercherDescendant(n.enfants || []);
            }
            if (n.enfants?.length && trouver(n.enfants)) return true;
        }
        return false;
    };
    return trouver(arbre);
}

/**
 * Compte les enfants (descendants) d'une unité.
 */
function compterEnfants(arbre: OrganigrammeNode[], uniteId: string): number {
    const trouver = (noeuds: OrganigrammeNode[]): number => {
        for (const n of noeuds) {
            if (n.id === uniteId) {
                const compter = (children: OrganigrammeNode[]): number => {
                    let count = children.length;
                    for (const c of children) {
                        if (c.enfants?.length) count += compter(c.enfants);
                    }
                    return count;
                };
                return compter(n.enfants || []);
            }
            if (n.enfants?.length) {
                const r = trouver(n.enfants);
                if (r >= 0) return r;
            }
        }
        return -1;
    };
    return Math.max(0, trouver(arbre));
}

/**
 * Trouve le parent d'un noeud dans l'arbre.
 */
function trouverParent(arbre: OrganigrammeNode[], uniteId: string): string | null {
    for (const n of arbre) {
        if (n.enfants?.some(e => e.id === uniteId)) return n.id;
        if (n.enfants?.length) {
            const found = trouverParent(n.enfants, uniteId);
            if (found) return found;
        }
    }
    return null;
}

export function useDndOrganigramme({ arbre, isEditMode = false }: UseDndOrganigrammeProps) {
    const qc = useQueryClient();
    const { mutateAsync: modifierUnite } = useModifierUnite();
    const [dndState, setDndState] = useState<DndState>({
        draggedNodeId: null,
        dropTargetId: null,
        isValid: false,
        isOverPane: false,
        isDragging: false,
    });
    const confirmPending = useRef<{ nodeId: string; targetId: string } | null>(null);

    // ─── EXECUTION (doit être déclaré avant les callbacks qui le référencent) ───

    const executerDeplacement = useCallback(async (nodeId: string, newParentId: string | null) => {
        try {
            await modifierUnite({
                id: nodeId,
                parentId: newParentId ?? null,
            });
            qc.invalidateQueries({ queryKey: ['organisation', 'organigramme'] });
            if (newParentId === null) {
                toast.success('Unité détachée (racine)');
            } else {
                toast.success('Unité déplacée');
            }
        } catch (error: any) {
            console.error('Erreur déplacement:', error);
        }
    }, [modifierUnite, qc]);

    // ─── DRAG EVENTS ───

    const onNodeDrag = useCallback((_: React.MouseEvent, node: Node) => {
        if (!isEditMode) return;
        setDndState(prev => ({ ...prev, draggedNodeId: node.id, isDragging: true }));
    }, [isEditMode]);

    const onNodeDragStop = useCallback((_: React.MouseEvent, _node: Node) => {
        if (!isEditMode) return;
        const wasDragging = dndState.isDragging;
        const draggedId = dndState.draggedNodeId;
        const targetId = dndState.dropTargetId;

        // Réinitialiser l'état DnD
        setDndState({ draggedNodeId: null, dropTargetId: null, isValid: false, isOverPane: false, isDragging: false });

        // Si pas de drop target et qu'on a vraiment draggué → drop sur canvas (détacher)
        if (wasDragging && draggedId && !targetId) {
            const nbEnfants = compterEnfants(arbre, draggedId);
            if (nbEnfants > 0) {
                confirmPending.current = { nodeId: draggedId, targetId: '__root__' };
                window.dispatchEvent(new CustomEvent('organigramme-confirm-move', {
                    detail: { nodeId: draggedId, targetId: '__root__', nbEnfants },
                }));
            } else {
                executerDeplacement(draggedId, null);
            }
        }
    }, [isEditMode, dndState.isDragging, dndState.draggedNodeId, dndState.dropTargetId, arbre, executerDeplacement]);

    const onNodeMouseEnter = useCallback((_: React.MouseEvent, targetNode: Node) => {
        if (!isEditMode) return;
        setDndState(prev => {
            if (!prev.draggedNodeId || prev.draggedNodeId === targetNode.id) return prev;
            const isValid = !estDescendant(arbre, targetNode.id, prev.draggedNodeId);
            return { ...prev, dropTargetId: targetNode.id, isValid };
        });
    }, [arbre, isEditMode]);

    const onNodeMouseLeave = useCallback((_: React.MouseEvent, _node: Node) => {
        if (!isEditMode) return;
        // Note : on ne clear PAS dropTargetId ici pour permettre la détection canvas drop dans onNodeDragStop.
        // Le visuel reste actif jusqu'au reset complet dans onNodeDragStop.
    }, [isEditMode]);

    // ─── DROP SUR UN NOEUD ───

    const onNodeDrop = useCallback(async (_: React.MouseEvent, targetNode: Node) => {
        if (!isEditMode) return;
        const draggedId = dndState.draggedNodeId;
        if (!draggedId || draggedId === targetNode.id) return;

        // Anti-cycle frontend
        if (estDescendant(arbre, targetNode.id, draggedId)) return;

        // Vérifier si même parent → réordonnancement (pas de reparenting)
        const draggedParent = trouverParent(arbre, draggedId);
        const targetParent = trouverParent(arbre, targetNode.id);
        if (draggedParent === targetParent && draggedParent !== null) {
            // Même parent : déclencher le réordonnancement
            window.dispatchEvent(new CustomEvent('organigramme-reorder', {
                detail: { nodeId: draggedId, apresId: targetNode.id },
            }));
            setDndState({ draggedNodeId: null, dropTargetId: null, isValid: false, isOverPane: false, isDragging: false });
            return;
        }

        const nbEnfants = compterEnfants(arbre, draggedId);

        if (nbEnfants > 0) {
            confirmPending.current = { nodeId: draggedId, targetId: targetNode.id };
            window.dispatchEvent(new CustomEvent('organigramme-confirm-move', {
                detail: { nodeId: draggedId, targetId: targetNode.id, nbEnfants },
            }));
        } else {
            await executerDeplacement(draggedId, targetNode.id);
        }

        setDndState({ draggedNodeId: null, dropTargetId: null, isValid: false, isOverPane: false, isDragging: false });
    }, [isEditMode, dndState.draggedNodeId, arbre, executerDeplacement]);

    // ─── DROP SUR CANVAS (faire racine) ───

    const onPaneDragStop = useCallback(() => {
        if (!isEditMode || !dndState.draggedNodeId) return;
        // Si pas de dropTarget et on arrête de drag → détacher
        if (!dndState.dropTargetId) {
            setDndState(prev => ({ ...prev, isOverPane: true }));
        }
    }, [isEditMode, dndState.draggedNodeId, dndState.dropTargetId]);

    const onPaneDrop = useCallback(async () => {
        if (!isEditMode || !dndState.draggedNodeId) return;
        const draggedId = dndState.draggedNodeId;
        const nbEnfants = compterEnfants(arbre, draggedId);

        if (nbEnfants > 0) {
            confirmPending.current = { nodeId: draggedId, targetId: '__root__' };
            window.dispatchEvent(new CustomEvent('organigramme-confirm-move', {
                detail: { nodeId: draggedId, targetId: '__root__', nbEnfants },
            }));
        } else {
            await executerDeplacement(draggedId, null);
        }
        setDndState({ draggedNodeId: null, dropTargetId: null, isValid: false, isOverPane: false, isDragging: false });
    }, [isEditMode, dndState.draggedNodeId, arbre, executerDeplacement]);

    // ─── CONFIRMATION ───

    const confirmerDeplacement = useCallback(async () => {
        if (confirmPending.current) {
            const { nodeId, targetId } = confirmPending.current;
            confirmPending.current = null;
            const newParentId = targetId === '__root__' ? null : targetId;
            await executerDeplacement(nodeId, newParentId);
        }
    }, [executerDeplacement]);

    const annulerDeplacement = useCallback(() => {
        confirmPending.current = null;
    }, []);

    // ─── CONNEXION PAR POIGNEES (handle-to-handle) ───

    const onConnect = useCallback((connection: Connection) => {
        if (!isEditMode) return;
        const sourceId = connection.source;
        const targetId = connection.target;
        if (!sourceId || !targetId || sourceId === targetId) return;

        // Anti-cycle : vérifier que source n'est pas déjà descendant de target
        if (estDescendant(arbre, sourceId, targetId)) {
            toast.error('Connexion impossible : cycle détecté');
            return;
        }

        // target devient enfant de source
        executerDeplacement(targetId, sourceId);
    }, [isEditMode, arbre, executerDeplacement]);

    const onConnectStart = useCallback(() => {
        // Feedback visuel : mode connexion actif
    }, []);

    const onConnectEnd = useCallback(() => {
        // Fin du mode connexion
    }, []);

    return {
        dndState,
        onNodeDrag,
        onNodeDragStop,
        onNodeMouseEnter,
        onNodeMouseLeave,
        onNodeDrop,
        onPaneDragStop,
        onPaneDrop,
        confirmerDeplacement,
        annulerDeplacement,
        confirmPending,
        onConnect,
        onConnectStart,
        onConnectEnd,
    };
}
