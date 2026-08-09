/**
 * ==================================
 * eLISAschool - Route Platform Roles
 * ==================================
 * Page plateforme — Gestion des rôles et permissions plateforme.
 * Modèle C — Auth0 Internalisé (Dual-Plane)
 */

import { createFileRoute } from '@tanstack/react-router';
import { RoleBuilderPage } from '@/features/admin/components/role-builder-page';

function PlatformRolesLayout() {
    return (
        <div className="p-[var(--space-lg)]">
            <RoleBuilderPage />
        </div>
    );
}

export const Route = createFileRoute('/platform/roles')({
    component: PlatformRolesLayout,
});

export default PlatformRolesLayout;
