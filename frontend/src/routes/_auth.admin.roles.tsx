import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router';
import { requireRole } from '@/app/permission-guards';
import { ArrowLeft } from 'lucide-react';
import { useCurrentBreadcrumbLabel } from '@/components/navigation/breadcrumb-context';
import { useTranslation } from 'react-i18next';
import { ModuleLayout } from '@/components/layout/ModuleLayout';

export const Route = createFileRoute('/_auth/admin/roles')({
    beforeLoad: () => requireRole(['SUPER_ADMIN', 'ADMIN']),
    component: RolesLayout,
});

function RolesLayout() {
    const { t } = useTranslation('utilisateurs');
    const navigate = useNavigate();
    const currentLabel = useCurrentBreadcrumbLabel();

    return (
        <ModuleLayout animationKey={currentLabel || 'index'}>
            <div className="space-y-4">
                <div className="flex items-center gap-3 px-6 pt-4">
                    <button
                        onClick={() => navigate({ to: '/utilisateurs' })}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
                    >
                        <ArrowLeft className="h-4 w-4 shrink-0" />
                        <span className="hidden sm:inline">{t('retour')}</span>
                    </button>
                </div>
                <Outlet />
            </div>
        </ModuleLayout>
    );
}
