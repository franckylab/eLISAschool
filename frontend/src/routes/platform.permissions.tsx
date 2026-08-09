/**
 * ==================================
 * eLISAschool - Platform Permissions
 * ==================================
 * Page plateforme — Matrice des permissions plateforme (Dual-Plane).
 * Modèle C — Auth0 Internalisé
 */

import { createFileRoute } from '@tanstack/react-router';
import PlatformPermissionsMatrixPage from '@/features/platform/components/platform-permissions-matrix';

function PlatformPermissionsPage() {
    return (
        <div className="p-[var(--space-lg)]">
            <PlatformPermissionsMatrixPage />
        </div>
    );
}

export const Route = createFileRoute('/platform/permissions')({
    component: PlatformPermissionsPage,
});

export default PlatformPermissionsPage;