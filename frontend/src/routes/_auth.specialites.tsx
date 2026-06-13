/**
 * ==================================
 * eLISAschool - Route Spécialités
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { SpecialitesPage } from '@/features/specialites';

export const Route = createFileRoute('/_auth/specialites')({
    beforeLoad: () => requireModulePermission('specialites'),
    component: () => <SpecialitesPage />,
});
