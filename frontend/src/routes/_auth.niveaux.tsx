/**
 * ==================================
 * eLISAschool - Route Niveaux (Layout)
 * ==================================
 * Route layout pour la liste et les détails des niveaux
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { ModuleLayout } from '@/components/layout/ModuleLayout';

export const Route = createFileRoute('/_auth/niveaux')({
    beforeLoad: () => requireModulePermission('niveaux'),
    component: () => <ModuleLayout />,
});
