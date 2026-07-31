/**
 * ==================================
 * eLISAschool - Route Utilisateurs (Layout)
 * ==================================
 * Route layout pour la liste et les détails des utilisateurs
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { ModuleLayout } from '@/components/layout/ModuleLayout';

export const Route = createFileRoute('/_auth/utilisateurs')({
    beforeLoad: () => requireModulePermission('utilisateurs'),
    component: () => <ModuleLayout />,
});
