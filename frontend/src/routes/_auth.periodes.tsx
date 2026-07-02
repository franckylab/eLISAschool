/**
 * ==================================
 * eLISAschool - Route Périodes (Layout)
 * ==================================
 * Route layout pour la liste et les détails de périodes
 */

import { createFileRoute, Outlet } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';

export const Route = createFileRoute('/_auth/periodes')({
    beforeLoad: () => requireModulePermission('periodes'),
    component: PeriodesLayout,
});

function PeriodesLayout() {
    return <Outlet />;
}
