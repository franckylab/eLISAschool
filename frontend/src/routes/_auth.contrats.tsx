import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { ContratsPage } from '@/features/contrats';

export const Route = createFileRoute('/_auth/contrats')({
    beforeLoad: () => requireModulePermission('contrats'),
    component: ContratsPage,
});
