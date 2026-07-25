import { createFileRoute } from '@tanstack/react-router';
import { requirePermission } from '@/app/permission-guards';
import { OrganigrammePage } from '@/features/organisation/components/organigramme/OrganigrammePage';

export const Route = createFileRoute('/_auth/organisation/')({
    beforeLoad: () => requirePermission('organisation:organigramme:read'),
    component: OrganigrammePage,
});
