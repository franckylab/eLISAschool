/**
 * ==================================
 * eLISAschool - Route Élèves (Layout)
 * ==================================
 * Route layout pour la liste et les détails des élèves
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { ModuleLayout } from '@/components/layout/ModuleLayout';

export const Route = createFileRoute('/_auth/eleves')({
    beforeLoad: () => requireModulePermission('eleves'),
    component: () => <ModuleLayout />,
});
