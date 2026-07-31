/**
 * ==================================
 * eLISAschool - Route Bulletins Layout
 * ==================================
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { ModuleLayout } from '@/components/layout/ModuleLayout';

export const Route = createFileRoute('/_auth/bulletins')({
    beforeLoad: () => requireModulePermission('bulletins'),
    component: () => <ModuleLayout />,
});
