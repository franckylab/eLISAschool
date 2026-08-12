/**
 * ==================================
 * eLISAschool - Rendu de pages CMS
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Composant de rendu des sections CMS.
 * Supporte 18 types de sections avec styles dynamiques.
 */

import { useState } from 'react';
import type { CmsSection, CmsTheme, EtablissementPublic } from '../types/cms.types';
import { SectionType } from '../types/cms.types';
import { envoyerContactPublic } from '../hooks/use-cms-public';

interface CmsPageRendererProps {
    sections: CmsSection[];
    theme?: CmsTheme | null;
    etablissement?: EtablissementPublic;
    codeEtablissement: string;
}

export function CmsPageRenderer({ sections, theme, etablissement, codeEtablissement }: CmsPageRendererProps) {
    const sectionsVisibles = sections
        .filter(s => s.visible)
        .sort((a, b) => a.ordre - b.ordre);

    return (
        <div className="cms-page">
            {sectionsVisibles.map((section) => (
                <SectionRenderer
                    key={section.id}
                    section={section}
                    theme={theme}
                    etablissement={etablissement}
                    codeEtablissement={codeEtablissement}
                />
            ))}
        </div>
    );
}

// ==================================
// Section individuelle
// ==================================
function SectionRenderer({ section, theme, etablissement, codeEtablissement }: {
    section: CmsSection;
    theme?: CmsTheme | null;
    etablissement?: EtablissementPublic;
    codeEtablissement: string;
}) {
    const style = section.styles || {};
    const padding = style.padding || 'clamp(2rem, 1.5rem + 2vw, 4rem) clamp(1rem, 0.5rem + 2vw, 2rem)';
    const bgColor = style.backgroundColor || 'transparent';

    return (
        <section
            id={section.id}
            style={{ padding, backgroundColor: bgColor }}
            className="w-full"
        >
            <div className="mx-auto max-w-7xl">
                {section.titre && (
                    <h2
                        className="mb-6 text-center font-bold"
                        style={{
                            fontSize: 'clamp(1.25rem, 1rem + 1vw, 2rem)',
                            color: 'var(--cms-primary)',
                            fontFamily: 'var(--cms-font-title)',
                        }}
                    >
                        {section.titre}
                    </h2>
                )}
                <SectionContent
                    type={section.type}
                    contenu={section.contenu}
                    theme={theme}
                    etablissement={etablissement}
                    codeEtablissement={codeEtablissement}
                />
            </div>
        </section>
    );
}

// ==================================
// Contenu par type de section
// ==================================
function SectionContent({ type, contenu, theme, etablissement, codeEtablissement }: {
    type: SectionType;
    contenu: Record<string, any>;
    theme?: CmsTheme | null;
    etablissement?: EtablissementPublic;
    codeEtablissement: string;
}) {
    switch (type) {
        case SectionType.HERO:
            return <HeroSection contenu={contenu} theme={theme} />;
        case SectionType.TEXTE:
            return <TexteSection contenu={contenu} />;
        case SectionType.GALERIE:
            return <GalerieSection contenu={contenu} />;
        case SectionType.CARTE_INFOS:
            return <CarteInfosSection contenu={contenu} />;
        case SectionType.TEMOIGNAGES:
            return <TemoignagesSection contenu={contenu} />;
        case SectionType.CHIFFRES_CLES:
            return <ChiffresClesSection contenu={contenu} theme={theme} />;
        case SectionType.EQUIPE:
            return <EquipeSection contenu={contenu} />;
        case SectionType.FORMULAIRE:
            return <FormulaireSection contenu={contenu} codeEtablissement={codeEtablissement} />;
        case SectionType.CARTE:
            return <CarteSection contenu={contenu} etablissement={etablissement} />;
        case SectionType.VIDEO:
            return <VideoSection contenu={contenu} />;
        case SectionType.TELECHARGEMENTS:
            return <TelechargementsSection contenu={contenu} />;
        case SectionType.ACTUALITES:
            return <ActualitesSection contenu={contenu} />;
        case SectionType.HORAIRES:
            return <HorairesSection contenu={contenu} theme={theme} />;
        case SectionType.PARTENAIRES:
            return <PartenairesSection contenu={contenu} />;
        case SectionType.FAQ:
            return <FaqSection contenu={contenu} theme={theme} />;
        case SectionType.APPEL_ACTION:
            return <AppelActionSection contenu={contenu} theme={theme} />;
        case SectionType.SEPARATEUR:
            return <SeparateurSection contenu={contenu} theme={theme} />;
        case SectionType.HTML_CUSTOM:
            return <HtmlCustomSection contenu={contenu} />;
        default:
            return <div className="text-center text-gray-400 py-8">Section non supportée</div>;
    }
}

// ==================================
// 1. HERO — Bannière principale
// ==================================
function HeroSection({ contenu, theme }: { contenu: Record<string, any>; theme?: CmsTheme | null }) {
    return (
        <div
            className="relative flex min-h-[400px] items-center justify-center overflow-hidden rounded-2xl text-center text-white"
            style={{
                background: contenu.imageFond
                    ? `url(${contenu.imageFond}) center/cover no-repeat`
                    : `linear-gradient(135deg, var(--cms-primary), var(--cms-secondary))`,
                minHeight: 'clamp(300px, 40vh, 600px)',
            }}
        >
            {contenu.imageFond && <div className="absolute inset-0 bg-black/40" />}
            <div className="relative z-10 mx-auto max-w-3xl px-6 space-y-4">
                {contenu.surtitre && (
                    <p className="text-sm font-medium uppercase tracking-wider opacity-80">
                        {contenu.surtitre}
                    </p>
                )}
                <h1
                    className="font-bold leading-tight"
                    style={{
                        fontSize: 'clamp(1.5rem, 1rem + 2.5vw, 3.5rem)',
                        fontFamily: 'var(--cms-font-title)',
                        textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                    }}
                >
                    {contenu.titre}
                </h1>
                {contenu.description && (
                    <p
                        className="mx-auto max-w-xl opacity-90"
                        style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.4vw, 1.25rem)' }}
                    >
                        {contenu.description}
                    </p>
                )}
                {contenu.boutons && (
                    <div className="flex flex-wrap justify-center gap-3 pt-4">
                        {contenu.boutons.map((btn: any, i: number) => (
                            <a
                                key={i}
                                href={btn.url || '#'}
                                target={btn.nouvelOnglet ? '_blank' : undefined}
                                rel="noopener noreferrer"
                                className="inline-flex items-center rounded-lg px-6 py-3 text-sm font-semibold transition-transform hover:scale-105"
                                style={{
                                    backgroundColor: btn.principal ? 'var(--cms-accent)' : 'rgba(255,255,255,0.2)',
                                    color: btn.principal ? 'var(--cms-text)' : '#fff',
                                    backdropFilter: btn.principal ? undefined : 'blur(4px)',
                                }}
                            >
                                {btn.label}
                            </a>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ==================================
// 2. TEXTE — Bloc de texte riche
// ==================================
function TexteSection({ contenu }: { contenu: Record<string, any> }) {
    return (
        <div
            className="prose prose-lg max-w-none"
            style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.3vw, 1.125rem)', lineHeight: 1.8 }}
            dangerouslySetInnerHTML={{ __html: contenu.html || contenu.texte || '' }}
        />
    );
}

// ==================================
// 3. GALERIE — Grille d'images
// ==================================
function GalerieSection({ contenu }: { contenu: Record<string, any> }) {
    const images: any[] = contenu.images || [];
    const colonnes = contenu.colonnes || 3;

    return (
        <div
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${colonnes}, 1fr)` }}
        >
            {images.map((img: any, i: number) => (
                <div key={i} className="group relative overflow-hidden rounded-xl aspect-square">
                    <img
                        src={img.url}
                        alt={img.alt || `Image ${i + 1}`}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                        loading="lazy"
                    />
                    {img.legend && (
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                            <p className="text-sm text-white">{img.legend}</p>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

// ==================================
// 4. CARTE_INFOS — Cartes d'information
// ==================================
function CarteInfosSection({ contenu }: { contenu: Record<string, any> }) {
    const cartes: any[] = contenu.cartes || [];
    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cartes.map((carte: any, i: number) => (
                <div
                    key={i}
                    className="rounded-xl border p-6 transition-shadow hover:shadow-lg"
                    style={{ borderColor: 'var(--cms-primary, #e5e7eb)' + '30' }}
                >
                    {carte.icone && (
                        <div
                            className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg text-2xl"
                            style={{ backgroundColor: 'var(--cms-primary)' + '15' }}
                        >
                            {carte.icone}
                        </div>
                    )}
                    <h3 className="mb-2 text-lg font-bold" style={{ fontFamily: 'var(--cms-font-title)' }}>
                        {carte.titre}
                    </h3>
                    <p className="text-sm opacity-70" style={{ color: 'var(--cms-text-light)' }}>
                        {carte.description}
                    </p>
                </div>
            ))}
        </div>
    );
}

// ==================================
// 5. TEMOIGNAGES — Carrousel témoignages
// ==================================
function TemoignagesSection({ contenu }: { contenu: Record<string, any> }) {
    const temoignages: any[] = contenu.temoignages || [];
    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {temoignages.map((t: any, i: number) => (
                <blockquote
                    key={i}
                    className="rounded-xl border-l-4 bg-gray-50 p-6 dark:bg-gray-800/50"
                    style={{ borderLeftColor: 'var(--cms-primary)' }}
                >
                    <p className="mb-4 italic opacity-80">« {t.texte} »</p>
                    <footer className="flex items-center gap-3">
                        {t.avatar && (
                            <img src={t.avatar} alt={t.nom} className="h-10 w-10 rounded-full object-cover" />
                        )}
                        <div>
                            <cite className="text-sm font-semibold not-italic">{t.nom}</cite>
                            {t.fonction && <p className="text-xs opacity-60">{t.fonction}</p>}
                        </div>
                    </footer>
                </blockquote>
            ))}
        </div>
    );
}

// ==================================
// 6. CHIFFRES_CLES — Compteurs animés
// ==================================
function ChiffresClesSection({ contenu, theme }: { contenu: Record<string, any>; theme?: CmsTheme | null }) {
    const chiffres: any[] = contenu.chiffres || [];
    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {chiffres.map((c: any, i: number) => (
                <div key={i} className="text-center space-y-2">
                    <div
                        className="text-4xl font-black"
                        style={{ color: 'var(--cms-primary)', fontFamily: 'var(--cms-font-title)' }}
                    >
                        {c.valeur}
                    </div>
                    <div className="text-sm font-medium opacity-70">{c.label}</div>
                    {c.description && <div className="text-xs opacity-50">{c.description}</div>}
                </div>
            ))}
        </div>
    );
}

// ==================================
// 7. EQUIPE — Grille membres
// ==================================
function EquipeSection({ contenu }: { contenu: Record<string, any> }) {
    const membres: any[] = contenu.membres || [];
    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {membres.map((m: any, i: number) => (
                <div key={i} className="text-center space-y-3">
                    {m.photo && (
                        <img
                            src={m.photo}
                            alt={m.nom}
                            className="mx-auto h-24 w-24 rounded-full object-cover ring-2"
                            style={{ ringColor: 'var(--cms-primary)' + '30' }}
                        />
                    )}
                    <div>
                        <h4 className="font-bold">{m.nom}</h4>
                        <p className="text-sm opacity-60">{m.fonction}</p>
                    </div>
                    {m.bio && <p className="text-xs opacity-50">{m.bio}</p>}
                </div>
            ))}
        </div>
    );
}

// ==================================
// 8. FORMULAIRE — Contact public
// ==================================
function FormulaireSection({ contenu, codeEtablissement }: { contenu: Record<string, any>; codeEtablissement: string }) {
    const [envoye, setEnvoye] = useState(false);
    const [erreur, setErreur] = useState('');
    const [chargement, setChargement] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setChargement(true);
        setErreur('');
        const form = e.currentTarget;
        const data = {
            nom: (form.elements.namedItem('nom') as HTMLInputElement).value,
            email: (form.elements.namedItem('email') as HTMLInputElement).value,
            sujet: (form.elements.namedItem('sujet') as HTMLInputElement).value,
            message: (form.elements.namedItem('message') as HTMLTextAreaElement).value,
        };
        try {
            await envoyerContactPublic(codeEtablissement, data);
            setEnvoye(true);
        } catch {
            setErreur('Erreur lors de l\'envoi. Veuillez réessayer.');
        } finally {
            setChargement(false);
        }
    };

    if (envoye) {
        return (
            <div className="rounded-xl bg-green-50 p-8 text-center dark:bg-green-900/20">
                <p className="text-lg font-semibold text-green-700 dark:text-green-400">
                    Message envoyé avec succès !
                </p>
                <p className="mt-2 text-sm text-green-600 dark:text-green-500">
                    L'établissement vous répondra sous peu.
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-4">
            {contenu.description && (
                <p className="text-center text-sm opacity-70">{contenu.description}</p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
                <input
                    name="nom"
                    required
                    placeholder="Votre nom"
                    className="rounded-lg border px-4 py-3 text-sm outline-none focus:ring-2"
                    style={{ borderColor: 'var(--cms-primary)' + '30', focusRingColor: 'var(--cms-primary)' }}
                />
                <input
                    name="email"
                    type="email"
                    required
                    placeholder="Votre email"
                    className="rounded-lg border px-4 py-3 text-sm outline-none focus:ring-2"
                />
            </div>
            <input
                name="sujet"
                required
                placeholder="Sujet"
                className="w-full rounded-lg border px-4 py-3 text-sm outline-none focus:ring-2"
            />
            <textarea
                name="message"
                required
                rows={5}
                placeholder="Votre message..."
                className="w-full rounded-lg border px-4 py-3 text-sm outline-none focus:ring-2"
            />
            {erreur && <p className="text-sm text-red-500">{erreur}</p>}
            <button
                type="submit"
                disabled={chargement}
                className="w-full rounded-lg px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: 'var(--cms-primary)' }}
            >
                {chargement ? 'Envoi en cours...' : 'Envoyer le message'}
            </button>
        </form>
    );
}

// ==================================
// 9. CARTE — Carte géographique
// ==================================
function CarteSection({ contenu, etablissement }: { contenu: Record<string, any>; etablissement?: EtablissementPublic }) {
    const lat = contenu.latitude || etablissement?.latitude;
    const lng = contenu.longitude || etablissement?.longitude;

    if (!lat || !lng) {
        return <p className="text-center text-sm opacity-50">Coordonnées non disponibles</p>;
    }

    return (
        <div className="overflow-hidden rounded-xl border" style={{ borderColor: 'var(--cms-primary)' + '20' }}>
            <iframe
                title="Localisation"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.01},${lat-0.01},${lng+0.01},${lat+0.01}&layer=mapnik&marker=${lat},${lng}`}
                className="h-80 w-full border-0"
                loading="lazy"
            />
            {contenu.adresse && (
                <div className="p-4 text-center text-sm opacity-70">
                    {contenu.adresse}
                </div>
            )}
        </div>
    );
}

// ==================================
// 10. VIDEO — Lecteur vidéo
// ==================================
function VideoSection({ contenu }: { contenu: Record<string, any> }) {
    return (
        <div className="mx-auto max-w-4xl">
            {contenu.youtubeId ? (
                <div className="aspect-video overflow-hidden rounded-xl">
                    <iframe
                        src={`https://www.youtube.com/embed/${contenu.youtubeId}`}
                        title={contenu.titre || 'Vidéo'}
                        className="h-full w-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
            ) : contenu.videoUrl ? (
                <video
                    controls
                    className="mx-auto w-full max-w-4xl rounded-xl"
                    poster={contenu.poster}
                >
                    <source src={contenu.videoUrl} type="video/mp4" />
                </video>
            ) : null}
            {contenu.description && (
                <p className="mt-3 text-center text-sm opacity-60">{contenu.description}</p>
            )}
        </div>
    );
}

// ==================================
// 11. TELECHARGEMENTS — Liste fichiers
// ==================================
function TelechargementsSection({ contenu }: { contenu: Record<string, any> }) {
    const fichiers: any[] = contenu.fichiers || [];
    return (
        <div className="space-y-3">
            {fichiers.map((f: any, i: number) => (
                <a
                    key={i}
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    style={{ borderColor: 'var(--cms-primary)' + '20' }}
                >
                    <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg"
                        style={{ backgroundColor: 'var(--cms-primary)' + '15' }}
                    >
                        📄
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{f.nom}</p>
                        {f.description && <p className="truncate text-xs opacity-50">{f.description}</p>}
                    </div>
                    {f.taille && <span className="shrink-0 text-xs opacity-40">{f.taille}</span>}
                </a>
            ))}
        </div>
    );
}

// ==================================
// 12. ACTUALITES — Liste d'actualités
// ==================================
function ActualitesSection({ contenu }: { contenu: Record<string, any> }) {
    const actualites: any[] = contenu.actualites || [];
    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {actualites.map((a: any, i: number) => (
                <article key={i} className="overflow-hidden rounded-xl border transition-shadow hover:shadow-md">
                    {a.image && (
                        <img src={a.image} alt={a.titre} className="h-48 w-full object-cover" loading="lazy" />
                    )}
                    <div className="p-4 space-y-2">
                        {a.date && <time className="text-xs opacity-50">{a.date}</time>}
                        <h3 className="font-bold leading-tight">{a.titre}</h3>
                        <p className="text-sm opacity-70 line-clamp-3">{a.resume}</p>
                        {a.lien && (
                            <a href={a.lien} className="text-sm font-medium" style={{ color: 'var(--cms-primary)' }}>
                                Lire la suite →
                            </a>
                        )}
                    </div>
                </article>
            ))}
        </div>
    );
}

// ==================================
// 13. HORAIRES — Tableau horaires
// ==================================
function HorairesSection({ contenu, theme }: { contenu: Record<string, any>; theme?: CmsTheme | null }) {
    const horaires: any[] = contenu.horaires || [];
    return (
        <div className="mx-auto max-w-2xl overflow-hidden rounded-xl border" style={{ borderColor: 'var(--cms-primary)' + '20' }}>
            <table className="w-full text-sm">
                <thead>
                    <tr style={{ backgroundColor: 'var(--cms-primary)' + '10' }}>
                        <th className="px-4 py-3 text-left font-semibold">Jour</th>
                        <th className="px-4 py-3 text-left font-semibold">Horaires</th>
                    </tr>
                </thead>
                <tbody>
                    {horaires.map((h: any, i: number) => (
                        <tr key={i} className="border-t" style={{ borderColor: 'var(--cms-primary)' + '10' }}>
                            <td className="px-4 py-3 font-medium">{h.jour}</td>
                            <td className="px-4 py-3 opacity-70">{h.horaires}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ==================================
// 14. PARTENAIRES — Logos partenaires
// ==================================
function PartenairesSection({ contenu }: { contenu: Record<string, any> }) {
    const partenaires: any[] = contenu.partenaires || [];
    return (
        <div className="flex flex-wrap items-center justify-center gap-8">
            {partenaires.map((p: any, i: number) => (
                <a
                    key={i}
                    href={p.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-center rounded-xl border p-4 transition-all hover:shadow-md"
                    style={{ borderColor: 'var(--cms-primary)' + '15' }}
                    title={p.nom}
                >
                    {p.logo ? (
                        <img
                            src={p.logo}
                            alt={p.nom}
                            className="h-16 w-auto object-contain opacity-60 grayscale transition-all group-hover:opacity-100 group-hover:grayscale-0"
                        />
                    ) : (
                        <span className="text-sm font-medium opacity-60 group-hover:opacity-100">{p.nom}</span>
                    )}
                </a>
            ))}
        </div>
    );
}

// ==================================
// 15. FAQ — Accordéon
// ==================================
function FaqSection({ contenu, theme }: { contenu: Record<string, any>; theme?: CmsTheme | null }) {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const faqs: any[] = contenu.faqs || [];

    return (
        <div className="mx-auto max-w-3xl space-y-3">
            {faqs.map((faq: any, i: number) => (
                <div
                    key={i}
                    className="overflow-hidden rounded-xl border transition-colors"
                    style={{ borderColor: 'var(--cms-primary)' + '20' }}
                >
                    <button
                        onClick={() => setOpenIndex(openIndex === i ? null : i)}
                        className="flex w-full items-center justify-between px-6 py-4 text-left font-medium transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                        <span>{faq.question}</span>
                        <span
                            className="ml-4 shrink-0 text-xl transition-transform"
                            style={{ transform: openIndex === i ? 'rotate(180deg)' : 'rotate(0deg)' }}
                        >
                            ▾
                        </span>
                    </button>
                    {openIndex === i && (
                        <div className="px-6 pb-4 text-sm opacity-70" style={{ color: 'var(--cms-text-light)' }}>
                            {faq.reponse}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

// ==================================
// 16. APPEL_ACTION — Bannière CTA
// ==================================
function AppelActionSection({ contenu, theme }: { contenu: Record<string, any>; theme?: CmsTheme | null }) {
    return (
        <div
            className="rounded-2xl p-8 text-center text-white"
            style={{
                background: contenu.imageFond
                    ? `linear-gradient(135deg, var(--cms-primary)dd, var(--cms-secondary)dd), url(${contenu.imageFond}) center/cover`
                    : `linear-gradient(135deg, var(--cms-primary), var(--cms-secondary))`,
                padding: 'clamp(2rem, 1.5rem + 2vw, 4rem)',
            }}
        >
            <h3
                className="mb-3 font-bold"
                style={{ fontSize: 'clamp(1.125rem, 1rem + 0.8vw, 1.75rem)', fontFamily: 'var(--cms-font-title)' }}
            >
                {contenu.titre}
            </h3>
            {contenu.description && (
                <p className="mx-auto mb-6 max-w-xl opacity-90" style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.3vw, 1.125rem)' }}>
                    {contenu.description}
                </p>
            )}
            {contenu.bouton && (
                <a
                    href={contenu.bouton.url || '#'}
                    target={contenu.bouton.nouvelOnglet ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-lg bg-white px-8 py-3 text-sm font-bold transition-transform hover:scale-105"
                    style={{ color: 'var(--cms-primary)' }}
                >
                    {contenu.bouton.label}
                </a>
            )}
        </div>
    );
}

// ==================================
// 17. SEPARATEUR — Ligne décorative
// ==================================
function SeparateurSection({ contenu, theme }: { contenu: Record<string, any>; theme?: CmsTheme | null }) {
    const style = contenu.style || 'ligne';
    if (style === 'espace') {
        return <div style={{ height: contenu.hauteur || '4rem' }} />;
    }
    return (
        <div className="flex items-center justify-center py-4">
            <div
                className="h-px w-full max-w-md"
                style={{ background: `linear-gradient(to right, transparent, var(--cms-primary), transparent)` }}
            />
        </div>
    );
}

// ==================================
// 18. HTML_CUSTOM — HTML libre
// ==================================
function HtmlCustomSection({ contenu }: { contenu: Record<string, any> }) {
    return (
        <div
            className="cms-custom-html"
            dangerouslySetInnerHTML={{ __html: contenu.html || '' }}
        />
    );
}
