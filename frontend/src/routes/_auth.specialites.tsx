/**
 * ==================================
 * eLISAschool - Route Spécialités (Layout)
 * ==================================
 * Route layout pour la liste et les détails des spécialités
 */

import { createFileRoute, Outlet } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';

export const Route = createFileRoute('/_auth/specialites')({
    beforeLoad: () => requireModulePermission('specialites'),
    component: SpecialitesLayout,
});

function SpecialitesLayout() {
    return <Outlet />;
}
