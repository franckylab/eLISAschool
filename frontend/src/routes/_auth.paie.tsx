import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { PaiePage } from '@/features/paie';

export const Route = createFileRoute('/_auth/paie')({
    beforeLoad: () => requireModulePermission('paie'),
    component: PaiePage,
});
