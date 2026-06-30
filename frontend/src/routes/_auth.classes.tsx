/**
 * ==================================
 * eLISAschool - Route Classes (Layout)
 * ==================================
 * Route layout pour la liste et les détails de classes
 */

import { createFileRoute, Outlet } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';

export const Route = createFileRoute('/_auth/classes')({
    beforeLoad: () => requireModulePermission('classes'),
    component: ClassesLayout,
});

function ClassesLayout() {
    return <Outlet />;
}
