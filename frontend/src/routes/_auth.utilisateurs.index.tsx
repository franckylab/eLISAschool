/**
 * ==================================
 * eLISAschool - Route Index Utilisateurs
 * ==================================
 * Affiche la liste des utilisateurs par défaut sur /utilisateurs
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { UtilisateursPage } from '@/features/utilisateurs/components/utilisateurs-page';

export const Route = createFileRoute('/_auth/utilisateurs/')({
    beforeLoad: () => requireModulePermission('utilisateurs'),
    component: UtilisateursPage,
});
