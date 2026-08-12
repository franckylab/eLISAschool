/**
 * ==================================
 * eLISAschool - Route Platform Établissements Détail
 * ==================================
 * Page plateforme — Détail établissement.
 * Refonte SaaS v2 — page détail avec 4 onglets
 */

import { createFileRoute } from '@tanstack/react-router';
import { PlatformEtablissementDetailPage } from '@/features/platform/components/platform-etablissement-detail-page';

export const Route = createFileRoute('/platform/etablissements/$id')({
    validateSearch: (search: Record<string, unknown>) => ({
        tab: (search.tab as string) || 'identite',
    }),
    component: PlatformEtablissementDetailPage,
});

export default PlatformEtablissementDetailPage;
