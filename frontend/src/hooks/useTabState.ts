import { useState, useCallback } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';

interface UrlDrivenOptions {
    from?: string;
    key?: string;
}

export function useTabState<T extends string>(
    defaultTab: T,
    options?: UrlDrivenOptions,
): [T, (tab: T) => void] {
    if (options?.from) {
        const navigate = useNavigate();
        const search = useSearch({ from: options.from as any });
        const key = options.key ?? 'tab';

        const activeTab = ((search as Record<string, unknown>)?.[key] ?? defaultTab) as T;

        const setActiveTab = useCallback(
            (tab: T) => {
                navigate({
                    to: '.',
                    search: (prev: Record<string, unknown>) => ({ ...prev, [key]: tab !== defaultTab ? tab : undefined }),
                    replace: true,
                });
            },
            [navigate, key, defaultTab],
        );

        return [activeTab, setActiveTab];
    }

    return useState<T>(defaultTab);
}
