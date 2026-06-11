/**
 * ==================================
 * eLISAschool - Route Matières
 * ==================================
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { MatieresPage } from '@/features/matieres/components/matieres-page';

export const Route = createFileRoute('/_auth/matieres')({
    beforeLoad: () => requireModulePermission('matieres'),
    component: MatieresPage,
});
