/**
 * ==================================
 * eLISAschool - Route Platform Groupes Détail
 * ==================================
 * Page plateforme — Détail groupe.
 * Miroir de platform.etablissements.$id.tsx
 */

import { createFileRoute } from '@tanstack/react-router';
import { PlatformGroupeDetailPage } from '@/features/platform/groupes/PlatformGroupeDetailPage';

export const Route = createFileRoute('/platform/groupes/$id')({
    validateSearch: (search: Record<string, unknown>) => ({
        tab: (search.tab as string) || 'membres',
    }),
    component: PlatformGroupeDetailPage,
});

export default PlatformGroupeDetailPage;
