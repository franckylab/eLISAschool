/**
 * ==================================
 * eLISAschool - Route Détail Établissement
 * ==================================
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { EtablissementDetailPage } from '@/features/etablissement/components/etablissement-detail-page';

export const Route = createFileRoute('/_auth/etablissements/$id')({
    beforeLoad: () => requireModulePermission('etablissements'),
    component: EtablissementDetailPage,
});
