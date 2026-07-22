import { createFileRoute, Outlet, useLocation } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { motion } from 'framer-motion';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';

export const Route = createFileRoute('/_auth/organisation/fonctions')({
    beforeLoad: () => requireModulePermission('fonctions'),
    component: FonctionsLayout,
});

function FonctionsLayout() {
    const { pathname } = useLocation();

    return (
        <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
        >
            <ErrorBoundary>
                <Outlet />
            </ErrorBoundary>
        </motion.div>
    );
}
