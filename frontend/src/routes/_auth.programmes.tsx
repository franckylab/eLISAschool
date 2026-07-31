/**
 * ==================================
 * eLISAschool - Route Programmes Pédagogiques (Layout)
 * ==================================
 * Route layout pour la liste et les détails des programmes
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { ModuleLayout } from '@/components/layout/ModuleLayout';

export const Route = createFileRoute('/_auth/programmes')({
    beforeLoad: () => requireModulePermission('programmes'),
    component: () => <ModuleLayout />,
});
