import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { ProgrammeDetailPage } from '@/features/programmes/components/programme-detail-page';

export const Route = createFileRoute('/_auth/programmes/$id')({
    beforeLoad: () => requireModulePermission('programmes'),
    component: ProgrammeDetailPage,
});
