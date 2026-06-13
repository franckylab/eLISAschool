/**
 * ==================================
 * eLISAschool - Route Compétences
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { CompetencesPage } from '@/features/competences';

export const Route = createFileRoute('/_auth/competences')({
    beforeLoad: () => requireModulePermission('competences'),
    component: () => <CompetencesPage />,
});
