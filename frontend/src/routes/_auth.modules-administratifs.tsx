/**
 * ==================================
 * eLISAschool - Routes Modules Administratifs
 * ==================================
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireRole } from '@/app/permission-guards';

function ModulesAdministratifs() {
    return null;
}

export const Route = createFileRoute('/_auth/modules-administratifs')({
    beforeLoad: () => requireRole(['ADMIN', 'SUPER_ADMIN']),
    component: ModulesAdministratifs,
});
