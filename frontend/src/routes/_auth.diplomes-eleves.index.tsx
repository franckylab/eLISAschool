/**
 * ==================================
 * eLISAschool - Route Index Diplômes Élèves
 * ==================================
 * Affiche la liste des diplômes élèves par défaut sur /diplomes-eleves
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { DiplomesElevesPage } from '@/features/diplomes-eleves';

export const Route = createFileRoute('/_auth/diplomes-eleves/')({
    beforeLoad: () => requireModulePermission('diplomes-eleves'),
    component: DiplomesElevesPage,
});
