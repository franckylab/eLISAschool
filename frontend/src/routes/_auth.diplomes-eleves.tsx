/**
 * ==================================
 * eLISAschool - Route Diplômes Élèves (Layout)
 * ==================================
 * Route layout pour la liste et les détails des diplômes élèves
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { ModuleLayout } from '@/components/layout/ModuleLayout';

export const Route = createFileRoute('/_auth/diplomes-eleves')({
    beforeLoad: () => requireModulePermission('diplomes-eleves'),
    component: () => <ModuleLayout />,
});
