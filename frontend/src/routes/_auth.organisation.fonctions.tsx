import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { ArrowLeft } from 'lucide-react';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/_auth/organisation/fonctions')({
    beforeLoad: () => requireModulePermission('fonctions'),
    component: FonctionsLayout,
});

function FonctionsLayout() {
    const { t } = useTranslation('organisation');
    const navigate = useNavigate();

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigate({ to: '/organisation' })}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>{t('retourOrganisation')}</span>
                </button>
            </div>
            <Breadcrumbs labelsMap={{ organisation: t('organisation'), fonctions: t('fonctions') }} />
            <Outlet />
        </div>
    );
}
