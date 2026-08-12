/**
 * ==================================
 * eLISAschool - Service Redis Centralisé
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Service Redis pour :
 * - Cache distribué (multi-instances)
 * - File d'attente (notifications, emails)
 * - Session store
 * - Rate limiting distribué
 */

import Redis from 'ioredis';
import { envConfig } from '@config/env.config';
import { logger } from '@common/utils/logger.util';
import { getCurrentEtablissementId } from '@common/async-local-storage';

/**
 * Configuration du client Redis
 */
const redisConfig = {
    host: envConfig.redis.host,
    port: envConfig.redis.port,
    password: envConfig.redis.password || undefined,
    db: 0,
    
    // Pool de connexions
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    enableReadyCheck: true,
    
    // Timeouts
    connectTimeout: 5000,  // Réduit de 10s à 5s pour échouer plus rapidement
    commandTimeout: 3000,  // Réduit de 5s à 3s
    
    // Reconnexion automatique
    lazyConnect: false,  // ✅ Connecter immédiatement (était true)
    keepAlive: 30000,
    
    // Gestion des erreurs de connexion
    reconnectOnError: (err: Error) => {
        const targetErrors = ['READONLY', 'ECONNRESET'];
        return targetErrors.some(targetErr => err.message.includes(targetErr));
    },
};

/**
 * Client Redis singleton avec DEUX clients séparés :
 * - cacheClient : Pour les opérations de cache (GET/SET/DEL)
 * - subscriberClient : Pour le mode subscriber (SSE, events)
 */
class RedisService {
    private static instance: RedisService;
    private cacheClient: Redis | null = null;  // Client pour cache
    private subscriberClient: Redis | null = null;  // Client pour subscriber
    private isConnecting = false;

    private constructor() {}

    static getInstance(): RedisService {
        if (!RedisService.instance) {
            RedisService.instance = new RedisService();
        }
        return RedisService.instance;
    }

    /**
     * Obtenir ou créer la connexion Redis (client cache)
     */
    async getClient(): Promise<Redis> {
        if (this.cacheClient && this.cacheClient.status === 'ready') {
            return this.cacheClient;
        }

        if (this.isConnecting) {
            // Attendre que la connexion en cours se termine
            return new Promise((resolve, reject) => {
                let settled = false;
                const checkInterval = setInterval(() => {
                    if (!settled && this.cacheClient?.status === 'ready') {
                        settled = true;
                        clearInterval(checkInterval);
                        clearTimeout(timeout);
                        resolve(this.cacheClient!);
                    }
                }, 100);
                const timeout = setTimeout(() => {
                    if (settled) return;
                    settled = true;
                    clearInterval(checkInterval);
                    reject(new Error('Timeout connexion Redis'));
                }, 8000);
                this.cacheClient?.once('ready', () => {
                    if (settled) return;
                    settled = true;
                    clearInterval(checkInterval);
                    clearTimeout(timeout);
                    resolve(this.cacheClient!);
                });
                this.cacheClient?.once('error', (err) => {
                    if (settled) return;
                    settled = true;
                    clearInterval(checkInterval);
                    clearTimeout(timeout);
                    reject(err);
                });
            });
        }

        return this.connect();
    }

    /**
     * Obtenir le client subscriber (pour SSE, events)
     */
    getSubscriberClient(): Redis | null {
        return this.subscriberClient;
    }

    /**
     * Construit explicitement une clé cache préfixée par tenant.
     * Phase 3.4 — Refonte SaaS.
     * Utiliser quand l'etablissementId est connu explicitement (hors contexte ALS).
     * Pour les méthodes tenant-aware auto (getTenant, setTenant...), utiliser la
     * méthode privée tenantKey() qui récupère le tenant depuis AsyncLocalStorage.
     * 
     * @param etablissementId ID de l'établissement (tenant)
     * @param key Clé relative (ex: 'permissions:userId', 'config:*')
     * @returns Clé préfixée: 'tenant:{etablissementId}:{key}'
     */
    buildTenantKey(etablissementId: string, key: string): string {
        return `tenant:${etablissementId}:${key}`;
    }

    /**
     * Supprime toutes les clés d'un tenant spécifique.
     * Phase 3.4 — Flush sélectif par tenant.
     */
    async flushTenant(etablissementId: string): Promise<number> {
        const client = await this.getClient();
        const pattern = `tenant:${etablissementId}:*`;
        let count = 0;

        let cursor = '0';
        do {
            const [nextCursor, keys] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
            cursor = nextCursor;
            if (keys.length > 0) {
                await client.del(...keys);
                count += keys.length;
            }
        } while (cursor !== '0');

        logger.info(`[Redis] Flush tenant ${etablissementId}: ${count} clés supprimées`);
        return count;
    }

    /**
     * Établir la connexion Redis (DEUX clients séparés)
     */
    private async connect(): Promise<Redis> {
        this.isConnecting = true;

        try {
            // Nettoyer les anciens clients avant d'en créer de nouveaux
            await this.disconnect();

            // 1. Client pour CACHE (GET/SET/DEL)
            this.cacheClient = new Redis(redisConfig);

            this.cacheClient.on('ready', () => {
                logger.info('[Redis] Cache client connecté et prêt');
                this.isConnecting = false;
            });

            this.cacheClient.on('error', (error) => {
                logger.error('[Redis] Cache client error:', error?.message || String(error));
                this.isConnecting = false;
            });

            this.cacheClient.on('close', () => {
                logger.warn('[Redis] Cache client connexion fermée');
            });

            this.cacheClient.on('reconnecting', () => {
                logger.info('[Redis] Cache client tentative de reconnexion...');
            });

            // 2. Client pour SUBSCRIBER (SSE, events)
            this.subscriberClient = new Redis(redisConfig);

            this.subscriberClient.on('ready', () => {
                logger.info('[Redis] Subscriber client connecté et prêt');
            });

            this.subscriberClient.on('error', (error: Error) => {
                logger.error('[Redis] Subscriber client error:', error.message || String(error));
            });

            this.subscriberClient.on('close', () => {
                logger.warn('[Redis] Subscriber client connexion fermée');
            });

            this.subscriberClient.on('reconnecting', () => {
                logger.info('[Redis] Subscriber client tentative de reconnexion...');
            });

            // Attendre que le cache client soit prêt
            await new Promise<void>((resolve, reject) => {
                if (this.cacheClient!.status === 'ready') {
                    resolve();
                } else {
                    this.cacheClient!.once('ready', () => resolve());
                    this.cacheClient!.once('error', (error) => reject(error));
                }
            });

            return this.cacheClient;
        } catch (error) {
            // Nettoyer les clients partiellement créés
            await this.disconnect();
            this.isConnecting = false;
            logger.error('[Redis] Échec de connexion:', error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    /**
     * Vérifier si Redis est disponible
     */
    async isAvailable(): Promise<boolean> {
        try {
            // Vérifier si le client cache existe et est prêt
            if (this.cacheClient && this.cacheClient.status === 'ready') {
                const result = await this.cacheClient.ping();
                return result === 'PONG';
            }
            
            // Sinon, essayer de se connecter
            const client = await this.getClient();
            
            // Retry 3 fois avec délai
            for (let i = 0; i < 3; i++) {
                try {
                    const result = await client.ping();
                    if (result === 'PONG') {
                        return true;
                    }
                } catch (error) {
                    if (i === 2) throw error;  // Dernier essai
                    await new Promise(resolve => setTimeout(resolve, 500));  // Attendre 500ms
                }
            }
            return false;
        } catch (error) {
            logger.debug('[Redis] isAvailable check failed:', error instanceof Error ? error.message : String(error));
            return false;
        }
    }

    /**
     * GET - Récupérer une valeur
     */
    async get(key: string): Promise<string | null> {
        try {
            const client = await this.getClient();
            return await client.get(key);
        } catch (error) {
            logger.error(`[Redis] GET ${key} error:`, error);
            return null;
        }
    }

    /**
     * SET - Stocker une valeur
     */
    async set(key: string, value: string, ttl?: number): Promise<void> {
        try {
            const client = await this.getClient();
            if (ttl) {
                await client.setex(key, ttl, value);
            } else {
                await client.set(key, value);
            }
        } catch (error) {
            logger.error(`[Redis] SET ${key} error:`, error);
        }
    }

    /**
     * SET - Stocker un objet JSON
     */
    async setJSON(key: string, value: any, ttl?: number): Promise<void> {
        try {
            const serialized = JSON.stringify(value);
            await this.set(key, serialized, ttl);
        } catch (error) {
            logger.error(`[Redis] SETJSON ${key} error:`, error);
        }
    }

    /**
     * GET - Récupérer un objet JSON
     */
    async getJSON<T>(key: string): Promise<T | null> {
        try {
            const data = await this.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            logger.error(`[Redis] GETJSON ${key} error:`, error);
            return null;
        }
    }

    /**
     * DELETE - Supprimer une clé
     */
    async del(key: string): Promise<void> {
        try {
            const client = await this.getClient();
            await client.del(key);
        } catch (error) {
            logger.error(`[Redis] DEL ${key} error:`, error);
        }
    }

    // ==========================================
    // Méthodes tenant-aware — Phase P3.2 v6
    // Prefixe les clés par tenant:{etablissementId}:
    // ==========================================

    /**
     * Construit une clé préfixée par le tenant courant.
     */
    private tenantKey(key: string): string {
        const tenantId = getCurrentEtablissementId();
        if (tenantId) {
            return `tenant:${tenantId}:${key}`;
        }
        return key;
    }

    /**
     * GET avec préfixe tenant automatique
     */
    async getTenant(key: string): Promise<string | null> {
        return this.get(this.tenantKey(key));
    }

    /**
     * SET avec préfixe tenant automatique
     */
    async setTenant(key: string, value: string, ttl?: number): Promise<void> {
        return this.set(this.tenantKey(key), value, ttl);
    }

    /**
     * GET JSON avec préfixe tenant automatique
     */
    async getTenantJSON<T>(key: string): Promise<T | null> {
        return this.getJSON<T>(this.tenantKey(key));
    }

    /**
     * SET JSON avec préfixe tenant automatique
     */
    async setTenantJSON(key: string, value: any, ttl?: number): Promise<void> {
        return this.setJSON(this.tenantKey(key), value, ttl);
    }

    /**
     * DEL avec préfixe tenant automatique
     */
    async delTenant(key: string): Promise<void> {
        return this.del(this.tenantKey(key));
    }

    /**
     * Invalide toutes les clés d'un tenant (via SCAN + DEL).
     * Utiliser avec modération.
     */
    async invalidateTenant(tenantId: string): Promise<number> {
        try {
            const client = await this.getClient();
            const pattern = `tenant:${tenantId}:*`;
            let deleted = 0;
            let cursor = '0';

            do {
                const [nextCursor, keys] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
                cursor = nextCursor;
                if (keys.length > 0) {
                    deleted += await client.del(...keys);
                }
            } while (cursor !== '0');

            logger.info(`[Redis] Invalidé ${deleted} clés pour tenant ${tenantId}`);
            return deleted;
        } catch (error) {
            logger.error(`[Redis] invalidateTenant error:`, error);
            return 0;
        }
    }

    /**
     * EXISTS - Vérifier si une clé existe
     */
    async exists(key: string): Promise<boolean> {
        try {
            const client = await this.getClient();
            const result = await client.exists(key);
            return result === 1;
        } catch {
            return false;
        }
    }

    /**
     * EXPIRE - Définir un TTL sur une clé existante
     */
    async expire(key: string, ttl: number): Promise<void> {
        try {
            const client = await this.getClient();
            await client.expire(key, ttl);
        } catch (error) {
            logger.error(`[Redis] EXPIRE ${key} error:`, error);
        }
    }

    /**
     * KEYS - Trouver des clés par pattern
     */
    async keys(pattern: string): Promise<string[]> {
        try {
            const client = await this.getClient();
            return await client.keys(pattern);
        } catch (error) {
            logger.error(`[Redis] KEYS ${pattern} error:`, error);
            return [];
        }
    }

    /**
     * INCR - Incrémenter un compteur
     */
    async incr(key: string): Promise<number> {
        try {
            const client = await this.getClient();
            return await client.incr(key);
        } catch (error) {
            logger.error(`[Redis] INCR ${key} error:`, error);
            return 0;
        }
    }

    /**
     * DECR - Décrémenter un compteur
     */
    async decr(key: string): Promise<number> {
        try {
            const client = await this.getClient();
            return await client.decr(key);
        } catch (error) {
            logger.error(`[Redis] DECR ${key} error:`, error);
            return 0;
        }
    }

    /**
     * TTL - Obtenir le temps restant avant expiration
     */
    async ttl(key: string): Promise<number> {
        try {
            const client = await this.getClient();
            return await client.ttl(key);
        } catch {
            return -1;
        }
    }

    /**
     * FLUSH - Vider toutes les clés (DANGER!)
     */
    async flush(): Promise<void> {
        try {
            const client = await this.getClient();
            await client.flushdb();
            logger.warn('[Redis] Base de données vidée');
        } catch (error) {
            logger.error('[Redis] FLUSH error:', error);
        }
    }

    // ==========================================
    // P3.2 v7 — Pub/Sub pour invalidation cross-instance
    // ==========================================

    /**
     * PUBLISHER — Publier un message sur un canal
     */
    async publish(channel: string, message: any): Promise<void> {
        try {
            const client = await this.getClient();
            await client.publish(channel, JSON.stringify(message));
        } catch (error) {
            logger.error(`[Redis] PUBLISH ${channel} error:`, error);
        }
    }

    /**
     * SUBSCRIBER — S'abonner à un canal
     * @returns handler pour se désabonner
     */
    subscribe(channel: string, handler: (message: any) => void): () => void {
        const sub = this.subscriberClient;
        if (!sub) {
            logger.warn('[Redis] subscribe: subscriber client non disponible');
            return () => {};
        }

        sub.subscribe(channel).catch((err) => {
            logger.error(`[Redis] SUBSCRIBE ${channel} error:`, err);
        });

        const listener = (ch: string, raw: string) => {
            if (ch !== channel) return;
            try {
                handler(JSON.parse(raw));
            } catch (error) {
                logger.error(`[Redis] subscriber handler error (${channel}):`, error);
            }
        };

        sub.on('message', listener);

        // Retourne une fonction de cleanup
        return () => {
            sub.unsubscribe(channel).catch(() => {});
            sub.off('message', listener);
        };
    }

    /**
     * DEL by pattern — Supprimer toutes les clés matchant un pattern (via SCAN)
     */
    async delByPattern(pattern: string): Promise<number> {
        try {
            const client = await this.getClient();
            let deleted = 0;
            let cursor = '0';
            do {
                const [nextCursor, keys] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
                cursor = nextCursor;
                if (keys.length > 0) {
                    deleted += await client.del(...keys);
                }
            } while (cursor !== '0');
            return deleted;
        } catch (error) {
            logger.error(`[Redis] delByPattern ${pattern} error:`, error);
            return 0;
        }
    }

    /**
     * Obtenir les statistiques Redis
     */
    async getStats(): Promise<{
        connected: boolean;
        keysCount?: number;
        usedMemory?: string;
        connectedClients?: number;
    }> {
        try {
            const client = await this.getClient();
            const info = await client.info();
            
            const parseInfo = (section: string): Record<string, string> => {
                const lines = info.split('\n');
                const result: Record<string, string> = {};
                let inSection = false;

                for (const line of lines) {
                    if (line.startsWith('#')) {
                        inSection = line.toLowerCase().includes(section.toLowerCase());
                        continue;
                    }
                    if (inSection && line.includes(':')) {
                        const [key, value] = line.split(':');
                        result[key.trim()] = value.trim();
                    }
                }

                return result;
            };

            const serverInfo = parseInfo('server');
            const memoryInfo = parseInfo('memory');
            const clientsInfo = parseInfo('clients');

            return {
                connected: true,
                keysCount: parseInt(memoryInfo.db0?.split(',')[0]?.split('=')[1] || '0'),
                usedMemory: memoryInfo.used_memory_human,
                connectedClients: parseInt(clientsInfo.connected_clients || '0'),
            };
        } catch {
            return { connected: false };
        }
    }

    /**
     * Fermer les connexions
     */
    async disconnect(): Promise<void> {
        if (this.cacheClient) {
            await this.cacheClient.quit();
            this.cacheClient = null;
            logger.info('[Redis] Cache client déconnecté');
        }
        if (this.subscriberClient) {
            await this.subscriberClient.quit();
            this.subscriberClient = null;
            logger.info('[Redis] Subscriber client déconnecté');
        }
    }
}

// Export singleton
export const redisService = RedisService.getInstance();
export default redisService;
