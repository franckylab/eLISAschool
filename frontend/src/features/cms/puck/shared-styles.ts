/**
 * ==================================
 * eLISAschool - Styles partagés Puck Editor
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Système de personnalisation avancée pour les composants Puck :
 * boutons, typographie, backgrounds, spacing, bordures, ombres.
 * Utilisé par tous les composants Puck pour cohérence visuelle.
 */

import type { AnimationConfig } from '../types/cms.types';
import { ANIMATION_LABELS, EASING_LABELS, HOVER_LABELS } from '../lib/animations';
import type { AnimationType, AnimationEasing, HoverEffect } from '../types/cms.types';

// ==================================
// Types de styles partagés
// ==================================

/** Configuration des boutons personnalisables */
export interface ButtonStyle {
    texte: string;
    lien?: string;
    variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link';
    size: 'sm' | 'md' | 'lg' | 'xl';
    borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'full';
    iconPosition?: 'left' | 'right' | 'none';
    iconUrl?: string;
    fullWidth: boolean;
}

/** Configuration de typographie */
export interface TypographyStyle {
    fontFamily: 'sans' | 'serif' | 'mono' | 'display';
    fontWeight: 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
    fontSize: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
    lineHeight: 'tight' | 'normal' | 'relaxed' | 'loose';
    letterSpacing: 'tighter' | 'tight' | 'normal' | 'wide' | 'wider';
    textAlign: 'left' | 'center' | 'right' | 'justify';
    textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
    color?: string;
}

/** Configuration d'arrière-plan */
export interface BackgroundStyle {
    type: 'color' | 'gradient' | 'image' | 'video';
    color?: string;
    gradientFrom?: string;
    gradientTo?: string;
    gradientDirection?: 'to-r' | 'to-l' | 'to-t' | 'to-b' | 'to-br' | 'to-tr';
    imageUrl?: string;
    imagePosition: 'cover' | 'contain' | 'center' | 'repeat';
    overlay: boolean;
    overlayColor: string;
    overlayOpacity: number;
}

/** Configuration d'espacement */
export interface SpacingStyle {
    paddingTop: string;
    paddingBottom: string;
    paddingLeft: string;
    paddingRight: string;
    marginTop: string;
    marginBottom: string;
    gap: string;
}

/** Configuration de bordure */
export interface BorderStyle {
    width: 'none' | 'thin' | 'medium' | 'thick';
    color?: string;
    style: 'solid' | 'dashed' | 'dotted' | 'double';
    radius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

/** Configuration d'ombre */
export interface ShadowStyle {
    type: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'inner' | 'glow';
    color?: string;
}

/** Style complet d'une section */
export interface SectionStyleConfig {
    typography?: TypographyStyle;
    background?: BackgroundStyle;
    spacing?: SpacingStyle;
    border?: BorderStyle;
    shadow?: ShadowStyle;
    button?: ButtonStyle;
    animations?: AnimationConfig;
}

// ==================================
// Presets de styles (thèmes prédéfinis)
// ==================================

export const STYLE_PRESETS = {
    /** Hero classique avec gradient */
    heroClassic: {
        background: {
            type: 'gradient' as const,
            gradientFrom: '#1e40af',
            gradientTo: '#7c3aed',
            gradientDirection: 'to-br' as const,
            overlay: false,
            overlayColor: '#000000',
            overlayOpacity: 0,
            imagePosition: 'cover' as const,
        },
        typography: {
            fontFamily: 'sans' as const,
            fontWeight: 'bold' as const,
            fontSize: '4xl' as const,
            lineHeight: 'tight' as const,
            letterSpacing: 'tight' as const,
            textAlign: 'center' as const,
            textTransform: 'none' as const,
            color: '#ffffff',
        },
        spacing: {
            paddingTop: 'clamp(4rem, 3rem + 4vw, 8rem)',
            paddingBottom: 'clamp(4rem, 3rem + 4vw, 8rem)',
            paddingLeft: 'clamp(1rem, 0.5rem + 2vw, 2rem)',
            paddingRight: 'clamp(1rem, 0.5rem + 2vw, 2rem)',
            marginTop: '0',
            marginBottom: '0',
            gap: 'clamp(0.5rem, 0.4rem + 0.3vw, 1rem)',
        },
    },
    /** Section contenu standard */
    contentStandard: {
        background: {
            type: 'color' as const,
            color: '#ffffff',
            overlay: false,
            overlayColor: '#000000',
            overlayOpacity: 0,
            imagePosition: 'cover' as const,
        },
        typography: {
            fontFamily: 'sans' as const,
            fontWeight: 'normal' as const,
            fontSize: 'base' as const,
            lineHeight: 'relaxed' as const,
            letterSpacing: 'normal' as const,
            textAlign: 'left' as const,
            textTransform: 'none' as const,
        },
        spacing: {
            paddingTop: 'clamp(2rem, 1.5rem + 2vw, 4rem)',
            paddingBottom: 'clamp(2rem, 1.5rem + 2vw, 4rem)',
            paddingLeft: 'clamp(1rem, 0.5rem + 2vw, 2rem)',
            paddingRight: 'clamp(1rem, 0.5rem + 2vw, 2rem)',
            marginTop: '0',
            marginBottom: '0',
            gap: 'clamp(0.5rem, 0.4rem + 0.3vw, 1rem)',
        },
    },
    /** Section sombre élégante */
    darkElegant: {
        background: {
            type: 'color' as const,
            color: '#111827',
            overlay: false,
            overlayColor: '#000000',
            overlayOpacity: 0,
            imagePosition: 'cover' as const,
        },
        typography: {
            fontFamily: 'serif' as const,
            fontWeight: 'medium' as const,
            fontSize: 'lg' as const,
            lineHeight: 'relaxed' as const,
            letterSpacing: 'normal' as const,
            textAlign: 'center' as const,
            textTransform: 'none' as const,
            color: '#f9fafb',
        },
        spacing: {
            paddingTop: 'clamp(3rem, 2rem + 3vw, 6rem)',
            paddingBottom: 'clamp(3rem, 2rem + 3vw, 6rem)',
            paddingLeft: 'clamp(1rem, 0.5rem + 2vw, 2rem)',
            paddingRight: 'clamp(1rem, 0.5rem + 2vw, 2rem)',
            marginTop: '0',
            marginBottom: '0',
            gap: 'clamp(0.75rem, 0.6rem + 0.4vw, 1.5rem)',
        },
    },
    /** Carte avec ombre douce */
    cardSoft: {
        border: {
            width: 'thin' as const,
            color: '#e5e7eb',
            style: 'solid' as const,
            radius: 'xl' as const,
        },
        shadow: {
            type: 'lg' as const,
        },
        spacing: {
            paddingTop: 'clamp(1.5rem, 1rem + 1.5vw, 2.5rem)',
            paddingBottom: 'clamp(1.5rem, 1rem + 1.5vw, 2.5rem)',
            paddingLeft: 'clamp(1rem, 0.5rem + 1vw, 2rem)',
            paddingRight: 'clamp(1rem, 0.5rem + 1vw, 2rem)',
            marginTop: '0',
            marginBottom: '0',
            gap: 'clamp(0.5rem, 0.4rem + 0.3vw, 1rem)',
        },
    },
} as const;

// ==================================
// Helpers de conversion CSS
// ==================================

const FONT_SIZE_MAP: Record<string, string> = {
    xs: 'clamp(0.625rem, 0.58rem + 0.2vw, 0.75rem)',
    sm: 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)',
    base: 'clamp(0.875rem, 0.8rem + 0.35vw, 1rem)',
    lg: 'clamp(1rem, 0.9rem + 0.5vw, 1.125rem)',
    xl: 'clamp(1.125rem, 1rem + 0.6vw, 1.25rem)',
    '2xl': 'clamp(1.25rem, 1.1rem + 0.7vw, 1.5rem)',
    '3xl': 'clamp(1.5rem, 1.3rem + 1vw, 1.875rem)',
    '4xl': 'clamp(1.875rem, 1.5rem + 1.5vw, 2.5rem)',
    '5xl': 'clamp(2.5rem, 2rem + 2vw, 3.5rem)',
};

const FONT_FAMILY_MAP: Record<string, string> = {
    sans: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
    serif: 'ui-serif, Georgia, Cambria, serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    display: 'ui-sans-serif, system-ui, sans-serif',
};

const FONT_WEIGHT_MAP: Record<string, number> = {
    normal: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800,
};

const LINE_HEIGHT_MAP: Record<string, string> = {
    tight: '1.25', normal: '1.5', relaxed: '1.75', loose: '2',
};

const LETTER_SPACING_MAP: Record<string, string> = {
    tighter: '-0.05em', tight: '-0.025em', normal: '0em', wide: '0.025em', wider: '0.05em',
};

const BORDER_RADIUS_MAP: Record<string, string> = {
    none: '0', sm: '0.25rem', md: '0.375rem', lg: '0.5rem', xl: '0.75rem', '2xl': '1rem', full: '9999px',
};

const SHADOW_MAP: Record<string, string> = {
    none: 'none',
    sm: '0 1px 2px rgba(0,0,0,0.05)',
    md: '0 4px 6px -1px rgba(0,0,0,0.1)',
    lg: '0 10px 15px -3px rgba(0,0,0,0.1)',
    xl: '0 20px 25px -5px rgba(0,0,0,0.1)',
    '2xl': '0 25px 50px -12px rgba(0,0,0,0.25)',
    inner: 'inset 0 2px 4px rgba(0,0,0,0.06)',
    glow: '0 0 20px rgba(59,130,246,0.3)',
};

/**
 * Convertit un TypographyStyle en CSS inline.
 */
export function typographyToCSS(typo: TypographyStyle): Record<string, string> {
    const css: Record<string, string> = {};
    if (typo.fontFamily) css.fontFamily = FONT_FAMILY_MAP[typo.fontFamily];
    if (typo.fontWeight) css.fontWeight = String(FONT_WEIGHT_MAP[typo.fontWeight]);
    if (typo.fontSize) css.fontSize = FONT_SIZE_MAP[typo.fontSize];
    if (typo.lineHeight) css.lineHeight = LINE_HEIGHT_MAP[typo.lineHeight];
    if (typo.letterSpacing) css.letterSpacing = LETTER_SPACING_MAP[typo.letterSpacing];
    if (typo.textAlign) css.textAlign = typo.textAlign;
    if (typo.textTransform) css.textTransform = typo.textTransform;
    if (typo.color) css.color = typo.color;
    return css;
}

/**
 * Convertit un BackgroundStyle en CSS inline.
 */
export function backgroundToCSS(bg: BackgroundStyle): Record<string, string> {
    const css: Record<string, string> = {};
    if (bg.type === 'color' && bg.color) {
        css.backgroundColor = bg.color;
    } else if (bg.type === 'gradient' && bg.gradientFrom && bg.gradientTo) {
        const dir = bg.gradientDirection || 'to-br';
        css.background = `linear-gradient(${dir}, ${bg.gradientFrom}, ${bg.gradientTo})`;
    } else if (bg.type === 'image' && bg.imageUrl) {
        css.backgroundImage = `url(${bg.imageUrl})`;
        css.backgroundSize = bg.imagePosition || 'cover';
        css.backgroundPosition = 'center';
    }
    return css;
}

/**
 * Convertit un SpacingStyle en CSS inline.
 */
export function spacingToCSS(sp: SpacingStyle): Record<string, string> {
    const css: Record<string, string> = {};
    if (sp.paddingTop) css.paddingTop = sp.paddingTop;
    if (sp.paddingBottom) css.paddingBottom = sp.paddingBottom;
    if (sp.paddingLeft) css.paddingLeft = sp.paddingLeft;
    if (sp.paddingRight) css.paddingRight = sp.paddingRight;
    if (sp.marginTop) css.marginTop = sp.marginTop;
    if (sp.marginBottom) css.marginBottom = sp.marginBottom;
    if (sp.gap) css.gap = sp.gap;
    return css;
}

/**
 * Convertit un BorderStyle en CSS inline.
 */
export function borderToCSS(border: BorderStyle): Record<string, string> {
    const css: Record<string, string> = {};
    if (border.width && border.width !== 'none') {
        const w = border.width === 'thin' ? '1px' : border.width === 'medium' ? '2px' : '4px';
        css.border = `${w} ${border.style} ${border.color || '#e5e7eb'}`;
    }
    if (border.radius && border.radius !== 'none') {
        css.borderRadius = BORDER_RADIUS_MAP[border.radius];
    }
    return css;
}

/**
 * Convertit un ShadowStyle en CSS inline.
 */
export function shadowToCSS(shadow: ShadowStyle): Record<string, string> {
    if (!shadow.type || shadow.type === 'none') return {};
    return { boxShadow: SHADOW_MAP[shadow.type] || 'none' };
}

/**
 * Fusionne tous les styles de section en un seul objet CSS inline.
 */
export function mergeSectionStyles(config: SectionStyleConfig): Record<string, string> {
    const styles: Record<string, string>[] = [];
    if (config.background) styles.push(backgroundToCSS(config.background));
    if (config.spacing) styles.push(spacingToCSS(config.spacing));
    if (config.border) styles.push(borderToCSS(config.border));
    if (config.shadow) styles.push(shadowToCSS(config.shadow));
    if (config.typography) styles.push(typographyToCSS(config.typography));
    return Object.assign({}, ...styles);
}

// ==================================
// Options pour les sélecteurs UI
// ==================================

export const BUTTON_VARIANTS = [
    { label: 'Primaire', value: 'primary' },
    { label: 'Secondaire', value: 'secondary' },
    { label: 'Contour', value: 'outline' },
    { label: 'Fantôme', value: 'ghost' },
    { label: 'Lien', value: 'link' },
] as const;

export const BUTTON_SIZES = [
    { label: 'Petit', value: 'sm' },
    { label: 'Moyen', value: 'md' },
    { label: 'Grand', value: 'lg' },
    { label: 'XL', value: 'xl' },
] as const;

export const GRADIENT_DIRECTIONS = [
    { label: '→ Droite', value: 'to-r' },
    { label: '← Gauche', value: 'to-l' },
    { label: '↓ Bas', value: 'to-b' },
    { label: '↑ Haut', value: 'to-t' },
    { label: '↘ Diagonale', value: 'to-br' },
    { label: '↗ Diagonale', value: 'to-tr' },
] as const;

export { ANIMATION_LABELS, EASING_LABELS, HOVER_LABELS };
export type { AnimationType, AnimationEasing, HoverEffect };
