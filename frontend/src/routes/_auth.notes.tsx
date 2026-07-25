/**
 * ==================================
 * eLISAschool - Route Notes Layout
 * ==================================
 */

import { createFileRoute, Outlet, useLocation } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { motion } from 'framer-motion';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/_auth/notes')({
    beforeLoad: () => requireModulePermission('notes'),
    component: NotesLayout,
});

function NotesLayout() {
    const { t } = useTranslation('notes');
    const { pathname } = useLocation();

    return (
        <div className="space-y-4">
            <div className="px-6 pt-4">
                <Breadcrumbs
                    labelsMap={{
                        notes: t('notes'),
                        nouvelle: t('nouvelleNote'),
                        saisie: t('saisieMasse'),
                        detail: t('detail'),
                    }}
                />
            </div>
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
        </div>
    );
}
