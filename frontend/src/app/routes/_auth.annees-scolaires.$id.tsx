/**
 * ==================================
 * eLISAschool - Route Détail Année Scolaire
 * ==================================
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { AnneeScolaireDetailPage } from '@/features/annees-scolaires/components/annee-scolaire-detail-page';

export const Route = createFileRoute('/_auth/annees-scolaires/$id')({
    beforeLoad: () => requireModulePermission('annees-scolaires'),
    component: AnneeScolaireDetailPage,
});
