/**
 * ==================================
 * eLISAschool - Route Revenus (REDIRECTION)
 * ==================================
 * Refonte SaaS v9.1 — Consolidation
 * Redirigé vers /platform/facturation (onglet Revenus intégré).
 */

import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/platform/revenus')({
    beforeLoad: () => {
        throw redirect({ to: '/platform/facturation' });
    },
});
