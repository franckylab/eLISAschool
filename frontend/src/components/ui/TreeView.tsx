import { useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DndContext, DragOverlay, closestCenter,
    type DragStartEvent, type DragEndEvent,
    useSensor, useSensors, PointerSensor,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronRight, GripVertical } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface TreeNode<T = any> {
    id: string;
    label: string;
    data: T;
    children?: TreeNode<T>[];
    icon?: ReactNode;
    badge?: ReactNode;
    depth?: number;
}

interface TreeViewProps<T> {
    nodes: TreeNode<T>[];
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

function TreeItem<T>({
    node,
    depth = 0,
    onSelect,
    selectedId,
    expandedIds,
    onExpandedChange,
    renderActions,
    enableDrag,
}: {
    node: TreeNode<T>;
    depth?: number;
    onSelect?: (node: TreeNode<T>) => void;
    selectedId?: string;
    expandedIds?: Set<string>;
    onExpandedChange?: (expandedIds: Set<string>) => void;
    renderActions?: (node: TreeNode<T>) => ReactNode;
    enableDrag?: boolean;
}) {
    const [localExpanded, setLocalExpanded] = useState(true);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedId === node.id;
    const isExpanded = expandedIds ? expandedIds.has(node.id) : localExpanded;

    const {
        attributes, listeners, setNodeRef, transform, transition, isDragging,
    } = useSortable({ id: node.id, disabled: !enableDrag });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (expandedIds && onExpandedChange) {
            const next = new Set(expandedIds);
            if (next.has(node.id)) next.delete(node.id);
            else next.add(node.id);
            onExpandedChange(next);
        } else {
            setLocalExpanded(!localExpanded);
        }
    };

    const handleSelect = () => onSelect?.(node);

    return (
        <div ref={setNodeRef} style={style} className="select-none">
            <div
                className={cn(
                    'flex items-center gap-1.5 py-1.5 px-2 rounded-md cursor-pointer transition-colors group',
                    'hover:bg-[var(--color-dominant-50)]',
                    isSelected && 'bg-[var(--color-dominant-50)] border border-[var(--color-dominant-200)]',
                    !isSelected && 'border border-transparent',
                )}
                onClick={handleSelect}
                style={{ paddingLeft: `${depth * 20 + 8}px` }}
            >
                {enableDrag && (
                    <button
                        className="cursor-grab active:cursor-grabbing text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] shrink-0"
                        {...attributes}
                        {...listeners}
                    >
                        <GripVertical className="h-3.5 w-3.5" />
                    </button>
                )}

                {hasChildren ? (
                    <button
                        onClick={handleToggle}
                        className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] shrink-0"
                    >
                        <motion.div
                            animate={{ rotate: isExpanded ? 90 : 0 }}
                            transition={{ duration: 0.15 }}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </motion.div>
                    </button>
                ) : (
                    <span className="w-4 shrink-0" />
                )}

                {node.icon && <span className="shrink-0 text-[var(--color-text-muted)]">{node.icon}</span>}

                <span className={cn(
                    'text-sm truncate flex-1',
                    isSelected && 'font-medium text-[var(--color-dominant-600)]',
                    !isSelected && 'text-[var(--color-text-primary)]',
                )}>
                    {node.label}
                </span>

                {node.badge && <span className="shrink-0">{node.badge}</span>}

                {renderActions && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={(e) => e.stopPropagation()}>
                        {renderActions(node)}
                    </div>
                )}
            </div>

            <AnimatePresence initial={false}>
                {isExpanded && hasChildren && (
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
                                onSelect={onSelect}
                                selectedId={selectedId}
                                expandedIds={expandedIds}
                                onExpandedChange={onExpandedChange}
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
    expandedIds: externalExpandedIds,
    onExpandedChange,
    renderActions,
    onDragEnd,
    enableDrag = false,
    className,
    loading = false,
    emptyMessage = 'Aucun élément',
}: TreeViewProps<T>) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const [internalExpanded, setInternalExpanded] = useState<Set<string> | undefined>(undefined);
    const inited = useRef(false);

    useEffect(() => {
        if (inited.current || externalExpandedIds) return;
        inited.current = true;
        const all = new Set<string>();
        const collect = (items: TreeNode<T>[]) => {
            for (const item of items) {
                if (item.children?.length) {
                    all.add(item.id);
                    collect(item.children);
                }
            }
        };
        collect(nodes);
        setInternalExpanded(all);
    }, [externalExpandedIds, nodes]);

    const expandedIds = externalExpandedIds || internalExpanded;

    const toggleExpanded = useCallback((next: Set<string>) => {
        if (onExpandedChange) {
            onExpandedChange(next);
        } else {
            setInternalExpanded(next);
        }
    }, [onExpandedChange]);

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

    const findNode = (items: TreeNode<T>[], id: string): TreeNode<T> | undefined => {
        for (const item of items) {
            if (item.id === id) return item;
            if (item.children) {
                const found = findNode(item.children, id);
                if (found) return found;
            }
        }
        return undefined;
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
                    onExpandedChange={toggleExpanded}
                    renderActions={renderActions}
                    enableDrag={enableDrag}
                />
            ))}
        </div>
    );

    if (enableDrag) {
        const draggedNode = activeId ? findNode(nodes, activeId) : undefined;
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
                    {draggedNode ? (
                        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-md px-4 py-2 border border-gray-200 dark:border-gray-700 text-sm flex items-center gap-2">
                            {draggedNode.icon}
                            <span>{draggedNode.label}</span>
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        );
    }

    return content;
}

export { TreeView, type TreeViewProps, type TreeNode };