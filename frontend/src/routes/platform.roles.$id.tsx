/**
 * ==================================
 * eLISAschool - Platform Role Detail
 * ==================================
 * Détail d'un rôle plateforme — permissions, utilisateurs, audit.
 * ADR-005 — Auth unifiée (source unique de vérité)
 */

import { createFileRoute } from '@tanstack/react-router';
import { PlatformRoleDetailPage } from '@/features/platform/components/platform-role-detail-page';

export const Route = createFileRoute('/platform/roles/$id')({
    validateSearch: (search: Record<string, unknown>) => ({
        tab: (search.tab as string) || 'permissions',
    }),
    component: PlatformRoleDetailPage,
});

export default PlatformRoleDetailPage;
