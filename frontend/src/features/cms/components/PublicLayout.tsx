/**
 * ==================================
 * eLISAschool - Layout public pour pages établissement
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Layout sans auth pour les pages publiques /e/:code.
 * Header + Footer dynamiques selon les données CMS.
 * Thème appliqué depuis CmsTheme.
 */

import { useMemo } from 'react';
import { Outlet } from '@tanstack/react-router';
import { Link } from '@tanstack/react-router';
import type { EtablissementPublic, CmsTheme, CmsMenu, CmsMenuItem } from '../types/cms.types';
import { EmplacementMenu } from '../types/cms.types';

interface PublicLayoutProps {
    etablissement: EtablissementPublic;
    theme?: CmsTheme | null;
    menus?: CmsMenu[];
}

export function PublicLayout({ etablissement, theme, menus = [] }: PublicLayoutProps) {
    // Appliquer les variables CSS du thème
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

    return (
        <div
            className="min-h-screen flex flex-col"
            style={{
                ...themeStyles,
                backgroundColor: 'var(--cms-bg, #ffffff)',
                color: 'var(--cms-text, #1a1a2e)',
                fontFamily: 'var(--cms-font-body, Inter, sans-serif)',
            }}
        >
            {/* Header */}
            <header
                className="sticky top-0 z-50 border-b backdrop-blur-md bg-white/90 dark:bg-gray-900/90"
                style={{ borderColor: 'var(--cms-primary, #28a745)' + '30' }}
            >
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        {/* Logo + Nom */}
                        <Link
                            to="/e/$code"
                            params={{ code: etablissement.codeEtablissement }}
                            className="flex items-center gap-3"
                        >
                            {etablissement.logoBase64 && (
                                <img
                                    src={etablissement.logoBase64}
                                    alt={`Logo ${etablissement.nom}`}
                                    className="h-10 w-10 rounded-lg object-contain"
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
                                    <span
                                        className="text-xs"
                                        style={{ color: 'var(--cms-text-light)' }}
                                    >
                                        {etablissement.slogan}
                                    </span>
                                )}
                            </div>
                        </Link>

                        {/* Navigation principale */}
                        <nav className="hidden md:flex items-center gap-6">
                            {menuPrincipal?.items
                                .sort((a, b) => a.ordre - b.ordre)
                                .map((item) => (
                                    <MenuItemLink
                                        key={item.id}
                                        item={item}
                                        code={etablissement.codeEtablissement}
                                    />
                                ))}
                        </nav>

                        {/* Bouton contact rapide */}
                        <Link
                            to="/e/$code/$slug"
                            params={{ code: etablissement.codeEtablissement, slug: 'contact' }}
                            className="hidden sm:inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
                            style={{ backgroundColor: 'var(--cms-primary)' }}
                        >
                            Contact
                        </Link>
                    </div>
                </div>
            </header>

            {/* Contenu principal */}
            <main className="flex-1">
                <Outlet />
            </main>

            {/* Footer */}
            <footer
                className="border-t mt-auto"
                style={{
                    backgroundColor: 'var(--cms-text, #1a1a2e)',
                    color: 'var(--cms-text-light, #adb5bd)',
                    borderColor: 'var(--cms-primary, #28a745)' + '20',
                }}
            >
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Colonne 1 : Infos établissement */}
                        <div className="space-y-4">
                            <h3
                                className="text-lg font-bold"
                                style={{ color: 'var(--cms-primary)', fontFamily: 'var(--cms-font-title)' }}
                            >
                                {etablissement.nom}
                            </h3>
                            {etablissement.descriptionPublique && (
                                <p className="text-sm leading-relaxed opacity-80">
                                    {etablissement.descriptionPublique}
                                </p>
                            )}
                            {etablissement.devise && (
                                <p className="text-sm italic opacity-60">« {etablissement.devise} »</p>
                            )}
                        </div>

                        {/* Colonne 2 : Menu pied de page */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-semibold uppercase tracking-wider opacity-60">
                                Navigation
                            </h4>
                            <ul className="space-y-2">
                                {menuPiedPage?.items
                                    .sort((a, b) => a.ordre - b.ordre)
                                    .map((item) => (
                                        <li key={item.id}>
                                            <MenuItemLink
                                                item={item}
                                                code={etablissement.codeEtablissement}
                                                className="text-sm hover:opacity-100 opacity-70 transition-opacity"
                                            />
                                        </li>
                                    ))}
                            </ul>
                        </div>

                        {/* Colonne 3 : Contact */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-semibold uppercase tracking-wider opacity-60">
                                Contact
                            </h4>
                            <div className="space-y-2 text-sm">
                                {etablissement.adresse && (
                                    <p>{etablissement.adresse}, {etablissement.ville}</p>
                                )}
                                {etablissement.contactTelephone && (
                                    <p>
                                        <a href={`tel:${etablissement.contactTelephone}`} className="hover:opacity-100 opacity-70">
                                            {etablissement.contactTelephone}
                                        </a>
                                    </p>
                                )}
                                {etablissement.contactEmail && (
                                    <p>
                                        <a href={`mailto:${etablissement.contactEmail}`} className="hover:opacity-100 opacity-70">
                                            {etablissement.contactEmail}
                                        </a>
                                    </p>
                                )}
                                {/* Réseaux sociaux */}
                                <div className="flex gap-3 pt-2">
                                    {etablissement.facebook && (
                                        <a href={etablissement.facebook} target="_blank" rel="noopener noreferrer" className="hover:opacity-100 opacity-60">
                                            Facebook
                                        </a>
                                    )}
                                    {etablissement.twitter && (
                                        <a href={etablissement.twitter} target="_blank" rel="noopener noreferrer" className="hover:opacity-100 opacity-60">
                                            Twitter
                                        </a>
                                    )}
                                    {etablissement.siteWeb && (
                                        <a href={etablissement.siteWeb} target="_blank" rel="noopener noreferrer" className="hover:opacity-100 opacity-60">
                                            Site web
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Copyright */}
                    <div className="mt-8 border-t pt-6 text-center text-xs opacity-50" style={{ borderColor: 'currentColor' }}>
                        <p>© {new Date().getFullYear()} {etablissement.nom}. Propulsé par eLISAschool.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

// ==================================
// Composant lien de menu
// ==================================
function MenuItemLink({ item, code, className }: { item: CmsMenuItem; code: string; className?: string }) {
    const href = item.pageSlug
        ? `/e/${code}/${item.pageSlug}`
        : item.url || '#';

    const isExternal = href.startsWith('http');

    if (isExternal) {
        return (
            <a
                href={href}
                target={item.ouvrirdansNouvelOnglet ? '_blank' : undefined}
                rel="noopener noreferrer"
                className={className || 'text-sm font-medium transition-colors hover:opacity-80'}
                style={{ color: 'inherit' }}
            >
                {item.label}
            </a>
        );
    }

    return (
        <Link
            to={item.pageSlug ? '/e/$code/$slug' : '/e/$code'}
            params={{ code, ...(item.pageSlug ? { slug: item.pageSlug } : {}) }}
            target={item.ouvrirdansNouvelOnglet ? '_blank' : undefined}
            className={className || 'text-sm font-medium transition-colors hover:opacity-80'}
            style={{ color: 'inherit' }}
        >
            {item.label}
        </Link>
    );
}
