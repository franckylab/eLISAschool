/**
 * ==================================
 * eLISAschool - Route Édition/Configuration Établissement
 * ==================================
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { EtablissementEditPage } from '@/features/etablissement/components/etablissement-edit-page';

export const Route = createFileRoute('/_auth/etablissements/$id')({
    beforeLoad: () => requireModulePermission('etablissements'),
    component: EtablissementEditPage,
});
