/**
 * ==================================
 * eLISAschool - Route Matières (Layout)
 * ==================================
 * Route layout pour la liste et les détails des matières
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { ModuleLayout } from '@/components/layout/ModuleLayout';

export const Route = createFileRoute('/_auth/matieres')({
    beforeLoad: () => requireModulePermission('matieres'),
    component: () => <ModuleLayout />,
});
