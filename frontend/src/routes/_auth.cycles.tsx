/**
 * ==================================
 * eLISAschool - Route Cycles (Layout)
 * ==================================
 * Route layout pour la liste et les détails des cycles
 */

import { createFileRoute, Outlet } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';

export const Route = createFileRoute('/_auth/cycles')({
    beforeLoad: () => requireModulePermission('cycles'),
    component: CyclesLayout,
});

function CyclesLayout() {
    return <Outlet />;
}
