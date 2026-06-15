/**
 * ==================================
 * eLISAschool - Route Salles (Liste)
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { SallesPage } from '@/features/salles';

export const Route = createFileRoute('/_auth/salles')({
    beforeLoad: () => requireModulePermission('salles'),
    component: SallesPage,
});
