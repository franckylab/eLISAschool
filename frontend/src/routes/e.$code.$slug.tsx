/**
 * ==================================
 * eLISAschool - Route publique page CMS
 * ==================================
 * Route: /e/:code/$slug
 * Page CMS individuelle d'un établissement.
 * Supporte le mode preview via ?preview=TOKEN.
 */

import { createFileRoute, useSearch, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { usePagePublique } from '@/features/cms/hooks/use-cms-public';
import { usePublicPage } from '@/features/cms/components/PublicPageContext';
import { CmsPageRenderer } from '@/features/cms/components/CmsPageRenderer';
import { SeoHead } from '@/features/cms/components/SeoHead';
import { apiClient } from '@/lib/api-client';
import type { PagePubliqueData } from '@/features/cms/types/cms.types';
import { AlertTriangle } from 'lucide-react';

// Capture le query param ?preview=TOKEN
const previewSearchOptions = {
    validateSearch: (search: Record<string, unknown>) => ({
        preview: (search.preview as string) || '',
    }),
};

export const Route = createFileRoute('/e/$code/$slug')({
    ...previewSearchOptions,
    component: PageCmsPublique,
});

function PageCmsPublique() {
    const { code, slug } = Route.useParams();
    const { preview: previewToken } = useSearch({ from: Route.id });
    const isPreview = !!previewToken;

    const { etab, theme, code: codeEtab } = usePublicPage();

    // Hook normal ou preview selon le cas
    const normalQuery = usePagePublique(code, slug);
    const previewQuery = useQuery<PagePubliqueData>({
        queryKey: ['public', code, 'page', slug, 'preview', previewToken],
        queryFn: async () => {
            const res = await apiClient.get<PagePubliqueData>(
                `/api/public/e/${code}/pages/${slug}`,
                { preview: previewToken },
            );
            return res.data!;
        },
        enabled: isPreview,
        retry: false,
    });

    const { data: pageData, isLoading, error } = isPreview ? previewQuery : normalQuery;

    if (isLoading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-green-600" />
            </div>
        );
    }

    if (error || !pageData) {
        // Page introuvable — 404 professionnelle
        return (
            <>
                <SeoHead titre="Page introuvable — 404" description="La page demandée n'existe pas ou a été déplacée." />
                <div className="flex min-h-[60vh] items-center justify-center px-4">
                    <div className="text-center space-y-6">
                        {/* Illustration SVG */}
                        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                            <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-1.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-5xl font-black text-gray-200 dark:text-gray-700">404</h1>
                            <h2 className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
                                {isPreview ? 'Aperçu invalide ou expiré' : 'Page introuvable'}
                            </h2>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                {isPreview
                                    ? 'Le lien d\'aperçu est peut-être expiré. Demandez un nouveau lien à l\'administrateur.'
                                    : 'La page que vous recherchez n\'existe pas ou a été déplacée.'
                                }
                            </p>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                            <Link
                                to="/e/$code"
                                params={{ code }}
                                className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90"
                                style={{ backgroundColor: 'var(--cms-primary, #28a745)' }}
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Retour à l'accueil
                            </Link>
                            <Link
                                to="/e/$code/$slug"
                                params={{ code, slug: 'contact' }}
                                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                            >
                                Nous contacter
                            </Link>
                            <Link
                                to="/e/$code/$slug"
                                params={{ code, slug: 'inscriptions' }}
                                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                            >
                                Inscriptions
                            </Link>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    const { page, sections } = pageData;

    // SEO
    const metaTitre = page.seo?.metaTitre || `${page.titre} — ${etab.nom}`;
    const metaDescription = page.seo?.metaDescription || '';

    return (
        <>
            <SeoHead
                titre={metaTitre}
                description={metaDescription}
                logoBase64={etab.logoBase64}
                canonicalUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/e/${code}/${slug}`}
                etablissementNom={etab.nom}
            />
            {/* Bandeau preview */}
            {isPreview && (
                <div className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-lg">
                    <AlertTriangle className="h-4 w-4" />
                    Mode aperçu — Cette page n'est pas encore publiée
                </div>
            )}
            <CmsPageRenderer
                sections={sections}
                theme={theme}
                etablissement={etab}
                codeEtablissement={codeEtab}
            />
        </>
    );
}
