/**
 * ==================================
 * eLISAschool - Route Diplômes Élèves (Layout)
 * ==================================
 * Route layout pour la liste et les détails des diplômes élèves
 */

import { createFileRoute, Outlet } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';

export const Route = createFileRoute('/_auth/diplomes-eleves')({
    beforeLoad: () => requireModulePermission('diplomes-eleves'),
    component: DiplomesElevesLayout,
});

function DiplomesElevesLayout() {
    return <Outlet />;
}
