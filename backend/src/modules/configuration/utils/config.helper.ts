/**
 * ==================================
 * eLISAschool - Helper Configuration v2.0
 * ==================================
 * Version: 2.0.0
 * Auteur: xAI Éducation
 * 
 * Fonctions utilitaires pour accéder aux paramètres
 * avec cache rapide et typage fort
 */

import { configurationService } from '../services/configuration.service';
import { CategorieParametre } from '../entities/parametre-systeme.entity';

/**
 * Cache léger pour les accès très fréquents (1 minute)
 */
const quickCache: Map<string, { value: any; expiry: number }> = new Map();
const QUICK_CACHE_TTL = 60 * 1000;

/**
 * Récupère un paramètre avec cache rapide
 */
export async function getParam<T = string>(cle: string, defaultValue?: T): Promise<T> {
    const cached = quickCache.get(cle);
    if (cached && Date.now() < cached.expiry) {
        return cached.value as T;
    }

    const value = await configurationService.getParametre<T>(cle);
    if (value !== null) {
        quickCache.set(cle, { value, expiry: Date.now() + QUICK_CACHE_TTL });
        return value;
    }

    return defaultValue as T;
}

/**
 * Récupère un paramètre numérique
 */
export async function getParamNumber(cle: string, defaultValue: number = 0): Promise<number> {
    const value = await getParam<number>(cle, defaultValue);
    return typeof value === 'number' ? value : parseFloat(String(value)) || defaultValue;
}

/**
 * Récupère un paramètre booléen
 */
export async function getParamBoolean(cle: string, defaultValue: boolean = false): Promise<boolean> {
    const value = await getParam<boolean | string>(cle, defaultValue);
    if (typeof value === 'boolean') return value;
    return value === 'true' || value === '1';
}

/**
 * Récupère un paramètre JSON
 */
export async function getParamJson<T = any>(cle: string, defaultValue?: T): Promise<T | undefined> {
    const value = await getParam<T>(cle, defaultValue);
    return value;
}

/**
 * Récupère un paramètre tableau
 */
export async function getParamArray<T = string>(cle: string, defaultValue: T[] = []): Promise<T[]> {
    const value = await getParam<T[]>(cle, defaultValue);
    return Array.isArray(value) ? value : defaultValue;
}

/**
 * Vérifie si un module est actif
 */
export async function isModuleActive(moduleNom: string): Promise<boolean> {
    return configurationService.isModuleActive(moduleNom);
}

/**
 * Récupère la configuration de l'établissement
 */
export async function getAppConfig() {
    return configurationService.getConfigApp();
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
    getParamNumber,
    getParamBoolean,
    getParamJson,
    getParamArray,
    isModuleActive,
    getAppConfig,
    getModuleParams,
    invalidateConfigCache,
    setParam,
};
