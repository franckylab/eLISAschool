/**
 * ==================================
 * eLISAschool - Route Index Spécialités
 * ==================================
 * Affiche la liste des spécialités par défaut sur /specialites
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { SpecialitesPage } from '@/features/specialites';

export const Route = createFileRoute('/_auth/specialites/')({
    beforeLoad: () => requireModulePermission('specialites'),
    component: SpecialitesPage,
});
