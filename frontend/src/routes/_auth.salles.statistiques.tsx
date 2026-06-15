/**
 * ==================================
 * eLISAschool - Route Statistiques Salles
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { SallesStatistiquesPage } from '@/features/salles';

export const Route = createFileRoute('/_auth/salles/statistiques')({
    beforeLoad: () => requireModulePermission('salles'),
    component: SallesStatistiquesPage,
});
