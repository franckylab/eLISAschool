/**
 * ==================================
 * eLISAschool - Validation Zod des Paramètres v10.0
 * ==================================
 * Version: 10.0.0
 * Auteur: franck arlos chendjou
 * 
 * Registry de schémas Zod pour valider les valeurs des paramètres
 * système avant sauvegarde.
 * 
 * Usage :
 * - Validation automatique dans setParametre() et createParametre()
 * - Schémas par catégorie ou par clé spécifique
 * - Extensible pour ajouter des validations custom
 */

import { z } from 'zod';
import { CategorieParametre, TypeValeurParametre } from '../entities/parametre-systeme.entity';

/**
 * Schémas de validation par type de valeur
 */
export const typeValidationSchemas: Record<TypeValeurParametre, z.ZodSchema> = {
    [TypeValeurParametre.STRING]: z.string().min(0).max(10000),
    [TypeValeurParametre.NUMBER]: z.number().finite(),
    [TypeValeurParametre.BOOLEAN]: z.boolean(),
    [TypeValeurParametre.JSON]: z.any(), // JSON valide (objet, tableau, etc.)
    [TypeValeurParametre.ARRAY]: z.array(z.any()),
    [TypeValeurParametre.ENCRYPTED]: z.string().min(1), // Chaîne chiffrée non vide
};

/**
 * Schémas de validation spécifiques par clé de paramètre
 * 
 * Permet de définir des validations plus strictes pour des paramètres critiques
 */
export const keyValidationSchemas: Record<string, z.ZodSchema> = {
    // Authentification
    'auth.session_duration': z.number().int().min(60).max(86400), // 1 min à 24h en secondes
    'auth.max_login_attempts': z.number().int().min(1).max(100),
    'auth.lockout_duration': z.number().int().min(60).max(86400), // 1 min à 24h
    'auth.password_min_length': z.number().int().min(6).max(128),
    'auth.require_uppercase': z.boolean(),
    'auth.require_lowercase': z.boolean(),
    'auth.require_numbers': z.boolean(),
    'auth.require_special_chars': z.boolean(),
    'auth.mfa_required': z.boolean(),
    
    // Validation workflow
    'notes.validation_levels': z.object({
        '1': z.string(),
        '2': z.string().optional(),
        '3': z.string().optional(),
    }).passthrough(),
    'bulletins.validation_levels': z.object({
        '1': z.string(),
        '2': z.string().optional(),
    }).passthrough(),
    
    // Billing
    'billing.tranche_eleves': z.number().int().min(1).max(100000),
    'billing.tranche_montant': z.number().min(0).max(10000000),
    'billing.taux_tva': z.number().min(0).max(100),
    
    // Notifications
    'notifications.max_recipients': z.number().int().min(1).max(10000),
    'notifications.rate_limit': z.number().int().min(1).max(1000),
    
    // Système
    'app.nom': z.string().min(1).max(100),
    'app.version': z.string().regex(/^\d+\.\d+\.\d+$/), // Semver
    'app.langueDefaut': z.enum(['fr', 'en']),
    'app.devise': z.string().length(3), // ISO 4217
    'app.fuseauHoraire': z.string().min(1).max(50),
    
    // Modules
    'modules.*.actif': z.boolean(), // Pattern matching pour tous les modules
};

/**
 * Résultat de la validation
 */
export interface ValidationResult {
    success: boolean;
    errors?: string[];
    parsedValue?: any;
}

/**
 * Valide une valeur de paramètre selon son type et sa clé
 * 
 * @param cle Clé du paramètre
 * @param valeur Valeur à valider
 * @param typeValeur Type de valeur attendu
 * @returns Résultat de la validation
 */
export function validateParametreValue(
    cle: string,
    valeur: any,
    typeValeur: TypeValeurParametre
): ValidationResult {
    // 1. Vérifier le schéma spécifique par clé (priorité)
    const keySchema = findKeySchema(cle);
    if (keySchema) {
        const result = keySchema.safeParse(valeur);
        if (result.success) {
            return { success: true, parsedValue: result.data };
        }
        return {
            success: false,
            errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
        };
    }

    // 2. Fallback sur le schéma par type
    const typeSchema = typeValidationSchemas[typeValeur];
    if (!typeSchema) {
        return { success: true, parsedValue: valeur }; // Pas de validation pour ce type
    }

    const result = typeSchema.safeParse(valeur);
    if (result.success) {
        return { success: true, parsedValue: result.data };
    }

    return {
        success: false,
        errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
    };
}

/**
 * Trouve le schéma de validation pour une clé donnée
 * Supporte les patterns avec wildcard (ex: 'modules.*.actif')
 */
function findKeySchema(cle: string): z.ZodSchema | null {
    // 1. Match exact
    if (keyValidationSchemas[cle]) {
        return keyValidationSchemas[cle];
    }

    // 2. Match par pattern (wildcard)
    for (const [pattern, schema] of Object.entries(keyValidationSchemas)) {
        if (pattern.includes('*')) {
            const regex = new RegExp('^' + pattern.replace(/\*/g, '[^.]+') + '$');
            if (regex.test(cle)) {
                return schema;
            }
        }
    }

    return null;
}

/**
 * Valide et parse une valeur JSON string
 * 
 * @param cle Clé du paramètre
 * @param valeurString Valeur sous forme de string JSON
 * @param typeValeur Type de valeur attendu
 * @returns Résultat de la validation
 */
export function validateAndParseJsonValue(
    cle: string,
    valeurString: string,
    typeValeur: TypeValeurParametre
): ValidationResult {
    // 1. Parser le JSON
    let parsed: any;
    try {
        parsed = JSON.parse(valeurString);
    } catch (error) {
        return {
            success: false,
            errors: [`Valeur JSON invalide: ${(error as Error).message}`],
        };
    }

    // 2. Valider la valeur parsée
    return validateParametreValue(cle, parsed, typeValeur);
}

/**
 * Schémas de validation par catégorie
 * 
 * Permet de définir des contraintes globales par catégorie
 */
export const categoryValidationRules: Partial<Record<CategorieParametre, { maxParams: number; description: string }>> = {
    [CategorieParametre.SYSTEME]: {
        maxParams: 100,
        description: 'Paramètres système critiques',
    },
    [CategorieParametre.SECURITE]: {
        maxParams: 50,
        description: 'Paramètres de sécurité',
    },
    [CategorieParametre.MODULE]: {
        maxParams: 500,
        description: 'Paramètres de modules',
    },
};

/**
 * Vérifie si une catégorie a atteint sa limite de paramètres
 * 
 * @param categorie Catégorie à vérifier
 * @param count Nombre actuel de paramètres
 * @returns true si la limite est atteinte
 */
export function isCategoryLimitReached(categorie: CategorieParametre, count: number): boolean {
    const rules = categoryValidationRules[categorie];
    if (!rules) return false;
    return count >= rules.maxParams;
}
