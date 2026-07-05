import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { EnseignantDetailPage } from '@/features/enseignants/components/enseignant-detail-page';

export const Route = createFileRoute('/_auth/enseignants/$id')({
    beforeLoad: () => requireModulePermission('personnel'),
    component: EnseignantDetailPage,
});
