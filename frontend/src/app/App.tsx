/**
 * ==================================
 * eLISAschool - Application principale
 * ==================================
 * Composant racine avec Router et ErrorBoundary
 */

import { useEffect } from 'react';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import { useThemeStore } from '@/stores/theme.store';
import { routeTree } from '@/app/route-tree.gen';

// Créer le router
const router = createRouter({
    routeTree,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
});

// Déclaration pour TanStack Router
declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}

export function App() {
    const appliquerTheme = useThemeStore((state) => state.appliquerTheme);

    useEffect(() => {
        appliquerTheme();
    }, [appliquerTheme]);

    return (
        <ErrorBoundary>
            <RouterProvider router={router} />
        </ErrorBoundary>
    );
}
