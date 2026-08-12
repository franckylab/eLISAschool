/**
 * ==================================
 * eLISAschool - Route Platform Utilisateurs Détail
 * ==================================
 * Page plateforme — Détail utilisateur plateforme.
 * ADR-005 — Auth unifiée (source unique de vérité)
 */

import { createFileRoute } from '@tanstack/react-router';
import { PlatformUserDetailPage } from '@/features/platform/components/platform-user-detail-page';

export const Route = createFileRoute('/platform/utilisateurs/$id')({
    validateSearch: (search: Record<string, unknown>) => ({
        tab: (search.tab as string) || 'informations',
    }),
    component: PlatformUserDetailPage,
});

export default PlatformUserDetailPage;
