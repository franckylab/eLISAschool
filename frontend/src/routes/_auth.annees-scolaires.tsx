/**
 * ==================================
 * eLISAschool - Route Années Scolaires (Layout)
 * ==================================
 * Route layout pour la liste et les détails d'années scolaires
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { ModuleLayout } from '@/components/layout/ModuleLayout';

export const Route = createFileRoute('/_auth/annees-scolaires')({
    beforeLoad: () => requireModulePermission('annees'),
    component: () => <ModuleLayout />,
});
