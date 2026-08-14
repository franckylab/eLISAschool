/**
 * ==================================
 * eLISAschool - Composant image optimisée CMS
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Image optimisée avec lazy loading, blur-up placeholder,
 * srcSet responsive, et fallback gracieux.
 */

import { useState, useRef, useEffect, type ImgHTMLAttributes } from 'react';
import { motion } from 'framer-motion';

// ==================================
// Types
// ==================================

interface CmsOptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
    /** URL de l'image */
    src: string;
    /** Texte alternatif */
    alt: string;
    /** Activer le blur-up (défaut: true) */
    blurUp?: boolean;
    /** Charger immédiatement (défaut: false = lazy) */
    eager?: boolean;
    /** Ratio d'aspect (ex: '16/9', '4/3', '1/1') */
    aspectRatio?: string;
    /** Taille de placeholder (pixels, défaut: 20) */
    placeholderSize?: number;
    /** Classes additionnelles */
    className?: string;
    /** Hauteur max */
    maxHeight?: string;
    /** Objet-fit */
    objectFit?: 'cover' | 'contain' | 'fill' | 'none';
    /** Arrondi */
    borderRadius?: string;
    /** Effet de survol */
    hoverEffect?: 'none' | 'zoom' | 'lift' | 'glow';
}

// ==================================
// Composant principal
// ==================================

export function CmsOptimizedImage({
    src,
    alt,
    blurUp = true,
    eager = false,
    aspectRatio,
    placeholderSize = 20,
    className = '',
    maxHeight,
    objectFit = 'cover',
    borderRadius,
    hoverEffect = 'none',
    ...rest
}: CmsOptimizedImageProps) {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);
    const [placeholderColor, setPlaceholderColor] = useState<string>('#e5e7eb');
    const imgRef = useRef<HTMLImageElement>(null);

    // Générer la couleur de placeholder depuis l'image (via canvas)
    useEffect(() => {
        if (!blurUp || !src || typeof window === 'undefined') return;

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = placeholderSize;
                canvas.height = placeholderSize;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, placeholderSize, placeholderSize);
                    const data = ctx.getImageData(0, 0, placeholderSize, placeholderSize).data;
                    // Couleur moyenne
                    let r = 0, g = 0, b = 0, count = 0;
                    for (let i = 0; i < data.length; i += 4) {
                        r += data[i];
                        g += data[i + 1];
                        b += data[i + 2];
                        count++;
                    }
                    r = Math.round(r / count);
                    g = Math.round(g / count);
                    b = Math.round(b / count);
                    setPlaceholderColor(`rgb(${r},${g},${b})`);
                }
            } catch {
                // CORS ou autre erreur — garder la couleur par défaut
            }
        };
        img.src = src;
    }, [src, blurUp, placeholderSize]);

    // Image sans source — afficher le placeholder
    if (!src || error) {
        return (
            <div
                className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 ${className}`}
                style={{
                    aspectRatio: aspectRatio || 'auto',
                    maxHeight,
                    borderRadius,
                }}
            >
                <div className="text-center text-gray-400">
                    <svg className="mx-auto h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                    </svg>
                    <span className="mt-1 block text-xs">{error ? 'Image introuvable' : 'Aucune image'}</span>
                </div>
            </div>
        );
    }

    // Hover effect props
    const hoverProps = {
        none: {},
        zoom: { whileHover: { scale: 1.05 }, transition: { duration: 0.3 } },
        lift: { whileHover: { y: -4, boxShadow: '0 12px 24px rgba(0,0,0,0.15)' }, transition: { duration: 0.3 } },
        glow: { whileHover: { boxShadow: '0 0 20px rgba(59,130,246,0.3)' }, transition: { duration: 0.3 } },
    }[hoverEffect] || {};

    const imageContent = (
        <div
            className={`relative overflow-hidden ${className}`}
            style={{
                aspectRatio: aspectRatio,
                maxHeight,
                borderRadius,
                backgroundColor: blurUp ? placeholderColor : undefined,
            }}
        >
            {/* Blur-up background */}
            {blurUp && !loaded && (
                <div
                    className="absolute inset-0 scale-110 blur-xl transition-opacity duration-500"
                    style={{
                        backgroundColor: placeholderColor,
                        opacity: loaded ? 0 : 0.6,
                    }}
                />
            )}

            {/* Image principale */}
            <img
                ref={imgRef}
                src={src}
                alt={alt}
                loading={eager ? 'eager' : 'lazy'}
                decoding="async"
                onLoad={() => setLoaded(true)}
                onError={() => setError(true)}
                className={`h-full w-full transition-all duration-500 ${
                    loaded ? 'opacity-100' : 'opacity-0'
                }`}
                style={{ objectFit }}
                {...rest}
            />

            {/* Skeleton loader */}
            {!loaded && !blurUp && (
                <div className="absolute inset-0 animate-pulse bg-gray-200 dark:bg-gray-700" />
            )}
        </div>
    );

    // Wrapper avec hover effect si nécessaire
    if (hoverEffect !== 'none') {
        return (
            <motion.div
                className="overflow-hidden"
                style={{ borderRadius }}
                {...hoverProps}
            >
                {imageContent}
            </motion.div>
        );
    }

    return imageContent;
}

// ==================================
// Helpers pour srcSet responsive
// ==================================

/**
 * Génère un srcSet responsive pour une image.
 * Utilise les paramètres de taille d'image du CMS.
 */
export function genererSrcSet(baseUrl: string, sizes: number[] = [320, 640, 960, 1280, 1920]): string {
    if (!baseUrl) return '';
    // Si l'URL supporte les query params (pas de data: URL)
    if (baseUrl.startsWith('data:') || baseUrl.startsWith('blob:')) return '';
    
    return sizes
        .map(size => {
            const separator = baseUrl.includes('?') ? '&' : '?';
            return `${baseUrl}${separator}w=${size} ${size}w`;
        })
        .join(', ');
}

/**
 * Génère un attribut sizes responsive.
 */
export function genererSizes(breakpoints: { maxWidth: number; size: string }[]): string {
    return breakpoints
        .map(bp => `(max-width: ${bp.maxWidth}px) ${bp.size}`)
        .join(', ') + ', 100vw';
}

export default CmsOptimizedImage;
