/**
 * ==================================
 * eLISAschool - Platform Utilisateurs
 * ==================================
 * Page plateforme — CRUD utilisateurs plateforme (comptes admin).
 *
 * V2.4 — Panel Admin Enterprise
 */

import { createFileRoute } from '@tanstack/react-router';
import PlatformUsersPage from '@/features/admin/components/platform-users-page';

function PlatformUtilisateursPage() {
    return (
        <div className="p-[var(--space-lg)]">
            <PlatformUsersPage />
        </div>
    );
}

export const Route = createFileRoute('/platform/utilisateurs')({
    component: PlatformUtilisateursPage,
});

export default PlatformUtilisateursPage;
