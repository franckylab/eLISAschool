/**
 * ==================================
 * eLISAschool - Platform Providers
 * ==================================
 * Page plateforme — Gestion des providers de paiement
 * CRUD, test connexion, assignments.
 *
 * Lot D — Refonte SaaS v7
 */

import { createFileRoute } from '@tanstack/react-router';
import ProvidersPaiementPage from '@/features/admin/components/providers-paiement-page';

function PlatformProvidersPage() {
    return (
        <div className="p-[var(--space-lg)]">
            <ProvidersPaiementPage />
        </div>
    );
}

export const Route = createFileRoute('/platform/providers')({
    component: PlatformProvidersPage,
});

export default PlatformProvidersPage;
