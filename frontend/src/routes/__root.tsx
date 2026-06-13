/**
 * ==================================
 * eLISAschool - Root Route
 * ==================================
 * Layout racine avec ErrorBoundary
 */

import { createRootRoute, Outlet } from '@tanstack/react-router';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';

function RootLayout() {
    return (
        <ErrorBoundary>
            <Outlet />
        </ErrorBoundary>
    );
}

export const Route = createRootRoute({
    component: RootLayout,
});
