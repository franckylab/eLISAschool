/**
 * ==================================
 * eLISAschool - Helper Configuration v6.0
 * ==================================
 * Version: 6.0.0
 * Auteur: franck arlos chendjou
 * 
 * Fonctions utilitaires pour accéder aux paramètres
 * avec cache rapide, typage fort et support multi-tenant
 */

import { configurationService } from '../services/configuration.service';
import { CategorieParametre } from '../entities/parametre-systeme.entity';

/**
 * Cache léger pour les accès très fréquents (1 minute)
 */
const quickCache: Map<string, { value: any; expiry: number }> = new Map();
const QUICK_CACHE_TTL = 60 * 1000;

/**
 * Récupère un paramètre avec contexte d'établissement
 * 
 * @param cle Clé du paramètre
 * @param options Options de contexte
 * @param options.etablissementId ID de l'établissement (optionnel)
 * @param options.defaultValue Valeur par défaut si paramètre non trouvé
 */
export async function getParam<T = string>(
    cle: string, 
    options?: { etablissementId?: string; defaultValue?: T }
): Promise<T> {
    const { etablissementId, defaultValue } = options || {};
    const cacheKey = etablissementId ? `${cle}:${etablissementId}` : cle;

    const cached = quickCache.get(cacheKey);
    if (cached && Date.now() < cached.expiry) {
        return cached.value as T;
    }

    // ✅ PASSER etablissementId au service
    const value = await configurationService.getParametre<T>(cle, etablissementId);
    if (value !== null) {
        quickCache.set(cacheKey, { value, expiry: Date.now() + QUICK_CACHE_TTL });
        return value;
    }

    return defaultValue as T;
}

/**
 * Récupère un paramètre depuis le contexte de la requête
 * Utilise automatiquement req.etablissementId
 */
export async function getParamFromRequest<T = string>(
    cle: string,
    req: { etablissementId?: string },
    defaultValue?: T
): Promise<T> {
    return getParam<T>(cle, {
        etablissementId: req.etablissementId,
        defaultValue
    });
}

/**
 * Récupère un paramètre numérique
 */
export async function getParamNumber(
    cle: string, 
    options?: { etablissementId?: string; defaultValue?: number }
): Promise<number> {
    const value = await getParam<number>(cle, options);
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    const parsed = parseFloat(String(value));
    // Number.isFinite distingue un parse échoué d'une valeur 0 légitime
    return Number.isFinite(parsed) ? parsed : (options?.defaultValue ?? 0);
}

/**
 * Récupère un paramètre booléen
 */
export async function getParamBoolean(
    cle: string, 
    options?: { etablissementId?: string; defaultValue?: boolean }
): Promise<boolean> {
    const value = await getParam<boolean | string>(cle, options);
    if (typeof value === 'boolean') return value;
    return value === 'true' || value === '1';
}

/**
 * Récupère un paramètre JSON
 */
export async function getParamJson<T = any>(
    cle: string, 
    options?: { etablissementId?: string; defaultValue?: T }
): Promise<T | undefined> {
    const value = await getParam<T>(cle, options);
    return value;
}

/**
 * Récupère un paramètre tableau
 */
export async function getParamArray<T = string>(
    cle: string, 
    options?: { etablissementId?: string; defaultValue?: T[] }
): Promise<T[]> {
    const value = await getParam<T[]>(cle, options);
    return Array.isArray(value) ? value : options?.defaultValue || [];
}

/**
 * Vérifie si un module est actif
 */
export async function isModuleActive(moduleNom: string, etablissementId?: string): Promise<boolean> {
    return configurationService.isModuleActive(moduleNom, etablissementId);
}

/**
 * Récupère les paramètres d'un module
 */
export async function getModuleParams(module: string): Promise<Map<string, any>> {
    const params = await configurationService.getParametresByModule(module);
    const map = new Map<string, any>();
    for (const p of params) {
        try {
            map.set(p.cle, JSON.parse(p.valeur));
        } catch {
            map.set(p.cle, p.valeur);
        }
    }
    return map;
}

/**
 * Invalide le cache des configurations
 */
export function invalidateConfigCache() {
    quickCache.clear();
    configurationService.invalidateCache();
}

/**
 * Définit un paramètre (pour les services qui en ont besoin)
 */
export function setParam(cle: string, valeur: any) {
    return configurationService.setParametre(cle, valeur);
}

export { CategorieParametre };

export default {
    getParam,
    getParamFromRequest,
    getParamNumber,
    getParamBoolean,
    getParamJson,
    getParamArray,
    isModuleActive,
    getModuleParams,
    invalidateConfigCache,
    setParam,
};
