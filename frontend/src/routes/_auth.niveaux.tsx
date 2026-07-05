/**
 * ==================================
 * eLISAschool - Route Niveaux (Layout)
 * ==================================
 * Route layout pour la liste et les détails des niveaux
 */

import { createFileRoute, Outlet } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';

export const Route = createFileRoute('/_auth/niveaux')({
    beforeLoad: () => requireModulePermission('niveaux'),
    component: NiveauxLayout,
});

function NiveauxLayout() {
    return <Outlet />;
}
