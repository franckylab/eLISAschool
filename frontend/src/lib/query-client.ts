/**
 * ==================================
 * eLISAschool - TanStack Query Client
 * ==================================
 * Configuration du QueryClient avec retry, staleTime et gcTime
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000,      // 5 minutes
            gcTime: 10 * 60 * 1000,         // 10 minutes (garbage collection)
            retry: 2,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
            refetchOnMount: true,
        },
        mutations: {
            retry: 1,
            retryDelay: 1000,
        },
    },
});
