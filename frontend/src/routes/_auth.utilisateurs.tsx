/**
 * ==================================
 * eLISAschool - Route Utilisateurs (Layout)
 * ==================================
 * Route layout pour la liste et les détails des utilisateurs
 */

import { createFileRoute, Outlet } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';

export const Route = createFileRoute('/_auth/utilisateurs')({
    beforeLoad: () => requireModulePermission('utilisateurs'),
    component: UtilisateursLayout,
});

function UtilisateursLayout() {
    return <Outlet />;
}
