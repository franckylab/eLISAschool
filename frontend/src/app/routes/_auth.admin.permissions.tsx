/**
 * ==================================
 * eLISAschool - Route Admin Matrice Permissions
 * ==================================
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireRole } from '@/app/permission-guards';
import { AdminPermissionsMatrixPage } from '@/features/admin/components/admin-permissions-matrix';

export const Route = createFileRoute('/_auth/admin/permissions')({
    beforeLoad: () => requireRole(['SUPER_ADMIN', 'ADMIN']),
    component: AdminPermissionsMatrixPage,
});

