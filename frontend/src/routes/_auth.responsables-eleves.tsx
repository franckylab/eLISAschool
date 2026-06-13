/**
 * ==================================
 * eLISAschool - Route Responsables Élèves
 * ==================================
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { ResponsablesElevesPage } from '@/features/responsables-eleves';

export const Route = createFileRoute('/_auth/responsables-eleves')({
    beforeLoad: () => requireModulePermission('responsables-eleves'),
    component: () => <ResponsablesElevesPage />,
});
