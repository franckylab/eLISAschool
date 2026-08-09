/**
 * ==================================
 * eLISAschool - Virtual Table Component
 * ==================================
 * 
 * Table virtualisée pour listes > 100 lignes.
 * Utilise un approach windowing native (sans dépendance externe).
 * Seules les lignes visibles dans le viewport sont rendues.
 * 
 * Phase E.6 — Refonte SaaS v2
 */

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';

export interface VirtualTableColumn<T> {
    key: string;
    header: string;
    width?: string;
    render?: (item: T, index: number) => React.ReactNode;
    className?: string;
}

interface VirtualTableProps<T> {
    columns: VirtualTableColumn<T>[];
    data: T[];
    rowHeight?: number;
    containerHeight?: number;
    overscan?: number;
    keyExtractor: (item: T, index: number) => string;
    onRowClick?: (item: T, index: number) => void;
    emptyMessage?: string;
    className?: string;
}

export function VirtualTable<T>({
    columns,
    data,
    rowHeight = 48,
    containerHeight = 500,
    overscan = 5,
    keyExtractor,
    onRowClick,
    emptyMessage = 'Aucune donnée',
    className = '',
}: VirtualTableProps<T>) {
    const [scrollTop, setScrollTop] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const { startIndex, endIndex, visibleItems } = useMemo(() => {
        const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
        const visibleCount = Math.ceil(containerHeight / rowHeight);
        const end = Math.min(data.length, start + visibleCount + 2 * overscan);

        return {
            startIndex: start,
            endIndex: end,
            visibleItems: data.slice(start, end),
        };
    }, [scrollTop, rowHeight, containerHeight, overscan, data]);

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        setScrollTop(e.currentTarget.scrollTop);
    }, []);

    const topPadding = startIndex * rowHeight;
    const bottomPadding = (data.length - endIndex) * rowHeight;

    if (data.length === 0) {
        return (
            <div className={`rounded-xl border bg-card p-8 text-center text-muted-foreground ${className}`}>
                {emptyMessage}
            </div>
        );
    }

    return (
        <div className={`rounded-xl border bg-card overflow-hidden ${className}`}>
            {/* Header */}
            <div className="flex border-b bg-muted/50 px-2">
                {columns.map((col) => (
                    <div
                        key={col.key}
                        className={`px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider ${col.className || ''}`}
                        style={{ width: col.width, flexShrink: 0 }}
                    >
                        {col.header}
                    </div>
                ))}
            </div>

            {/* Virtual scroll container */}
            <div
                ref={containerRef}
                onScroll={handleScroll}
                style={{ height: containerHeight, overflow: 'auto' }}
                className="scrollbar-thin"
            >
                {/* Top spacer */}
                <div style={{ height: topPadding }} />

                {/* Visible rows */}
                {visibleItems.map((item, i) => {
                    const actualIndex = startIndex + i;
                    const key = keyExtractor(item, actualIndex);

                    return (
                        <div
                            key={key}
                            className={`flex items-center border-b last:border-b-0 hover:bg-muted/30 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                            style={{ height: rowHeight }}
                            onClick={() => onRowClick?.(item, actualIndex)}
                        >
                            {columns.map((col) => (
                                <div
                                    key={col.key}
                                    className={`px-3 py-2 text-sm truncate ${col.className || ''}`}
                                    style={{ width: col.width, flexShrink: 0 }}
                                >
                                    {col.render ? col.render(item, actualIndex) : String((item as any)[col.key] ?? '')}
                                </div>
                            ))}
                        </div>
                    );
                })}

                {/* Bottom spacer */}
                <div style={{ height: bottomPadding }} />
            </div>

            {/* Footer with count */}
            <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
                <span>{data.length} élément{data.length > 1 ? 's' : ''}</span>
                <span>Affichés: {startIndex + 1}–{Math.min(endIndex, data.length)}</span>
            </div>
        </div>
    );
}

/**
 * Hook pour infinite scroll — charge plus de données au scroll.
 */
export function useInfiniteScroll(
    callback: () => void,
    options: { threshold?: number; enabled?: boolean } = {}
) {
    const { threshold = 200, enabled = true } = options;
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container || !enabled) return;

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = container;
            if (scrollHeight - scrollTop - clientHeight < threshold) {
                callback();
            }
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [callback, threshold, enabled]);

    return containerRef;
}

export default VirtualTable;
