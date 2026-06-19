/**
 * ==================================
 * eLISAschool - Route Établissements (Layout)
 * ==================================
 * Route layout pour la liste et les détails d'établissements
 */

import { createFileRoute, Outlet } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';

export const Route = createFileRoute('/_auth/etablissements')({
    beforeLoad: () => requireModulePermission('etablissements'),
    component: EtablissementsLayout,
});

function EtablissementsLayout() {
    return <Outlet />;
}
