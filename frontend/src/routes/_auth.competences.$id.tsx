/**
 * ==================================
 * eLISAschool - Route Détail Compétence
 * ==================================
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { CompetenceDetailPage } from '@/features/competences';

export const Route = createFileRoute('/_auth/competences/$id')({
    beforeLoad: () => requireModulePermission('competences'),
    component: CompetenceDetailPage,
});
