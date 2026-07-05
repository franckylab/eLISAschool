/**
 * ==================================
 * eLISAschool - Route Filières (Layout)
 * ==================================
 * Route layout pour la liste et les détails des filières
 */

import { createFileRoute, Outlet } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';

export const Route = createFileRoute('/_auth/filieres')({
    beforeLoad: () => requireModulePermission('filieres'),
    component: FilieresLayout,
});

function FilieresLayout() {
    return <Outlet />;
}
