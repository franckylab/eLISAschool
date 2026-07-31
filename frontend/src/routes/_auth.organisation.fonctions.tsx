import { createFileRoute } from '@tanstack/react-router';
import { requirePermission } from '@/app/permission-guards';
import { ModuleLayout } from '@/components/layout/ModuleLayout';

export const Route = createFileRoute('/_auth/organisation/fonctions')({
    beforeLoad: () => requirePermission('organisation:fonctions:read'),
    component: () => <ModuleLayout />,
});
