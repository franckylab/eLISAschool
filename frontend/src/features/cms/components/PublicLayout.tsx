/**
 * ==================================
 * eLISAschool - Layout public pour pages établissement
 * ==================================
 * Version: 3.0.0
 * Auteur: franck arlos chendjou
 * 
 * Layout sans auth pour les pages publiques /e/:code.
 * Header sticky scroll-aware + Footer dynamique avec widgets CMS.
 * Dark mode avec toggle, menu mobile hamburger, breadcrumbs.
 * Thème appliqué depuis CmsTheme via variables CSS.
 * Scroll-to-top button, icônes SVG réseaux sociaux.
 */

import { useMemo, useState, useEffect, useRef, type ReactNode } from 'react';
import { Outlet, Link, useLocation } from '@tanstack/react-router';
import type { EtablissementPublic, CmsTheme, CmsMenu, CmsMenuItem, CmsWidget } from '../types/cms.types';
import { EmplacementMenu } from '../types/cms.types';

interface PublicLayoutProps {
    etablissement: EtablissementPublic;
    theme?: CmsTheme | null;
    menus?: CmsMenu[];
    widgets?: CmsWidget[];
    children?: ReactNode;
}

export function PublicLayout({ etablissement, theme, menus = [], widgets = [], children }: PublicLayoutProps) {
    const [darkMode, setDarkMode] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [scrollToTopVisible, setScrollToTopVisible] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);
    const lastScrollY = useRef(0);
    const [headerHidden, setHeaderHidden] = useState(false);

    // Appliquer la classe dark au document
    useEffect(() => {
        document.documentElement.classList.toggle('dark', darkMode);
    }, [darkMode]);

    // Scroll tracking : header shrink + hide/show + scroll-to-top + progress
    useEffect(() => {
        const handleScroll = () => {
            const y = window.scrollY;
            setScrolled(y > 20);
            setScrollToTopVisible(y > 300);
            // Progress bar
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            if (docHeight > 0) setScrollProgress(Math.min((y / docHeight) * 100, 100));
            // Hide header on scroll down, show on scroll up (after 100px)
            if (y > 100) {
                setHeaderHidden(y > lastScrollY.current && y > 200);
            } else {
                setHeaderHidden(false);
            }
            lastScrollY.current = y;
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Fermer le menu mobile au resize
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) setMobileMenuOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fermer le menu mobile au changement de route + scroll to top
    const location = useLocation();
    useEffect(() => {
        setMobileMenuOpen(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [location.pathname]);

    // Variables CSS du thème
    const themeStyles = useMemo(() => {
        if (!theme?.couleurs) return {};
        return {
            '--cms-primary': theme.couleurs.primaire || '#28a745',
            '--cms-secondary': theme.couleurs.secondaire || '#007bff',
            '--cms-accent': theme.couleurs.accent || '#ffc107',
            '--cms-bg': theme.couleurs.fond || '#ffffff',
            '--cms-text': theme.couleurs.texte || '#1a1a2e',
            '--cms-text-light': theme.couleurs.texteClair || '#6c757d',
            '--cms-font-title': theme.typographie?.titre || "'Inter', sans-serif",
            '--cms-font-body': theme.typographie?.corps || "'Inter', sans-serif",
        } as Record<string, string>;
    }, [theme]);

    const menuPrincipal = menus.find(m => m.emplacement === EmplacementMenu.PRINCIPAL);
    const menuPiedPage = menus.find(m => m.emplacement === EmplacementMenu.PIED_PAGE);

    // Widgets actifs pour le footer dynamique (triés par ordre)
    const widgetsFooter = widgets
        .filter(w => w.actif && w.emplacement === 'pied_page')
        .sort((a, b) => a.ordre - b.ordre);
    const hasWidgets = widgetsFooter.length > 0;

    // Grille adaptative : 1 col mobile, 2 cols tablette, N cols desktop (selon nb widgets + 1 info)
    const grilleCols = hasWidgets
        ? ['lg:grid-cols-2', 'lg:grid-cols-3', 'lg:grid-cols-4', 'lg:grid-cols-5', 'lg:grid-cols-6'][Math.min(widgetsFooter.length, 4)]
        : 'md:grid-cols-3';

    const code = etablissement.codeEtablissement;

    return (
        <div
            className="min-h-screen flex flex-col bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100"
            style={{
                ...themeStyles,
                fontFamily: 'var(--cms-font-body, Inter, sans-serif)',
            }}
        >
            {/* ─── Scroll progress bar ───────────────────────────── */}
            {scrollProgress > 0 && (
                <div
                    className="fixed left-0 top-0 z-[60] h-0.5 transition-all duration-150"
                    style={{
                        width: `${scrollProgress}%`,
                        backgroundColor: 'var(--cms-primary, #28a745)',
                    }}
                />
            )}

            {/* ─── Header scroll-aware ──────────────────────────────── */}
            <header
                className={`sticky top-0 z-50 border-b transition-all duration-300 ${
                    headerHidden ? '-translate-y-full' : 'translate-y-0'
                } ${scrolled
                    ? 'border-gray-200/80 bg-white/95 shadow-sm backdrop-blur-lg dark:border-gray-800/80 dark:bg-gray-950/95'
                    : 'border-gray-200/50 bg-white/90 backdrop-blur-md dark:border-gray-800/50 dark:bg-gray-950/90'
                }`}
                style={{ borderColor: scrolled ? undefined : 'color-mix(in srgb, var(--cms-primary, #28a745) 20%, transparent)' }}
            >
                <div className={`mx-auto flex max-w-7xl items-center justify-between px-4 transition-all duration-300 sm:px-6 lg:px-8 ${scrolled ? 'h-12' : 'h-16'}`}>
                    {/* Logo + Nom */}
                    <Link
                        to="/e/$code"
                        params={{ code }}
                        className="flex items-center gap-3"
                    >
                        {etablissement.logoBase64 && (
                            <img
                                src={etablissement.logoBase64}
                                alt={`Logo ${etablissement.nom}`}
                                className="h-10 w-10 rounded-xl object-contain"
                            />
                        )}
                        <div className="flex flex-col">
                            <span
                                className="text-lg font-bold leading-tight"
                                style={{
                                    fontFamily: 'var(--cms-font-title)',
                                    color: 'var(--cms-primary)',
                                }}
                            >
                                {etablissement.nom}
                            </span>
                            {etablissement.slogan && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {etablissement.slogan}
                                </span>
                            )}
                        </div>
                    </Link>

                    {/* Navigation desktop */}
                    <nav className="hidden items-center gap-1 md:flex">
                        {menuPrincipal?.items
                            .sort((a, b) => a.ordre - b.ordre)
                            .map((item) => (
                                <MenuItemLink
                                    key={item.id}
                                    item={item}
                                    code={code}
                                    currentPath={location.pathname}
                                    className="rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                                    activeClass="bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white"
                                    inactiveClass="text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                                />
                            ))}
                    </nav>

                    {/* Actions droite */}
                    <div className="flex items-center gap-2">
                        {/* Toggle dark mode */}
                        <button
                            type="button"
                            onClick={() => setDarkMode(d => !d)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                            aria-label="Basculer le mode sombre"
                        >
                            {darkMode ? (
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            ) : (
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                            )}
                        </button>

                        {/* Bouton contact desktop */}
                        <Link
                            to="/e/$code/$slug"
                            params={{ code, slug: 'contact' }}
                            search={{ preview: '' }}
                            className="hidden rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 sm:inline-flex"
                            style={{ backgroundColor: 'var(--cms-primary, #28a745)' }}
                        >
                            Contact
                        </Link>

                        {/* Hamburger mobile */}
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(o => !o)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 md:hidden dark:text-gray-400 dark:hover:bg-gray-800"
                            aria-label="Menu"
                        >
                            {mobileMenuOpen ? (
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* Menu mobile — slide-down with transition */}
                <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out md:hidden ${
                        mobileMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
                >
                    <div className="border-t border-gray-200/50 bg-white px-4 pb-4 pt-2 dark:border-gray-800/50 dark:bg-gray-950">
                        <nav className="flex flex-col gap-1">
                            {menuPrincipal?.items
                                .sort((a, b) => a.ordre - b.ordre)
                                .map((item) => (
                                    <MenuItemLink
                                        key={item.id}
                                        item={item}
                                        code={code}
                                        currentPath={location.pathname}
                                        className="rounded-lg px-3 py-2.5 text-base font-medium transition-colors"
                                        activeClass="bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white"
                                        inactiveClass="text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                                    />
                                ))}
                            <Link
                                to="/e/$code/$slug"
                                params={{ code, slug: 'contact' }}
                                search={{ preview: '' }}
                                className="mt-2 rounded-lg px-4 py-2.5 text-center text-base font-medium text-white transition-opacity hover:opacity-90"
                                style={{ backgroundColor: 'var(--cms-primary, #28a745)' }}
                            >
                                Contact
                            </Link>
                        </nav>
                    </div>
                </div>
            </header>

            {/* ─── Breadcrumbs ────────────────────────────────────── */}
            <PublicBreadcrumbs etablissement={etablissement} />

            {/* ─── Contenu principal ──────────────────────────────── */}
            <main className="flex-1">
                {children || <Outlet />}
            </main>

            {/* ─── Scroll-to-top button ──────────────────────────── */}
            <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className={`fixed bottom-6 right-6 z-40 flex h-10 w-10 items-center justify-center rounded-full text-white transition-all duration-300 hover:scale-110 ${
                    scrollToTopVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
                }`}
                style={{ backgroundColor: 'var(--cms-primary, #28a745)' }}
                aria-label="Retour en haut"
            >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
            </button>

            {/* ─── Footer dynamique avec widgets CMS ──────────────── */}
            <footer className="mt-auto border-t border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
                <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                    <div className={`grid grid-cols-1 gap-8 ${hasWidgets ? `md:grid-cols-2 ${grilleCols}` : 'md:grid-cols-3'}`}>
                        {/* Colonne 1 : Infos établissement (toujours fixe) */}
                        <div className="space-y-4">
                            <h3
                                className="text-lg font-bold"
                                style={{ color: 'var(--cms-primary)', fontFamily: 'var(--cms-font-title)' }}
                            >
                                {etablissement.nom}
                            </h3>
                            {etablissement.descriptionPublique && (
                                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                                    {etablissement.descriptionPublique}
                                </p>
                            )}
                            {etablissement.devise && (
                                <p className="text-sm italic text-gray-500 dark:text-gray-500">
                                    « {etablissement.devise} »
                                </p>
                            )}
                        </div>

                        {/* Widgets CMS dynamiques OU fallback statique */}
                        {hasWidgets ? (
                            widgetsFooter.map((widget) => (
                                <FooterWidgets key={widget.id} widget={widget} code={code} />
                            ))
                        ) : (
                            <>
                                {/* Fallback : Réseaux sociaux */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Réseaux sociaux
                                    </h4>
                                    <div className="flex flex-wrap gap-3">
                                        {etablissement.facebook && (
                                            <SocialLink href={etablissement.facebook} label="Facebook" icon="facebook" />
                                        )}
                                        {etablissement.twitter && (
                                            <SocialLink href={etablissement.twitter} label="Twitter" icon="twitter" />
                                        )}
                                        {etablissement.siteWeb && (
                                            <SocialLink href={etablissement.siteWeb} label="Site web" icon="website" />
                                        )}
                                    </div>
                                </div>

                                {/* Fallback : Contact */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Contact
                                    </h4>
                                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                        {etablissement.adresse && <p>{etablissement.adresse}, {etablissement.ville}</p>}
                                        {etablissement.contactTelephone && (
                                            <p>
                                                <a href={`tel:${etablissement.contactTelephone}`} className="transition-colors hover:text-gray-900 dark:hover:text-white">
                                                    {etablissement.contactTelephone}
                                                </a>
                                            </p>
                                        )}
                                        {etablissement.contactEmail && (
                                            <p>
                                                <a href={`mailto:${etablissement.contactEmail}`} className="transition-colors hover:text-gray-900 dark:hover:text-white">
                                                    {etablissement.contactEmail}
                                                </a>
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Navigation pied de page + Copyright */}
                    <div className="mt-8 border-t border-gray-200 pt-6 dark:border-gray-800">
                        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                                © {new Date().getFullYear()} {etablissement.nom}. Propulsé par eLISAschool.
                            </p>
                            {menuPiedPage?.items && menuPiedPage.items.length > 0 && (
                                <nav className="flex flex-wrap gap-4">
                                    {menuPiedPage.items
                                        .sort((a, b) => a.ordre - b.ordre)
                                        .map((item) => (
                                            <MenuItemLink
                                                key={item.id}
                                                item={item}
                                                code={code}
                                                className="text-xs text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                                            />
                                        ))}
                                </nav>
                            )}
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

// ==================================
// Icônes SVG réseaux sociaux
// ==================================
function FacebookIcon({ size = 20 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
    );
}

function TwitterIcon({ size = 20 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    );
}

function InstagramIcon({ size = 20 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
    );
}

function LinkedinIcon({ size = 20 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
    );
}

function YoutubeIcon({ size = 20 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
    );
}

function WebsiteIcon({ size = 20 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
        </svg>
    );
}

// ==================================
// Composant lien réseau social avec icône SVG
// ==================================
function SocialLink({ href, label, icon }: { href: string; label: string; icon: string }) {
    const hoverColors: Record<string, string> = {
        facebook: 'hover:text-blue-600',
        twitter: 'hover:text-gray-900',
        instagram: 'hover:text-pink-600',
        linkedin: 'hover:text-blue-700',
        youtube: 'hover:text-red-600',
        website: 'hover:text-green-600',
    };

    const iconMap: Record<string, React.ReactNode> = {
        facebook: <FacebookIcon />,
        twitter: <TwitterIcon />,
        instagram: <InstagramIcon />,
        linkedin: <LinkedinIcon />,
        youtube: <YoutubeIcon />,
        website: <WebsiteIcon />,
    };

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`text-gray-500 transition-all duration-200 hover:scale-110 dark:text-gray-400 ${hoverColors[icon] || 'hover:text-gray-900 dark:hover:text-white'}`}
            aria-label={label}
            title={label}
        >
            {iconMap[icon] || <WebsiteIcon />}
        </a>
    );
}

// ==================================
// Détection d'icône réseau social par URL
// ==================================
function detectSocialIcon(url: string): string {
    const lower = url.toLowerCase();
    if (lower.includes('facebook') || lower.includes('fb.com')) return 'facebook';
    if (lower.includes('twitter') || lower.includes('x.com')) return 'twitter';
    if (lower.includes('instagram') || lower.includes('insta')) return 'instagram';
    if (lower.includes('linkedin')) return 'linkedin';
    if (lower.includes('youtube') || lower.includes('youtu.be')) return 'youtube';
    return 'website';
}

// ==================================
// Footer widgets — Rendu dynamique des widgets CMS dans le footer
// ==================================
function FooterWidgets({ widget }: { widget: CmsWidget; code: string }) {
    const contenu = widget.contenu || {};

    if (widget.type === 'RESEAUX_SOCIAUX') {
        const liens: { url: string; label: string }[] = [];
        if (contenu.facebook) liens.push({ url: contenu.facebook, label: 'Facebook' });
        if (contenu.twitter) liens.push({ url: contenu.twitter, label: 'Twitter' });
        if (contenu.instagram) liens.push({ url: contenu.instagram, label: 'Instagram' });
        if (contenu.linkedin) liens.push({ url: contenu.linkedin, label: 'LinkedIn' });
        if (contenu.youtube) liens.push({ url: contenu.youtube, label: 'YouTube' });
        if (contenu.siteWeb) liens.push({ url: contenu.siteWeb, label: 'Site web' });

        return (
            <div className="space-y-4">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {widget.titre || 'Réseaux sociaux'}
                </h4>
                <div className="flex flex-wrap gap-3">
                    {liens.map((lien, i) => (
                        <SocialLink key={i} href={lien.url} label={lien.label} icon={detectSocialIcon(lien.url)} />
                    ))}
                </div>
            </div>
        );
    }

    if (widget.type === 'CONTACT_RAPIDE') {
        return (
            <div className="space-y-4">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {widget.titre || 'Contact'}
                </h4>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    {contenu.email && (
                        <p>
                            <a href={`mailto:${contenu.email}`} className="transition-colors hover:text-gray-900 dark:hover:text-white">
                                {contenu.email}
                            </a>
                        </p>
                    )}
                    {contenu.telephone && (
                        <p>
                            <a href={`tel:${contenu.telephone}`} className="transition-colors hover:text-gray-900 dark:hover:text-white">
                                {contenu.telephone}
                            </a>
                        </p>
                    )}
                    {contenu.adresse && <p>{contenu.adresse}</p>}
                </div>
            </div>
        );
    }

    if (widget.type === 'HORAIRES') {
        const horaires: any[] = contenu.horaires || [];
        return (
            <div className="space-y-4">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {widget.titre || 'Horaires'}
                </h4>
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    {horaires.map((h: any, i: number) => (
                        <div key={i} className="flex justify-between gap-2">
                            <span className="font-medium">{h.jour}</span>
                            <span className="opacity-70">{h.horaires}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (widget.type === 'NEWSLETTER') {
        return (
            <div className="space-y-4">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {widget.titre || 'Newsletter'}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    {(contenu.description as string) || 'Inscrivez-vous pour recevoir nos actualités'}
                </p>
                <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
                    <input
                        type="email"
                        placeholder={(contenu.placeholder as string) || 'Votre adresse email'}
                        className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
                    />
                    <button
                        type="submit"
                        className="shrink-0 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
                    >
                        {(contenu.boutonLabel as string) || 'S\'inscrire'}
                    </button>
                </form>
            </div>
        );
    }

    if (widget.type === 'LIENS_UTILES') {
        const liens: { label: string; url: string }[] = (contenu.liens as any[]) || [];
        if (liens.length === 0) return null;
        return (
            <div className="space-y-4">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {widget.titre || 'Liens utiles'}
                </h4>
                <ul className="space-y-2 text-sm">
                    {liens.map((lien, i) => (
                        <li key={i}>
                            <a
                                href={lien.url}
                                className="text-gray-600 transition-colors hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400"
                                {...(lien.url.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                            >
                                {lien.label}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        );
    }

    return null;
}

// ==================================
// Breadcrumbs
// ==================================

function PublicBreadcrumbs({ etablissement }: { etablissement: EtablissementPublic }) {
    const location = useLocation();
    const code = etablissement.codeEtablissement;

    // Déterminer le fil d'Ariane basé sur le pathname
    const segments = location.pathname.split('/').filter(Boolean);
    // segments: ['e', code] = page d'accueil → pas de breadcrumb
    // segments: ['e', code, slug] = page interne → breadcrumb
    if (segments.length <= 2) return null; // Pas de breadcrumbs sur la page d'accueil établissement

    const currentSlug = segments[segments.length - 1];
    const slugLabels: Record<string, string> = {
        contact: 'Contact',
        galerie: 'Galerie',
        inscriptions: 'Inscriptions',
        'mentions-legales': 'Mentions légales',
        'a-propos': 'À propos',
    };

    const label = slugLabels[currentSlug] || currentSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    return (
        <nav aria-label="Fil d'Ariane" className="border-b border-gray-100 bg-gray-50/50 dark:border-gray-800/50 dark:bg-gray-900/50">
            <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2 text-sm sm:px-6 lg:px-8">
                <Link
                    to="/e/$code"
                    params={{ code }}
                    className="text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                >
                    Accueil
                </Link>
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                <span className="font-medium text-gray-900 dark:text-white">{label}</span>
            </div>
        </nav>
    );
}

// ==================================
// Composant lien de menu avec état actif
// ==================================
function MenuItemLink({ item, code, currentPath, className, activeClass, inactiveClass }: {
    item: CmsMenuItem;
    code: string;
    currentPath?: string;
    className?: string;
    activeClass?: string;
    inactiveClass?: string;
}) {
    const href = item.pageSlug !== undefined && item.pageSlug !== null
        ? `/e/${code}/${item.pageSlug}`
        : item.url || '#';

    const isExternal = href.startsWith('http');

    // Déterminer si le lien est actif
    const isActive = currentPath && item.pageSlug !== undefined && item.pageSlug !== null
        ? item.pageSlug === ''
            ? currentPath === `/e/${code}` || currentPath === `/e/${code}/`
            : currentPath === `/e/${code}/${item.pageSlug}`
        : false;

    const combinedClassName = isActive
        ? `${className} ${activeClass || ''}`.trim()
        : `${className} ${inactiveClass || ''}`.trim();

    if (isExternal) {
        return (
            <a
                href={href}
                target={item.ouvrirdansNouvelOnglet ? '_blank' : undefined}
                rel="noopener noreferrer"
                className={combinedClassName}
            >
                {item.label}
            </a>
        );
    }

    return (
        <Link
            to={item.pageSlug !== undefined && item.pageSlug !== null && item.pageSlug ? '/e/$code/$slug' : '/e/$code'}
            params={{ code, ...(item.pageSlug && item.pageSlug ? { slug: item.pageSlug } : {}) }}
            target={item.ouvrirdansNouvelOnglet ? '_blank' : undefined}
            className={combinedClassName}
        >
            {item.label}
        </Link>
    );
}
