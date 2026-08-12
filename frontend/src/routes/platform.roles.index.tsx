/**
 * ==================================
 * eLISAschool - Platform Roles Index
 * ==================================
 * Page liste des rôles plateforme (système + personnalisés).
 * ADR-005 — Auth unifiée (source unique de vérité)
 */

import { createFileRoute } from '@tanstack/react-router';
import { PlatformRolesPage } from '@/features/platform/components/platform-roles-page';

export const Route = createFileRoute('/platform/roles/')({
    component: PlatformRolesPage,
});

export default PlatformRolesPage;
