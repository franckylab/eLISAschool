/**
 * ==================================
 * eLISAschool - Route Élèves
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { ElevesPage } from '@/features/eleves/components/eleves-page';

export const Route = createFileRoute('/_auth/eleves')({
    beforeLoad: () => requireModulePermission('eleves'),
    component: ElevesPage,
});
