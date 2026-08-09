/**
 * ==================================
 * eLISAschool - Platform Roles Index
 * ==================================
 * Page liste des rôles plateforme (système + personnalisés).
 * Modèle C — Auth0 Internalisé (Dual-Plane)
 */

import { createFileRoute } from '@tanstack/react-router';
import { RoleBuilderPage } from '@/features/admin/components/role-builder-page';

function PlatformRolesIndex() {
    return <RoleBuilderPage />;
}

export const Route = createFileRoute('/platform/roles/')({
    component: PlatformRolesIndex,
});

export default PlatformRolesIndex;
