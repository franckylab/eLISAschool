/**
 * ==================================
 * eLISAschool - Route Transport
 * ==================================
 * [FE-2] Ajout guard avantLoad — Rapport audit SaaS 2026-08-07
 */

import { createFileRoute } from '@tanstack/react-router';
import { TransportPage } from '@/features/transport/components/transport-page';
import { requireModulePermission } from '@/app/permission-guards';

export const Route = createFileRoute('/_auth/transport')({
    beforeLoad: () => requireModulePermission('transport'),
    component: TransportPage,
});
