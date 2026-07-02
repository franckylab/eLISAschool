/**
 * ==================================
 * eLISAschool - Route Détail Période
 * ==================================
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { PeriodeDetailPage } from '@/features/periodes/components/periode-detail-page';

export const Route = createFileRoute('/_auth/periodes/$id')({
    beforeLoad: () => requireModulePermission('periodes'),
    component: PeriodeDetailPage,
});
