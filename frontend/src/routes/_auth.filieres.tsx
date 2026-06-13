/**
 * ==================================
 * eLISAschool - Route Filières
 * ==================================
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { FilieresPage } from '@/features/filieres';

export const Route = createFileRoute('/_auth/filieres')({
    beforeLoad: () => requireModulePermission('filieres'),
    component: () => <FilieresPage />,
});
