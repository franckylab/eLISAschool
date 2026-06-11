/**
 * ==================================
 * eLISAschool - Route Utilisateurs
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { UtilisateursPage } from '@/features/utilisateurs/components/utilisateurs-page';

export const Route = createFileRoute('/_auth/utilisateurs')({
    beforeLoad: () => requireModulePermission('utilisateurs'),
    component: UtilisateursPage,
});
