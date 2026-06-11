/**
 * ==================================
 * eLISAschool - Hook de Pagination TanStack Query
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Hook réutilisable pour la pagination côté client avec TanStack Query
 */

import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { PaginatedResult } from '@shared/types/api.types';

interface UsePaginationOptions<T> {
    queryKey: string[];
    queryFn: (params: { page: number; limit: number }) => Promise<PaginatedResult<T>>;
    initialPage?: number;
    initialLimit?: number;
    staleTime?: number;
    enabled?: boolean;
}

interface UsePaginationReturn<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
    isLoading: boolean;
    isError: boolean;
    setPage: (page: number) => void;
    setLimit: (limit: number) => void;
    nextPage: () => void;
    prevPage: () => void;
    refetch: () => void;
}

export function usePaginatedQuery<T>({
    queryKey,
    queryFn,
    initialPage = 1,
    initialLimit = 20,
    staleTime = 5 * 60 * 1000,
    enabled = true,
}: UsePaginationOptions<T>): UsePaginationReturn<T> {
    const [page, setPage] = useState(initialPage);
    const [limit, setLimit] = useState(initialLimit);

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: [...queryKey, page, limit],
        queryFn: () => queryFn({ page, limit }),
        staleTime,
        enabled,
    });

    const pagination = {
        page,
        limit,
        total: data?.total || 0,
        totalPages: Math.ceil((data?.total || 0) / limit),
        hasNext: page * limit < (data?.total || 0),
        hasPrev: page > 1,
    };

    const nextPage = useCallback(() => {
        if (pagination.hasNext) {
            setPage((prev) => prev + 1);
        }
    }, [pagination.hasNext]);

    const prevPage = useCallback(() => {
        if (pagination.hasPrev) {
            setPage((prev) => prev - 1);
        }
    }, [pagination.hasPrev]);

    return {
        data: data?.data || [],
        pagination,
        isLoading,
        isError,
        setPage,
        setLimit,
        nextPage,
        prevPage,
        refetch,
    };
}
