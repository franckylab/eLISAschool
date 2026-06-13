/**
 * ==================================
 * eLISAschool - Route Paramètres Système
 * ==================================
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { ParametresPage } from '@/features/parametres/ParametresPage';

export const Route = createFileRoute('/_auth/parametres')({
    beforeLoad: () => requireModulePermission('parametres'),
    component: ParametresPage,
});
