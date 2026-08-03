/**
 * ==================================
 * eLISAschool - Service Cache Messagerie
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Gestion intelligente du cache Redis pour optimiser les performances
 */

import { redisService } from '@common/services/redis.service';
import { logger } from '@common/utils/logger.util';

export class MessagerieCacheService {
    private readonly CACHE_TTL = {
        CONVERSATIONS: 30,        // 30 secondes
        MESSAGES: 60,             // 1 minute
        UNREAD_COUNT: 30,         // 30 secondes
        ONLINE_STATUS: 60,        // 1 minute
        SEARCH_RESULTS: 120,      // 2 minutes
        TYPING_INDICATOR: 5,      // 5 secondes
        USER_PROFILE: 300,        // 5 minutes
    };

    /**
     * Mettre en cache des données
     */
    async set<T>(key: string, data: T, ttlSeconds?: number): Promise<void> {
        try {
            await redisService.setJSON(key, {
                data,
                timestamp: Date.now(),
            }, ttlSeconds);
        } catch (error) {
            logger.warn(`[Messagerie Cache] Échec set cache ${key}`, error);
        }
    }

    /**
     * Récupérer depuis le cache
     */
    async get<T>(key: string): Promise<T | null> {
        try {
            const cached = await redisService.getJSON<T>(key);
            if (cached) {
                return cached;
            }
            return null;
        } catch {
            return null;
        }
    }

    /**
     * Supprimer du cache
     */
    async del(key: string): Promise<void> {
        try {
            await redisService.del(key);
        } catch (error) {
            logger.warn(`[Messagerie Cache] Échec del cache ${key}`, error);
        }
    }

    /**
     * Invalider le cache d'une conversation
     */
    async invalidateConversation(conversationId: string): Promise<void> {
        try {
            const keys = await redisService.keys(`messagerie:*:${conversationId}:*`);
            for (const key of keys) {
                await redisService.del(key);
            }
        } catch (error) {
            logger.warn(`[Messagerie Cache] Échec invalidation conversation ${conversationId}`, error);
        }
    }

    /**
     * Invalider le cache d'un utilisateur
     */
    async invalidateUser(userId: string): Promise<void> {
        try {
            const keys = await redisService.keys(`messagerie:*:${userId}:*`);
            for (const key of keys) {
                await redisService.del(key);
            }
        } catch (error) {
            logger.warn(`[Messagerie Cache] Échec invalidation user ${userId}`, error);
        }
    }

    /**
     * Cache pour conversations
     */
    async cacheConversations(
        userId: string,
        page: number,
        limit: number,
        data: any
    ): Promise<void> {
        const key = `messagerie:conversations:${userId}:${page}:${limit}`;
        await this.set(key, data, this.CACHE_TTL.CONVERSATIONS);
    }

    async getCachedConversations(
        userId: string,
        page: number,
        limit: number
    ): Promise<any | null> {
        const key = `messagerie:conversations:${userId}:${page}:${limit}`;
        return this.get(key);
    }

    /**
     * Cache pour messages
     */
    async cacheMessages(
        conversationId: string,
        cursor: string | undefined,
        data: any
    ): Promise<void> {
        const key = `messagerie:messages:${conversationId}:${cursor || 'first'}`;
        await this.set(key, data, this.CACHE_TTL.MESSAGES);
    }

    async getCachedMessages(
        conversationId: string,
        cursor: string | undefined
    ): Promise<any | null> {
        const key = `messagerie:messages:${conversationId}:${cursor || 'first'}`;
        return this.get(key);
    }

    /**
     * Cache pour compteur non-lus
     */
    async cacheUnreadCount(userId: string, count: number): Promise<void> {
        const key = `messagerie:unread:${userId}`;
        await this.set(key, { total: count }, this.CACHE_TTL.UNREAD_COUNT);
    }

    async getCachedUnreadCount(userId: string): Promise<number | null> {
        const key = `messagerie:unread:${userId}`;
        const cached = await this.get<{ total: number }>(key);
        return cached?.total || null;
    }

    /**
     * Cache pour résultats de recherche
     */
    async cacheSearchResults(
        query: string,
        userId: string,
        data: any
    ): Promise<void> {
        const sanitizedQuery = query.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 50);
        const key = `messagerie:search:${sanitizedQuery}:${userId}`;
        await this.set(key, data, this.CACHE_TTL.SEARCH_RESULTS);
    }

    async getCachedSearchResults(
        query: string,
        userId: string
    ): Promise<any | null> {
        const sanitizedQuery = query.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 50);
        const key = `messagerie:search:${sanitizedQuery}:${userId}`;
        return this.get(key);
    }

    /**
     * Statistiques du cache
     */
    async getStats(): Promise<{
        keysCount: number;
        memoryUsed: string;
    }> {
        try {
            const client = await redisService.getClient();
            const keysCount = await client.dbsize();
            const info = await client.info('memory');
            const memoryMatch = info.match(/used_memory_human:(.+)/);
            
            return {
                keysCount,
                memoryUsed: memoryMatch ? memoryMatch[1].trim() : 'unknown',
            };
        } catch (error) {
            logger.warn('[Messagerie Cache] Échec récupération stats', error);
            return { keysCount: 0, memoryUsed: 'unknown' };
        }
    }

    /**
     * Nettoyer tout le cache messagerie
     */
    async clearAll(): Promise<void> {
        try {
            const keys = await redisService.keys('messagerie:*');
            for (const key of keys) {
                await redisService.del(key);
            }
            logger.info(`[Messagerie Cache] ${keys.length} clés supprimées`);
        } catch (error) {
            logger.warn('[Messagerie Cache] Échec clear all', error);
        }
    }
}

export const messagerieCacheService = new MessagerieCacheService();
