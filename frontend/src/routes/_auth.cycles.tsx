/**
 * ==================================
 * eLISAschool - Route Cycles (Layout)
 * ==================================
 * Route layout pour la liste et les détails des cycles
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { ModuleLayout } from '@/components/layout/ModuleLayout';

export const Route = createFileRoute('/_auth/cycles')({
    beforeLoad: () => requireModulePermission('cycles'),
    component: () => <ModuleLayout />,
});
