/**
 * ==================================
 * eLISAschool - Route Compétences (Layout)
 * ==================================
 * Route layout pour la liste et les détails des compétences
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { ModuleLayout } from '@/components/layout/ModuleLayout';

export const Route = createFileRoute('/_auth/competences')({
    beforeLoad: () => requireModulePermission('competences'),
    component: () => <ModuleLayout />,
});
