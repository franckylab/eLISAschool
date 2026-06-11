/**
 * ==================================
 * eLISAschool - Route Classes
 * ==================================
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { ClassesPage } from '@/features/classes/components/classes-page';

export const Route = createFileRoute('/_auth/classes')({
    beforeLoad: () => requireModulePermission('classes'),
    component: ClassesPage,
});
