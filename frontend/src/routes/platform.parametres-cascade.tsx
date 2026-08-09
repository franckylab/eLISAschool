/**
 * ==================================
 * eLISAschool — Route Paramètres Cascade
 * ==================================
 * Page de gestion cascade multi-niveaux :
 * Système → Global → Groupe → Établissement
 * Phase V3.2 — Refonte Panel Admin
 */

import { createFileRoute } from '@tanstack/react-router';
import { ParametresCascadePage } from '@/features/admin/components/parametres-cascade-page';

function ParametresCascadeRoute() {
    return <ParametresCascadePage />;
}

export const Route = createFileRoute('/platform/parametres-cascade')({
    component: ParametresCascadeRoute,
});
