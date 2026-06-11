/**
 * ==================================
 * eLISAschool - Service de Cache Dashboard
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * Système de cache intelligent avec invalidation contextuelle
 * Support Redis (distribué) + fallback in-memory
 */

import { logger } from '@common/utils/logger.util';
import { redisService } from '@common/services/redis.service';

interface CacheEntry {
    data: any;
    timestamp: number;
    ttl: number; // en secondes
    context: string; // contexte d'invalidation (userId:etablissementId)
    hits: number;
}

export class DashboardCacheService {
    private cache = new Map<string, CacheEntry>();
    private autoCleanInterval?: NodeJS.Timeout;
    private useRedis = false;
    private readonly CACHE_PREFIX = 'dashboard:';
    private readonly MAX_CACHE_SIZE = 1000; // Limite LRU
    private stats = {
        hits: 0,
        misses: 0,
        sets: 0,
        invalidations: 0,
    };

    constructor() {
        // Vérifier si Redis est disponible (avec retry)
        this.checkRedisAvailability();
        
        // Re-vérifier toutes les 30 secondes
        setInterval(() => this.checkRedisAvailability(), 30000);
    }

    /**
     * Vérifier la disponibilité de Redis
     */
    private async checkRedisAvailability(): Promise<void> {
        try {
            const available = await redisService.isAvailable();
            if (available && !this.useRedis) {
                this.useRedis = true;
                logger.info('[DashboardCache] ✅ Mode: Redis (distribué)');
            } else if (!available && this.useRedis) {
                this.useRedis = false;
                logger.warn('[DashboardCache] ⚠️  Mode: In-memory (fallback - Redis perdu)');
            } else if (!available && !this.useRedis) {
                logger.debug('[DashboardCache] Mode: In-memory (fallback)');
            }
        } catch (error) {
            // Ignorer les erreurs de vérification
        }
    }

    /**
     * Récupérer une entrée du cache
     */
    async get(key: string): Promise<any | null> {
        const prefixedKey = this.CACHE_PREFIX + key;

        // Essayer Redis d'abord
        if (this.useRedis) {
            try {
                const data = await redisService.getJSON(prefixedKey);
                if (data !== null) {
                    this.stats.hits++;
                    logger.debug(`[DashboardCache] Redis hit: ${key}`);
                    return data;
                }
            } catch (error) {
                logger.warn('[DashboardCache] Redis échec, fallback in-memory');
                this.useRedis = false;
            }
        }

        // Fallback in-memory
        const entry = this.cache.get(prefixedKey);
        
        if (!entry) {
            this.stats.misses++;
            return null;
        }

        // Vérifier si expiré
        const age = (Date.now() - entry.timestamp) / 1000;
        if (age > entry.ttl) {
            this.cache.delete(prefixedKey);
            this.stats.misses++;
            logger.debug(`[DashboardCache] Cache expiré: ${key}`);
            return null;
        }

        // Hit
        entry.hits++;
        this.stats.hits++;
        logger.debug(`[DashboardCache] Memory hit: ${key} (age: ${Math.round(age)}s, hits: ${entry.hits})`);
        
        return entry.data;
    }

    /**
     * Stocker une entrée dans le cache
     */
    async set(key: string, data: any, ttl: number, context: string): Promise<void> {
        const prefixedKey = this.CACHE_PREFIX + key;

        // Stocker dans Redis
        if (this.useRedis) {
            try {
                await redisService.setJSON(prefixedKey, data, ttl);
            } catch (error) {
                logger.warn('[DashboardCache] Redis échec, fallback in-memory');
                this.useRedis = false;
            }
        }

        // Stocker en mémoire (avec limite LRU)
        if (this.cache.size >= this.MAX_CACHE_SIZE) {
            // Stratégie LRU : supprimer les entrées les moins utilisées
            const sorted = Array.from(this.cache.entries())
                .sort((a, b) => a[1].hits - b[1].hits);
            this.cache.delete(sorted[0][0]);
            logger.debug('[DashboardCache] Cache LRU: entrée supprimée');
        }

        this.cache.set(prefixedKey, {
            data,
            timestamp: Date.now(),
            ttl,
            context,
            hits: 0,
        });
        
        this.stats.sets++;
        logger.debug(`[DashboardCache] Cache set: ${key} (TTL: ${ttl}s, context: ${context})`);
    }

    /**
     * Vérifier si une clé existe et est valide
     */
    async isCached(key: string): Promise<boolean> {
        const prefixedKey = this.CACHE_PREFIX + key;

        if (this.useRedis) {
            return await redisService.exists(prefixedKey);
        }

        const entry = this.cache.get(prefixedKey);
        if (!entry) return false;

        const age = (Date.now() - entry.timestamp) / 1000;
        return age <= entry.ttl;
    }

    /**
     * Invalider une entrée spécifique
     */
    invalidate(key: string): void {
        const prefixedKey = this.CACHE_PREFIX + key;
        
        // Supprimer de Redis
        if (this.useRedis) {
            redisService.del(prefixedKey);
        }

        this.cache.delete(prefixedKey);
        this.stats.invalidations++;
        logger.debug(`[DashboardCache] Invalidé: ${key}`);
    }

    /**
     * Invalider toutes les entrées d'un contexte
     * Ex: "user123:etab456" invalide tout le dashboard de cet utilisateur/établissement
     */
    invalidateByContext(context: string): void {
        let count = 0;
        const prefixedContext = this.CACHE_PREFIX + context;
        
        // Invalider dans Redis
        if (this.useRedis) {
            redisService.keys(`${this.CACHE_PREFIX}*${context}*`).then(keys => {
                keys.forEach(key => redisService.del(key));
                logger.info(`[DashboardCache] Redis invalidation contexte "${context}": ${keys.length} entrées`);
            });
        }

        // Invalider en mémoire
        for (const [key, entry] of this.cache.entries()) {
            if (entry.context === context || key.includes(prefixedContext)) {
                this.cache.delete(key);
                count++;
            }
        }
        
        this.stats.invalidations += count;
        logger.info(`[DashboardCache] Invalidation contexte "${context}": ${count} entrées supprimées`);
    }

    /**
     * Invalider par pattern (ex: "widget:data:*")
     */
    invalidateByPattern(pattern: string): void {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        let count = 0;
        const prefixedPattern = this.CACHE_PREFIX + pattern;
        
        // Invalider dans Redis
        if (this.useRedis) {
            redisService.keys(prefixedPattern).then(keys => {
                keys.forEach(key => redisService.del(key));
            });
        }
        
        // Invalider en mémoire
        for (const key of this.cache.keys()) {
            if (regex.test(key.replace(this.CACHE_PREFIX, ''))) {
                this.cache.delete(key);
                count++;
            }
        }
        
        this.stats.invalidations += count;
        logger.info(`[DashboardCache] Invalidation pattern "${pattern}": ${count} entrées supprimées`);
    }

    /**
     * Invalider tous les widgets d'un module
     */
    invalidateModule(moduleName: string, etablissementId?: string): void {
        const context = etablissementId ? `:${etablissementId}` : '';
        this.invalidateByPattern(`widget:data:${moduleName}:*${context}`);
        logger.info(`[DashboardCache] Module invalidé: ${moduleName}${context}`);
    }

    /**
     * Nettoyer le cache (entrées expirées)
     */
    clean(): void {
        let cleaned = 0;
        const now = Date.now();
        
        for (const [key, entry] of this.cache.entries()) {
            const age = (now - entry.timestamp) / 1000;
            if (age > entry.ttl) {
                this.cache.delete(key);
                cleaned++;
                
                // Nettoyer aussi dans Redis
                if (this.useRedis) {
                    redisService.del(key);
                }
            }
        }
        
        if (cleaned > 0) {
            logger.info(`[DashboardCache] Nettoyage: ${cleaned} entrées expirées supprimées`);
        }
    }

    /**
     * Statistiques du cache
     */
    getStats(): {
        size: number;
        hits: number;
        misses: number;
        hitRate: number;
        hitRatePercent: string;
        sets: number;
        invalidations: number;
        memoryUsageKB: number;
    } {
        const total = this.stats.hits + this.stats.misses;
        const hitRate = total > 0 ? this.stats.hits / total : 0;
        
        // Estimation mémoire (approximative)
        let memoryUsage = 0;
        for (const [key, entry] of this.cache.entries()) {
            memoryUsage += key.length * 2; // UTF-16
            memoryUsage += JSON.stringify(entry.data).length * 2;
            memoryUsage += 100; // overhead par entrée
        }
        
        return {
            size: this.cache.size,
            hits: this.stats.hits,
            misses: this.stats.misses,
            hitRate,
            hitRatePercent: `${(hitRate * 100).toFixed(2)}%`,
            sets: this.stats.sets,
            invalidations: this.stats.invalidations,
            memoryUsageKB: Math.round(memoryUsage / 1024),
        };
    }

    /**
     * Vider tout le cache
     */
    clear(): void {
        const size = this.cache.size;
        this.cache.clear();
        logger.warn(`[DashboardCache] Cache vidé complètement (${size} entrées)`);
    }

    /**
     * Nettoyage automatique périodique (toutes les 5 min)
     */
    startAutoClean(intervalMs: number = 300000): void {
        this.stopAutoClean(); // Arrêter l'ancien intervalle avant d'en créer un nouveau
        this.autoCleanInterval = setInterval(() => {
            this.clean();
        }, intervalMs);
        
        logger.info(`[DashboardCache] Auto-clean activé (intervalle: ${intervalMs}ms)`);
    }

    /**
     * Arrêter le nettoyage automatique
     */
    stopAutoClean(): void {
        if (this.autoCleanInterval) {
            clearInterval(this.autoCleanInterval);
            this.autoCleanInterval = undefined;
            logger.info('[DashboardCache] Auto-clean arrêté');
        }
    }
}

export const dashboardCacheService = new DashboardCacheService();
