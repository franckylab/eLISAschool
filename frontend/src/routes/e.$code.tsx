/**
 * ==================================
 * eLISAschool - Route publique établissement (accueil)
 * ==================================
 * Route: /e/:code
 * Page d'accueil publique d'un établissement.
 */

import { createFileRoute, notFound } from '@tanstack/react-router';
import { usePageAccueil } from '@/features/cms/hooks/use-cms-public';
import { PublicLayout } from '@/features/cms/components/PublicLayout';
import { CmsPageRenderer } from '@/features/cms/components/CmsPageRenderer';

export const Route = createFileRoute('/e/$code')({
    component: EtablissementPublicPage,
});

function EtablissementPublicPage() {
    const { code } = Route.useParams();
    const { data, isLoading, error } = usePageAccueil(code);

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="space-y-4 text-center">
                    <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-green-600" />
                    <p className="text-sm text-gray-500">Chargement...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold text-gray-300">404</h1>
                    <p className="text-gray-500">Établissement introuvable ou inactif</p>
                    <a href="/login" className="text-sm text-green-600 hover:underline">
                        Retour à la connexion
                    </a>
                </div>
            </div>
        );
    }

    const { etab, page, sections, theme, menus, widgets } = data;

    // Appliquer le titre SEO de la page d'accueil
    const metaTitre = page?.seo?.metaTitre || `${etab.nom} — eLISAschool`;

    if (typeof document !== 'undefined') {
        document.title = metaTitre;
        // Meta description
        const metaDesc = page?.seo?.metaDescription || etab.descriptionPublique || '';
        let metaTag = document.querySelector('meta[name="description"]');
        if (!metaTag) {
            metaTag = document.createElement('meta');
            metaTag.setAttribute('name', 'description');
            document.head.appendChild(metaTag);
        }
        metaTag.setAttribute('content', metaDesc);
    }

    return (
        <PublicLayout etablissement={etab} theme={theme} menus={menus}>
            {/* Sections de la page d'accueil */}
            {sections.length > 0 ? (
                <CmsPageRenderer
                    sections={sections}
                    theme={theme}
                    etablissement={etab}
                    codeEtablissement={code}
                />
            ) : (
                /* Fallback si pas de page d'accueil configurée */
                <div className="mx-auto max-w-4xl px-4 py-20 text-center">
                    {etab.logoBase64 && (
                        <img
                            src={etab.logoBase64}
                            alt={etab.nom}
                            className="mx-auto mb-8 h-24 w-24 rounded-2xl object-contain"
                        />
                    )}
                    <h1
                        className="mb-4 font-bold"
                        style={{
                            fontSize: 'clamp(1.5rem, 1rem + 2.5vw, 3rem)',
                            color: 'var(--cms-primary, #28a745)',
                            fontFamily: 'var(--cms-font-title)',
                        }}
                    >
                        {etab.nom}
                    </h1>
                    {etab.slogan && (
                        <p className="mb-6 text-lg opacity-70">{etab.slogan}</p>
                    )}
                    {etab.descriptionPublique && (
                        <p className="mx-auto max-w-2xl text-base opacity-60">
                            {etab.descriptionPublique}
                        </p>
                    )}
                    <div className="mt-10 flex flex-wrap justify-center gap-4">
                        {etab.contactTelephone && (
                            <a
                                href={`tel:${etab.contactTelephone}`}
                                className="rounded-lg px-6 py-3 text-sm font-semibold text-white"
                                style={{ backgroundColor: 'var(--cms-primary, #28a745)' }}
                            >
                                Nous contacter
                            </a>
                        )}
                    </div>
                </div>
            )}
        </PublicLayout>
    );
}
