/**
 * ==================================
 * eLISAschool - Route Types de Cycles
 * ==================================
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { TypesCyclesPage } from '@/features/types-cycles';

export const Route = createFileRoute('/_auth/types-cycles')({
    beforeLoad: () => requireModulePermission('types-cycles'),
    component: () => <TypesCyclesPage />,
});
