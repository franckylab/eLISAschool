/**
 * ==================================
 * eLISAschool - Route Index Compétences
 * ==================================
 * Affiche la liste des compétences par défaut sur /competences
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { CompetencesPage } from '@/features/competences';

export const Route = createFileRoute('/_auth/competences/')({
    beforeLoad: () => requireModulePermission('competences'),
    component: CompetencesPage,
});
