/**
 * ==================================
 * eLISAschool - Route Index Salles
 * ==================================
 * Affiche la liste des salles par défaut sur /salles
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { SallesPage } from '@/features/salles';

export const Route = createFileRoute('/_auth/salles/')({
    beforeLoad: () => requireModulePermission('salles'),
    component: SallesPage,
});
