import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { ResponsableEleveDetailPage } from '@/features/responsables-eleves/components/responsable-eleve-detail-page';

export const Route = createFileRoute('/_auth/responsables-eleves/$id')({
    beforeLoad: () => requireModulePermission('responsables-eleves'),
    component: ResponsableEleveDetailPage,
});
