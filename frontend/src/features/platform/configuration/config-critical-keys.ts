/**
 * ==================================
 * eLISAschool - Clés de paramètres critiques
 * ==================================
 * Liste des paramètres qui nécessitent une re-authentification MFA
 * avant modification. Ces paramètres impactent la sécurité globale
 * du système et ne doivent pas être modifiés sans vérification.
 *
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

/** Clés des paramètres critiques nécessitant MFA pour modification */
export const CRITICAL_PARAM_KEYS: ReadonlySet<string> = new Set([
    // Authentification
    'auth.require_2fa',
    'auth.allow_self_registration',
    'auth.rate_limiting',
    'auth.brute_force_protection',
    'auth.session_duration',
    'auth.max_login_attempts',
    'auth.lockout_duration',
    'auth.password_min_length',
    'auth.password_require_uppercase',
    'auth.password_require_lowercase',
    'auth.password_require_numbers',
    'auth.password_require_special',
    'auth.password_expiry_days',
    'auth.jwt_access_ttl',
    'auth.jwt_refresh_ttl',

    // Système
    'system.maintenance_mode',
    'system.log_level',

    // Sécurité réseau
    'security.ip_allowlist_enabled',
    'security.cors_origins',
    'security.rate_limit_global',

    // Paramètres ENCRYPTED (tous)
    // Détectés dynamiquement via typeValeur === 'ENCRYPTED'
]);

/**
 * Vérifie si un paramètre est critique (nécessite MFA).
 * Un paramètre est critique si :
 *   1. Sa clé est dans CRITICAL_PARAM_KEYS, OU
 *   2. Son typeValeur est 'ENCRYPTED'
 */
export function isParametreCritique(cle: string, typeValeur?: string): boolean {
    if (CRITICAL_PARAM_KEYS.has(cle)) return true;
    if (typeValeur === 'ENCRYPTED') return true;
    return false;
}

/**
 * Vérifie si un ensemble de modifications contient des paramètres critiques.
 */
export function hasCriticalChanges(dirtyFields: Set<string>, parametres: Array<{ cle: string; typeValeur?: string }>): boolean {
    for (const cle of dirtyFields) {
        const param = parametres.find(p => p.cle === cle);
        if (param && isParametreCritique(cle, param.typeValeur)) {
            return true;
        }
    }
    return false;
}
