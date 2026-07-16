import { createFileRoute } from '@tanstack/react-router';
import { requireRole } from '@/app/permission-guards';
import { RoleDetailPage } from '@/features/utilisateurs/components/role-detail-page';

export const Route = createFileRoute('/_auth/admin/roles/$id')({
    beforeLoad: () => requireRole(['SUPER_ADMIN', 'ADMIN']),
    component: RoleDetailPage,
});
