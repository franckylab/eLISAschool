/**
 * ==================================
 * eLISAschool - Route Index Programmes
 * ==================================
 * Affiche la liste des programmes par défaut sur /programmes
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { ProgrammesPage } from '@/features/programmes';

export const Route = createFileRoute('/_auth/programmes/')({
    beforeLoad: () => requireModulePermission('programmes'),
    component: ProgrammesPage,
});
