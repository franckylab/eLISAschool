import { createFileRoute } from '@tanstack/react-router';
import { requirePermission } from '@/app/permission-guards';
import { ModelesPage } from '@/features/organisation/components/modeles-page';

export const Route = createFileRoute('/_auth/organisation/modeles')({
    beforeLoad: () => requirePermission('organisation:templates:read'),
    component: ModelesPage,
});
