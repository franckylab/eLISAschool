import { createFileRoute, Outlet, useLocation } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';

export const Route = createFileRoute('/_auth/organisation/nomenclatures/niveaux-responsabilite')({
    component: Layout,
});

function Layout() {
    const { pathname } = useLocation();
    return (
        <motion.div key={pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <ErrorBoundary><Outlet /></ErrorBoundary>
        </motion.div>
    );
}
