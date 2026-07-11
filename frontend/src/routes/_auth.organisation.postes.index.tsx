import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { PostesPage } from '@/features/postes';

export const Route = createFileRoute('/_auth/organisation/postes/')({
    beforeLoad: () => requireModulePermission('postes'),
    component: PostesPage,
});
