import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { OrganisationPage } from '@/features/organisation/components/organisation-page';

export const Route = createFileRoute('/_auth/organisation/')({
    beforeLoad: () => requireModulePermission('organisation'),
    component: OrganisationPage,
});
