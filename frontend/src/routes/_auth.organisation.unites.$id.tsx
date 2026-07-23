import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { UniteDetailPage } from '@/features/organisation/components/unite-detail-page';

export const Route = createFileRoute('/_auth/organisation/unites/$id')({
    beforeLoad: () => requireModulePermission('organisation'),
    component: UniteDetailPage,
});
