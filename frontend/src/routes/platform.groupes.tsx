/**
 * ==================================
 * eLISAschool - Platform Groupes SaaS
 * ==================================
 * Page plateforme — Groupes d'établissements (organisation SaaS).
 * v2.0 — ModuleLayout + guard rôles plateforme (cohérence etablissements).
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireRole } from '@/app/permission-guards';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { useCurrentBreadcrumbLabel } from '@/components/navigation/breadcrumb-context';
import GroupesSaaSPage from '@/features/platform/components/groupes-saas-page';

/** Rôles plateforme ayant accès au Control Plane */
const ROLES_PLATEFORME = [
    'SUPER_ADMIN',
    'PLATEFORME_ADMIN',
    'PLATEFORME_SUPPORT',
    'PLATEFORME_BILLING',
    'PLATEFORME_ANALYST',
    'PLATEFORME_AUDITOR',
];

function PlatformGroupesPage() {
    const currentLabel = useCurrentBreadcrumbLabel();
    return (
        <ModuleLayout animationKey={currentLabel || 'groupes'}>
            <div className="p-[clamp(1rem,2vw,1.5rem)]">
                <GroupesSaaSPage />
            </div>
        </ModuleLayout>
    );
}

export const Route = createFileRoute('/platform/groupes')({
    beforeLoad: () => requireRole(ROLES_PLATEFORME),
    component: PlatformGroupesPage,
});

export default PlatformGroupesPage;
