/**
 * ==================================
 * eLISAschool - Route Établissements
 * ==================================
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { EtablissementsPage } from '@/features/etablissements/components/etablissements-page';

export const Route = createFileRoute('/_auth/etablissements')({
    beforeLoad: () => requireModulePermission('etablissements'),
    component: EtablissementsPage,
});
