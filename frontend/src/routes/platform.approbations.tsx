/**
 * ==================================
 * eLISAschool - Platform Approbations
 * ==================================
 * Page plateforme — Workflow d'approbation 2F pour actions critiques.
 *
 * Lot F — Refonte SaaS v7
 */

import { createFileRoute } from '@tanstack/react-router';
import ApprobationsPage from '@/features/platform/components/approbations-page';

function PlatformApprobationsPage() {
    return (
        <div className="p-[var(--space-lg)]">
            <ApprobationsPage />
        </div>
    );
}

export const Route = createFileRoute('/platform/approbations')({
    component: PlatformApprobationsPage,
});

export default PlatformApprobationsPage;
