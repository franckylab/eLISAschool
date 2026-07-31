/**
 * ==================================
 * eLISAschool - Route Périodes (Layout)
 * ==================================
 * Route layout pour la liste et les détails de périodes
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { ModuleLayout } from '@/components/layout/ModuleLayout';

export const Route = createFileRoute('/_auth/periodes')({
    beforeLoad: () => requireModulePermission('periodes'),
    component: () => <ModuleLayout />,
});
