/**
 * ==================================
 * eLISAschool - Route Élèves (Layout)
 * ==================================
 * Route layout pour la liste et les détails des élèves
 */

import { createFileRoute, Outlet } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';

export const Route = createFileRoute('/_auth/eleves')({
    beforeLoad: () => requireModulePermission('eleves'),
    component: ElevesLayout,
});

function ElevesLayout() {
    return <Outlet />;
}
