/**
 * ==================================
 * eLISAschool - Route Notes Layout
 * ==================================
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { ModuleLayout } from '@/components/layout/ModuleLayout';

export const Route = createFileRoute('/_auth/notes')({
    beforeLoad: () => requireModulePermission('notes'),
    component: () => <ModuleLayout />,
});
