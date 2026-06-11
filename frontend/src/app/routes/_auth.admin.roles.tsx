/**
 * ==================================
 * eLISAschool - Route Gestion des Rôles
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireRole } from '@/app/permission-guards';
import { RolesPage } from '@/features/utilisateurs/components/roles-page';

export const Route = createFileRoute('/_auth/admin/roles')({
    beforeLoad: () => requireRole(['SUPER_ADMIN', 'ADMIN']),
    component: RolesPage,
});
