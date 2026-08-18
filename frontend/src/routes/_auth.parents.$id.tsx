import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { ParentDetailPage } from '@/features/parents/components/parent-detail-page';

export const Route = createFileRoute('/_auth/parents/$id')({
    beforeLoad: () => requireModulePermission('parents'),
    component: ParentDetailPage,
});
