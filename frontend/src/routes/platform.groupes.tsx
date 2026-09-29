/**
 * ==================================
 * eLISAschool - Platform Groupes SaaS
 * ==================================
 * Page plateforme — Groupes d'établissements (organisation SaaS).
 * v3.0 — Layout ModuleLayout + guard rôles plateforme + Outlet pour index + détail.
 */

import { createFileRoute, Outlet } from '@tanstack/react-router';
import { requireRole } from '@/app/permission-guards';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { useCurrentBreadcrumbLabel } from '@/components/navigation/breadcrumb-context';

/** Rôles plateforme ayant accès au Control Plane */
const ROLES_PLATEFORME = [
    'SUPER_ADMIN',
    'PLATEFORME_ADMIN',
    'PLATEFORME_SUPPORT',
    'PLATEFORME_BILLING',
    'PLATEFORME_ANALYST',
    'PLATEFORME_AUDITOR',
];

function PlatformGroupesLayout() {
    const currentLabel = useCurrentBreadcrumbLabel();
    return (
        <ModuleLayout animationKey={currentLabel || 'groupes'}>
            <Outlet />
        </ModuleLayout>
    );
}

export const Route = createFileRoute('/platform/groupes')({
    beforeLoad: () => requireRole(ROLES_PLATEFORME),
    component: PlatformGroupesLayout,
});

export default PlatformGroupesLayout;