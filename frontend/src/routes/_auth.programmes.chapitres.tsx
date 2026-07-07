import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { ChapitresCataloguePage } from '@/features/programmes/components/chapitres-catalogue-page';

export const Route = createFileRoute('/_auth/programmes/chapitres')({
    beforeLoad: () => requireModulePermission('programmes'),
    component: ChapitresCataloguePage,
});
