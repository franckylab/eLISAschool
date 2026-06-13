/**
 * ==================================
 * eLISAschool - Route Années Scolaires
 * ==================================
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { AnneesScolairesPage } from '@/features/annees-scolaires/components/annees-scolaires-page';

export const Route = createFileRoute('/_auth/annees-scolaires')({
    beforeLoad: () => requireModulePermission('annees-scolaires'),
    component: AnneesScolairesPage,
});
