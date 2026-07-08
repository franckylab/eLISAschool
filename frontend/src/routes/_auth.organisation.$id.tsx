import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { OrganisationDetailPage } from '@/features/organisation/components/organisation-detail-page';

export const Route = createFileRoute('/_auth/organisation/$id')({
    beforeLoad: () => requireModulePermission('organisation'),
    component: OrganisationDetailPage,
});
