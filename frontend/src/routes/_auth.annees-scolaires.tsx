/**
 * ==================================
 * eLISAschool - Route Années Scolaires (Layout)
 * ==================================
 * Route layout pour la liste et les détails d'années scolaires
 */

import { createFileRoute, Outlet } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';

export const Route = createFileRoute('/_auth/annees-scolaires')({
    beforeLoad: () => requireModulePermission('annees-scolaires'),
    component: AnneesScolairesLayout,
});

function AnneesScolairesLayout() {
    return <Outlet />;
}
