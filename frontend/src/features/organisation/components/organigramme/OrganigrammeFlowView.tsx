import { useCallback, useRef, useMemo, useState, useEffect } from 'react';
import ReactFlow, {
    ReactFlowProvider,
    MiniMap,
    Controls,
    Background,
    useReactFlow,
    type NodeTypes,
    type EdgeTypes,
    type Node,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { UniteNode } from './nodes/UniteNode';
import { HierarchieEdge } from './edges/HierarchieEdge';
import { useOrganigrammeFlow } from './hooks/use-organigramme-flow';
import { useDndOrganigramme } from './hooks/use-dnd-organigramme';
import { useModifierPoste } from '../../hooks/use-postes';
import type { OrganigrammeNode } from '../../types/organisation.types';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface OrganigrammeFlowViewProps {
    data: OrganigrammeNode[];
    direction?: 'TB' | 'LR';
    containerId?: string;
    onNodeSelect?: (unite: OrganigrammeNode) => void;
    isEditMode?: boolean;
    onEditUnite?: (unite: OrganigrammeNode) => void;
    onAddChildUnite?: (unite: OrganigrammeNode) => void;
    onDeleteUnite?: (unite: OrganigrammeNode) => void;
}

const nodeTypes: NodeTypes = { uniteNode: UniteNode };
const edgeTypes: EdgeTypes = { hierarchieEdge: HierarchieEdge };

function FlowViewInner({
    data,
    direction = 'TB',
    containerId = 'organigramme-flow-container',
    onNodeSelect,
    isEditMode,
    onEditUnite,
    onAddChildUnite,
    onDeleteUnite,
}: OrganigrammeFlowViewProps) {
    const { t } = useTranslation('organisation');
    const isDesktop = useMediaQuery('(min-width: 1280px)');
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const { fitView, zoomIn, zoomOut } = useReactFlow();

    const { dndState, onNodeDrag, onNodeDragStop, onNodeMouseEnter, onNodeMouseLeave, onConnect, onConnectStart, onConnectEnd } = useDndOrganigramme({ arbre: data, isEditMode });

    const { nodes, edges, selectNode, expandAll, collapseAll, handleSearch } = useOrganigrammeFlow({
        data,
        direction,
        defaultCollapseDepth: 2,
        isEditMode,
        dndVisualState: { draggedNodeId: dndState.draggedNodeId, dropTargetId: dndState.dropTargetId, isValid: dndState.isValid, isDragging: dndState.isDragging, isConnecting: dndState.isConnecting },
    });

    const { mutateAsync: modifierPoste } = useModifierPoste();
    const [posteDropTarget, setPosteDropTarget] = useState<string | null>(null);

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

    const onInit = useCallback(() => {
        setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 100);
    }, [fitView]);

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
            toast.success(t('organigramme.flow.posteDeplace', 'Poste déplacé'));
        } catch {
            toast.error(t('organigramme.flow.erreurDeplacementPoste', 'Erreur déplacement poste'));
        }
        setPosteDropTarget(null);
    }, [modifierPoste, posteDropTarget, t]);

    return (
        <div
            id={containerId}
            ref={reactFlowWrapper}
            className="w-full"
            style={{ height: 'clamp(300px, calc(100vh - 320px), 800px)' }}
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
                onNodeMouseEnter={(_event: React.MouseEvent, node: Node) => {
                    onNodeMouseEnter(_event, node);
                    setPosteDropTarget((node.id as string) ?? null);
                }}
                onNodeMouseLeave={(_event: React.MouseEvent, node: Node) => {
                    onNodeMouseLeave(_event, node);
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
                elementsSelectable
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
                        maskColor="rgba(0,0,0,0.08)"
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
            </ReactFlow>
        </div>
    );
}

export function OrganigrammeFlowView(props: OrganigrammeFlowViewProps) {
    return (
        <ReactFlowProvider>
            <FlowViewInner {...props} />
        </ReactFlowProvider>
    );
}
