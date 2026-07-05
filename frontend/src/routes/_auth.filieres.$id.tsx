/**
 * ==================================
 * eLISAschool - Route Détail Filière
 * ==================================
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { FiliereDetailPage } from '@/features/filieres';

export const Route = createFileRoute('/_auth/filieres/$id')({
    beforeLoad: () => requireModulePermission('filieres'),
    component: FiliereDetailPage,
});
