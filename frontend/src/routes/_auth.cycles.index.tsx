/**
 * ==================================
 * eLISAschool - Route Index Cycles
 * ==================================
 * Affiche la liste des cycles par défaut sur /cycles
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { CyclesPage } from '@/features/cycles/components/cycles-page';

export const Route = createFileRoute('/_auth/cycles/')({
    beforeLoad: () => requireModulePermission('cycles'),
    component: CyclesPage,
});
