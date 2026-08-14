/**
 * ==================================
 * eLISAschool - Bibliothèque d'animations CMS avancées
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * 15+ variants d'animation, 7 easings, 6 hover effects,
 * parallax, stagger, count-up helpers.
 */

import type { Variants, Transition } from 'framer-motion';
import type { AnimationType, AnimationEasing, HoverEffect, AnimationConfig } from '../types/cms.types';

// ==================================
// 15+ variants d'animation d'entrée
// ==================================

export const ANIMATION_VARIANTS: Record<AnimationType, Variants> = {
    'fade-in': {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
    },
    'slide-up': {
        hidden: { opacity: 0, y: 60 },
        visible: { opacity: 1, y: 0 },
    },
    'slide-down': {
        hidden: { opacity: 0, y: -60 },
        visible: { opacity: 1, y: 0 },
    },
    'slide-left': {
        hidden: { opacity: 0, x: 60 },
        visible: { opacity: 1, x: 0 },
    },
    'slide-right': {
        hidden: { opacity: 0, x: -60 },
        visible: { opacity: 1, x: 0 },
    },
    'zoom': {
        hidden: { opacity: 0, scale: 0.85 },
        visible: { opacity: 1, scale: 1 },
    },
    'zoom-out': {
        hidden: { opacity: 0, scale: 1.15 },
        visible: { opacity: 1, scale: 1 },
    },
    'flip-x': {
        hidden: { opacity: 0, rotateX: 90 },
        visible: { opacity: 1, rotateX: 0 },
    },
    'flip-y': {
        hidden: { opacity: 0, rotateY: 90 },
        visible: { opacity: 1, rotateY: 0 },
    },
    'rotate': {
        hidden: { opacity: 0, rotate: -15, scale: 0.9 },
        visible: { opacity: 1, rotate: 0, scale: 1 },
    },
    'blur': {
        hidden: { opacity: 0, filter: 'blur(12px)' },
        visible: { opacity: 1, filter: 'blur(0px)' },
    },
    'scale-up': {
        hidden: { opacity: 0, scale: 0.5, y: 30 },
        visible: { opacity: 1, scale: 1, y: 0 },
    },
    'bounce': {
        hidden: { opacity: 0, y: 80 },
        visible: {
            opacity: 1, y: 0,
            transition: { type: 'spring', stiffness: 300, damping: 15 },
        },
    },
    'elastic': {
        hidden: { opacity: 0, scale: 0.3 },
        visible: {
            opacity: 1, scale: 1,
            transition: { type: 'spring', stiffness: 200, damping: 10 },
        },
    },
    'none': {
        hidden: {},
        visible: {},
    },
};

// ==================================
// Animations avancées v2.1 (8 nouvelles)
// ==================================

export const ADVANCED_VARIANTS: Record<string, Variants> = {
    'typewriter': {
        hidden: { opacity: 0, clipPath: 'inset(0 100% 0 0)' },
        visible: { opacity: 1, clipPath: 'inset(0 0% 0 0)' },
    },
    'shimmer': {
        hidden: { opacity: 0, x: -100 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: 'easeOut' } },
    },
    'morph': {
        hidden: { opacity: 0, scale: 0.5, rotate: -10 },
        visible: { opacity: 1, scale: 1, rotate: 0, transition: { type: 'spring', stiffness: 200, damping: 20 } },
    },
    'curtain': {
        hidden: { clipPath: 'inset(0 0 100% 0)' },
        visible: { clipPath: 'inset(0 0 0% 0)' },
    },
    'perspective': {
        hidden: { opacity: 0, rotateY: -45 },
        visible: { opacity: 1, rotateY: 0 },
    },
    'swing': {
        hidden: { opacity: 0, rotate: -30 },
        visible: { opacity: 1, rotate: 0, transition: { type: 'spring', stiffness: 300, damping: 8 } },
    },
    'jelly': {
        hidden: { opacity: 0, scaleX: 0.3, scaleY: 1.5 },
        visible: { opacity: 1, scaleX: 1, scaleY: 1, transition: { type: 'spring', stiffness: 400, damping: 12 } },
    },
    'cascade': {
        hidden: { opacity: 0, y: -200, scale: 0.8 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 200, damping: 15 } },
    },
};

/**
 * Fusionne les variants standards et avancés.
 */
export function getAllVariants(): Record<string, Variants> {
    return { ...ANIMATION_VARIANTS, ...ADVANCED_VARIANTS };
}

// ==================================
// 7 courbes d'animation (easing)
// ==================================

export const EASING_MAP: Record<AnimationEasing, Transition['ease']> = {
    easeOut: 'easeOut',
    easeIn: 'easeIn',
    easeInOut: 'easeInOut',
    linear: 'linear',
    spring: { type: 'spring', stiffness: 300, damping: 25 },
    bounce: { type: 'spring', stiffness: 400, damping: 15 },
    elastic: { type: 'spring', stiffness: 200, damping: 10 },
};

// ==================================
// 6 effets de survol (hover)
// ==================================

export const HOVER_EFFECTS: Record<HoverEffect, { whileHover: any; whileTap?: any }> = {
    none: { whileHover: {} },
    lift: {
        whileHover: { y: -6, boxShadow: '0 12px 32px rgba(0,0,0,0.12)' },
        whileTap: { y: -2 },
    },
    glow: {
        whileHover: { boxShadow: '0 0 24px rgba(var(--color-dominant-rgb, 59,130,246), 0.4)' },
    },
    scale: {
        whileHover: { scale: 1.03 },
        whileTap: { scale: 0.98 },
    },
    tilt: {
        whileHover: { rotateY: 3, rotateX: -2, scale: 1.02 },
    },
    shadow: {
        whileHover: { boxShadow: '0 20px 40px rgba(0,0,0,0.15)', y: -4 },
        whileTap: { y: -1 },
    },
    'border-glow': {
        whileHover: {
            boxShadow: '0 0 0 2px rgba(var(--color-dominant-rgb, 59,130,246), 0.5), 0 8px 24px rgba(0,0,0,0.1)',
        },
    },
};

// ==================================
// Helpers de configuration
// ==================================

/**
 * Retourne la configuration d'animation complète pour une section.
 */
export function getAnimationConfig(config?: AnimationConfig): {
    variants: Variants;
    transition: Transition;
} {
    const type = config?.type || 'slide-up';
    const duration = config?.duration || 0.6;
    const delay = config?.delay || 0;
    const easing = config?.easing || 'easeOut';

    const variants = ANIMATION_VARIANTS[type] || ANIMATION_VARIANTS['slide-up'];
    const ease = EASING_MAP[easing] || 'easeOut';

    // Si le variant a déjà un transition intégré (bounce, elastic), ne pas écraser
    const visibleTransition = variants?.visible?.transition;
    if (visibleTransition) {
        return { variants, transition: { duration, delay, ...visibleTransition } as Transition };
    }

    return {
        variants,
        transition: { duration, delay, ease },
    };
}

/**
 * Retourne la configuration de stagger pour les enfants d'une section.
 * Les enfants apparaissent en séquence avec un délai progressif.
 */
export function getStaggerContainerConfig(duration = 0.5, staggerDelay = 0.1): {
    container: Variants;
    item: Variants;
} {
    return {
        container: {
            hidden: { opacity: 0 },
            visible: {
                opacity: 1,
                transition: {
                    staggerChildren: staggerDelay,
                    delayChildren: 0.1,
                },
            },
        },
        item: {
            hidden: { opacity: 0, y: 20 },
            visible: {
                opacity: 1,
                y: 0,
                transition: { duration, ease: 'easeOut' },
            },
        },
    };
}

/**
 * Retourne les props de hover pour un composant motion.
 */
export function getHoverProps(effect: HoverEffect = 'none'): {
    whileHover: any;
    whileTap?: any;
} {
    return HOVER_EFFECTS[effect] || HOVER_EFFECTS.none;
}

// ==================================
// Hook parallax (scroll-based)
// ==================================

/**
 * Retourne les props de parallaxe pour un composant motion.
 * Le parallaxe déplace l'élément en fonction du scroll.
 */
export function getParallaxProps(speed: number = 0.3): {
    style: Record<string, string>;
} {
    // Le parallaxe est géré via CSS scroll-driven animations
    // ou via useScroll de framer-motion dans le composant
    return {
        style: {
            '--parallax-speed': String(speed),
        } as any,
    };
}

// ==================================
// CountUp — Animation de compteur numérique
// ==================================

/**
 * Configuration pour l'animation count-up.
 */
export interface CountUpConfig {
    start?: number;
    end: number;
    duration?: number;
    separator?: string;
    prefix?: string;
    suffix?: string;
    decimals?: number;
}

/**
 * Formate un nombre avec séparateurs de milliers.
 */
export function formaterNombre(value: number, decimals = 0, separator = ' '): string {
    const parts = value.toFixed(decimals).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    return parts.join('.');
}

// ==================================
// Presets d'animation (combinaisons prêtes)
// ==================================

export const ANIMATION_PRESETS = {
    /** Hero d'accueil — entrée spectaculaire */
    hero: {
        type: 'zoom' as AnimationType,
        duration: 0.8,
        easing: 'easeOut' as AnimationEasing,
        hover: 'lift' as HoverEffect,
    },
    /** Carte — entrée douce + hover lift */
    card: {
        type: 'slide-up' as AnimationType,
        duration: 0.5,
        easing: 'easeOut' as AnimationEasing,
        hover: 'lift' as HoverEffect,
        stagger: true,
    },
    /** Témoignage — fade + glow */
    testimonial: {
        type: 'fade-in' as AnimationType,
        duration: 0.6,
        easing: 'easeOut' as AnimationEasing,
        hover: 'glow' as HoverEffect,
    },
    /** Chiffres clés — bounce + scale */
    stats: {
        type: 'scale-up' as AnimationType,
        duration: 0.5,
        easing: 'bounce' as AnimationEasing,
        hover: 'scale' as HoverEffect,
        stagger: true,
    },
    /** Timeline — slide alterné */
    timeline: {
        type: 'slide-left' as AnimationType,
        duration: 0.6,
        easing: 'easeOut' as AnimationEasing,
        stagger: true,
    },
    /** Galerie — zoom + shadow hover */
    gallery: {
        type: 'zoom' as AnimationType,
        duration: 0.4,
        easing: 'easeOut' as AnimationEasing,
        hover: 'shadow' as HoverEffect,
        stagger: true,
    },
    /** Partenaire — fade simple */
    partner: {
        type: 'fade-in' as AnimationType,
        duration: 0.4,
        easing: 'easeOut' as AnimationEasing,
        hover: 'scale' as HoverEffect,
        stagger: true,
    },
    /** CTA — elastic + glow */
    cta: {
        type: 'elastic' as AnimationType,
        duration: 0.7,
        easing: 'elastic' as AnimationEasing,
        hover: 'glow' as HoverEffect,
    },
    /** Section standard — slide-up doux */
    standard: {
        type: 'slide-up' as AnimationType,
        duration: 0.6,
        easing: 'easeOut' as AnimationEasing,
    },
    // ─── Nouveaux presets v2.1 ───────────────────────────────
    /** Hero cinématique — entrée dramatique */
    heroCinema: {
        type: 'fade-in' as AnimationType,
        duration: 1.0,
        easing: 'easeInOut' as AnimationEasing,
    },
    /** Carte morph — scale + spring */
    cardMorph: {
        type: 'scale-up' as AnimationType,
        duration: 0.5,
        easing: 'spring' as AnimationEasing,
        hover: 'shadow' as HoverEffect,
        stagger: true,
    },
    /** Features cascade — staggered cascade */
    featuresCascade: {
        type: 'slide-down' as AnimationType,
        duration: 0.6,
        easing: 'bounce' as AnimationEasing,
        stagger: true,
    },
    /** Masonry — fade + tilt hover */
    masonry: {
        type: 'fade-in' as AnimationType,
        duration: 0.4,
        easing: 'easeOut' as AnimationEasing,
        hover: 'tilt' as HoverEffect,
        stagger: true,
    },
} as const;

/**
 * Liste des labels d'animation pour l'UI (sélecteur dans l'éditeur).
 */
export const ANIMATION_LABELS: Record<AnimationType, string> = {
    'fade-in': 'Fondu',
    'slide-up': 'Glisser haut',
    'slide-down': 'Glisser bas',
    'slide-left': 'Glisser gauche',
    'slide-right': 'Glisser droite',
    'zoom': 'Zoom avant',
    'zoom-out': 'Zoom arrière',
    'flip-x': 'Retournement X',
    'flip-y': 'Retournement Y',
    'rotate': 'Rotation',
    'blur': 'Flou',
    'scale-up': 'Scale up',
    'bounce': 'Rebond',
    'elastic': 'Élastique',
    'none': 'Aucune',
};

export const EASING_LABELS: Record<AnimationEasing, string> = {
    easeOut: 'Sortie douce',
    easeIn: 'Entrée douce',
    easeInOut: 'Doux',
    linear: 'Linéaire',
    spring: 'Ressort',
    bounce: 'Rebond',
    elastic: 'Élastique',
};

export const HOVER_LABELS: Record<HoverEffect, string> = {
    none: 'Aucun',
    lift: 'Élévation',
    glow: 'Lueur',
    scale: 'Agrandissement',
    tilt: 'Inclinaison',
    shadow: 'Ombre',
    'border-glow': 'Bordure lumineuse',
};
