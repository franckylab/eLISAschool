/**
 * ==================================
 * eLISAschool - Route Personnel
 * ==================================
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { PersonnelPage } from '@/features/personnel/components/personnel-page';

export const Route = createFileRoute('/_auth/personnel')({
    beforeLoad: () => requireModulePermission('personnel'),
    component: PersonnelPage,
});
