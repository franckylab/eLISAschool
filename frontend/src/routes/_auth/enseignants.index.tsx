import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { EnseignantsPage } from '@/features/enseignants/components/enseignants-page';

export const Route = createFileRoute('/_auth/enseignants/')({
    beforeLoad: () => requireModulePermission('personnel'),
    component: EnseignantsPage,
});
