/**
 * ==================================
 * eLISAschool - Route Platform Établissements
 * ==================================
 * Layout ModuleLayout + guard SUPER_ADMIN.
 * Outlet pour index/$id.
 * Refonte SaaS v2 — page détail établissement
 */

import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { requireRole } from '@/app/permission-guards';
import { useCurrentBreadcrumbLabel } from '@/components/navigation/breadcrumb-context';
import { ModuleLayout } from '@/components/layout/ModuleLayout';

/** Rôles plateforme ayant accès au Control Plane */
const ROLES_PLATEFORME = [
    'SUPER_ADMIN',
    'PLATEFORME_ADMIN',
    'PLATEFORME_SUPPORT',
    'PLATEFORME_BILLING',
    'PLATEFORME_ANALYST',
    'PLATEFORME_AUDITOR',
];

function PlatformEtablissementsLayout() {
    const { t } = useTranslation('admin');
    const navigate = useNavigate();
    const currentLabel = useCurrentBreadcrumbLabel();

    return (
        <ModuleLayout animationKey={currentLabel || 'etablissements'}>
            <div className="space-y-4">
                <div className="flex items-center gap-3 px-6 pt-4">
                    <button
                        onClick={() => navigate({ to: '/platform/dashboard' })}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
                    >
                        <ArrowLeft className="h-4 w-4 shrink-0" />
                        <span className="hidden sm:inline">{t('platformEtablissements.retourDashboard', 'Retour')}</span>
                    </button>
                </div>
                <Outlet />
            </div>
        </ModuleLayout>
    );
}

export const Route = createFileRoute('/platform/etablissements')({
    beforeLoad: () => requireRole(ROLES_PLATEFORME),
    component: PlatformEtablissementsLayout,
});

export default PlatformEtablissementsLayout;
