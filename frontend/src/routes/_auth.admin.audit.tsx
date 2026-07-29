import { createFileRoute } from '@tanstack/react-router';
import { requireRole } from '@/app/permission-guards';
import { AuditPage } from '@/features/admin/components/audit-page';

export const Route = createFileRoute('/_auth/admin/audit')({
    beforeLoad: () => requireRole(['SUPER_ADMIN', 'ADMIN']),
    component: AuditPage,
});
