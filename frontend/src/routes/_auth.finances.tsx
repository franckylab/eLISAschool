/**
 * ==================================
 * eLISAschool - Route Finances
 * ==================================
 * [FE-2] Ajout guard avantLoad — Rapport audit SaaS 2026-08-07
 */

import { createFileRoute } from '@tanstack/react-router';
import { FinancesPage } from '@/features/finances';
import { requireModulePermission } from '@/app/permission-guards';

export const Route = createFileRoute('/_auth/finances')({
    beforeLoad: () => requireModulePermission('finances'),
    component: FinancesPage,
});
