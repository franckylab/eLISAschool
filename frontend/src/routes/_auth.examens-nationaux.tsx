/**
 * ==================================
 * eLISAschool - Route Examens Nationaux (Layout)
 * ==================================
 * Route layout pour la liste et les détails des examens nationaux
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { ModuleLayout } from '@/components/layout/ModuleLayout';

export const Route = createFileRoute('/_auth/examens-nationaux')({
    beforeLoad: () => requireModulePermission('examens-nationaux'),
    component: () => <ModuleLayout />,
});
