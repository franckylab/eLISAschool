/**
 * ==================================
 * eLISAschool - Organigramme Vertical (Top-Down)
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Vue React Flow avec layout vertical (top-to-bottom).
 * Minimap, zoom controls, DnD, responsive.
 */

import { useCallback, useRef, useMemo, useState, useEffect } from 'react';
import ReactFlow, {
    ReactFlowProvider,
    MiniMap,
    Controls,
    Background,
    useReactFlow,
    type NodeTypes,
    type EdgeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { UniteNode } from './nodes/UniteNode';
import { HierarchieEdge } from './edges/HierarchieEdge';
import { useOrganigrammeFlow } from './hooks/use-organigramme-flow';
import { useDndOrganigramme } from './hooks/use-dnd-organigramme';
import { useModifierPoste } from '../../hooks/use-postes';
import type { OrganigrammeNode } from '../../types/organisation.types';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Minimize2 } from 'lucide-react';
import { toast } from 'sonner';

interface OrganigrammeVerticalProps {
    data: OrganigrammeNode[];
    onNodeSelect?: (unite: OrganigrammeNode) => void;
    isEditMode?: boolean;
    onEditUnite?: (unite: OrganigrammeNode) => void;
    onAddChildUnite?: (unite: OrganigrammeNode) => void;
    onDeleteUnite?: (unite: OrganigrammeNode) => void;
}

const nodeTypes: NodeTypes = { uniteNode: UniteNode };
const edgeTypes: EdgeTypes = { hierarchieEdge: HierarchieEdge };

function OrganigrammeVerticalInner({ data, onNodeSelect, isEditMode, onEditUnite, onAddChildUnite, onDeleteUnite }: OrganigrammeVerticalProps) {
    const isDesktop = useMediaQuery('(min-width: 1280px)');
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const { fitView, zoomIn, zoomOut } = useReactFlow();

    const { dndState, onNodeDrag, onNodeDragStop, onNodeMouseEnter, onNodeMouseLeave, onConnect, onConnectStart, onConnectEnd } = useDndOrganigramme({ arbre: data, isEditMode });

    const { nodes, edges, selectNode, expandAll, collapseAll, handleSearch } = useOrganigrammeFlow({
        data,
        direction: 'TB',
        defaultCollapseDepth: 2,
        isEditMode,
        dndVisualState: { draggedNodeId: dndState.draggedNodeId, dropTargetId: dndState.dropTargetId, isValid: dndState.isValid, isDragging: dndState.isDragging, isConnecting: dndState.isConnecting },
    });

    const { mutateAsync: modifierPoste } = useModifierPoste();
    const [posteDropTarget, setPosteDropTarget] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Synchroniser l'état plein écran
    useEffect(() => {
        const handler = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

    const handleNodeSelect = useCallback((unite: OrganigrammeNode) => {
        selectNode(unite);
        onNodeSelect?.(unite);
    }, [selectNode, onNodeSelect]);

    const nodesWithSelect = useMemo(() =>
        nodes.map(n => ({
            ...n,
            data: {
                ...n.data,
                onSelect: handleNodeSelect,
                isEditMode,
                onEdit: onEditUnite,
                onAddChild: onAddChildUnite,
                onDelete: onDeleteUnite,
            },
        })),
        [nodes, handleNodeSelect, isEditMode, onEditUnite, onAddChildUnite, onDeleteUnite]
    );

    // Pas besoin de nodesWithDnd séparé — le feedback visuel est géré par useOrganigrammeFlow via dndVisualState

    const onInit = useCallback(() => {
        setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 100);
    }, [fitView]);

    // Écouter les commandes de la toolbar
    useEffect(() => {
        const handler = (e: Event) => {
            const { command } = (e as CustomEvent).detail;
            switch (command) {
                case 'zoom-in':
                    zoomIn({ duration: 200 });
                    break;
                case 'zoom-out':
                    zoomOut({ duration: 200 });
                    break;
                case 'fit-view':
                    fitView({ padding: 0.2, duration: 300 });
                    break;
                case 'expand-all':
                    expandAll();
                    break;
                case 'collapse-all':
                    collapseAll();
                    break;
                case 'search':
                    handleSearch((e as CustomEvent).detail.query || '');
                    break;
            }
        };
        window.addEventListener('organigramme:toolbar-command', handler);
        return () => window.removeEventListener('organigramme:toolbar-command', handler);
    }, [zoomIn, zoomOut, fitView, expandAll, collapseAll, handleSearch]);

    // Gestion du drop de poste depuis le drawer
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        const posteId = e.dataTransfer.getData('application/poste-id');
        if (!posteId || !posteDropTarget) return;
        try {
            await modifierPoste({ id: posteId, uniteOrganisationnelleId: posteDropTarget });
            toast.success('Poste déplacé');
        } catch {
            toast.error('Erreur déplacement poste');
        }
        setPosteDropTarget(null);
    }, [modifierPoste, posteDropTarget]);

    return (
        <div
            ref={reactFlowWrapper}
            className="w-full"
            style={{ height: 'calc(100vh - 320px)', minHeight: '400px' }}
            id="organigramme-flow-container"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <ReactFlow
                nodes={nodesWithSelect}
                edges={edges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                onInit={onInit}
                onNodeDrag={onNodeDrag}
                onNodeDragStop={onNodeDragStop}
                onNodeMouseEnter={(_, node) => {
                    onNodeMouseEnter(_, node);
                    setPosteDropTarget(node.id);
                }}
                onNodeMouseLeave={(_, node) => {
                    onNodeMouseLeave(_, node);
                    setPosteDropTarget(null);
                }}
                onConnect={onConnect}
                onConnectStart={onConnectStart}
                onConnectEnd={onConnectEnd}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.1}
                maxZoom={2}
                defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
                nodesDraggable={isEditMode}
                nodesConnectable={isEditMode}
                elementsSelectable={isEditMode}
                panOnDrag
                panOnScroll={false}
                zoomOnScroll
                zoomOnPinch
                zoomOnDoubleClick={false}
                proOptions={{ hideAttribution: true }}
            >
                <Background gap={20} size={1} color="var(--color-bordure)" />
                {isDesktop && (
                    <MiniMap
                        nodeColor={() => 'var(--color-dominant-400)'}
                        maskColor="rgba(0,0,0,0.1)"
                        className="!bg-[var(--color-surface)] !border !border-[var(--color-bordure)] !rounded-lg"
                        position="bottom-right"
                        pannable
                        zoomable
                    />
                )}
                <Controls
                    showInteractive={false}
                    className="!bg-[var(--color-surface)] !border !border-[var(--color-bordure)] !rounded-lg !shadow-sm"
                />
                {/* Bouton quitter plein écran — visible uniquement en fullscreen */}
                {isFullscreen && (
                    <button
                        onClick={() => document.exitFullscreen().catch(() => {})}
                        className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        style={{
                            backgroundColor: 'var(--color-surface)',
                            border: '1px solid var(--color-bordure)',
                            color: 'var(--color-text-secondary)',
                        }}
                        title="Quitter le plein écran (Échap)"
                    >
                        <Minimize2 className="w-3.5 h-3.5" />
                        Quitter
                    </button>
                )}
            </ReactFlow>
        </div>
    );
}

export function OrganigrammeVertical(props: OrganigrammeVerticalProps) {
    return (
        <ReactFlowProvider>
            <OrganigrammeVerticalInner {...props} />
        </ReactFlowProvider>
    );
}
