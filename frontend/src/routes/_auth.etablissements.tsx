/**
 * ==================================
 * eLISAschool - Route Établissements (Layout)
 * ==================================
 * Route layout pour la liste et les détails d'établissements
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { ModuleLayout } from '@/components/layout/ModuleLayout';

export const Route = createFileRoute('/_auth/etablissements')({
    beforeLoad: () => requireModulePermission('etablissements'),
    component: () => <ModuleLayout />,
});
