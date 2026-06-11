/**
 * ==================================
 * eLISAschool - Route Détail Personnel
 * ==================================
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { PersonnelDetailPage } from '@/features/personnel/components/personnel-detail-page';

export const Route = createFileRoute('/_auth/personnel/$id')({
    beforeLoad: () => requireModulePermission('personnel'),
    component: PersonnelDetailPage,
});
