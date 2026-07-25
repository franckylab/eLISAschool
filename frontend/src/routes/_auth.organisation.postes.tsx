import { createFileRoute, Outlet, useLocation } from '@tanstack/react-router';
import { requirePermission } from '@/app/permission-guards';
import { motion } from 'framer-motion';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';

export const Route = createFileRoute('/_auth/organisation/postes')({
    beforeLoad: () => requirePermission('organisation:postes:read'),
    component: PostesLayout,
});

function PostesLayout() {
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
