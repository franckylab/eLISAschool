/**
 * ==================================
 * eLISAschool - Layout public établissement
 * ==================================
 * Route: /e/:code
 * Layout parent pour toutes les pages publiques /e/:code/*.
 * Charge les données partagées et les fournit via PublicPageContext.
 */

import { createFileRoute, Outlet } from '@tanstack/react-router';
import { useEtablissementPublic, useThemePublic, useMenusPublic, useWidgetsPublic } from '@/features/cms/hooks/use-cms-public';
import { PublicLayout } from '@/features/cms/components/PublicLayout';
import { PublicPageContext } from '@/features/cms/components/PublicPageContext';
import { PublicPageSkeleton } from '@/features/cms/components/PublicPageSkeleton';

export const Route = createFileRoute('/e/$code')({
    component: LayoutPublicEtablissement,
});

function LayoutPublicEtablissement() {
    const { code } = Route.useParams();
    const { data: etab, isLoading, error } = useEtablissementPublic(code);
    const { data: theme } = useThemePublic(code);
    const { data: menus } = useMenusPublic(code);
    const { data: widgets } = useWidgetsPublic(code);

    if (isLoading) {
        return <PublicPageSkeleton />;
    }

    if (error || !etab) {
        const errCode = (error as any)?.code || '';
        const errStatus = (error as any)?.status || 0;
        const isInactive = errCode === 'ETABLISSEMENT_INACTIF' || errStatus === 403;
        const isNotFound = errCode === 'ETABLISSEMENT_NOT_FOUND' || errStatus === 404;
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="mx-auto max-w-md px-6 text-center space-y-6">
                    <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${isInactive ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                        {isInactive ? (
                            <svg className="h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                            </svg>
                        ) : (
                            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                            </svg>
                        )}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {isInactive ? 'Établissement inactif' : isNotFound ? 'Établissement introuvable' : 'Erreur de chargement'}
                        </h1>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            {isInactive
                                ? `L'établissement « ${code} » est actuellement désactivé. Veuillez réessayer plus tard.`
                                : isNotFound
                                    ? `Aucun établissement trouvé avec le code « ${code} ». Vérifiez l'adresse ou contactez l'administration.`
                                    : (error as any)?.message || 'Une erreur est survenue lors du chargement de la page.'
                            }
                        </p>
                        {import.meta.env.DEV && (errCode || errStatus) && (
                            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 font-mono">
                                [{errStatus}] {errCode}
                            </p>
                        )}
                    </div>
                    <div className="flex flex-col gap-2">
                        <a
                            href="/login"
                            className="inline-flex items-center justify-center rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 transition-colors"
                        >
                            Espace administration
                        </a>
                        <button
                            onClick={() => window.location.reload()}
                            className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                        >
                            Réessayer
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <PublicPageContext.Provider value={{
            etab,
            theme,
            menus: menus || [],
            widgets: widgets || [],
            code,
        }}>
            <PublicLayout etablissement={etab} theme={theme} menus={menus || []} widgets={widgets || []}>
                <Outlet />
            </PublicLayout>
        </PublicPageContext.Provider>
    );
}
