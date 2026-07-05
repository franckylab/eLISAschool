/**
 * ==================================
 * eLISAschool - Route Détail Niveau
 * ==================================
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { NiveauDetailPage } from '@/features/niveaux';

export const Route = createFileRoute('/_auth/niveaux/$id')({
    beforeLoad: () => requireModulePermission('niveaux'),
    component: NiveauDetailPage,
});
