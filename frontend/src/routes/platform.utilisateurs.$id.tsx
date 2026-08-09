/**
 * ==================================
 * eLISAschool - Route Platform Utilisateurs Détail
 * ==================================
 * Page plateforme — Détail utilisateur plateforme.
 * Modèle C — Auth0 Internalisé (Dual-Plane)
 */

import { createFileRoute } from '@tanstack/react-router';
import PlatformUserDetailPage from '@/features/platform/components/platform-user-detail-page';

function PlatformUtilisateurDetailRoute() {
    return (
        <div className="p-[var(--space-lg)]">
            <PlatformUserDetailPage />
        </div>
    );
}

export const Route = createFileRoute('/platform/utilisateurs/$id')({
    component: PlatformUtilisateurDetailRoute,
});

export default PlatformUtilisateurDetailRoute;
