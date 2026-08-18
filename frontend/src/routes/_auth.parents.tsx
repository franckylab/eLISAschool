/**
 * ==================================
 * eLISAschool - Route Parents (Module Parents)
 * ==================================
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { ParentsPage } from '@/features/parents';

export const Route = createFileRoute('/_auth/parents')({
    beforeLoad: () => requireModulePermission('parents'),
    component: () => <ParentsPage />,
});
