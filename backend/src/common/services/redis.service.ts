/**
 * ==================================
 * eLISAschool - Service Redis Centralisé
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
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
    connectTimeout: 10000,
    commandTimeout: 5000,
    
    // Reconnexion automatique
    lazyConnect: true,
    keepAlive: 30000,
};

/**
 * Client Redis singleton
 */
class RedisService {
    private static instance: RedisService;
    private client: Redis | null = null;
    private isConnecting = false;

    private constructor() {}

    static getInstance(): RedisService {
        if (!RedisService.instance) {
            RedisService.instance = new RedisService();
        }
        return RedisService.instance;
    }

    /**
     * Obtenir ou créer la connexion Redis
     */
    async getClient(): Promise<Redis> {
        if (this.client && this.client.status === 'ready') {
            return this.client;
        }

        if (this.isConnecting) {
            // Attendre que la connexion en cours se termine
            return new Promise((resolve, reject) => {
                const checkInterval = setInterval(() => {
                    if (this.client?.status === 'ready') {
                        clearInterval(checkInterval);
                        resolve(this.client!);
                    }
                }, 100);

                setTimeout(() => {
                    clearInterval(checkInterval);
                    reject(new Error('Timeout connexion Redis'));
                }, 15000);
            });
        }

        return this.connect();
    }

    /**
     * Établir la connexion Redis
     */
    private async connect(): Promise<Redis> {
        this.isConnecting = true;

        try {
            this.client = new Redis(redisConfig);

            // Event listeners
            this.client.on('ready', () => {
                logger.info('[Redis] Connecté et prêt');
                this.isConnecting = false;
            });

            this.client.on('error', (error) => {
                logger.error('[Redis] Erreur:', error.message);
                this.isConnecting = false;
            });

            this.client.on('close', () => {
                logger.warn('[Redis] Connexion fermée');
            });

            this.client.on('reconnecting', () => {
                logger.info('[Redis] Tentative de reconnexion...');
            });

            // Attendre que le client soit prêt
            await new Promise<void>((resolve, reject) => {
                if (this.client!.status === 'ready') {
                    resolve();
                } else {
                    this.client!.once('ready', () => resolve());
                    this.client!.once('error', (error) => reject(error));
                }
            });

            return this.client;
        } catch (error) {
            this.isConnecting = false;
            logger.error('[Redis] Échec de connexion:', error);
            throw error;
        }
    }

    /**
     * Vérifier si Redis est disponible
     */
    async isAvailable(): Promise<boolean> {
        try {
            const client = await this.getClient();
            const result = await client.ping();
            return result === 'PONG';
        } catch {
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
     * Fermer la connexion
     */
    async disconnect(): Promise<void> {
        if (this.client) {
            await this.client.quit();
            this.client = null;
            logger.info('[Redis] Déconnecté');
        }
    }
}

// Export singleton
export const redisService = RedisService.getInstance();
export default redisService;
