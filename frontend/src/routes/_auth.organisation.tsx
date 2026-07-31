import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { ModuleLayout } from '@/components/layout/ModuleLayout';

export const Route = createFileRoute('/_auth/organisation')({
    beforeLoad: () => requireModulePermission('organisation'),
    component: () => <ModuleLayout />,
});
