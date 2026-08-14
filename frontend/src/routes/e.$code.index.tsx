/**
 * ==================================
 * eLISAschool - Page d'accueil publique établissement
 * ==================================
 * Route: /e/:code (index)
 * Contenu de la page d'accueil CMS ou fallback riche.
 */

import { createFileRoute } from '@tanstack/react-router';
import { usePageAccueil } from '@/features/cms/hooks/use-cms-public';
import { usePublicPage } from '@/features/cms/components/PublicPageContext';
import { CmsPageRenderer } from '@/features/cms/components/CmsPageRenderer';
import { SeoHead } from '@/features/cms/components/SeoHead';
import type { EtablissementPublic } from '@/features/cms/types/cms.types';

export const Route = createFileRoute('/e/$code/')({
    component: AccueilPublicPage,
});

function AccueilPublicPage() {
    const { etab, theme, code } = usePublicPage();
    const { data, isLoading } = usePageAccueil(code);

    if (isLoading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-green-600" />
            </div>
        );
    }

    const page = data?.page;
    const sections = data?.sections || [];

    // SEO
    const metaTitre = page?.seo?.metaTitre || `${etab.nom} — eLISAschool`;
    const metaDescription = page?.seo?.metaDescription || etab.descriptionPublique || '';

    return (
        <>
            <SeoHead
                titre={metaTitre}
                description={metaDescription}
                logoBase64={etab.logoBase64}
                canonicalUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/e/${code}`}
                etablissementNom={etab.nom}
            />
            {sections.length > 0 ? (
                <CmsPageRenderer
                    sections={sections}
                    theme={theme}
                    etablissement={etab}
                    codeEtablissement={code}
                />
            ) : (
                <HomepageFallback etab={etab} code={code} />
            )}
        </>
    );
}

// ==================================
// Homepage fallback riche
// ==================================
function HomepageFallback({ etab, code }: { etab: EtablissementPublic; code: string }) {
    return (
        <div className="space-y-0">
            {/* Hero */}
            <section
                className="relative flex items-center justify-center overflow-hidden py-20 text-white md:py-32"
                style={{
                    background: `linear-gradient(135deg, var(--cms-primary, #28a745), var(--cms-secondary, #007bff))`,
                }}
            >
                <div className="relative z-10 mx-auto max-w-3xl px-4 text-center">
                    {etab.logoBase64 && (
                        <img
                            src={etab.logoBase64}
                            alt={etab.nom}
                            className="mx-auto mb-6 h-20 w-20 rounded-2xl bg-white/20 p-2 object-contain backdrop-blur-sm"
                        />
                    )}
                    <h1
                        className="mb-4 font-bold"
                        style={{
                            fontSize: 'clamp(1.5rem, 1rem + 2.5vw, 3.5rem)',
                            fontFamily: 'var(--cms-font-title)',
                        }}
                    >
                        {etab.nom}
                    </h1>
                    {etab.slogan && (
                        <p className="mb-6 text-lg opacity-90">{etab.slogan}</p>
                    )}
                    <div className="flex flex-wrap justify-center gap-3">
                        <a
                            href={`/e/${code}/contact`}
                            className="rounded-lg bg-white px-6 py-3 text-sm font-semibold transition-transform hover:scale-105"
                            style={{ color: 'var(--cms-primary, #28a745)' }}
                        >
                            Nous contacter
                        </a>
                        <a
                            href={`/e/${code}/inscriptions`}
                            className="rounded-lg border-2 border-white/50 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-transform hover:scale-105"
                        >
                            S'inscrire
                        </a>
                    </div>
                </div>
            </section>

            {/* À propos */}
            {etab.descriptionPublique && (
                <section className="py-16 dark:bg-gray-900/50">
                    <div className="mx-auto max-w-3xl px-4 text-center">
                        <h2
                            className="mb-6 font-bold"
                            style={{ fontSize: 'clamp(1.25rem, 1rem + 1vw, 2rem)', color: 'var(--cms-primary)' }}
                        >
                            À propos
                        </h2>
                        <p className="text-base leading-relaxed text-gray-600 dark:text-gray-400">
                            {etab.descriptionPublique}
                        </p>
                    </div>
                </section>
            )}

            {/* Chiffres clés placeholder */}
            <section className="bg-gray-50 py-16 dark:bg-gray-800/50">
                <div className="mx-auto max-w-5xl px-4">
                    <h2
                        className="mb-10 text-center font-bold"
                        style={{ fontSize: 'clamp(1.25rem, 1rem + 1vw, 2rem)', color: 'var(--cms-primary)' }}
                    >
                        Notre établissement en chiffres
                    </h2>
                    <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                        {[
                            { valeur: '500+', label: 'Élèves' },
                            { valeur: '30+', label: 'Enseignants' },
                            { valeur: '95%', label: 'Réussite' },
                            { valeur: '15', label: 'Années' },
                        ].map((c, i) => (
                            <div key={i} className="text-center">
                                <div className="text-3xl font-black" style={{ color: 'var(--cms-primary)' }}>{c.valeur}</div>
                                <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">{c.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Horaires */}
            {(etab.heuresOuverture || etab.contactTelephone) && (
                <section className="py-16">
                    <div className="mx-auto max-w-2xl px-4 text-center">
                        <h2
                            className="mb-6 font-bold"
                            style={{ fontSize: 'clamp(1.25rem, 1rem + 1vw, 2rem)', color: 'var(--cms-primary)' }}
                        >
                            Informations pratiques
                        </h2>
                        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                            {etab.heuresOuverture && (
                                <p>Horaires : {etab.heuresOuverture}{etab.heuresFermeture ? ` - ${etab.heuresFermeture}` : ''}</p>
                            )}
                            {etab.adresse && <p>{etab.adresse}, {etab.ville}</p>}
                            {etab.contactTelephone && (
                                <p>
                                    <a href={`tel:${etab.contactTelephone}`} className="font-medium hover:underline" style={{ color: 'var(--cms-primary)' }}>
                                        {etab.contactTelephone}
                                    </a>
                                </p>
                            )}
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}
