import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { PosteDetailPage } from '@/features/postes';

export const Route = createFileRoute('/_auth/organisation/postes/$id')({
    beforeLoad: () => requireModulePermission('postes'),
    component: PosteDetailPage,
});
