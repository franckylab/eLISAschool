/**
 * ==================================
 * eLISAschool - Route Index Établissements
 * ==================================
 * Affiche la liste des établissements par défaut sur /etablissements
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { EtablissementsPage } from '@/features/etablissement/components/etablissements-page';

export const Route = createFileRoute('/_auth/etablissements/')({
    beforeLoad: () => requireModulePermission('etablissements'),
    component: EtablissementsPage,
});
