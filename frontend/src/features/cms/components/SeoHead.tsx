/**
 * ==================================
 * eLISAschool - Composant SeoHead
 * ==================================
 * Version: 2.0.0
 * Composant réutilisable pour gérer le SEO complet.
 * Title, meta description, OpenGraph, Twitter Card, JSON-LD, canonical URL.
 */

import { useEffect } from 'react';

interface SeoHeadProps {
    /** Titre de la page (document.title) */
    titre: string;
    /** Meta description */
    description?: string;
    /** Open Graph title (fallback: titre) */
    ogTitle?: string;
    /** Open Graph description (fallback: description) */
    ogDescription?: string;
    /** Open Graph image URL */
    ogImage?: string;
    /** Logo base64 de l'établissement (fallback og:image) */
    logoBase64?: string;
    /** URL canonique de la page */
    canonicalUrl?: string;
    /** Nom de l'établissement */
    etablissementNom?: string;
    /** Type de page (website, article, etc.) */
    ogType?: string;
    /** Données JSON-LD personnalisées */
    jsonLd?: Record<string, any>;
}

export function SeoHead({
    titre,
    description,
    ogTitle,
    ogDescription,
    ogImage,
    logoBase64,
    canonicalUrl,
    etablissementNom,
    ogType = 'website',
    jsonLd,
}: SeoHeadProps) {
    useEffect(() => {
        if (typeof document === 'undefined') return;

        // Document title
        document.title = titre;

        // Meta description
        setMeta('name', 'description', description || '');

        // Open Graph
        setMeta('property', 'og:title', ogTitle || titre);
        setMeta('property', 'og:description', ogDescription || description || '');
        setMeta('property', 'og:image', ogImage || logoBase64 || '');
        setMeta('property', 'og:type', ogType);
        if (canonicalUrl) setMeta('property', 'og:url', canonicalUrl);
        if (etablissementNom) setMeta('property', 'og:site_name', etablissementNom);

        // Twitter Card
        setMeta('name', 'twitter:card', ogImage ? 'summary_large_image' : 'summary');
        setMeta('name', 'twitter:title', ogTitle || titre);
        setMeta('name', 'twitter:description', ogDescription || description || '');
        if (ogImage || logoBase64) {
            setMeta('name', 'twitter:image', ogImage || logoBase64 || '');
        }

        // Canonical URL
        setCanonical(canonicalUrl);

        // JSON-LD structured data
        setJsonLd(jsonLd || buildDefaultJsonLd(titre, description, ogImage || logoBase64, canonicalUrl, etablissementNom));

        // Cleanup : réinitialiser les meta tags au démontage
        return () => {
            document.title = 'eLISAschool';
        };
    }, [titre, description, ogTitle, ogDescription, ogImage, logoBase64, canonicalUrl, etablissementNom, ogType, jsonLd]);

    // Ce composant ne rend rien visuellement
    return null;
}

/**
 * Construit le JSON-LD par défaut (Organization + WebPage)
 */
function buildDefaultJsonLd(
    titre: string,
    description?: string,
    image?: string,
    canonicalUrl?: string,
    etablissementNom?: string,
): Record<string, any> {
    return {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'WebPage',
                'name': titre,
                'description': description || '',
                'url': canonicalUrl || '',
                ...(image ? { 'image': image } : {}),
                ...(etablissementNom ? { 'publisher': { '@type': 'Organization', 'name': etablissementNom } } : {}),
            },
        ],
    };
}

/**
 * Met à jour ou crée un meta tag dans le <head>.
 */
function setMeta(attr: 'name' | 'property', value: string, content: string): void {
    const selector = `meta[${attr}="${value}"]`;
    let tag = document.querySelector(selector);
    if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attr, value);
        document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
}

/**
 * Met à jour ou crée le lien canonical.
 */
function setCanonical(url?: string): void {
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);
    }
    link.href = url || '';
}

/**
 * Met à jour ou crée le bloc JSON-LD.
 */
function setJsonLd(data: Record<string, any>): void {
    let script = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement | null;
    if (!script) {
        script = document.createElement('script');
        script.type = 'application/ld+json';
        document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(data);
}
