/**
 * ==================================
 * eLISAschool - Route Classes (Layout)
 * ==================================
 * Route layout pour la liste et les détails de classes
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { ModuleLayout } from '@/components/layout/ModuleLayout';

export const Route = createFileRoute('/_auth/classes')({
    beforeLoad: () => requireModulePermission('classes'),
    component: () => <ModuleLayout />,
});
