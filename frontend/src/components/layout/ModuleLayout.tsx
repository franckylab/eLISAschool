/**
 * ==================================
 * eLISAschool - ModuleLayout
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Layout standardisé pour tous les modules.
 * Combine ErrorBoundary + animation de transition de page.
 *
 * Features :
 * - Protection erreurs avec fallback personnalisable
 * - Animation de transition entre sous-pages (fade + slide)
 * - 3 presets d'animation : slide (défaut), fade, scale
 * - Clé d'animation personnalisable (pathname par défaut)
 * - Support prefers-reduced-motion (accessibilité)
 * - Support children custom (layouts spéciaux avec header/bouton retour)
 * - Performance : useLocation interne, pas de re-render inutile
 */

import { type ReactNode, useMemo } from 'react';
import { motion, type Transition } from 'framer-motion';
import { Outlet, useLocation } from '@tanstack/react-router';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import { useMediaQuery } from '@/hooks/use-media-query';

// ==================================
// Presets d'animation
// ==================================

/** Variantes de transition disponibles */
export type ModuleAnimationPreset = 'slide' | 'fade' | 'scale' | 'none';

/** Presets d'animation — optimisés pour fluidité et performance */
const ANIMATION_CONFIG = {
    slide: {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -4 },
        transition: { duration: 0.2, ease: 'easeOut' } as Transition,
    },
    fade: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.15, ease: 'easeOut' } as Transition,
    },
    scale: {
        initial: { opacity: 0, scale: 0.98 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.98 },
        transition: { duration: 0.2, ease: 'easeOut' } as Transition,
    },
    none: {
        initial: {},
        animate: {},
        exit: {},
        transition: { duration: 0 } as Transition,
    },
} as const;

// ==================================
// Props
// ==================================

export interface ModuleLayoutProps {
    /** Contenu custom (layouts spéciaux). Par défaut : <Outlet /> */
    children?: ReactNode;

    /** Clé d'animation — déclenche la transition quand elle change */
    animationKey?: string;

    /** Preset d'animation (défaut: 'slide') */
    animation?: ModuleAnimationPreset;

    /** Durée d'animation custom (ms) — override le preset */
    animationDuration?: number;

    /** Fallback UI pour ErrorBoundary */
    errorFallback?: ReactNode;

    /** Classes CSS additionnelles sur le wrapper motion */
    className?: string;

    /** Désactiver l'animation (équivaut à animation='none') */
    disableAnimation?: boolean;
}

// ==================================
// Composant
// ==================================

export function ModuleLayout({
    children,
    animationKey,
    animation = 'slide',
    animationDuration,
    errorFallback,
    className,
    disableAnimation = false,
}: ModuleLayoutProps) {
    const { pathname } = useLocation();
    const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

    // Résolution de l'animation effective
    const effectiveAnimation = (disableAnimation || prefersReducedMotion || animation === 'none')
        ? 'none'
        : animation;

    // Clé d'animation : pathname par défaut, ou custom
    const key = animationKey ?? pathname;

    // Memo des variantes et transitions pour éviter les re-renders
    const config = useMemo(() => {
        const base = ANIMATION_CONFIG[effectiveAnimation];
        if (animationDuration) {
            return {
                ...base,
                transition: { duration: animationDuration / 1000, ease: 'easeOut' as const },
            };
        }
        return base;
    }, [effectiveAnimation, animationDuration]);

    return (
        <ErrorBoundary fallback={errorFallback}>
            <motion.div
                key={key}
                initial={config.initial}
                animate={config.animate}
                exit={config.exit}
                transition={config.transition}
                className={className}
            >
                {children ?? <Outlet />}
            </motion.div>
        </ErrorBoundary>
    );
}

export default ModuleLayout;
