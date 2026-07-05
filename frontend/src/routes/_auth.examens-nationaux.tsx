/**
 * ==================================
 * eLISAschool - Route Examens Nationaux (Layout)
 * ==================================
 * Route layout pour la liste et les détails des examens nationaux
 */

import { createFileRoute, Outlet } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';

export const Route = createFileRoute('/_auth/examens-nationaux')({
    beforeLoad: () => requireModulePermission('examens-nationaux'),
    component: ExamensNationauxLayout,
});

function ExamensNationauxLayout() {
    return <Outlet />;
}
