/**
 * eLISAschool - Platform Debug Index
 * Redirige vers la page de résolution entitlements.
 */

import { createFileRoute, Navigate } from '@tanstack/react-router';

export const Route = createFileRoute('/platform/debug/')({
    component: () => <Navigate to="/platform/debug/entitlements" />,
});
