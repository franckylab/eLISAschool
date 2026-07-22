import { createFileRoute, Outlet, useLocation } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { motion } from 'framer-motion';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/_auth/organisation')({
    beforeLoad: () => requireModulePermission('organisation'),
    component: OrganisationLayout,
});

/**
 * Layout du module Organisation.
 * La navigation latérale entre sections est assurée par le sous-menu
 * « Organisation » de la sidebar principale (plus de sticky sub-nav interne).
 */
function OrganisationLayout() {
    const { t } = useTranslation('organisation');
    const { pathname } = useLocation();

    return (
        <div className="space-y-4">
            <div className="px-6 pt-4">
                <Breadcrumbs
                    labelsMap={{
                        organisation: t('organisation'),
                        unites: t('unites'),
                        postes: t('postes'),
                        fonctions: t('fonctions'),
                        hierarchie: t('hierarchie'),
                        organigramme: t('organigramme.titre', 'Organigramme'),
                        nomenclatures: t('nomenclatures'),
                        modeles: t('modeles'),
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
