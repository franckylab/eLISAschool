/**
 * ==================================
 * eLISAschool - Route Détail Élève
 * ==================================
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { EleveDetailPage } from '@/features/eleves';

export const Route = createFileRoute('/_auth/eleves/$id')({
    beforeLoad: () => requireModulePermission('eleves'),
    component: EleveDetailPage,
});
