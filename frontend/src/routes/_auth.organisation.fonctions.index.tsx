import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { FonctionsPage } from '@/features/fonctions';

export const Route = createFileRoute('/_auth/organisation/fonctions/')({
    beforeLoad: () => requireModulePermission('fonctions'),
    component: FonctionsPage,
});
