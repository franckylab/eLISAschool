/**
 * ==================================
 * eLISAschool - Route Groupes d'Établissements
 * ==================================
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { GroupesEtablissementsPage } from '@/features/groupes-etablissements';

export const Route = createFileRoute('/_auth/groupes-etablissements')({
    beforeLoad: () => requireModulePermission('groupes-etablissements'),
    component: () => <GroupesEtablissementsPage />,
});
