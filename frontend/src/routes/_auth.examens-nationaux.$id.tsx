/**
 * ==================================
 * eLISAschool - Route Détail Examen National
 * ==================================
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { ExamenNationalDetailPage } from '@/features/examens-nationaux';

export const Route = createFileRoute('/_auth/examens-nationaux/$id')({
    beforeLoad: () => requireModulePermission('examens-nationaux'),
    component: ExamenNationalDetailPage,
});
