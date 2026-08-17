/**
 * ==================================
 * eLISAschool - Platform Groupes SaaS
 * ==================================
 * Page plateforme — Groupes d'établissements (organisation SaaS).
 *
 * V2 — Panel Admin Enterprise (Lot C v7 : Groupes SaaS)
 */

import { createFileRoute } from '@tanstack/react-router';
import GroupesSaaSPage from '@/features/platform/components/groupes-saas-page';

function PlatformGroupesPage() {
    return (
        <div className="p-[var(--space-lg)]">
            <GroupesSaaSPage />
        </div>
    );
}

export const Route = createFileRoute('/platform/groupes')({
    component: PlatformGroupesPage,
});

export default PlatformGroupesPage;