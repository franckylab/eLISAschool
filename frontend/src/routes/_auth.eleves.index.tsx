/**
 * ==================================
 * eLISAschool - Route Index Élèves
 * ==================================
 * Affiche la liste des élèves par défaut sur /eleves
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { ElevesPage } from '@/features/eleves/components/eleves-page';

export const Route = createFileRoute('/_auth/eleves/')({
    beforeLoad: () => requireModulePermission('eleves'),
    component: ElevesPage,
});
