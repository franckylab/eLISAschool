/**
 * ==================================
 * eLISAschool - Route Détail Utilisateur
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { UtilisateurDetailPage } from '@/features/utilisateurs/components/utilisateur-detail-page';

export const Route = createFileRoute('/_auth/utilisateurs/$id')({
    validateSearch: (search) => ({
        tab: (search as Record<string, string>).tab || 'informations',
    }),
    beforeLoad: () => requireModulePermission('utilisateurs'),
    component: UtilisateurDetailPage,
});
