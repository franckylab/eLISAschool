/**
 * ==================================
 * eLISAschool - Route publique page CMS
 * ==================================
 * Route: /e/:code/$slug
 * Page CMS individuelle d'un établissement.
 */

import { createFileRoute } from '@tanstack/react-router';
import { usePagePublique, useEtablissementPublic, useThemePublic, useMenusPublic } from '@/features/cms/hooks/use-cms-public';
import { PublicLayout } from '@/features/cms/components/PublicLayout';
import { CmsPageRenderer } from '@/features/cms/components/CmsPageRenderer';

export const Route = createFileRoute('/e/$code/$slug')({
    component: PageCmsPublique,
});

function PageCmsPublique() {
    const { code, slug } = Route.useParams();
    const { data: etab } = useEtablissementPublic(code);
    const { data: theme } = useThemePublic(code);
    const { data: menus } = useMenusPublic(code);
    const { data: pageData, isLoading, error } = usePagePublique(code, slug);

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="space-y-4 text-center">
                    <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-green-600" />
                    <p className="text-sm text-gray-500">Chargement de la page...</p>
                </div>
            </div>
        );
    }

    if (error || !pageData || !etab) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold text-gray-300">404</h1>
                    <p className="text-gray-500">Page introuvable</p>
                    <a
                        href={`/e/${code}`}
                        className="text-sm text-green-600 hover:underline"
                    >
                        Retour à l'accueil
                    </a>
                </div>
            </div>
        );
    }

    const { page, sections } = pageData;

    // Appliquer le titre SEO
    const metaTitre = page.seo?.metaTitre || `${page.titre} — ${etab.nom}`;
    if (typeof document !== 'undefined') {
        document.title = metaTitre;
        const metaDesc = page.seo?.metaDescription || '';
        let metaTag = document.querySelector('meta[name="description"]');
        if (!metaTag) {
            metaTag = document.createElement('meta');
            metaTag.setAttribute('name', 'description');
            document.head.appendChild(metaTag);
        }
        metaTag.setAttribute('content', metaDesc);
    }

    return (
        <PublicLayout etablissement={etab} theme={theme} menus={menus || []}>
            <CmsPageRenderer
                sections={sections}
                theme={theme}
                etablissement={etab}
                codeEtablissement={code}
            />
        </PublicLayout>
    );
}
