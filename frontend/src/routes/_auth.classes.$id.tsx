/**
 * ==================================
 * eLISAschool - Route Détail Classe
 * ==================================
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { ClasseDetailPage } from '@/features/classes/components/classe-detail-page';

export const Route = createFileRoute('/_auth/classes/$id')({
    beforeLoad: () => requireModulePermission('classes'),
    component: ClasseDetailPage,
});
