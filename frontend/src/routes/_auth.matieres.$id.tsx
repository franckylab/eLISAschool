/**
 * ==================================
 * eLISAschool - Route Détail Matière
 * ==================================
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { MatiereDetailPage } from '@/features/matieres/components/matiere-detail-page';

export const Route = createFileRoute('/_auth/matieres/$id')({
    beforeLoad: () => requireModulePermission('matieres'),
    component: MatiereDetailPage,
});
