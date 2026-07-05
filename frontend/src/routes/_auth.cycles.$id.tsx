/**
 * ==================================
 * eLISAschool - Route Détail Cycle
 * ==================================
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { CycleDetailPage } from '@/features/cycles';

export const Route = createFileRoute('/_auth/cycles/$id')({
    beforeLoad: () => requireModulePermission('cycles'),
    component: CycleDetailPage,
});
