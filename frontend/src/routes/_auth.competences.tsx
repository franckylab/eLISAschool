/**
 * ==================================
 * eLISAschool - Route Compétences (Layout)
 * ==================================
 * Route layout pour la liste et les détails des compétences
 */

import { createFileRoute, Outlet } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';

export const Route = createFileRoute('/_auth/competences')({
    beforeLoad: () => requireModulePermission('competences'),
    component: CompetencesLayout,
});

function CompetencesLayout() {
    return <Outlet />;
}
