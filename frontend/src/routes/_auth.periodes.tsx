/**
 * ==================================
 * eLISAschool - Route Périodes
 * ==================================
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { PeriodesPage } from '@/features/periodes';

export const Route = createFileRoute('/_auth/periodes')({
    beforeLoad: () => requireModulePermission('periodes'),
    component: () => <PeriodesPage />,
});
