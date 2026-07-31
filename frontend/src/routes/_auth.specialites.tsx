/**
 * ==================================
 * eLISAschool - Route Spécialités (Layout)
 * ==================================
 * Route layout pour la liste et les détails des spécialités
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { ModuleLayout } from '@/components/layout/ModuleLayout';

export const Route = createFileRoute('/_auth/specialites')({
    beforeLoad: () => requireModulePermission('specialites'),
    component: () => <ModuleLayout />,
});
