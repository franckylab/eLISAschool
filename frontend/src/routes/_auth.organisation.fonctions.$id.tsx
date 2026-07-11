import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { FonctionDetailPage } from '@/features/fonctions';

export const Route = createFileRoute('/_auth/organisation/fonctions/$id')({
    beforeLoad: () => requireModulePermission('fonctions'),
    component: FonctionDetailPage,
});
