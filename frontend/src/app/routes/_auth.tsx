/**
 * ==================================
 * eLISAschool - Auth Layout Route
 * ==================================
 * Layout commun pour les routes authentifiées
 * Inclut AuthGuard + PageLayout
 */

import { createFileRoute, Outlet } from '@tanstack/react-router';
import { authGuard } from '@/app/route-guards';
import { PageLayout } from '@/components/layout/PageLayout';

function AuthLayout() {
    return (
        <PageLayout>
            <Outlet />
        </PageLayout>
    );
}

export const Route = createFileRoute('/_auth')({
    beforeLoad: () => {
        authGuard();
    },
    component: AuthLayout,
});
