/**
 * ==================================
 * eLISAschool - Route Finances
 * ==================================
 */

import { createFileRoute } from '@tanstack/react-router';
import { FinancesPage } from '@/features/finances';

export const Route = createFileRoute('/_auth/finances')({
    component: FinancesPage,
});
