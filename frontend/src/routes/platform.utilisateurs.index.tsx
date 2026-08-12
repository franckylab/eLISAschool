/**
 * ==================================
 * eLISAschool - Route Index Platform Utilisateurs
 * ==================================
 * Page liste des utilisateurs plateforme.
 * ADR-005 — Auth unifiée (source unique de vérité)
 */

import { createFileRoute } from '@tanstack/react-router';
import { PlatformUsersPage } from '@/features/platform/components/platform-users-page';

export const Route = createFileRoute('/platform/utilisateurs/')({
    component: PlatformUsersPage,
});

export default PlatformUsersPage;
