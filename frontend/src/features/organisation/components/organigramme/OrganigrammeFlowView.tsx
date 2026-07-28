/**
 * ==================================
 * eLISAschool - Vue Organigramme React Flow
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Composant React Flow principal : rendu interactif avec DnD, connect,
 * recherche, zoom, toolbar via événements custom, drop postes.
 */

import { useCallback, useRef, useMemo, useState, useEffect } from 'react';
import ReactFlow, {
    ReactFlowProvider,
    MiniMap,
    Controls,
    ControlButton,
    Background,
    useReactFlow,
    type NodeTypes,
    type EdgeTypes,
    type Node,
    type Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Maximize2, Minimize2, Link2, Download } from 'lucide-react';
import { MarkerDefs } from '@/lib/routing';
import { UniteNode } from './nodes/UniteNode';
import { HierarchieEdge } from './edges/HierarchieEdge';
import { RelationEdge, type RelationEdgeData } from './edges/RelationEdge';
import { RelationDetailDrawer } from './drawer/RelationDetailDrawer';
import { useOrganigrammeFlow } from './hooks/use-organigramme-flow';
import { useDndOrganigramme } from './hooks/use-dnd-organigramme';
import { useModifierPoste } from '../../hooks/use-postes';
import { useHierarchies } from '../../hooks/use-hierarchies';
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
    showRelations?: boolean;
    onToggleRelations?: () => void;
    onExport?: () => void;
    onEditUnite?: (unite: OrganigrammeNode) => void;
    onAddChildUnite?: (unite: OrganigrammeNode) => void;
    onDeleteUnite?: (unite: OrganigrammeNode) => void;
}

const nodeTypes: NodeTypes = { uniteNode: UniteNode };
const edgeTypes: EdgeTypes = { hierarchieEdge: HierarchieEdge, relationEdge: RelationEdge };

function FlowViewInner({
    data,
    direction = 'TB',
    containerId = 'organigramme-flow-container',
    onNodeSelect,
    isEditMode,
    showRelations,
    onToggleRelations,
    onExport,
    onEditUnite,
    onAddChildUnite,
    onDeleteUnite,
}: OrganigrammeFlowViewProps) {
    const { t } = useTranslation('organisation');
    const isDesktop = useMediaQuery('(min-width: 1280px)');
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const { fitView, zoomIn, zoomOut } = useReactFlow();
    const { data: hierarchies } = useHierarchies();

    const { dndState, onNodeDrag, onNodeDragStop, onNodeMouseEnter, onNodeMouseLeave, onConnect, onConnectStart, onConnectEnd } = useDndOrganigramme({ arbre: data, isEditMode });

    const { nodes, edges, selectNode, expandAll, collapseAll, handleSearch } = useOrganigrammeFlow({
        data,
        direction,
        defaultCollapseDepth: 2,
        isEditMode,
        dndVisualState: { draggedNodeId: dndState.draggedNodeId, dropTargetId: dndState.dropTargetId, isValid: dndState.isValid, isDragging: dndState.isDragging, isConnecting: dndState.isConnecting },
        relations: showRelations ? hierarchies || [] : undefined,
    });

    const { mutateAsync: modifierPoste } = useModifierPoste();
    const [posteDropTarget, setPosteDropTarget] = useState<string | null>(null);

    // Minimap forcée pour export mobile/tablette (< 1280px)
    const [forceMinimap, setForceMinimap] = useState(false);

    // Plein écran (contrôles flottants)
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const handler = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

    // Drawer détail relation (clic sur un lien overlay)
    const [openedRelationEdgeId, setOpenedRelationEdgeId] = useState<string | null>(null);
    const openedRelationData = useMemo(() => {
        if (!openedRelationEdgeId) return null;
        const edge = edges.find(e => e.id === openedRelationEdgeId && e.type === 'relationEdge');
        return (edge?.data as RelationEdgeData | undefined) ?? null;
    }, [edges, openedRelationEdgeId]);

    const handleOpenRelation = useCallback((edgeId: string) => {
        setOpenedRelationEdgeId(edgeId);
    }, []);

    const handleCloseRelation = useCallback(() => {
        setOpenedRelationEdgeId(null);
    }, []);

    // Injecter le handler d'ouverture + état sélectionné dans les edges relation
    const edgesWithHandlers = useMemo<Edge[]>(() =>
        edges.map(e => e.type === 'relationEdge'
            ? { ...e, selected: e.id === openedRelationEdgeId, data: { ...(e.data as RelationEdgeData), onOpen: handleOpenRelation } }
            : e
        ),
        [edges, openedRelationEdgeId, handleOpenRelation]
    );

    // Unités reliées par le lien ouvert → surbrillance
    const highlightedNodeIds = useMemo(() => {
        if (!openedRelationEdgeId) return null;
        const edge = edges.find(e => e.id === openedRelationEdgeId);
        return edge ? new Set([edge.source, edge.target]) : null;
    }, [edges, openedRelationEdgeId]);

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
                isSearchMatch: n.data.isSearchMatch || !!highlightedNodeIds?.has(n.id),
            },
        })),
        [nodes, handleNodeSelect, isEditMode, onEditUnite, onAddChildUnite, onDeleteUnite, highlightedNodeIds]
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
                case 'force-minimap':
                    setForceMinimap(!!(e as CustomEvent).detail.visible);
                    break;
            }
        };
        window.addEventListener('organigramme:toolbar-command', handler);
        return () => window.removeEventListener('organigramme:toolbar-command', handler);
    }, [zoomIn, zoomOut, fitView, expandAll, collapseAll, handleSearch]);

    const handleToggleFullscreen = useCallback(() => {
        const el = document.getElementById(containerId);
        if (!el) return;
        if (!document.fullscreenElement) {
            el.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen().catch(() => {});
        }
    }, [containerId]);

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
                edges={edgesWithHandlers}
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
                <MarkerDefs />
                <Background gap={20} size={1} color="var(--org-node-border)" />
                {(isDesktop || forceMinimap) && (
                    <MiniMap
                        ariaLabel={t('organigramme.flow.minimapLabel', "Vue miniature de l'organigramme")}
                        nodeColor={() => 'var(--color-dominant-400)'}
                        maskColor="rgba(0,0,0,0.08)"
                        className="!bg-[var(--org-node-bg)] !border !border-[var(--org-node-border)] !rounded-lg"
                        position="bottom-right"
                        pannable
                        zoomable
                    />
                )}
                <Controls
                    showInteractive={false}
                    className="!bg-[var(--org-node-bg)] !border !border-[var(--org-node-border)] !rounded-lg !shadow-sm"
                >
                    <ControlButton
                        onClick={handleToggleFullscreen}
                        title={isFullscreen ? t('organigramme.quitterPleinEcran', 'Quitter le plein écran') : t('organigramme.pleinEcran', 'Plein écran')}
                    >
                        {isFullscreen ? <Minimize2 /> : <Maximize2 />}
                    </ControlButton>
                    {onToggleRelations && (
                        <ControlButton
                            onClick={onToggleRelations}
                            title={showRelations ? t('organigramme.masquerRelations', 'Masquer les relations') : t('organigramme.afficherRelations', 'Afficher les relations')}
                            style={showRelations
                                ? { backgroundColor: 'var(--color-dominant-600)', color: '#fff' }
                                : { color: 'inherit' }}
                        >
                            <Link2 />
                        </ControlButton>
                    )}
                    {onExport && (
                        <ControlButton
                            onClick={onExport}
                            title={t('organigramme.exporter', 'Exporter')}
                        >
                            <Download />
                        </ControlButton>
                    )}
                </Controls>
            </ReactFlow>
            <RelationDetailDrawer
                data={openedRelationData}
                open={!!openedRelationData}
                onClose={handleCloseRelation}
            />
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
