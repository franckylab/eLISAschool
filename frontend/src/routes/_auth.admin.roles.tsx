import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router';
import { requireRole } from '@/app/permission-guards';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { useCurrentBreadcrumbLabel } from '@/components/navigation/breadcrumb-context';
import { useTranslation } from 'react-i18next';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';

export const Route = createFileRoute('/_auth/admin/roles')({
    beforeLoad: () => requireRole(['SUPER_ADMIN', 'ADMIN']),
    component: RolesLayout,
});

function RolesLayout() {
    const { t } = useTranslation('utilisateurs');
    const navigate = useNavigate();
    const currentLabel = useCurrentBreadcrumbLabel();

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigate({ to: '/utilisateurs' })}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
                >
                    <ArrowLeft className="h-4 w-4 shrink-0" />
                    <span className="hidden sm:inline">{t('retour')}</span>
                </button>
            </div>
            <Breadcrumbs labelsMap={{ admin: 'Admin', roles: 'Rôles' }} currentLabel={currentLabel} />
            <motion.div
                key={currentLabel || 'index'}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
            >
                <ErrorBoundary>
                    <Outlet />
                </ErrorBoundary>
            </motion.div>
        </div>
    );
}
