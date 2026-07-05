/**
 * ==================================
 * eLISAschool - Route Matières (Layout)
 * ==================================
 * Route layout pour la liste et les détails des matières
 */

import { createFileRoute, Outlet } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';

export const Route = createFileRoute('/_auth/matieres')({
    beforeLoad: () => requireModulePermission('matieres'),
    component: MatieresLayout,
});

function MatieresLayout() {
    return <Outlet />;
}
