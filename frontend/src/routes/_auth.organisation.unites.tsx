import { createFileRoute } from '@tanstack/react-router';
import { requirePermission } from '@/app/permission-guards';
import { ModuleLayout } from '@/components/layout/ModuleLayout';

export const Route = createFileRoute('/_auth/organisation/unites')({
    beforeLoad: () => requirePermission('organisation:unites:read'),
    component: () => <ModuleLayout />,
});
