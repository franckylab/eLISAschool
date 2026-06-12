/**
 * ==================================
 * eLISAschool - Route Programmes Pédagogiques
 * ==================================
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { ProgrammesPage } from '@/features/programmes';

export const Route = createFileRoute('/_auth/programmes')({
    beforeLoad: () => requireModulePermission('programmes'),
    component: () => <ProgrammesPage />,
});
