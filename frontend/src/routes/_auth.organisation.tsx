import { createFileRoute, Outlet } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';

export const Route = createFileRoute('/_auth/organisation')({
    beforeLoad: () => requireModulePermission('organisation'),
    component: OrganisationLayout,
});

function OrganisationLayout() {
    return <Outlet />;
}
