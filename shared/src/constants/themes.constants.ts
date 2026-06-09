/**
 * ==================================
 * eLISAschool - Constantes des thèmes
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

/**
 * Palette de couleurs par défaut
 */
export const DEFAULT_THEME = {
    primary: '#28a745',    // Vert
    secondary: '#ffc107',  // Jaune
    accent: '#007bff',     // Bleu
    danger: '#dc3545',     // Rouge
    warning: '#fd7e14',    // Orange
    success: '#28a745',    // Vert
    info: '#17a2b8',       // Cyan

    // Couleurs neutres
    dark: '#343a40',
    light: '#f8f9fa',
    white: '#ffffff',
    black: '#000000',

    // Fond
    background: '#f4f6f9',
    surface: '#ffffff',

    // Texte
    textPrimary: '#212529',
    textSecondary: '#6c757d',
    textMuted: '#adb5bd',
} as const;

/**
 * Thèmes prédéfinis
 */
export const THEMES = {
    default: DEFAULT_THEME,

    dark: {
        ...DEFAULT_THEME,
        background: '#1a1a2e',
        surface: '#16213e',
        textPrimary: '#eaeaea',
        textSecondary: '#a0a0a0',
    },

    cameroon: {
        ...DEFAULT_THEME,
        primary: '#007a3d',    // Vert Cameroun
        secondary: '#ce1126',  // Rouge Cameroun
        accent: '#fcd116',     // Jaune Cameroun
    },
} as const;

/**
 * Tailles de police
 */
export const FONT_SIZES = {
    xs: '0.75rem',   // 12px
    sm: '0.875rem',  // 14px
    base: '1rem',    // 16px
    lg: '1.125rem',  // 18px
    xl: '1.25rem',   // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
} as const;

/**
 * Espacements
 */
export const SPACING = {
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
} as const;

/**
 * Rayons de bordure
 */
export const BORDER_RADIUS = {
    none: '0',
    sm: '0.125rem',
    default: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    full: '9999px',
} as const;

export default {
    DEFAULT_THEME,
    THEMES,
    FONT_SIZES,
    SPACING,
    BORDER_RADIUS,
};
