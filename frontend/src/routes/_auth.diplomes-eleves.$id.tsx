/**
 * ==================================
 * eLISAschool - Route Détail Diplôme Élève
 * ==================================
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { DiplomeEleveDetailPage } from '@/features/diplomes-eleves';

export const Route = createFileRoute('/_auth/diplomes-eleves/$id')({
    beforeLoad: () => requireModulePermission('diplomes-eleves'),
    component: DiplomeEleveDetailPage,
});
