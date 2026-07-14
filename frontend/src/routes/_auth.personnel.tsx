import { createFileRoute, Outlet } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';

export const Route = createFileRoute('/_auth/personnel')({
    beforeLoad: () => requireModulePermission('personnel'),
    component: PersonnelLayout,

});

function PersonnelLayout() {
    return (
        <ErrorBoundary>
            <Outlet />
        </ErrorBoundary>
    );
}
