/**
 * ==================================
 * eLISAschool - Route Détail Spécialité
 * ==================================
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { SpecialiteDetailPage } from '@/features/specialites';

export const Route = createFileRoute('/_auth/specialites/$id')({
    beforeLoad: () => requireModulePermission('specialites'),
    component: SpecialiteDetailPage,
});
