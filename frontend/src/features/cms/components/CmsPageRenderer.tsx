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

import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import DOMPurify from 'dompurify';
import { motion } from 'framer-motion';
import type { CmsSection, CmsTheme, EtablissementPublic } from '../types/cms.types';
import { SectionType } from '../types/cms.types';
import { getAnimationConfig, getHoverProps, getStaggerContainerConfig } from '../lib/animations';
import { envoyerContactPublic } from '../hooks/use-cms-public';

// Lazy-load les sections lourdes (code splitting)
const LazyGalerieSection = lazy(() => import('./sections/GalerieSection'));
const LazyVideoSection = lazy(() => import('./sections/VideoSection'));
const LazyTelechargementsSection = lazy(() => import('./sections/TelechargementsSection'));
const LazyCarteSection = lazy(() => import('./sections/CarteSection'));

// Skeleton fallback pour sections lazy-loaded
function SectionSkeleton() {
    return (
        <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
        </div>
    );
}

// Configuration DOMPurify — Whitelist tags/attrs pour sections CMS
const DOMPURIFY_CONFIG = {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'pre', 'code', 'span', 'div'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'target', 'rel', 'style'],
};

// ==================================
// Hook useInView — IntersectionObserver pour animations
// ==================================
function useInView(options?: IntersectionObserverInit): [React.RefObject<HTMLDivElement | null>, boolean] {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsVisible(true);
                observer.unobserve(element);
            }
        }, { threshold: 0.1, ...options });

        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    return [ref, isVisible];
}

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
// Animation variants — importés depuis la bibliothèque
// (ANIMATION_VARIANTS, getAnimationConfig, etc.)
// ==================================

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
    const animConfig = getAnimationConfig(section.animations);
    const hoverProps = getHoverProps(section.animations?.hover);

    return (
        <motion.section
            id={section.id}
            style={{ padding, backgroundColor: bgColor }}
            className="w-full dark:bg-gray-900/50"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={animConfig.variants}
            transition={animConfig.transition}
            {...hoverProps}
        >
            <div className="mx-auto max-w-7xl">
                {section.titre && (
                    <h2
                        className="mb-6 text-center font-bold text-gray-900 dark:text-white"
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
        </motion.section>
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
        case SectionType.HERO_VIDEO:
            return <HeroVideoSection contenu={contenu} />;
        case SectionType.TEXTE:
            return <TexteSection contenu={contenu} />;
        case SectionType.GALERIE:
            return <Suspense fallback={<SectionSkeleton />}><LazyGalerieSection contenu={contenu} /></Suspense>;
        case SectionType.GALERIE_MASONRY:
            return <GalerieMasonrySection contenu={contenu} />;
        case SectionType.CAROUSEL:
            return <CarouselSection contenu={contenu} />;
        case SectionType.CARTE_INFOS:
            return <CarteInfosSection contenu={contenu} />;
        case SectionType.TEMOIGNAGES:
            return <TemoignagesSection contenu={contenu} />;
        case SectionType.TEMOIGNAGE_CAROUSEL:
            return <TemoignageCarouselSection contenu={contenu} />;
        case SectionType.CHIFFRES_CLES:
            return <ChiffresClesSection contenu={contenu} theme={theme} />;
        case SectionType.COMPTEURS_ANIMES:
            return <CompteursAnimesSection contenu={contenu} />;
        case SectionType.EQUIPE:
            return <EquipeSection contenu={contenu} />;
        case SectionType.FORMULAIRE:
            return <FormulaireSection contenu={contenu} codeEtablissement={codeEtablissement} />;
        case SectionType.CARTE:
            return <Suspense fallback={<SectionSkeleton />}><LazyCarteSection contenu={contenu} etablissement={etablissement} /></Suspense>;
        case SectionType.VIDEO:
            return <Suspense fallback={<SectionSkeleton />}><LazyVideoSection contenu={contenu} /></Suspense>;
        case SectionType.TELECHARGEMENTS:
            return <Suspense fallback={<SectionSkeleton />}><LazyTelechargementsSection contenu={contenu} /></Suspense>;
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
        case SectionType.TIMELINE:
            return <TimelineSection contenu={contenu} />;
        case SectionType.TABS:
            return <TabsSection contenu={contenu} />;
        case SectionType.NEWSLETTER:
            return <NewsletterSection contenu={contenu} codeEtablissement={codeEtablissement} />;
        case SectionType.PRIX_TAB:
            return <PrixTabSection contenu={contenu} />;
        case SectionType.ICONE_FEATURES:
            return <IconeFeaturesSection contenu={contenu} />;
        default:
            return <div className="text-center text-gray-400 py-8">Section non supportée</div>;
    }
}

// ==================================
// 1. HERO — Bannière principale avec parallaxe et pattern
// ==================================
function HeroSection({ contenu, theme }: { contenu: Record<string, any>; theme?: CmsTheme | null }) {
    const [scrollY, setScrollY] = useState(0);
    const heroRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div
            ref={heroRef}
            className="relative flex items-center justify-center overflow-hidden rounded-2xl text-center text-white"
            style={{
                minHeight: 'clamp(300px, 40vh, 600px)',
            }}
        >
            {/* Background avec parallaxe */}
            <div
                className="absolute inset-0"
                style={{
                    background: contenu.imageFond
                        ? `url(${contenu.imageFond}) center/cover no-repeat`
                        : `linear-gradient(135deg, var(--cms-primary), var(--cms-secondary))`,
                    transform: `translateY(${scrollY * 0.3}px)`,
                    willChange: 'transform',
                }}
            />
            {contenu.imageFond && <div className="absolute inset-0 bg-black/40" />}

            {/* Pattern overlay SVG */}
            <svg className="absolute inset-0 h-full w-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <pattern id="hero-dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                        <circle cx="2" cy="2" r="1.5" fill="white" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#hero-dots)" />
            </svg>

            {/* Contenu avec staggered entrance */}
            <div className="relative z-10 mx-auto max-w-3xl px-6 space-y-4">
                {contenu.surtitre && (
                    <p
                        className="text-sm font-medium uppercase tracking-wider opacity-80 transition-all duration-700 ease-out"
                        style={{
                            opacity: scrollY < 200 ? 0.8 : 0,
                            transform: `translateY(${Math.max(0, 20 - scrollY * 0.1)}px)`,
                        }}
                    >
                        {contenu.surtitre}
                    </p>
                )}
                <h1
                    className="font-bold leading-tight transition-all duration-700 ease-out"
                    style={{
                        fontSize: 'clamp(1.5rem, 1rem + 2.5vw, 3.5rem)',
                        fontFamily: 'var(--cms-font-title)',
                        textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                        opacity: scrollY < 300 ? 1 : 0,
                        transform: `translateY(${Math.max(0, 30 - scrollY * 0.15)}px)`,
                    }}
                >
                    {contenu.titre}
                </h1>
                {contenu.description && (
                    <p
                        className="mx-auto max-w-xl opacity-90 transition-all duration-700 ease-out"
                        style={{
                            fontSize: 'clamp(0.875rem, 0.8rem + 0.4vw, 1.25rem)',
                            opacity: scrollY < 350 ? 0.9 : 0,
                            transform: `translateY(${Math.max(0, 40 - scrollY * 0.12)}px)`,
                        }}
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
                                className="inline-flex items-center rounded-lg px-6 py-3 text-sm font-semibold transition-all duration-300 hover:scale-105"
                                style={{
                                    backgroundColor: btn.principal ? 'var(--cms-accent)' : 'rgba(255,255,255,0.2)',
                                    color: btn.principal ? 'var(--cms-text)' : '#fff',
                                    backdropFilter: btn.principal ? undefined : 'blur(4px)',
                                    opacity: scrollY < 400 ? 1 : 0,
                                    transform: `translateY(${Math.max(0, 50 - scrollY * 0.1)}px)`,
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
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(contenu.html || contenu.texte || '', DOMPURIFY_CONFIG) }}
        />
    );
}

// ==================================
// 3. GALERIE — Grille d'images
// ==================================
function GalerieSection({ contenu }: { contenu: Record<string, any> }) {
    const images: any[] = contenu.images || [];
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    const navigate = useCallback((dir: number) => {
        setLightboxIndex(prev => prev !== null ? (prev + dir + images.length) % images.length : null);
    }, [images.length]);

    // Fermer au Escape
    useEffect(() => {
        if (lightboxIndex === null) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setLightboxIndex(null);
            if (e.key === 'ArrowLeft') navigate(-1);
            if (e.key === 'ArrowRight') navigate(1);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [lightboxIndex, navigate]);

    return (
        <>
            {/* Grille responsive : 1/2/3/4 colonnes selon breakpoint */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {images.map((img: any, i: number) => (
                    <button
                        key={i}
                        type="button"
                        onClick={() => setLightboxIndex(i)}
                        className="group relative aspect-square cursor-zoom-in overflow-hidden rounded-xl"
                    >
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
                    </button>
                ))}
            </div>

            {/* Lightbox overlay */}
            {lightboxIndex !== null && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
                    onClick={() => setLightboxIndex(null)}
                >
                    {/* Bouton fermer */}
                    <button
                        type="button"
                        onClick={() => setLightboxIndex(null)}
                        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                    >
                        ✕
                    </button>

                    {/* Navigation prev/next */}
                    {images.length > 1 && (
                        <>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); navigate(-1); }}
                                className="absolute left-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                            >
                                ‹
                            </button>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); navigate(1); }}
                                className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                            >
                                ›
                            </button>
                        </>
                    )}

                    {/* Image */}
                    <img
                        src={images[lightboxIndex]?.url}
                        alt={images[lightboxIndex]?.alt || ''}
                        className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />

                    {/* Légende + compteur */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center text-white">
                        {images[lightboxIndex]?.legend && (
                            <p className="text-sm">{images[lightboxIndex].legend}</p>
                        )}
                        <p className="mt-1 text-xs opacity-60">{lightboxIndex + 1} / {images.length}</p>
                    </div>
                </div>
            )}
        </>
    );
}

// ==================================
// 4. CARTE_INFOS — Cartes d'information avec staggered reveal
// ==================================
function CarteInfosSection({ contenu }: { contenu: Record<string, any> }) {
    const cartes: any[] = contenu.cartes || [];
    const [ref, isVisible] = useInView({ threshold: 0.15 });
    return (
        <div ref={ref} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cartes.map((carte: any, i: number) => (
                <div
                    key={i}
                    className="rounded-xl border p-6 transition-all duration-500 ease-out hover:shadow-lg"
                    style={{
                        borderColor: 'var(--cms-primary, #e5e7eb)' + '30',
                        transitionDelay: isVisible ? `${i * 100}ms` : '0ms',
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                    }}
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
// 5. TEMOIGNAGES — Carrousel témoignages avec staggered reveal
// ==================================
function TemoignagesSection({ contenu }: { contenu: Record<string, any> }) {
    const temoignages: any[] = contenu.temoignages || [];
    const [ref, isVisible] = useInView({ threshold: 0.15 });
    return (
        <div ref={ref} className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {temoignages.map((t: any, i: number) => (
                <blockquote
                    key={i}
                    className="rounded-xl border-l-4 bg-gray-50 p-6 transition-all duration-500 ease-out dark:bg-gray-800/50"
                    style={{
                        borderLeftColor: 'var(--cms-primary)',
                        transitionDelay: isVisible ? `${i * 100}ms` : '0ms',
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                    }}
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
    const [ref, isVisible] = useInView({ threshold: 0.2 });

    return (
        <div ref={ref} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {chiffres.map((c: any, i: number) => (
                <div key={i} className="text-center space-y-2">
                    <div
                        className="text-4xl font-black transition-all duration-700"
                        style={{
                            color: 'var(--cms-primary)',
                            fontFamily: 'var(--cms-font-title)',
                            opacity: isVisible ? 1 : 0,
                            transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
                            transitionDelay: `${i * 150}ms`,
                        }}
                    >
                        {isVisible ? <CountUp value={c.valeur} /> : '0'}
                    </div>
                    <div
                        className="text-sm font-medium transition-all duration-500"
                        style={{
                            opacity: isVisible ? 0.7 : 0,
                            transitionDelay: `${i * 150 + 200}ms`,
                        }}
                    >
                        {c.label}
                    </div>
                    {c.description && (
                        <div
                            className="text-xs transition-all duration-500"
                            style={{
                                opacity: isVisible ? 0.5 : 0,
                                transitionDelay: `${i * 150 + 300}ms`,
                            }}
                        >
                            {c.description}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

// Composant CountUp — animation de compteur
function CountUp({ value }: { value: string }) {
    const [display, setDisplay] = useState(value);
    const numericMatch = value.match(/^(\d+)/);

    useEffect(() => {
        if (!numericMatch) {
            setDisplay(value);
            return;
        }

        const target = parseInt(numericMatch[1], 10);
        const suffix = value.replace(numericMatch[1], '');
        const duration = 1500;
        const steps = 40;
        const stepTime = duration / steps;
        let current = 0;
        let step = 0;

        const timer = setInterval(() => {
            step++;
            // Easing: decelerate
            const progress = 1 - Math.pow(1 - step / steps, 3);
            current = Math.round(target * progress);
            setDisplay(`${current}${suffix}`);
            if (step >= steps) {
                setDisplay(value);
                clearInterval(timer);
            }
        }, stepTime);

        return () => clearInterval(timer);
    }, [value]);

    return <span>{display}</span>;
}

// ==================================
// 7. EQUIPE — Grille membres avec hover avancé et liens sociaux
// ==================================
function EquipeSection({ contenu }: { contenu: Record<string, any> }) {
    const membres: any[] = contenu.membres || [];
    const [ref, isVisible] = useInView({ threshold: 0.15 });
    return (
        <div ref={ref} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {membres.map((m: any, i: number) => (
                <div
                    key={i}
                    className="group text-center space-y-3 rounded-xl p-4 transition-all duration-500 ease-out hover:bg-gray-50 hover:shadow-lg dark:hover:bg-gray-800/50"
                    style={{
                        transitionDelay: isVisible ? `${i * 100}ms` : '0ms',
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.98)',
                    }}
                >
                    {m.photo ? (
                        <img
                            src={m.photo}
                            alt={m.nom}
                            className="mx-auto h-24 w-24 rounded-full object-cover ring-2 transition-transform duration-300 group-hover:scale-105"
                            style={{ ringColor: 'var(--cms-primary)' + '30' }}
                        />
                    ) : (
                        <div
                            className="mx-auto flex h-24 w-24 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-105"
                            style={{ backgroundColor: 'var(--cms-primary)' + '20' }}
                        >
                            <svg className="h-10 w-10" style={{ color: 'var(--cms-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                            </svg>
                        </div>
                    )}
                    <div>
                        <h4 className="font-bold">{m.nom}</h4>
                        <span
                            className="inline-block mt-1 rounded-full px-3 py-0.5 text-xs font-medium text-white"
                            style={{ backgroundColor: 'var(--cms-primary)' }}
                        >
                            {m.fonction}
                        </span>
                    </div>
                    {m.bio && <p className="text-xs opacity-50">{m.bio}</p>}
                    {/* Liens sociaux du membre */}
                    {(m.email || m.linkedin || m.twitter) && (
                        <div className="flex justify-center gap-2 pt-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                            {m.email && (
                                <a href={`mailto:${m.email}`} className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700" title="Email">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                    </svg>
                                </a>
                            )}
                            {m.linkedin && (
                                <a href={m.linkedin} target="_blank" rel="noopener noreferrer" className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-gray-700" title="LinkedIn">
                                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                    </svg>
                                </a>
                            )}
                            {m.twitter && (
                                <a href={m.twitter} target="_blank" rel="noopener noreferrer" className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-700" title="Twitter">
                                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                    </svg>
                                </a>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

// ==================================
// 8. FORMULAIRE — Contact public avec progress indicator
// ==================================
function FormulaireSection({ contenu, codeEtablissement }: { contenu: Record<string, any>; codeEtablissement: string }) {
    const [envoye, setEnvoye] = useState(false);
    const [erreur, setErreur] = useState('');
    const [chargement, setChargement] = useState(false);
    const [form, setForm] = useState(() => {
        if (typeof window === 'undefined') return { nom: '', email: '', sujet: '', message: '' };
        try {
            const saved = localStorage.getItem(`cms-form-${codeEtablissement}`);
            return saved ? JSON.parse(saved) : { nom: '', email: '', sujet: '', message: '' };
        } catch { return { nom: '', email: '', sujet: '', message: '' }; }
    });
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [honeypot, setHoneypot] = useState('');

    // Auto-save draft to localStorage
    const isInitialMount = useRef(true);
    useEffect(() => {
        if (isInitialMount.current) { isInitialMount.current = false; return; }
        try { localStorage.setItem(`cms-form-${codeEtablissement}`, JSON.stringify(form)); } catch {}
    }, [form, codeEtablissement]);

    // Progress calculation
    const fields = ['nom', 'email', 'sujet', 'message'];
    const filledCount = fields.filter(f => (form as any)[f]?.trim()).length;
    const progress = (filledCount / fields.length) * 100;

    // Validation en temps réel
    const errors: Record<string, string> = {};
    if (form.nom && form.nom.length < 2) errors.nom = 'Le nom doit contenir au moins 2 caractères';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Adresse email invalide';
    if (form.sujet && form.sujet.length < 3) errors.sujet = 'Le sujet doit contenir au moins 3 caractères';
    if (form.message && form.message.length < 10) errors.message = 'Le message doit contenir au moins 10 caractères';

    const isValid = form.nom && form.email && form.sujet && form.message && Object.keys(errors).length === 0;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!isValid) return;
        if (honeypot) return;

        setChargement(true);
        setErreur('');
        try {
            await envoyerContactPublic(codeEtablissement, form);
            setEnvoye(true);
            try { localStorage.removeItem(`cms-form-${codeEtablissement}`); } catch {}
        } catch {
            setErreur('Erreur lors de l\'envoi. Veuillez réessayer.');
        } finally {
            setChargement(false);
        }
    };

    const handleBlur = (field: string) => {
        setTouched(prev => ({ ...prev, [field]: true }));
    };

    const inputClass = (field: string) => `
        w-full rounded-lg border px-4 py-3 text-sm outline-none transition-colors
        dark:bg-gray-800 dark:text-white
        ${touched[field] && errors[field]
            ? 'border-red-400 focus:ring-2 focus:ring-red-200 dark:border-red-500'
            : touched[field] && !errors[field] && form[field as keyof typeof form]
                ? 'border-green-400 focus:ring-2 focus:ring-green-200 dark:border-green-500'
                : 'border-gray-300 focus:ring-2 dark:border-gray-600'
        }
    `.trim();

    if (envoye) {
        return (
            <div className="rounded-xl bg-green-50 p-8 text-center dark:bg-green-900/20">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                    <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                </div>
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
            {/* Barre de progression */}
            <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-500">
                    <span>Progression</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                            width: `${progress}%`,
                            backgroundColor: progress === 100 ? '#22c55e' : 'var(--cms-primary)',
                        }}
                    />
                </div>
            </div>

            {contenu.description && (
                <p className="text-center text-sm text-gray-600 dark:text-gray-400">{contenu.description}</p>
            )}

            {/* Honeypot anti-spam (caché) */}
            <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                className="absolute -left-[9999px] opacity-0"
                aria-hidden="true"
            />

            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <input
                        name="nom"
                        placeholder="Votre nom *"
                        value={form.nom}
                        onChange={(e) => setForm(f => ({ ...f, nom: e.target.value }))}
                        onBlur={() => handleBlur('nom')}
                        className={inputClass('nom')}
                        style={{ focusRingColor: 'var(--cms-primary)' }}
                    />
                    {touched.nom && errors.nom && (
                        <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.nom}</p>
                    )}
                </div>
                <div>
                    <input
                        name="email"
                        type="email"
                        placeholder="Votre email *"
                        value={form.email}
                        onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                        onBlur={() => handleBlur('email')}
                        className={inputClass('email')}
                    />
                    {touched.email && errors.email && (
                        <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.email}</p>
                    )}
                </div>
            </div>
            <div>
                <input
                    name="sujet"
                    placeholder="Sujet *"
                    value={form.sujet}
                    onChange={(e) => setForm(f => ({ ...f, sujet: e.target.value }))}
                    onBlur={() => handleBlur('sujet')}
                    className={inputClass('sujet')}
                />
                {touched.sujet && errors.sujet && (
                    <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.sujet}</p>
                )}
            </div>
            <div>
                <textarea
                    name="message"
                    rows={5}
                    placeholder="Votre message... *"
                    value={form.message}
                    onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
                    onBlur={() => handleBlur('message')}
                    className={inputClass('message')}
                />
                <div className="mt-1 flex justify-between">
                    {touched.message && errors.message ? (
                        <p className="text-xs text-red-500 dark:text-red-400">{errors.message}</p>
                    ) : <span />}
                    <span className={`text-xs ${form.message.length > 900 ? 'text-red-500' : 'text-gray-400'}`}>
                        {form.message.length}/1000
                    </span>
                </div>
            </div>
            {erreur && <p className="text-sm text-red-500 dark:text-red-400">{erreur}</p>}
            <button
                type="submit"
                disabled={chargement || !isValid}
                className="w-full rounded-lg px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: 'var(--cms-primary)' }}
            >
                {chargement ? (
                    <span className="inline-flex items-center gap-2">
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Envoi en cours...
                    </span>
                ) : 'Envoyer le message'}
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
// 12. ACTUALITES — Liste d'actualités avec staggered reveal
// ==================================
function ActualitesSection({ contenu }: { contenu: Record<string, any> }) {
    const actualites: any[] = contenu.actualites || [];
    const [ref, isVisible] = useInView({ threshold: 0.15 });
    return (
        <div ref={ref} className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {actualites.map((a: any, i: number) => (
                <article
                    key={i}
                    className="overflow-hidden rounded-xl border transition-all duration-500 ease-out hover:shadow-md"
                    style={{
                        borderColor: 'var(--cms-primary)' + '20',
                        transitionDelay: isVisible ? `${i * 100}ms` : '0ms',
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                    }}
                >
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
// 15. FAQ — Accordéon avec animation smooth
// ==================================
function FaqSection({ contenu, theme }: { contenu: Record<string, any>; theme?: CmsTheme | null }) {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const faqs: any[] = contenu.faqs || [];
    const contentRefs = useRef<(HTMLDivElement | null)[]>([]);

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
                        aria-expanded={openIndex === i}
                    >
                        <span className="pr-4">{faq.question}</span>
                        <span
                            className="ml-4 shrink-0 text-xl transition-transform duration-300"
                            style={{ transform: openIndex === i ? 'rotate(180deg)' : 'rotate(0deg)' }}
                        >
                            ▾
                        </span>
                    </button>
                    <div
                        ref={el => { contentRefs.current[i] = el; }}
                        className="overflow-hidden transition-all duration-300 ease-in-out"
                        style={{
                            maxHeight: openIndex === i ? (contentRefs.current[i]?.scrollHeight || 500) + 'px' : '0px',
                            opacity: openIndex === i ? 1 : 0,
                        }}
                    >
                        <div className="px-6 pb-4 text-sm leading-relaxed" style={{ color: 'var(--cms-text-light)' }}>
                            {faq.reponse}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ==================================
// 16. APPEL_ACTION — Bannière CTA avec pattern dynamique
// ==================================
function AppelActionSection({ contenu, theme }: { contenu: Record<string, any>; theme?: CmsTheme | null }) {
    return (
        <div
            className="relative overflow-hidden rounded-2xl p-8 text-center text-white"
            style={{
                background: contenu.imageFond
                    ? `linear-gradient(135deg, var(--cms-primary)dd, var(--cms-secondary)dd), url(${contenu.imageFond}) center/cover`
                    : `linear-gradient(135deg, var(--cms-primary), var(--cms-secondary))`,
                padding: 'clamp(2rem, 1.5rem + 2vw, 4rem)',
            }}
        >
            {/* Pattern SVG overlay */}
            <svg className="absolute inset-0 h-full w-full opacity-10" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <pattern id="cta-waves" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M0 20 Q10 10 20 20 Q30 30 40 20" fill="none" stroke="white" strokeWidth="1.5" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#cta-waves)" />
            </svg>

            {/* Contenu */}
            <div className="relative z-10">
                {contenu.icone && (
                    <span className="mb-3 inline-block text-4xl">{contenu.icone}</span>
                )}
                <h3
                    className="mb-3 font-bold"
                    style={{
                        fontSize: 'clamp(1.125rem, 1rem + 0.8vw, 1.75rem)',
                        fontFamily: 'var(--cms-font-title)',
                    }}
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
                        className="inline-flex items-center rounded-lg bg-white px-8 py-3 text-sm font-bold transition-all duration-300 hover:scale-105 hover:shadow-lg"
                        style={{ color: 'var(--cms-primary)' }}
                    >
                        {contenu.bouton.label}
                    </a>
                )}
            </div>
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
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(contenu.html || '', DOMPURIFY_CONFIG) }}
        />
    );
}

// ==================================
// 19. HERO_VIDEO — Hero avec vidéo arrière-plan
// ==================================
function HeroVideoSection({ contenu }: { contenu: Record<string, any> }) {
    const [scrollY, setScrollY] = useState(0);
    useEffect(() => {
        const h = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', h, { passive: true });
        return () => window.removeEventListener('scroll', h);
    }, []);

    const opacity = Math.max(0, 1 - scrollY / 600);

    return (
        <div
            className="relative flex items-center justify-center overflow-hidden rounded-2xl"
            style={{ height: contenu.hauteur || 'clamp(400px, 60vh, 700px)', opacity }}
        >
            {contenu.videoUrl ? (
                <video
                    autoPlay muted loop playsInline
                    className="absolute inset-0 h-full w-full object-cover"
                >
                    <source src={contenu.videoUrl} type="video/mp4" />
                </video>
            ) : (
                <div
                    className="absolute inset-0"
                    style={{ background: `linear-gradient(135deg, var(--cms-primary), var(--cms-secondary))` }}
                />
            )}
            {contenu.overlay !== false && (
                <div className="absolute inset-0 bg-black" style={{ opacity: contenu.overlayOpacity || 0.5 }} />
            )}
            <div className="relative z-10 mx-auto max-w-3xl px-6 text-center text-white space-y-4">
                {contenu.titre && (
                    <h1
                        className="font-bold leading-tight"
                        style={{
                            fontSize: 'clamp(1.5rem, 1rem + 3vw, 3.5rem)',
                            fontFamily: 'var(--cms-font-title)',
                            textShadow: '0 2px 12px rgba(0,0,0,0.4)',
                        }}
                    >
                        {contenu.titre}
                    </h1>
                )}
                {contenu.sousTitre && (
                    <p className="opacity-90" style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.5vw, 1.25rem)' }}>
                        {contenu.sousTitre}
                    </p>
                )}
                {contenu.boutonTexte && (
                    <a
                        href={contenu.boutonLien || '#'}
                        className="inline-block rounded-lg bg-white px-8 py-3 text-sm font-bold shadow-lg transition-all hover:scale-105"
                        style={{ color: 'var(--cms-primary)' }}
                    >
                        {contenu.boutonTexte}
                    </a>
                )}
            </div>
        </div>
    );
}

// ==================================
// 20. CAROUSEL — Carrousel interactif avec autoplay
// ==================================
function CarouselSection({ contenu }: { contenu: Record<string, any> }) {
    const slides: any[] = contenu.slides || [];
    const [current, setCurrent] = useState(0);
    const autoplay = contenu.autoplay !== false;
    const interval = contenu.interval || 5000;

    useEffect(() => {
        if (!autoplay || slides.length <= 1) return;
        const timer = setInterval(() => setCurrent(c => (c + 1) % slides.length), interval);
        return () => clearInterval(timer);
    }, [autoplay, interval, slides.length]);

    const navigate = (dir: number) => setCurrent(c => (c + dir + slides.length) % slides.length);

    if (slides.length === 0) return <div className="py-12 text-center text-gray-400">Aucun slide</div>;

    return (
        <div className="relative w-full overflow-hidden rounded-xl" style={{ height: contenu.hauteur || 'clamp(250px, 40vh, 500px)' }}>
            {slides.map((slide, i) => (
                <div
                    key={i}
                    className="absolute inset-0 transition-opacity duration-700 ease-in-out"
                    style={{ opacity: i === current ? 1 : 0, zIndex: i === current ? 1 : 0 }}
                >
                    {slide.imageUrl ? (
                        <img src={slide.imageUrl} alt={slide.titre || ''} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                        <div className="flex h-full items-center justify-center" style={{ background: `linear-gradient(135deg, var(--cms-primary)30, var(--cms-secondary)30)` }}>
                            <span className="text-4xl opacity-20">🖼</span>
                        </div>
                    )}
                    {(slide.titre || slide.description) && (
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-6 text-white">
                            {slide.titre && <h3 className="text-xl font-bold">{slide.titre}</h3>}
                            {slide.description && <p className="mt-1 text-sm opacity-90">{slide.description}</p>}
                            {slide.lien && <a href={slide.lien} className="mt-2 inline-block text-sm font-medium underline">En savoir plus →</a>}
                        </div>
                    )}
                </div>
            ))}
            {slides.length > 1 && (
                <>
                    <button onClick={() => navigate(-1)} className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow backdrop-blur-sm transition hover:bg-white" aria-label="Précédent">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button onClick={() => navigate(1)} className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow backdrop-blur-sm transition hover:bg-white" aria-label="Suivant">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                    <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-2">
                        {slides.map((_, i) => (
                            <button key={i} onClick={() => setCurrent(i)} className={`h-2.5 w-2.5 rounded-full transition-all ${i === current ? 'bg-white scale-125' : 'bg-white/50'}`} aria-label={`Slide ${i + 1}`} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

// ==================================
// 21. TIMELINE — Chronologie avec staggered reveal
// ==================================
function TimelineSection({ contenu }: { contenu: Record<string, any> }) {
    const items: any[] = contenu.items || [];
    const orientation = contenu.orientation || 'vertical';
    const [ref, isVisible] = useInView({ threshold: 0.1 });

    if (orientation === 'horizontal') {
        return (
            <div className="overflow-x-auto pb-4">
                <div className="flex gap-6 min-w-max px-4">
                    {items.map((item, i) => (
                        <div key={i} className="min-w-[200px] max-w-[280px] rounded-xl border p-5 transition-all duration-500" style={{ borderColor: 'var(--cms-primary)' + '20', transitionDelay: isVisible ? `${i * 100}ms` : '0ms', opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(20px)' }}>
                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full text-xl" style={{ backgroundColor: 'var(--cms-primary)' + '15' }}>
                                {item.icone || '📌'}
                            </div>
                            <span className="text-xs font-bold" style={{ color: 'var(--cms-primary)' }}>{item.date}</span>
                            <h4 className="mt-1 font-bold">{item.titre}</h4>
                            {item.description && <p className="mt-1 text-sm opacity-70">{item.description}</p>}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div ref={ref} className="relative mx-auto max-w-3xl">
            <div className="absolute left-6 top-0 h-full w-0.5" style={{ backgroundColor: 'var(--cms-primary)' + '20' }} />
            {items.map((item, i) => (
                <div
                    key={i}
                    className="relative pl-16 pb-10 transition-all duration-500"
                    style={{ transitionDelay: isVisible ? `${i * 120}ms` : '0ms', opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateX(0)' : 'translateX(-20px)' }}
                >
                    <div
                        className="absolute left-3 top-1 flex h-8 w-8 items-center justify-center rounded-full text-sm ring-4"
                        style={{ backgroundColor: 'var(--cms-primary)', color: 'white', ringColor: 'var(--cms-primary)' + '20' }}
                    >
                        {item.icone || '📌'}
                    </div>
                    <span className="text-xs font-bold" style={{ color: 'var(--cms-primary)' }}>{item.date}</span>
                    <h4 className="mt-1 text-lg font-bold">{item.titre}</h4>
                    {item.description && <p className="mt-1 text-sm opacity-70">{item.description}</p>}
                </div>
            ))}
        </div>
    );
}

// ==================================
// 22. TABS — Onglets interactifs
// ==================================
function TabsSection({ contenu }: { contenu: Record<string, any> }) {
    const tabs: any[] = contenu.tabs || [];
    const [activeTab, setActiveTab] = useState(0);
    const style = contenu.style || 'underline';

    if (tabs.length === 0) return null;

    return (
        <div className="w-full">
            <div className={`flex flex-wrap gap-1 border-b ${style === 'pills' ? 'gap-2 border-none' : ''} ${style === 'boxed' ? 'rounded-t-lg bg-gray-50 p-1 dark:bg-gray-800' : ''}`}>
                {tabs.map((tab, i) => (
                    <button
                        key={i}
                        onClick={() => setActiveTab(i)}
                        className={`px-4 py-2.5 text-sm font-medium transition-all duration-200
                            ${i === activeTab
                                ? style === 'pills' ? 'rounded-full text-white shadow-sm'
                                    : style === 'boxed' ? 'rounded-t bg-white shadow-sm'
                                    : 'border-b-2'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                        style={i === activeTab ? {
                            backgroundColor: style === 'pills' ? 'var(--cms-primary)' : undefined,
                            color: style === 'pills' ? 'white' : 'var(--cms-primary)',
                            borderColor: style === 'underline' ? 'var(--cms-primary)' : undefined,
                        } : undefined}
                    >
                        {tab.icone && <span className="mr-1.5">{tab.icone}</span>}
                        {tab.label}
                    </button>
                ))}
            </div>
            <div
                className="prose max-w-none py-5"
                style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.3vw, 1rem)' }}
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(tabs[activeTab]?.contenu || '', DOMPURIFY_CONFIG) }}
            />
        </div>
    );
}

// ==================================
// 23. NEWSLETTER — Formulaire d'abonnement fonctionnel
// ==================================
function NewsletterSection({ contenu, codeEtablissement }: { contenu: Record<string, any>; codeEtablissement: string }) {
    const [email, setEmail] = useState('');
    const [nom, setNom] = useState('');
    const [envoye, setEnvoye] = useState(false);
    const [erreur, setErreur] = useState('');
    const [chargement, setChargement] = useState(false);
    const [honeypot, setHoneypot] = useState('');

    const bg = contenu.background || 'primary';
    const bgClass = bg === 'dark' ? 'bg-gray-900 text-white' : bg === 'primary' ? '' : 'bg-gray-50 text-gray-900 dark:bg-gray-800 dark:text-white';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || honeypot) return;
        setChargement(true);
        setErreur('');
        try {
            const { envoyerNewsletterPublic } = await import('../hooks/use-cms-public');
            await envoyerNewsletterPublic(codeEtablissement, { email, nom: nom || undefined });
            setEnvoye(true);
        } catch {
            setErreur('Erreur lors de l\'inscription. Veuillez réessayer.');
        } finally {
            setChargement(false);
        }
    };

    if (envoye) {
        return (
            <div className={`rounded-xl p-8 text-center ${bgClass}`} style={bg === 'primary' ? { backgroundColor: 'var(--cms-primary)' } : undefined}>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                </div>
                <p className="text-lg font-bold">Inscription confirmée !</p>
                <p className="mt-2 text-sm opacity-80">Vous recevrez bientôt de nos nouvelles.</p>
            </div>
        );
    }

    return (
        <div className={`rounded-xl p-8 text-center ${bgClass}`} style={bg === 'primary' ? { backgroundColor: 'var(--cms-primary)', color: 'white' } : undefined}>
            {contenu.titre && <h3 className="text-2xl font-bold" style={{ fontFamily: 'var(--cms-font-title)' }}>{contenu.titre}</h3>}
            {contenu.description && <p className="mt-2 opacity-80">{contenu.description}</p>}
            <form onSubmit={handleSubmit} className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <input type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={e => setHoneypot(e.target.value)} className="absolute -left-[9999px] opacity-0" aria-hidden="true" />
                {contenu.showNom && (
                    <input type="text" placeholder="Votre nom" value={nom} onChange={e => setNom(e.target.value)} className="rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-sm placeholder-white/50 outline-none focus:ring-2 focus:ring-white/30" />
                )}
                <input type="email" placeholder={contenu.placeholder || 'votre@email.com'} value={email} onChange={e => setEmail(e.target.value)} required className="rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-sm placeholder-white/50 outline-none focus:ring-2 focus:ring-white/30" />
                <button type="submit" disabled={chargement} className="rounded-lg bg-white px-6 py-2.5 text-sm font-semibold shadow transition-all hover:scale-105 disabled:opacity-50" style={{ color: 'var(--cms-primary)' }}>
                    {chargement ? '...' : (contenu.boutonTexte || "S'inscrire")}
                </button>
            </form>
            {erreur && <p className="mt-3 text-sm text-red-300">{erreur}</p>}
        </div>
    );
}

// ==================================
// 24. COMPTEURS_ANIMES — Statistiques avec animation
// ==================================
function CompteursAnimesSection({ contenu }: { contenu: Record<string, any> }) {
    const items: any[] = contenu.items || [];
    const columns = contenu.columns || 4;
    const bg = contenu.background || 'light';
    const [ref, isVisible] = useInView({ threshold: 0.2 });

    const bgClass = bg === 'dark' ? 'bg-gray-900 text-white' : bg === 'primary' ? '' : 'bg-gray-50 text-gray-900 dark:bg-gray-800 dark:text-white';

    return (
        <div ref={ref} className={`rounded-xl p-8 ${bgClass}`} style={bg === 'primary' ? { backgroundColor: 'var(--cms-primary)', color: 'white' } : undefined}>
            <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${Math.min(columns, 4)}, 1fr)` }}>
                {items.map((item, i) => (
                    <div key={i} className="text-center transition-all duration-700" style={{ transitionDelay: `${i * 150}ms`, opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.9)' }}>
                        {item.icone && <div className="mb-2 text-3xl">{item.icone}</div>}
                        <div className="text-3xl font-bold md:text-4xl">
                            {isVisible ? <CountUp value={`${item.prefix || ''}${item.valeur}${item.suffix || ''}`} /> : '0'}
                        </div>
                        <div className="mt-1 text-sm opacity-80">{item.label}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ==================================
// 25. TEMOIGNAGE_CAROUSEL — Carrousel témoignages auto-rotatif
// ==================================
function TemoignageCarouselSection({ contenu }: { contenu: Record<string, any> }) {
    const temoignages: any[] = contenu.temoignages || [];
    const [current, setCurrent] = useState(0);
    const autoplay = contenu.autoplay !== false;

    useEffect(() => {
        if (!autoplay || temoignages.length <= 1) return;
        const timer = setInterval(() => setCurrent(c => (c + 1) % temoignages.length), 6000);
        return () => clearInterval(timer);
    }, [autoplay, temoignages.length]);

    if (temoignages.length === 0) return <div className="py-8 text-center text-gray-400">Aucun témoignage</div>;

    const t = temoignages[current];

    return (
        <div className="mx-auto max-w-2xl py-6 text-center">
            <div className="text-5xl leading-none" style={{ color: 'var(--cms-primary)' + '40' }}>«</div>
            <p className="my-4 text-lg italic" style={{ fontSize: 'clamp(0.95rem, 0.85rem + 0.4vw, 1.2rem)' }}>
                {t.contenu}
            </p>
            <div className="flex items-center justify-center gap-3">
                {t.avatar ? (
                    <img src={t.avatar} alt={t.nom} className="h-12 w-12 rounded-full object-cover ring-2" style={{ ringColor: 'var(--cms-primary)' + '30' }} />
                ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold" style={{ backgroundColor: 'var(--cms-primary)' + '15', color: 'var(--cms-primary)' }}>
                        {t.nom?.charAt(0) || '?'}
                    </div>
                )}
                <div className="text-left">
                    <div className="font-bold">{t.nom}</div>
                    {t.fonction && <div className="text-sm opacity-60">{t.fonction}</div>}
                </div>
            </div>
            {t.note > 0 && (
                <div className="mt-3" style={{ color: '#f59e0b' }}>
                    {'★'.repeat(t.note)}{'☆'.repeat(5 - t.note)}
                </div>
            )}
            {temoignages.length > 1 && (
                <div className="mt-4 flex justify-center gap-2">
                    {temoignages.map((_, i) => (
                        <button key={i} onClick={() => setCurrent(i)} className={`h-2.5 w-2.5 rounded-full transition-all ${i === current ? 'scale-125' : 'opacity-40'}`} style={{ backgroundColor: i === current ? 'var(--cms-primary)' : 'var(--cms-primary)' + '40' }} aria-label={`Témoignage ${i + 1}`} />
                    ))}
                </div>
            )}
        </div>
    );
}

// ==================================
// 26. PRIX_TAB — Grille tarifaire
// ==================================
function PrixTabSection({ contenu }: { contenu: Record<string, any> }) {
    const plans: any[] = contenu.plans || [];
    const [ref, isVisible] = useInView({ threshold: 0.1 });

    return (
        <div ref={ref} className="py-4">
            {contenu.titre && <h3 className="mb-2 text-center text-2xl font-bold" style={{ fontFamily: 'var(--cms-font-title)' }}>{contenu.titre}</h3>}
            {contenu.sousTitre && <p className="mb-8 text-center text-sm opacity-60">{contenu.sousTitre}</p>}
            <div className="grid gap-6 md:grid-cols-3">
                {plans.map((plan, i) => {
                    const features = typeof plan.features === 'string' ? plan.features.split(',').map((f: string) => f.trim()) : (plan.features || []);
                    return (
                        <div
                            key={i}
                            className={`relative rounded-xl border p-6 text-center transition-all duration-500 ${plan.highlight ? 'scale-105 shadow-lg' : ''}`}
                            style={{
                                borderColor: plan.highlight ? 'var(--cms-primary)' : 'var(--cms-primary)' + '20',
                                transitionDelay: isVisible ? `${i * 100}ms` : '0ms',
                                opacity: isVisible ? 1 : 0,
                                transform: isVisible ? `translateY(0) ${plan.highlight ? 'scale(1.05)' : 'scale(1)'}` : 'translateY(20px)',
                            }}
                        >
                            {plan.highlight && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-bold text-white" style={{ backgroundColor: 'var(--cms-primary)' }}>
                                    Populaire
                                </div>
                            )}
                            <h4 className="text-lg font-bold">{plan.nom}</h4>
                            <div className="mt-4 text-3xl font-black" style={{ color: 'var(--cms-primary)' }}>
                                {plan.prix}
                                {plan.periode && <span className="text-sm font-normal opacity-50">{plan.periode}</span>}
                            </div>
                            <ul className="mt-6 space-y-2 text-sm">
                                {features.map((f: string, j: number) => (
                                    <li key={j} className="flex items-center gap-2">
                                        <span className="text-green-500">✓</span> {f}
                                    </li>
                                ))}
                            </ul>
                            <button
                                className={`mt-6 w-full rounded-lg py-2.5 text-sm font-semibold transition-all hover:scale-105 ${plan.highlight ? 'text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-white'}`}
                                style={plan.highlight ? { backgroundColor: 'var(--cms-primary)' } : undefined}
                            >
                                {plan.boutonTexte || 'Choisir'}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ==================================
// 27. ICONE_FEATURES — Grille de fonctionnalités
// ==================================
function IconeFeaturesSection({ contenu }: { contenu: Record<string, any> }) {
    const features: any[] = contenu.features || [];
    const columns = contenu.columns || 3;
    const centered = contenu.centered !== false;
    const [ref, isVisible] = useInView({ threshold: 0.1 });

    return (
        <div ref={ref} className="grid gap-6" style={{ gridTemplateColumns: `repeat(${Math.min(columns, 4)}, 1fr)` }}>
            {features.map((f, i) => (
                <div
                    key={i}
                    className={`rounded-xl p-6 transition-all duration-500 hover:shadow-md ${centered ? 'text-center' : ''}`}
                    style={{
                        transitionDelay: isVisible ? `${i * 80}ms` : '0ms',
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? 'translateY(0)' : 'translateY(15px)',
                    }}
                >
                    <div className="mb-3 text-3xl">{f.icone || '✨'}</div>
                    <h3 className="font-bold" style={{ fontFamily: 'var(--cms-font-title)' }}>{f.titre}</h3>
                    <p className="mt-2 text-sm opacity-70">{f.description}</p>
                </div>
            ))}
        </div>
    );
}

// ==================================
// 28. GALERIE_MASONRY — Galerie masonry avec lightbox
// ==================================
function GalerieMasonrySection({ contenu }: { contenu: Record<string, any> }) {
    const images: any[] = contenu.images || [];
    const columns = contenu.columns || 3;
    const gap = contenu.gap || '8px';
    const borderRadius = contenu.borderRadius || '12px';
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    const heightMap: Record<string, string> = { small: '200px', medium: '280px', large: '360px' };

    useEffect(() => {
        if (lightboxIndex === null) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightboxIndex(null); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [lightboxIndex]);

    return (
        <>
            <div className="w-full" style={{ columnCount: columns, columnGap: gap }}>
                {images.map((img, i) => (
                    <button
                        key={i}
                        type="button"
                        onClick={() => setLightboxIndex(i)}
                        className="mb-2 block w-full cursor-zoom-in overflow-hidden transition-transform hover:scale-[1.02]"
                        style={{ height: heightMap[img.span || 'small'], borderRadius, breakInside: 'avoid' }}
                    >
                        {img.url ? (
                            <img src={img.url} alt={img.alt || ''} className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                            <div className="flex h-full items-center justify-center bg-gray-100 text-3xl text-gray-300 dark:bg-gray-800">🖼</div>
                        )}
                    </button>
                ))}
            </div>
            {lightboxIndex !== null && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4" onClick={() => setLightboxIndex(null)}>
                    <button type="button" onClick={() => setLightboxIndex(null)} className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20">✕</button>
                    <img src={images[lightboxIndex]?.url} alt={images[lightboxIndex]?.alt || ''} className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain" onClick={e => e.stopPropagation()} />
                    <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white opacity-60">{lightboxIndex + 1} / {images.length}</p>
                </div>
            )}
        </>
    );
}
