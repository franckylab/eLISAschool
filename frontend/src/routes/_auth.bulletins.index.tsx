import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { BulletinsPage } from '@/features/bulletins';

export const Route = createFileRoute('/_auth/bulletins/')({
    beforeLoad: () => requireModulePermission('bulletins'),
    component: BulletinsPage,
});