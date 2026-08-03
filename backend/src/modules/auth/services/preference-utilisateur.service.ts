/**
 * ==================================
 * eLISAschool - Service Préférences Utilisateur
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Gestion complète des préférences utilisateur avec:
 * - Valeurs par défaut
 * - Reset individuel et global
 * - Héritage config globale
 * - Cache Redis performant
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { PreferenceUtilisateur, CategoriePreference } from '../entities/preference-utilisateur.entity';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { redisService } from '@common/services/redis.service';
import { configurationService } from '@modules/configuration/services/configuration.service';

/**
 * Préférences par défaut du système
 */
export const DEFAULT_PREFERENCES: Record<string, {
    valeur: string;
    typeValeur: string;
    categorie: CategoriePreference;
    description: string;
}> = {
    // Affichage
    'theme': {
        valeur: 'default',
        typeValeur: 'string',
        categorie: CategoriePreference.AFFICHAGE,
        description: 'Thème de l\'interface (default, dark, cameroon)',
    },
    'langue': {
        valeur: 'fr',
        typeValeur: 'string',
        categorie: CategoriePreference.LANGUE,
        description: 'Langue de l\'interface (fr, en)',
    },
    'taillePolice': {
        valeur: 'base',
        typeValeur: 'string',
        categorie: CategoriePreference.AFFICHAGE,
        description: 'Taille de police (xs, sm, base, lg, xl)',
    },
    'modeCompact': {
        valeur: 'false',
        typeValeur: 'boolean',
        categorie: CategoriePreference.AFFICHAGE,
        description: 'Mode compact pour les tableaux',
    },

    // Notifications
    'notifications.email': {
        valeur: 'true',
        typeValeur: 'boolean',
        categorie: CategoriePreference.NOTIFICATIONS,
        description: 'Recevoir les notifications par email',
    },
    'notifications.push': {
        valeur: 'true',
        typeValeur: 'boolean',
        categorie: CategoriePreference.NOTIFICATIONS,
        description: 'Recevoir les notifications push',
    },
    'notifications.sms': {
        valeur: 'false',
        typeValeur: 'boolean',
        categorie: CategoriePreference.NOTIFICATIONS,
        description: 'Recevoir les notifications SMS',
    },
    'notifications.son': {
        valeur: 'true',
        typeValeur: 'boolean',
        categorie: CategoriePreference.NOTIFICATIONS,
        description: 'Son des notifications',
    },

    // Messagerie
    'messagerie.signature': {
        valeur: '',
        typeValeur: 'string',
        categorie: CategoriePreference.MESSAGERIE,
        description: 'Signature automatique des messages',
    },
    'messagerie.notification_sonore': {
        valeur: 'true',
        typeValeur: 'boolean',
        categorie: CategoriePreference.MESSAGERIE,
        description: 'Son pour nouveaux messages',
    },
    'messagerie.auto_save_brouillons': {
        valeur: 'true',
        typeValeur: 'boolean',
        categorie: CategoriePreference.MESSAGERIE,
        description: 'Sauvegarde automatique des brouillons',
    },

    // Tableau de bord
    'dashboard.widgets': {
        valeur: JSON.stringify(['stats', 'activite recente', 'calendrier']),
        typeValeur: 'json',
        categorie: CategoriePreference.TABLEAU_BORD,
        description: 'Widgets affichés sur le dashboard',
    },
    'dashboard.layout': {
        valeur: 'grid',
        typeValeur: 'string',
        categorie: CategoriePreference.TABLEAU_BORD,
        description: 'Layout du dashboard (grid, list)',
    },

    // Accessibilité
    'accessibilite.contraste': {
        valeur: 'normal',
        typeValeur: 'string',
        categorie: CategoriePreference.ACCESSIBILITE,
        description: 'Niveau de contraste (normal, high)',
    },
    'accessibilite.reduction_mouvements': {
        valeur: 'false',
        typeValeur: 'boolean',
        categorie: CategoriePreference.ACCESSIBILITE,
        description: 'Réduction des animations',
    },

    // Sécurité
    'securite.double_auth': {
        valeur: 'false',
        typeValeur: 'boolean',
        categorie: CategoriePreference.SECURITE,
        description: 'Authentification à deux facteurs',
    },
    'securite.timeout_session': {
        valeur: '30',
        typeValeur: 'number',
        categorie: CategoriePreference.SECURITE,
        description: 'Timeout session (minutes)',
    },
};

const PREFERENCE_CACHE_TTL = 300; // 5 minutes

/**
 * Cache L1 en mémoire pour accès ultra-rapide (1 min)
 */
const memoryCache = new Map<string, { value: any; expiry: number }>();
const MEMORY_CACHE_TTL = 60 * 1000; // 1 minute

export class PreferenceUtilisateurService {
    private preferenceRepo: Repository<PreferenceUtilisateur>;

    constructor() {
        this.preferenceRepo = AppDataSource.getRepository(PreferenceUtilisateur);
    }

    /**
     * Obtenir toutes les préférences d'un utilisateur
     * Avec fallback sur les valeurs par défaut
     * OPTIMISÉ: Cache L1 (mémoire) + L2 (Redis) + Batch query
     */
    async getAllPreferences(utilisateurId: string): Promise<Record<string, any>> {
        // Vérifier cache L1 (mémoire)
        const cacheKey = `preferences:${utilisateurId}`;
        const memoryCached = memoryCache.get(cacheKey);
        if (memoryCached && Date.now() < memoryCached.expiry) {
            return memoryCached.value;
        }

        // Vérifier cache L2 (Redis)
        try {
            const redisCached = await redisService.getJSON<Record<string, any>>(cacheKey);
            if (redisCached) {
                // Peupler cache L1
                memoryCache.set(cacheKey, { value: redisCached, expiry: Date.now() + MEMORY_CACHE_TTL });
                return redisCached;
            }
        } catch (error) {
            logger.warn('[Preferences] Échec lecture cache Redis', error);
        }

        // BATCH QUERY: Charger toutes les préférences en une seule requête
        const userPrefs = await this.preferenceRepo.find({
            where: { utilisateurId },
            select: ['cle', 'valeur', 'typeValeur', 'categorie', 'heriteGlobal'],
        });

        // Construire le map de préférences
        const prefs: Record<string, any> = {};

        // Appliquer les valeurs par défaut
        for (const [key, def] of Object.entries(DEFAULT_PREFERENCES)) {
            prefs[key] = this.parseValue(def.valeur, def.typeValeur);
        }

        // Override avec préférences utilisateur
        for (const pref of userPrefs) {
            if (!pref.heriteGlobal) {
                prefs[pref.cle] = this.parseValue(pref.valeur, pref.typeValeur);
            } else {
                // Hériter de la config globale
                prefs[pref.cle] = await this.getGlobalConfigValue(pref.cle);
            }
        }

        // Mettre en cache L1 et L2
        try {
            await redisService.setJSON(cacheKey, prefs, PREFERENCE_CACHE_TTL);
            memoryCache.set(cacheKey, { value: prefs, expiry: Date.now() + MEMORY_CACHE_TTL });
        } catch (error) {
            logger.warn('[Preferences] Échec écriture cache', error);
        }

        return prefs;
    }

    /**
     * Obtenir une préférence spécifique
     * OPTIMISÉ: Cache L1 + L2 + requête sélective
     */
    async getPreference<T = any>(
        utilisateurId: string,
        cle: string,
        defaultValue?: T,
        etablissementId?: string
    ): Promise<T> {
        // Clé de cache avec contexte multi-tenant
        const keyEtab = etablissementId ? `:${etablissementId}` : '';
        const cacheKey = `preferences:${utilisateurId}:${cle}${keyEtab}`;
        
        // Vérifier cache L1
        const memoryCached = memoryCache.get(cacheKey);
        if (memoryCached && Date.now() < memoryCached.expiry) {
            return memoryCached.value;
        }

        // Vérifier cache L2
        try {
            const redisCached = await redisService.getJSON<T>(cacheKey);
            if (redisCached !== null) {
                memoryCache.set(cacheKey, { value: redisCached, expiry: Date.now() + MEMORY_CACHE_TTL });
                return redisCached;
            }
        } catch (error) {
            // Ignorer
        }

        // Chercher en DB avec requête optimisée (multi-tenant)
        const whereClause: any = { 
            utilisateurId, 
            cle,
        };
        
        // Ajouter etablissementId uniquement si fourni (éviter null)
        if (etablissementId) {
            whereClause.etablissementId = etablissementId;
        } else {
            whereClause.etablissementId = null;
        }
        
        const pref = await this.preferenceRepo.findOne({
            where: whereClause,
            select: ['valeur', 'typeValeur', 'heriteGlobal'],
        });

        let value: T;

        if (!pref || pref.heriteGlobal) {
            // Valeur par défaut ou config globale
            const defaultPref = DEFAULT_PREFERENCES[cle];
            if (defaultPref) {
                value = this.parseValue(defaultPref.valeur, defaultPref.typeValeur);
            } else {
                value = (await this.getGlobalConfigValue(cle)) as T;
            }

            // Si toujours null, utiliser defaultValue
            if (value === undefined || value === null) {
                value = defaultValue as T;
            }
        } else {
            value = this.parseValue(pref.valeur, pref.typeValeur);
        }

        // Cache L1 et L2
        try {
            await redisService.setJSON(cacheKey, value, PREFERENCE_CACHE_TTL);
            memoryCache.set(cacheKey, { value, expiry: Date.now() + MEMORY_CACHE_TTL });
        } catch (error) {
            // Ignorer
        }

        return value;
    }

    /**
     * Définir une préférence (avec support multi-tenant)
     */
    async setPreference(
        utilisateurId: string,
        cle: string,
        valeur: any,
        typeValeur?: string,
        etablissementId?: string
    ): Promise<PreferenceUtilisateur> {
        // Déterminer le type
        const defaultPref = DEFAULT_PREFERENCES[cle];
        const type = typeValeur || defaultPref?.typeValeur || this.inferType(valeur);

        // Chercher existant avec logique améliorée :
        // Essayer d'abord avec etablissementId, puis sans (NULL)
        let pref = await this.preferenceRepo.findOne({
            where: { utilisateurId, cle, etablissementId },
        });

        if (!pref && etablissementId) {
            // Si pas trouvé avec etablissementId, chercher sans (préférence globale)
            pref = await this.preferenceRepo.findOne({
                where: { utilisateurId, cle, etablissementId: undefined as any },
            });
        }

        if (pref) {
            // Update
            pref.valeur = this.serializeValue(valeur, type);
            pref.typeValeur = type;
            pref.heriteGlobal = false;
            if (etablissementId) {
                pref.etablissementId = etablissementId;
            }
        } else {
            // Create
            pref = this.preferenceRepo.create({
                utilisateurId,
                cle,
                valeur: this.serializeValue(valeur, type),
                typeValeur: type,
                categorie: defaultPref?.categorie || CategoriePreference.PERSONNALISATION,
                valeurDefaut: defaultPref?.valeur,
                heriteGlobal: false,
                description: defaultPref?.description,
                etablissementId,
            });
        }

        await this.preferenceRepo.save(pref);

        // Invalider cache (avec contexte établissement)
        await this.invalidateCache(utilisateurId, cle, etablissementId);

        logger.info(`[Preferences] Préférence ${cle} mise à jour pour utilisateur ${utilisateurId}${etablissementId ? ` (établissement: ${etablissementId})` : ''}`);

        return pref;
    }

    /**
     * Réinitialiser une préférence à sa valeur par défaut
     */
    async resetPreference(
        utilisateurId: string,
        cle: string
    ): Promise<void> {
        const pref = await this.preferenceRepo.findOne({
            where: { utilisateurId, cle },
        });

        if (pref) {
            await this.preferenceRepo.remove(pref);
        }

        // Invalider cache
        await this.invalidateCache(utilisateurId, cle);

        logger.info(`[Preferences] Préférence ${cle} réinitialisée pour utilisateur ${utilisateurId}`);
    }

    /**
     * Réinitialiser toutes les préférences d'une catégorie
     */
    async resetCategoryPreferences(
        utilisateurId: string,
        categorie: CategoriePreference
    ): Promise<number> {
        const prefs = await this.preferenceRepo.find({
            where: { utilisateurId, categorie },
        });

        if (prefs.length > 0) {
            await this.preferenceRepo.remove(prefs);
        }

        // Invalider cache
        await this.invalidateCache(utilisateurId);

        logger.info(`[Preferences] ${prefs.length} préférences ${categorie} réinitialisées`);

        return prefs.length;
    }

    /**
     * Réinitialiser TOUTES les préférences d'un utilisateur
     */
    async resetAllPreferences(utilisateurId: string): Promise<number> {
        const prefs = await this.preferenceRepo.find({
            where: { utilisateurId },
        });

        if (prefs.length > 0) {
            await this.preferenceRepo.remove(prefs);
        }

        // Invalider cache
        await this.invalidateCache(utilisateurId);

        logger.info(`[Preferences] Toutes les préférences réinitialisées pour utilisateur ${utilisateurId}`);

        return prefs.length;
    }

    /**
     * Réinitialiser aux valeurs par défaut du système (sans supprimer)
     */
    async restoreDefaultPreferences(utilisateurId: string): Promise<number> {
        let count = 0;

        for (const [cle, def] of Object.entries(DEFAULT_PREFERENCES)) {
            const pref = await this.preferenceRepo.findOne({
                where: { utilisateurId, cle },
            });

            if (pref) {
                pref.valeur = def.valeur;
                pref.typeValeur = def.typeValeur;
                pref.heriteGlobal = false;
                await this.preferenceRepo.save(pref);
                count++;
            } else {
                const newPref = this.preferenceRepo.create({
                    utilisateurId,
                    cle,
                    valeur: def.valeur,
                    typeValeur: def.typeValeur,
                    categorie: def.categorie,
                    valeurDefaut: def.valeur,
                    heriteGlobal: false,
                    description: def.description,
                });
                await this.preferenceRepo.save(newPref);
                count++;
            }
        }

        // Invalider cache
        await this.invalidateCache(utilisateurId);

        logger.info(`[Preferences] ${count} préférences restaurées aux valeurs par défaut`);

        return count;
    }

    /**
     * Obtenir les préférences groupées par catégorie
     */
    async getPreferencesByCategory(
        utilisateurId: string
    ): Promise<Record<string, Array<{ cle: string; valeur: any; description?: string }>>> {
        const allPrefs = await this.getAllPreferences(utilisateurId);
        const grouped: Record<string, Array<any>> = {};

        for (const [cle, valeur] of Object.entries(allPrefs)) {
            const def = DEFAULT_PREFERENCES[cle];
            const categorie = def?.categorie || CategoriePreference.PERSONNALISATION;

            if (!grouped[categorie]) {
                grouped[categorie] = [];
            }

            grouped[categorie].push({
                cle,
                valeur,
                description: def?.description,
            });
        }

        return grouped;
    }

    /**
     * Configurer l'héritage de la config globale
     */
    async setGlobalInheritance(
        utilisateurId: string,
        cle: string,
        herite: boolean
    ): Promise<void> {
        if (herite) {
            // Supprimer l'override utilisateur
            await this.resetPreference(utilisateurId, cle);

            // Créer entrée avec heriteGlobal = true
            const pref = this.preferenceRepo.create({
                utilisateurId,
                cle,
                valeur: '',
                typeValeur: 'string',
                categorie: CategoriePreference.PERSONNALISATION,
                heriteGlobal: true,
            });
            await this.preferenceRepo.save(pref);
        } else {
            // Restaurer valeur par défaut
            await this.resetPreference(utilisateurId, cle);
        }

        await this.invalidateCache(utilisateurId, cle);
    }

    /**
     * Helper: Parser une valeur selon son type
     */
    private parseValue(valeur: string, typeValeur: string): any {
        try {
            switch (typeValeur) {
                case 'boolean':
                    return valeur === 'true' || valeur === '1';
                case 'number':
                    return parseFloat(valeur);
                case 'json':
                    return JSON.parse(valeur);
                case 'array':
                    return JSON.parse(valeur);
                default:
                    return valeur;
            }
        } catch {
            return valeur;
        }
    }

    /**
     * Helper: Sérialiser une valeur
     */
    private serializeValue(valeur: any, typeValeur: string): string {
        switch (typeValeur) {
            case 'json':
            case 'array':
                return JSON.stringify(valeur);
            default:
                return String(valeur);
        }
    }

    /**
     * Helper: Inférer le type d'une valeur
     */
    private inferType(valeur: any): string {
        if (typeof valeur === 'boolean') return 'boolean';
        if (typeof valeur === 'number') return 'number';
        if (Array.isArray(valeur)) return 'array';
        if (typeof valeur === 'object') return 'json';
        return 'string';
    }

    /**
     * Helper: Obtenir valeur de la config globale
     */
    private async getGlobalConfigValue(cle: string): Promise<any> {
        try {
            return await configurationService.getParametre(cle);
        } catch {
            return null;
        }
    }

    /**
     * Helper: Invalider le cache L1 et L2
     */
    private async invalidateCache(utilisateurId: string, cle?: string, etablissementId?: string): Promise<void> {
        try {
            // Invalider cache L1
            if (cle) {
                const keyEtab = etablissementId ? `:${etablissementId}` : '';
                memoryCache.delete(`preferences:${utilisateurId}:${cle}${keyEtab}`);
            }
            memoryCache.delete(`preferences:${utilisateurId}`);

            // Invalider cache L2
            if (cle) {
                const keyEtab = etablissementId ? `:${etablissementId}` : '';
                await redisService.del(`preferences:${utilisateurId}:${cle}${keyEtab}`);
            }
            await redisService.del(`preferences:${utilisateurId}`);
        } catch (error) {
            logger.warn('[Preferences] Échec invalidation cache', error);
        }
    }

    /**
     * Nettoyage périodique du cache L1 (à appeler toutes les 5 min)
     */
    static cleanupMemoryCache(): void {
        const now = Date.now();
        let cleaned = 0;
        for (const [key, item] of memoryCache.entries()) {
            if (now >= item.expiry) {
                memoryCache.delete(key);
                cleaned++;
            }
        }
        if (cleaned > 0) {
            logger.debug(`[Preferences] Cache L1 nettoyé: ${cleaned} entrées supprimées`);
        }
    }
}

export const preferenceUtilisateurService = new PreferenceUtilisateurService();
