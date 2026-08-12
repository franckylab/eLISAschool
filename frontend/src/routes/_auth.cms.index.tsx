/**
 * ==================================
 * eLISAschool - CMS Dashboard Route
 * ==================================
 * Route: /_auth/cms (index)
 */

import { createFileRoute } from '@tanstack/react-router';
import { CmsDashboard } from '@/features/cms/components/CmsDashboard';

export const Route = createFileRoute('/_auth/cms/')({
    component: () => <CmsDashboard />,
});
