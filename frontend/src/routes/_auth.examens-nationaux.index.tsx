/**
 * ==================================
 * eLISAschool - Route Index Examens Nationaux
 * ==================================
 * Affiche la liste des examens nationaux par défaut sur /examens-nationaux
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { ExamensNationauxPage } from '@/features/examens-nationaux';

export const Route = createFileRoute('/_auth/examens-nationaux/')({
    beforeLoad: () => requireModulePermission('examens-nationaux'),
    component: ExamensNationauxPage,
});
