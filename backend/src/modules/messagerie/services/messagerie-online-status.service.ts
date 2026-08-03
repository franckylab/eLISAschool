/**
 * ==================================
 * eLISAschool - Service Online Status
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Gestion du statut en ligne/hors ligne via Redis
 */

import { redisService } from '@common/services/redis.service';
import { logger } from '@common/utils/logger.util';
import { getParamNumber } from '@modules/configuration/utils/config.helper';
import { messagerieSSEService } from './messagerie-sse.service';

export class MessagerieOnlineStatusService {
    /**
     * Marquer un utilisateur comme en ligne
     */
    async setOnline(userId: string): Promise<void> {
        try {
            const ttl = await getParamNumber('messagerie.online_status_ttl', { defaultValue: 60 });
            await redisService.set(`messagerie:online:${userId}`, '1', ttl);
            
            // Notifier via SSE
            await messagerieSSEService.notifyOnlineStatus(userId, true);
        } catch (error) {
            logger.warn('[OnlineStatus] Échec setOnline', error);
        }
    }

    /**
     * Marquer un utilisateur comme hors ligne
     */
    async setOffline(userId: string): Promise<void> {
        try {
            await redisService.del(`messagerie:online:${userId}`);
            
            // Notifier via SSE
            await messagerieSSEService.notifyOnlineStatus(userId, false);
        } catch (error) {
            logger.warn('[OnlineStatus] Échec setOffline', error);
        }
    }

    /**
     * Vérifier si un utilisateur est en ligne
     */
    async isOnline(userId: string): Promise<boolean> {
        try {
            return await redisService.exists(`messagerie:online:${userId}`);
        } catch {
            return false;
        }
    }

    /**
     * Récupérer les utilisateurs en ligne parmi une liste
     */
    async getOnlineUsers(userIds: string[]): Promise<string[]> {
        try {
            const online: string[] = [];
            for (const userId of userIds) {
                if (await this.isOnline(userId)) {
                    online.push(userId);
                }
            }
            return online;
        } catch {
            return [];
        }
    }

    /**
     * Rafraîchir le heartbeat (prolonger TTL)
     */
    async refreshHeartbeat(userId: string): Promise<void> {
        try {
            const isOnline = await this.isOnline(userId);
            if (isOnline) {
                await this.setOnline(userId);
            }
        } catch (error) {
            logger.warn('[OnlineStatus] Échec refreshHeartbeat', error);
        }
    }
}

export const messagerieOnlineStatusService = new MessagerieOnlineStatusService();
