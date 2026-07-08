import { useState, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DndContext, DragOverlay, closestCenter,
    type DragStartEvent, type DragEndEvent,
    useSensor, useSensors, PointerSensor,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronRight, ChevronDown, GripVertical } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface TreeNode<T = any> {
    id: string;
    label: string;
    data: T;
    children?: TreeNode<T>[];
    icon?: ReactNode;
    depth?: number;
}

interface TreeViewProps<T> {
    nodes: TreeNode<T>[];
    onToggle?: (nodeId: string) => void;
    onSelect?: (node: TreeNode<T>) => void;
    selectedId?: string;
    expandedIds?: Set<string>;
    onExpandedChange?: (expandedIds: Set<string>) => void;
    renderActions?: (node: TreeNode<T>) => ReactNode;
    onDragEnd?: (activeId: string, overId: string | null) => void;
    enableDrag?: boolean;
    className?: string;
    loading?: boolean;
    emptyMessage?: string;
}

const EXPANDED_ALL_SYMBOL = Symbol('all-expanded');

function TreeItem<T>({
    node,
    depth = 0,
    onToggle,
    onSelect,
    selectedId,
    expandedIds,
    renderActions,
    enableDrag,
}: {
    node: TreeNode<T>;
    depth?: number;
    onToggle?: (id: string) => void;
    onSelect?: (node: TreeNode<T>) => void;
    selectedId?: string;
    expandedIds?: Set<string>;
    renderActions?: (node: TreeNode<T>) => ReactNode;
    enableDrag?: boolean;
}) {
    const [expanded, setExpanded] = useState(
        expandedIds ? expandedIds.has(node.id) : true
    );
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedId === node.id;

    const {
        attributes, listeners, setNodeRef, transform, transition, isDragging,
    } = useSortable({ id: node.id, disabled: !enableDrag });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const handleToggle = () => {
        if (onToggle) onToggle(node.id);
        else setExpanded(!expanded);
    };

    const handleSelect = () => onSelect?.(node);

    return (
        <div ref={setNodeRef} style={style} className="select-none">
            <div
                className={cn(
                    'flex items-center gap-1.5 py-1.5 px-2 rounded-md cursor-pointer transition-colors group',
                    'hover:bg-gray-100 dark:hover:bg-gray-800',
                    isSelected && 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800',
                    !isSelected && 'border border-transparent',
                )}
                onClick={handleSelect}
                style={{ paddingLeft: `${depth * 20 + 8}px` }}
            >
                {enableDrag && (
                    <button
                        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 shrink-0"
                        {...attributes}
                        {...listeners}
                    >
                        <GripVertical className="h-3.5 w-3.5" />
                    </button>
                )}

                {hasChildren ? (
                    <button
                        onClick={(e) => { e.stopPropagation(); handleToggle(); }}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 shrink-0"
                    >
                        <motion.div
                            animate={{ rotate: (expandedIds || expanded) ? 90 : 0 }}
                            transition={{ duration: 0.15 }}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </motion.div>
                    </button>
                ) : (
                    <span className="w-4 shrink-0" />
                )}

                {node.icon && <span className="shrink-0 text-gray-500">{node.icon}</span>}

                <span className={cn(
                    'text-sm truncate flex-1',
                    isSelected && 'font-medium text-blue-700 dark:text-blue-300',
                    !isSelected && 'text-gray-700 dark:text-gray-300',
                )}>
                    {node.label}
                </span>

                {renderActions && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={(e) => e.stopPropagation()}>
                        {renderActions(node)}
                    </div>
                )}
            </div>

            <AnimatePresence initial={false}>
                {(expandedIds || expanded) && hasChildren && (
                    <motion.div
                        key={`children-${node.id}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="overflow-hidden"
                    >
                        {node.children!.map((child) => (
                            <TreeItem
                                key={child.id}
                                node={{ ...child, depth: depth + 1 }}
                                depth={depth + 1}
                                onToggle={onToggle}
                                onSelect={onSelect}
                                selectedId={selectedId}
                                expandedIds={expandedIds}
                                renderActions={renderActions}
                                enableDrag={enableDrag}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function TreeView<T>({
    nodes,
    onSelect,
    selectedId,
    expandedIds,
    renderActions,
    onDragEnd,
    enableDrag = false,
    className,
    loading = false,
    emptyMessage = 'Aucun élément',
}: TreeViewProps<T>) {
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        })
    );

    const handleDragStart = useCallback((event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    }, []);

    const handleDragEndCallback = useCallback((event: DragEndEvent) => {
        setActiveId(null);
        const { active, over } = event;
        onDragEnd?.(active.id as string, over?.id as string | null ?? null);
    }, [onDragEnd]);

    const flattenIds = (items: TreeNode<T>[]): string[] => {
        const ids: string[] = [];
        for (const item of items) {
            ids.push(item.id);
            if (item.children) ids.push(...flattenIds(item.children));
        }
        return ids;
    };

    if (loading) {
        return (
            <div className={cn('space-y-2 p-2', className)}>
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-2 py-2 px-3">
                        <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse flex-1" style={{ width: `${60 + Math.random() * 30}%` }} />
                    </div>
                ))}
            </div>
        );
    }

    if (nodes.length === 0) {
        return (
            <div className="flex items-center justify-center py-8 text-sm text-gray-400 dark:text-gray-500">
                {emptyMessage}
            </div>
        );
    }

    const allIds = flattenIds(nodes);

    const content = (
        <div className={cn('space-y-0.5', className)}>
            {nodes.map((node) => (
                <TreeItem
                    key={node.id}
                    node={node}
                    onSelect={onSelect}
                    selectedId={selectedId}
                    expandedIds={expandedIds}
                    renderActions={renderActions}
                    enableDrag={enableDrag}
                />
            ))}
        </div>
    );

    if (enableDrag) {
        return (
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEndCallback}
            >
                <SortableContext items={allIds} strategy={verticalListSortingStrategy}>
                    {content}
                </SortableContext>
                <DragOverlay>
                    {activeId ? (
                        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-md px-4 py-2 border border-gray-200 dark:border-gray-700 text-sm">
                            {activeId}
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        );
    }

    return content;
}

export { TreeView, type TreeViewProps, type TreeNode };
