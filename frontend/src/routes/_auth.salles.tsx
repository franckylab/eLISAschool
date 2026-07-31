/**
 * ==================================
 * eLISAschool - Route Salles (Layout)
 * ==================================
 * Route layout pour la liste et les détails des salles
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { ModuleLayout } from '@/components/layout/ModuleLayout';

export const Route = createFileRoute('/_auth/salles')({
    beforeLoad: () => requireModulePermission('salles'),
    component: () => <ModuleLayout />,
});
