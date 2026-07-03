import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { SalleDetailPage } from '@/features/salles';

export const Route = createFileRoute('/_auth/salles/$salleId')({
    beforeLoad: () => requireModulePermission('salles'),
    component: SalleDetailPage,
});
