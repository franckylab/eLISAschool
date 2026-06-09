/**
 * ==================================
 * eLISAschool - Constantes de l'application
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

/**
 * Informations de l'application
 */
export const APP_INFO = {
    name: 'eLISAschool',
    version: '1.0.0',
    author: 'franck arlos chendjou',
    description: 'Application de gestion scolaire avancée',
    website: 'https://elisaschool.cm',
} as const;

/**
 * Limites par défaut
 */
export const LIMITS = {
    /** Longueur maximale du message d'accueil */
    MESSAGE_ACCUEIL_MAX: 500,

    /** Taille maximale des fichiers uploadés (en octets) */
    FILE_UPLOAD_MAX_SIZE: 10 * 1024 * 1024, // 10 MB

    /** Nombre maximum d'éléments par page */
    PAGINATION_DEFAULT: 20,
    PAGINATION_MAX: 100,

    /** Longueur du mot de passe */
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_MAX_LENGTH: 128,

    /** Tentatives de connexion avant blocage */
    MAX_LOGIN_ATTEMPTS: 5,

    /** Durée du blocage (en minutes) */
    LOGIN_BLOCK_DURATION: 15,
} as const;

/**
 * Devises supportées
 */
export const CURRENCIES = {
    XOF: { code: 'XOF', symbol: 'FCFA', name: 'Franc CFA', decimals: 0 },
    XAF: { code: 'XAF', symbol: 'FCFA', name: 'Franc CFA BEAC', decimals: 0 },
    EUR: { code: 'EUR', symbol: '€', name: 'Euro', decimals: 2 },
    USD: { code: 'USD', symbol: '$', name: 'Dollar US', decimals: 2 },
} as const;

/**
 * Devise par défaut
 */
export const DEFAULT_CURRENCY = CURRENCIES.XOF;

/**
 * Langues supportées
 */
export const LANGUAGES = {
    fr: { code: 'fr', name: 'Français', nativeName: 'Français' },
    en: { code: 'en', name: 'Anglais', nativeName: 'English' },
} as const;

/**
 * Langue par défaut
 */
export const DEFAULT_LANGUAGE = LANGUAGES.fr;

export default {
    APP_INFO,
    LIMITS,
    CURRENCIES,
    DEFAULT_CURRENCY,
    LANGUAGES,
    DEFAULT_LANGUAGE,
};
