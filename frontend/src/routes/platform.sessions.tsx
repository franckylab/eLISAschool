/**
 * ==================================
 * eLISAschool - Route Platform Sessions
 * ==================================
 * Page plateforme — Sessions & Activité.
 * Modèle C — Auth0 Internalisé (Dual-Plane)
 */

import { createFileRoute } from '@tanstack/react-router';
import PlatformSessionsPage from '@/features/platform/components/platform-sessions-page';

function PlatformSessionsRoute() {
    return (
        <div className="p-[var(--space-lg)]">
            <PlatformSessionsPage />
        </div>
    );
}

export const Route = createFileRoute('/platform/sessions')({
    component: PlatformSessionsRoute,
});

export default PlatformSessionsRoute;
