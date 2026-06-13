/**
 * ==================================
 * eLISAschool - Route Examens Nationaux
 * ==================================
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { ExamensNationauxPage } from '@/features/examens-nationaux';

export const Route = createFileRoute('/_auth/examens-nationaux')({
    beforeLoad: () => requireModulePermission('examens-nationaux'),
    component: () => <ExamensNationauxPage />,
});
