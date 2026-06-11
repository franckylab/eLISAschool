/**
 * ==================================
 * eLISAschool - Tableau de Données avec Pagination
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Composant de tableau réutilisable avec tri, filtre et pagination
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
} from 'lucide-react';
import { ElisaButton } from '@/components/ui/ElisaButton';
import type { ReactNode } from 'react';

export interface Column<T> {
    key: string;
    header: string;
    render?: (item: T, index: number) => ReactNode;
    sortable?: boolean;
    className?: string;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    isLoading?: boolean;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
    onPageChange?: (page: number) => void;
    onLimitChange?: (limit: number) => void;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    onSortChange?: (sortBy: string, sortOrder: 'ASC' | 'DESC') => void;
    getRowId?: (item: T, index: number) => string;
    emptyMessage?: string;
}

export function DataTable<T>({
    data,
    columns,
    isLoading = false,
    pagination,
    onPageChange,
    onLimitChange,
    sortBy,
    sortOrder,
    onSortChange,
    getRowId,
    emptyMessage,
}: DataTableProps<T>) {
    const { t } = useTranslation();
    const [localSortBy, setLocalSortBy] = useState<string | null>(null);
    const [localSortOrder, setLocalSortOrder] = useState<'ASC' | 'DESC'>('ASC');

    const isControlled = sortBy !== undefined && onSortChange !== undefined;
    const activeSortBy = isControlled ? sortBy : localSortBy;
    const activeSortOrder = isControlled ? sortOrder : localSortOrder;

    const handleSort = (key: string) => {
        if (!isControlled) {
            if (localSortBy === key) {
                setLocalSortOrder((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'));
            } else {
                setLocalSortBy(key);
                setLocalSortOrder('ASC');
            }
        } else if (onSortChange) {
            const newOrder = sortBy === key && sortOrder === 'ASC' ? 'DESC' : 'ASC';
            onSortChange(key, newOrder);
        }
    };

    const sortedData = useMemo(() => {
        if (!activeSortBy || data.length === 0) return data;

        return [...data].sort((a: any, b: any) => {
            const aVal = a[activeSortBy];
            const bVal = b[activeSortBy];

            if (aVal < bVal) return activeSortOrder === 'ASC' ? -1 : 1;
            if (aVal > bVal) return activeSortOrder === 'ASC' ? 1 : -1;
            return 0;
        });
    }, [data, activeSortBy, activeSortOrder]);

    const displayData = isControlled ? data : sortedData;

    const limits = [10, 20, 50, 100];

    return (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
            {/* Tableau */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface-alt)]">
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className={`px-4 py-3 font-medium text-[var(--color-text-secondary)] ${
                                        col.sortable ? 'cursor-pointer select-none' : ''
                                    } ${col.className || ''}`}
                                    onClick={() => col.sortable && handleSort(col.key)}
                                >
                                    <div className="flex items-center gap-1">
                                        {col.header}
                                        {col.sortable && (
                                            <>
                                                {activeSortBy === col.key ? (
                                                    activeSortOrder === 'ASC' ? (
                                                        <ArrowUp className="h-3 w-3" />
                                                    ) : (
                                                        <ArrowDown className="h-3 w-3" />
                                                    )
                                                ) : (
                                                    <ArrowUpDown className="h-3 w-3 opacity-40" />
                                                )}
                                            </>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        <AnimatePresence mode="wait">
                            {isLoading ? (
                                <tr>
                                    <td
                                        colSpan={columns.length}
                                        className="px-4 py-12 text-center text-[var(--color-text-secondary)]"
                                    >
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-dominant-600)] border-t-transparent" />
                                            <p>{t('messages.chargement')}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : displayData.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={columns.length}
                                        className="px-4 py-12 text-center text-[var(--color-text-secondary)]"
                                    >
                                        {emptyMessage || t('messages.aucuneDonnee')}
                                    </td>
                                </tr>
                            ) : (
                                displayData.map((item, index) => (
                                    <motion.tr
                                        key={getRowId?.(item, index) || index}
                                        className="border-b border-[var(--color-border)] transition-colors last:border-b-0 hover:bg-[var(--color-dominant-50)] dark:hover:bg-[var(--color-surface-alt)]"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ delay: index * 0.02 }}
                                    >
                                        {columns.map((col) => (
                                            <td
                                                key={col.key}
                                                className={`px-4 py-3 ${col.className || ''}`}
                                            >
                                                {col.render
                                                    ? col.render(item, index)
                                                    : (item as any)[col.key]}
                                            </td>
                                        ))}
                                    </motion.tr>
                                ))
                            )}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination && (
                <div className="flex items-center justify-between border-t border-[var(--color-border)] px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                        <span>
                            {t('pagination.resultats', { total: pagination.total })}
                        </span>
                        <select
                            value={pagination.limit}
                            onChange={(e) => onLimitChange?.(Number(e.target.value))}
                            className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-sm"
                        >
                            {limits.map((limit) => (
                                <option key={limit} value={limit}>
                                    {limit} / page
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <ElisaButton
                            variant="outline"
                            size="sm"
                            icon={<ChevronsLeft className="h-4 w-4" />}
                            onClick={() => onPageChange?.(1)}
                            disabled={!pagination.hasPrev}
                        />
                        <ElisaButton
                            variant="outline"
                            size="sm"
                            icon={<ChevronLeft className="h-4 w-4" />}
                            onClick={() => onPageChange?.(pagination.page - 1)}
                            disabled={!pagination.hasPrev}
                        />
                        <span className="px-3 text-sm text-[var(--color-text-secondary)]">
                            {t('pagination.pageSur', {
                                page: pagination.page,
                                total: pagination.totalPages,
                            })}
                        </span>
                        <ElisaButton
                            variant="outline"
                            size="sm"
                            icon={<ChevronRight className="h-4 w-4" />}
                            onClick={() => onPageChange?.(pagination.page + 1)}
                            disabled={!pagination.hasNext}
                        />
                        <ElisaButton
                            variant="outline"
                            size="sm"
                            icon={<ChevronsRight className="h-4 w-4" />}
                            onClick={() => onPageChange?.(pagination.totalPages)}
                            disabled={!pagination.hasNext}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
