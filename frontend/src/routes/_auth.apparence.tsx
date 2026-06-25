/**
 * ==================================
 * eLISAschool - Route Apparence (Fonds d'écran)
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireRole } from '@/app/permission-guards';
import { ApparencePage } from '@/features/apparence/ApparencePage';

export const Route = createFileRoute('/_auth/apparence')({
    beforeLoad: () => requireRole(['ADMIN', 'SUPER_ADMIN', 'CHEF_ETABLISSEMENT']),
    component: ApparencePage,
});
