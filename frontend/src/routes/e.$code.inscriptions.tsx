/**
 * ==================================
 * eLISAschool - Page inscriptions publique établissement
 * ==================================
 * Route: /e/:code/inscriptions
 * Page publique d'information sur les inscriptions avec CTA.
 */

import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { usePagesPubliques } from '@/features/cms/hooks/use-cms-public';
import { usePublicPage } from '@/features/cms/components/PublicPageContext';
import { CmsPageRenderer } from '@/features/cms/components/CmsPageRenderer';
import { GraduationCap, Calendar, FileText, Users, CheckCircle, ArrowRight, Clock, BookOpen, Award, Phone } from 'lucide-react';
import { SectionType } from '@/features/cms/types/cms.types';

export const Route = createFileRoute('/e/$code/inscriptions')({
    component: PageInscriptionsPublique,
});

function PageInscriptionsPublique() {
    const { code } = Route.useParams();
    const { etab, theme, code: codeEtab } = usePublicPage();
    const { data: pages } = usePagesPubliques(code);

    const pageInscriptions = pages?.find(p => p.template === 'inscriptions' || p.slug === 'inscriptions');
    const sectionsInscriptions = pageInscriptions?.sections || [];

    // Stepper état
    const [etapeActive, setEtapeActive] = useState(0);

    const primaryColor = theme?.couleurs?.primaire || '#28a745';

    if (!etab) {
        return null;
    }

    // Étapes d'inscription par défaut
    const etapes = [
        {
            icone: <FileText className="h-6 w-6" />,
            titre: '1. Constituer le dossier',
            description: 'Préparez les documents requis : acte de naissance, certificats de scolarité, bulletins de notes, photos d\'identité.',
        },
        {
            icone: <Calendar className="h-6 w-6" />,
            titre: '2. Déposer la candidature',
            description: 'Remplissez le formulaire d\'inscription en ligne ou déposez le dossier au secrétariat de l\'établissement.',
        },
        {
            icone: <Users className="h-6 w-6" />,
            titre: '3. Entretien d\'admission',
            description: 'Un entretien avec l\'équipe pédagogique peut être prévu pour évaluer le niveau et les motivations.',
        },
        {
            icone: <CheckCircle className="h-6 w-6" />,
            titre: '4. Confirmation & paiement',
            description: 'Après acceptation, procédez au paiement des frais d\'inscription pour finaliser l\'admission.',
        },
    ];

    // Avantages
    const avantages = [
        { icone: <GraduationCap className="h-5 w-5" />, texte: 'Enseignement de qualité' },
        { icone: <BookOpen className="h-5 w-5" />, texte: 'Programmes adaptés' },
        { icone: <Award className="h-5 w-5" />, texte: 'Taux de réussite élevé' },
        { icone: <Users className="h-5 w-5" />, texte: 'Encadrement personnalisé' },
    ];

    return (
        <>
            {/* Sections CMS de la page inscriptions (hero, texte, CTA, etc.) */}
            {sectionsInscriptions.filter(s => s.type !== SectionType.FORMULAIRE).length > 0 && (
                <CmsPageRenderer
                    sections={sectionsInscriptions.filter(s => s.type !== SectionType.FORMULAIRE)}
                    theme={theme}
                    etablissement={etab}
                    codeEtablissement={codeEtab}
                />
            )}

            <div className="mx-auto max-w-5xl px-4 py-10">
                {/* Titre */}
                <div className="mb-12 text-center">
                    <h1
                        className="mb-3 font-bold"
                        style={{
                            fontSize: 'clamp(1.5rem, 1rem + 2.5vw, 2.5rem)',
                            color: primaryColor,
                            fontFamily: 'var(--cms-font-title)',
                        }}
                    >
                        Inscriptions {new Date().getFullYear()}-{new Date().getFullYear() + 1}
                    </h1>
                    <p className="mx-auto max-w-2xl text-sm opacity-60">
                        Rejoignez {etab.nom}. Découvrez les étapes d'inscription et les avantages de notre établissement.
                    </p>
                </div>

                {/* Stepper — Étapes d'inscription */}
                <div className="mb-16">
                    <h2 className="mb-8 text-center text-lg font-semibold">Comment s'inscrire ?</h2>

                    {/* Desktop — stepper horizontal */}
                    <div className="hidden md:block">
                        <div className="relative flex justify-between">
                            {/* Ligne de progression */}
                            <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200" />
                            <div
                                className="absolute top-6 left-0 h-0.5 transition-all duration-500"
                                style={{
                                    backgroundColor: primaryColor,
                                    width: `${(etapeActive / (etapes.length - 1)) * 100}%`,
                                }}
                            />

                            {etapes.map((etape, index) => (
                                <button
                                    key={index}
                                    onClick={() => setEtapeActive(index)}
                                    className="relative z-10 flex flex-col items-center text-center"
                                    style={{ width: `${100 / etapes.length}%` }}
                                >
                                    <div
                                        className="flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all"
                                        style={{
                                            borderColor: index <= etapeActive ? primaryColor : 'rgb(229,231,235)',
                                            backgroundColor: index <= etapeActive ? primaryColor : '#fff',
                                            color: index <= etapeActive ? '#fff' : 'rgb(156,163,175)',
                                        }}
                                    >
                                        {index < etapeActive ? <CheckCircle className="h-5 w-5" /> : etape.icone}
                                    </div>
                                    <p
                                        className="mt-3 text-xs font-semibold"
                                        style={{ color: index <= etapeActive ? primaryColor : 'inherit' }}
                                    >
                                        {etape.titre}
                                    </p>
                                </button>
                            ))}
                        </div>

                        {/* Description étape active */}
                        <div className="mt-8 rounded-xl border p-6 text-center" style={{ borderColor: 'rgba(128,128,128,0.2)' }}>
                            <p className="text-sm opacity-80">{etapes[etapeActive].description}</p>
                        </div>
                    </div>

                    {/* Mobile — stepper vertical */}
                    <div className="space-y-4 md:hidden">
                        {etapes.map((etape, index) => (
                            <button
                                key={index}
                                onClick={() => setEtapeActive(index)}
                                className="flex w-full items-start gap-4 rounded-xl border p-4 text-left transition-all"
                                style={{
                                    borderColor: index === etapeActive ? primaryColor : 'rgba(128,128,128,0.2)',
                                    backgroundColor: index === etapeActive ? `${primaryColor}10` : 'transparent',
                                }}
                            >
                                <div
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                                    style={{
                                        backgroundColor: index <= etapeActive ? primaryColor : 'rgba(128,128,128,0.1)',
                                        color: index <= etapeActive ? '#fff' : 'rgb(156,163,175)',
                                    }}
                                >
                                    {index < etapeActive ? <CheckCircle className="h-5 w-5" /> : etape.icone}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">{etape.titre}</p>
                                    {index === etapeActive && (
                                        <p className="mt-1 text-xs opacity-60">{etape.description}</p>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Avantages */}
                <div className="mb-16">
                    <h2 className="mb-8 text-center text-lg font-semibold">Pourquoi nous choisir ?</h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {avantages.map((av, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-4 rounded-xl border p-5"
                                style={{ borderColor: 'rgba(128,128,128,0.2)' }}
                            >
                                <div
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                                    style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                                >
                                    {av.icone}
                                </div>
                                <p className="text-sm font-medium">{av.texte}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA — Call to action */}
                <div
                    className="rounded-2xl p-8 text-center text-white"
                    style={{
                        background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)`,
                    }}
                >
                    <Clock className="mx-auto mb-4 h-10 w-10 opacity-80" />
                    <h2 className="mb-2 text-xl font-bold">Inscriptions ouvertes</h2>
                    <p className="mb-6 text-sm opacity-80">
                        Les inscriptions pour l'année scolaire {new Date().getFullYear()}-{new Date().getFullYear() + 1} sont en cours.
                        <br />Contactez-nous pour plus d'informations.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        {etab.contactTelephone && (
                            <a
                                href={`tel:${etab.contactTelephone}`}
                                className="flex items-center gap-2 rounded-lg bg-white/20 px-5 py-3 text-sm font-semibold backdrop-blur-sm transition-colors hover:bg-white/30"
                            >
                                <Phone className="h-4 w-4" />
                                Appeler
                            </a>
                        )}
                        <Link
                            to="/e/$code/contact"
                            params={{ code }}
                            className="flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold transition-colors hover:bg-white/90"
                            style={{ color: primaryColor }}
                        >
                            Nous contacter
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
