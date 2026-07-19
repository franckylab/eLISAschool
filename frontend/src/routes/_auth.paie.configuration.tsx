import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { PaieConfigPage } from '@/features/paie';

export const Route = createFileRoute('/_auth/paie/configuration')({
    beforeLoad: () => requireModulePermission('paie'),
    component: PaieConfigPage,
});
