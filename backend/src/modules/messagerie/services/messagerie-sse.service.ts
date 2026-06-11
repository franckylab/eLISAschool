/**
 * ==================================
 * eLISAschool - Service SSE Messagerie
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Server-Sent Events pour messagerie temps réel
 * Basé sur DashboardSSEService existant
 */

import { Response } from 'express';
import { logger } from '@common/utils/logger.util';
import { redisService } from '@common/services/redis.service';

interface SSEClient {
    id: string;
    userId: string;
    response: Response;
    createdAt: Date;
    lastHeartbeat: Date;
}

export class MessagerieSSEService {
    private clients: Map<string, SSEClient> = new Map();
    private heartbeatInterval: NodeJS.Timeout | null = null;

    constructor() {
        this.startHeartbeat();
        this.subscribeToRedis();
    }

    /**
     * Démarrer le heartbeat pour nettoyer les clients inactifs
     */
    private startHeartbeat(): void {
        this.heartbeatInterval = setInterval(() => {
            this.cleanupInactiveClients();
        }, 30000); // Toutes les 30 secondes
    }

    /**
     * Souscrire aux événements Redis pour broadcast multi-instance
     */
    private async subscribeToRedis(): Promise<void> {
        try {
            // Utiliser le client subscriber dédié (pas le client cache)
            const redis = redisService.getSubscriberClient();
            
            if (!redis || redis.status !== 'ready') {
                logger.warn('[Messagerie SSE] Subscriber client non disponible');
                return;
            }
            
            redis.subscribe('messagerie:events', (err) => {
                if (err) {
                    logger.error('[Messagerie SSE] Erreur souscription Redis:', err);
                } else {
                    logger.info('[Messagerie SSE] Souscrit au canal Redis messagerie:events');
                }
            });

            redis.on('message', (channel, message) => {
                if (channel === 'messagerie:events') {
                    const event = JSON.parse(message);
                    this.handleRedisEvent(event);
                }
            });
        } catch (error) {
            logger.warn('[Messagerie SSE] Redis non disponible, mode single-instance', error);
        }
    }

    /**
     * Traiter un événement Redis
     */
    private handleRedisEvent(event: any): void {
        const { userId, eventName, data } = event;
        this.sendToUser(userId, eventName, data);
    }

    /**
     * Ajouter un client SSE
     * AMÉLIORÉ: Support reconnexion avec Last-Event-ID
     */
    addClient(userId: string, res: Response, lastEventId?: string): string {
        const clientId = `${userId}_${Date.now()}`;

        // Configurer les headers SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.setHeader('Access-Control-Allow-Origin', '*');

        const client: SSEClient = {
            id: clientId,
            userId,
            response: res,
            createdAt: new Date(),
            lastHeartbeat: new Date(),
        };

        this.clients.set(clientId, client);
        logger.info(`[Messagerie SSE] Client connecté: ${clientId} (total: ${this.clients.size})`);

        // Envoyer événement de connexion avec info de reconnexion
        this.sendEvent(res, 'connected', { 
            clientId, 
            timestamp: new Date().toISOString(),
            reconnect: !!lastEventId,
        });

        // Si reconnexion, renvoyer les événements manquants
        if (lastEventId) {
            this.handleReconnection(clientId, userId, lastEventId);
        }

        // Nettoyage lors de la déconnexion
        res.on('close', () => {
            this.removeClient(clientId);
        });

        // Nettoyage des clients inactifs toutes les 30s
        res.on('timeout', () => {
            logger.warn(`[Messagerie SSE] Timeout client ${clientId}`);
            this.removeClient(clientId);
        });

        return clientId;
    }

    /**
     * Gérer la reconnexion d'un client
     */
    private async handleReconnection(
        clientId: string,
        userId: string,
        lastEventId: string
    ): Promise<void> {
        try {
            // Récupérer les événements manquants depuis Redis
            const redis = await redisService.getClient();
            const missedEvents = await redis.lrange(
                `messagerie:events:${userId}`,
                0,
                50 // Max 50 événements
            );

            for (const eventData of missedEvents) {
                const event = JSON.parse(eventData);
                if (event.id > lastEventId) {
                    const client = this.clients.get(clientId);
                    if (client) {
                        this.sendEvent(client.response, event.name, event.data);
                    }
                }
            }
        } catch (error) {
            logger.warn('[Messagerie SSE] Échec reconnection', error);
        }
    }

    /**
     * Retirer un client
     */
    removeClient(clientId: string): void {
        const client = this.clients.get(clientId);
        if (client) {
            this.clients.delete(clientId);
            logger.info(`[Messagerie SSE] Client déconnecté: ${clientId} (total: ${this.clients.size})`);
        }
    }

    /**
     * Envoyer un événement à un utilisateur spécifique
     */
    sendToUser(userId: string, eventName: string, data: any): boolean {
        let sent = false;

        for (const client of this.clients.values()) {
            if (client.userId === userId) {
                this.sendEvent(client.response, eventName, data);
                sent = true;
            }
        }

        return sent;
    }

    /**
     * Broadcast à tous les participants d'une conversation
     */
    async broadcastToConversation(
        conversationId: string,
        eventName: string,
        data: any
    ): Promise<number> {
        // Récupérer les participants de la conversation
        const participantRepo = (await import('@database/data-source')).AppDataSource.getRepository('ParticipantConversation');
        const participants = await participantRepo.find({
            where: { conversationId },
            select: ['utilisateurId'],
        });

        let count = 0;
        for (const participant of participants) {
            const userId = (participant as any).utilisateurId;
            const sent = this.sendToUser(userId, eventName, data);
            if (sent) count++;
        }

        // Publier sur Redis pour autres instances
        await this.publishToRedis(eventName, data, conversationId);

        return count;
    }

    /**
     * Publier un événement sur Redis pour broadcast multi-instance
     * CORRIGÉ: Utiliser publish() au lieu de setJSON()
     */
    private async publishToRedis(
        eventName: string,
        data: any,
        conversationId?: string
    ): Promise<void> {
        try {
            const redis = await redisService.getClient();
            const payload = JSON.stringify({
                eventName,
                data,
                conversationId,
                timestamp: Date.now(),
            });
            await redis.publish('messagerie:events', payload);
        } catch (error) {
            logger.warn('[Messagerie SSE] Échec publication Redis', error);
        }
    }

    /**
     * Notifier un nouveau message
     */
    async notifyNewMessage(message: any, conversationId: string): Promise<void> {
        await this.broadcastToConversation(conversationId, 'message:new', {
            messageId: message.id,
            conversationId,
            expediteurId: message.expediteurId,
            contenu: message.contenu.substring(0, 200),
            priorite: message.priorite,
            timestamp: message.createdAt,
        });
    }

    /**
     * Notifier typing indicator
     * AMÉLIORÉ: Nettoyage automatique après TTL
     */
    async notifyTyping(
        conversationId: string,
        userId: string,
        isTyping: boolean
    ): Promise<void> {
        const eventName = isTyping ? 'typing:start' : 'typing:stop';
        await this.broadcastToConversation(conversationId, eventName, {
            userId,
            conversationId,
        });

        // Redis pour TTL avec auto-cleanup
        if (isTyping) {
            const { getParamNumber } = await import('@modules/configuration/utils/config.helper');
            const ttl = await getParamNumber('messagerie.typing_indicator_ttl', 5);
            
            const redis = await redisService.getClient();
            const key = `messagerie:typing:${conversationId}:${userId}`;
            await redis.setex(key, ttl, '1');
            
            // Auto-cleanup après TTL
            setTimeout(async () => {
                try {
                    const stillTyping = await redis.exists(key);
                    if (!stillTyping) {
                        await this.broadcastToConversation(conversationId, 'typing:stop', {
                            userId,
                            conversationId,
                        });
                    }
                } catch (error) {
                    logger.warn('[Messagerie SSE] Échec cleanup typing', error);
                }
            }, ttl * 1000);
        } else {
            // Supprimer immédiatement
            const redis = await redisService.getClient();
            await redis.del(`messagerie:typing:${conversationId}:${userId}`);
        }
    }

    /**
     * Notifier read receipt
     */
    async notifyReadReceipt(messageId: string, userId: string): Promise<void> {
        // Récupérer la conversation du message
        const messageRepo = (await import('@database/data-source')).AppDataSource.getRepository('Message');
        const message = await messageRepo.findOne({
            where: { id: messageId },
            select: ['conversationId'],
        });

        if (message) {
            await this.broadcastToConversation((message as any).conversationId, 'message:read', {
                messageId,
                userId,
            });
        }
    }

    /**
     * Notifier changement statut en ligne
     */
    async notifyOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
        // Broadcast à tous les clients
        for (const client of this.clients.values()) {
            this.sendEvent(client.response, 'online:status', {
                userId,
                isOnline,
            });
        }
    }

    /**
     * Envoyer un heartbeat
     */
    sendHeartbeat(): void {
        for (const client of this.clients.values()) {
            this.sendEvent(client.response, 'heartbeat', {
                timestamp: new Date().toISOString(),
            });
            client.lastHeartbeat = new Date();
        }
    }

    /**
     * Nettoyer les clients inactifs
     */
    cleanupInactiveClients(): void {
        const now = Date.now();
        const timeout = 120000; // 2 minutes

        for (const [clientId, client] of this.clients.entries()) {
            if (now - client.lastHeartbeat.getTime() > timeout) {
                logger.warn(`[Messagerie SSE] Client inactif détecté: ${clientId}`);
                try {
                    client.response.end();
                } catch (error) {
                    // Ignorer erreurs
                }
                this.clients.delete(clientId);
            }
        }
    }

    /**
     * Envoyer un événement SSE
     */
    private sendEvent(res: Response, event: string, data: any): void {
        res.write(`event: ${event}\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    }

    /**
     * Récupérer les statistiques
     */
    getStats(): object {
        return {
            totalClients: this.clients.size,
            uniqueUsers: new Set(Array.from(this.clients.values()).map(c => c.userId)).size,
        };
    }

    /**
     * Arrêter le service
     */
    stop(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        for (const client of this.clients.values()) {
            try {
                client.response.end();
            } catch (error) {
                // Ignorer
            }
        }
        this.clients.clear();
    }
}

export const messagerieSSEService = new MessagerieSSEService();
